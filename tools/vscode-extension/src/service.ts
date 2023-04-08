import EventEmitter from "events"
import typescript from "typescript"
import vscode from "vscode"
import { URI } from "vscode-uri"
import { defaultExtractors } from "~/common/extractors/default"
import type { TextDocument } from "~/common/extractors/types"
import typescriptExtractor from "~/common/extractors/typescript"
import { defaultLogger as console } from "~/common/logger"
import type { ServiceOptions } from "~/shared"
import { Settings } from "~/shared"
import { ICompletionItem } from "~/typings/completion"
import { Now } from "./common/time"
import { createColorProvider } from "./service/colorProvider"
import completion from "./service/completion"
import completionResolve from "./service/completionResolve"
import { validate } from "./service/diagnostics"
import hover from "./service/hover"
import { createTailwindLoader } from "./service/tailwind"

const context = { console, typescriptExtractor, typescript }

export async function createTailwindLanguageService(options: ServiceOptions) {
	const configPath = options.configPath
	const isDefault = options.configPath == undefined
	const state = await createTailwindLoader()
	const configPathMessage = configPath == undefined ? "defaultConfig" : configPath.path
	let loading = false
	let _colorProvider: ReturnType<typeof createColorProvider> | undefined

	const completionItemProvider: vscode.CompletionItemProvider<ICompletionItem> & { tabSize: number } = {
		tabSize: 4,
		provideCompletionItems(document, position) {
			return onCompletion(document, position)
		},
		resolveCompletionItem(item) {
			return onCompletionResolve(item, this.tabSize)
		},
	}

	const hoverProvider: vscode.HoverProvider & { tabSize: number } = {
		tabSize: 4,
		provideHover(document, position) {
			return onHover(document, position, this.tabSize)
		},
	}

	const activated = new EventEmitter()
	const activatedEvent = new vscode.EventEmitter<void>()

	context.typescriptExtractor.importLabels = options.importLabels

	return {
		get configPath() {
			return configPath ?? URI.parse("defaultConfig")
		},
		get workspaceFolder() {
			return options.workspaceFolder
		},
		getConfigPath() {
			return configPath
		},
		getState() {
			return state
		},
		dispose() {
			activatedEvent.dispose()
			state.dispose()
		},
		isDefault,
		start,
		updateSettings,
		completionItemProvider,
		hoverProvider,
		provideDiagnostics,
		colorProvider: {
			dispose() {
				_colorProvider?.dispose()
			},
			render: renderColorDecoration,
		},
		activatedEvent,
	} as const

	function ready() {
		return new Promise<void>(resolve => {
			activated.once("signal", () => {
				resolve()
			})
		})
	}

	async function start() {
		if (!options.enabled || loading) return
		if (state.tw) return
		try {
			loading = true
			console.info("loading:", configPathMessage)
			const start = Now()
			await state.readTailwind({
				uri: configPath,
				mode: options.extensionMode,
				pnp: isDefault ? undefined : options.pnpContext,
				onChange: reload,
			})
			_colorProvider = createColorProvider(state.tw, state.separator)
			const end = Now()
			activated.emit("signal")
			console.info(`activated: ${configPathMessage} (${Number(end - start)}ms)\n`)
			activatedEvent.fire()
		} catch (error) {
			console.error(error)
			console.error("load failed: " + configPathMessage + "\n")
		} finally {
			loading = false
		}
	}

	async function reload() {
		if (!options.enabled || loading) return
		try {
			loading = true
			console.info("reloading:", configPathMessage)
			const start = Now()
			await state.readTailwind({
				uri: configPath,
				mode: options.extensionMode,
				pnp: isDefault ? undefined : options.pnpContext,
				onChange: reload,
			})
			if (_colorProvider) _colorProvider.dispose()
			_colorProvider = createColorProvider(state.tw, state.separator)
			const end = Now()
			activated.emit("signal")
			console.info(`activated: ${configPathMessage} (${Number(end - start)}ms)\n`)
			activatedEvent.fire()
		} catch (error) {
			console.error(error)
			console.error("reload failed: " + configPathMessage + "\n")
		} finally {
			loading = false
		}
	}

	/** Update user settings.(no need to reload.) */
	function updateSettings(setting: Partial<Settings>) {
		options = { ...options, ...setting }
		context.typescriptExtractor.importLabels = options.importLabels
	}

	async function onCompletion(document: TextDocument, position: vscode.Position) {
		return wait<vscode.ProviderResult<vscode.CompletionList<ICompletionItem>>>(undefined, defaultValue => {
			try {
				const token = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.map(extractor =>
						extractor.find(
							document.languageId,
							document.getText(),
							document.offsetAt(position),
							true,
							context,
						),
					)
					.reduce((prev, current) => {
						return prev ?? current
					}, undefined)

				return completion(token, document, position, state, options)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function onCompletionResolve(item: ICompletionItem, tabSize: number) {
		if (!state.tw) return item
		return completionResolve(item, state, tabSize, options)
	}

	async function onHover(document: TextDocument, position: vscode.Position, tabSize: number) {
		return wait<vscode.ProviderResult<vscode.Hover>>(undefined, defaultValue => {
			try {
				const token = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.map(extractor =>
						extractor.find(
							document.languageId,
							document.getText(),
							document.offsetAt(position),
							false,
							context,
						),
					)
					.reduce((prev, current) => {
						return prev ?? current
					}, undefined)

				return hover(token, document, position, state, options, tabSize)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function renderColorDecoration(editor: vscode.TextEditor) {
		return wait(void 0, () => {
			if (!_colorProvider) return
			const document = editor.document
			try {
				const tokens = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.flatMap(extractor => extractor.findAll(document.languageId, document.getText(), context))
				_colorProvider.render(tokens, editor, options)
			} catch (error) {
				console.error(error)
			}
		})
	}

	async function provideDiagnostics(document: TextDocument) {
		return wait<vscode.Diagnostic[]>([], defaultValue => {
			try {
				const tokens = defaultExtractors
					.concat(state.extractors)
					.filter(e => e.acceptLanguage(document.languageId))
					.flatMap(extractor => extractor.findAll(document.languageId, document.getText(), context))
				return validate(tokens, document, state, options)
			} catch (error) {
				console.error(error)
				return defaultValue
			}
		})
	}

	async function wait<ReturnValue = unknown>(
		defaultValue: ReturnValue,
		callback: (defaultValue: ReturnValue) => ReturnValue,
	) {
		if (!loading) {
			if (!state.tw) await start()
			return callback(defaultValue)
		}
		await ready()
		return callback(defaultValue)
	}
}

export type Service = Awaited<ReturnType<typeof createTailwindLanguageService>>
