import path from "path"
import vscode from "vscode"
import { URI, Utils } from "vscode-uri"
import { defaultLogger as console } from "~/common/logger"
import { findPnpApi } from "./common/config"
import { createTailwindLanguageService } from "./service"
import { IDiagnostic } from "./service/diagnostics"
import { SECTION_ID, Settings } from "./shared"
import { ICompletionItem } from "./typings/completion"

const DEFAULT_SUPPORT_LANGUAGES = ["javascript", "javascriptreact", "typescript", "typescriptreact", "tw"]

const triggerCharacters = ['"', "'", "`", ":", "-", "/", ".", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

const priority = [".ts", ".js", ".cjs"]

const prioritySorter = (a: URI, b: URI) => {
	if (a.toString().length === b.toString().length) {
		return priority.indexOf(Utils.extname(a)) - priority.indexOf(Utils.extname(b))
	}
	return b.toString().length - a.toString().length
}

function matchService(uri: URI, services: Map<string, ReturnType<typeof createTailwindLanguageService>>) {
	const uriString = uri.toString()
	const list = Array.from(services)
		.filter(([configDir]) => {
			if (uri.scheme === "untitled") return true
			const target = uri.scheme === "tailwind" ? uri.path : uriString
			const rel = path.relative(configDir, target)
			return !rel.startsWith("..")
		})
		.sort((a, b) => b[0].localeCompare(a[0]))
		.map(m => m[1])
	if (uri.scheme === "untitled") return list[list.length - 1]
	return list[0]
}

function equalLanguages(a: string[], b: string[]) {
	const s1 = new Set(a)
	const s2 = new Set(b)
	if (s1.size !== s2.size) return false
	for (const lang of s1) {
		if (!s2.has(lang)) return false
	}
	return true
}

const TAILWIND_CONFIG = /(tailwind|tailwind[.]config)[.](ts|js|cjs)/
const EXCLUDE_DIR = /(node_modules|[.]yarn)/

// NOTE: vscode.workspace.findFiles is not working.
/** Get all tailwindConfig under given uri. */
async function findTailwindConfigs(uri: vscode.Uri): Promise<vscode.Uri[]> {
	const result = await vscode.workspace.fs.readDirectory(uri)
	const files: string[] = []
	const directories: string[] = []

	result.forEach(([name, t]) => {
		if (t !== vscode.FileType.Unknown) {
			if (t === vscode.FileType.Directory) {
				if (EXCLUDE_DIR.test(name)) {
					return
				}
				directories.push(name)
			} else {
				if (TAILWIND_CONFIG.test(name)) {
					files.push(name)
				}
			}
		}
	})

	const first = await Promise.all(
		directories.map(d => {
			const subDirectory = vscode.Uri.joinPath(uri, d)
			return findTailwindConfigs(subDirectory)
		}),
	)

	return [...first.flat(), ...files.map(f => vscode.Uri.joinPath(uri, f))]
}

export async function workspaceClient(context: vscode.ExtensionContext, ws: vscode.WorkspaceFolder) {
	const extensionUri = context.extensionUri
	const extensionMode = context.extensionMode
	const workspaceFolder = ws.uri
	const serverSourceMapUri = Utils.joinPath(context.extensionUri, "dist", "extension.js.map")
	const workspaceConfiguration = vscode.workspace.getConfiguration("", ws)
	const diagnosticCollection = vscode.languages.createDiagnosticCollection("tw")
	const services: Map<string, ReturnType<typeof createTailwindLanguageService>> = new Map()
	const configFolders: Map<string, URI[]> = new Map()
	let defaultServiceRunning = false
	let activeTextEditor = vscode.window.activeTextEditor
	let documentSelector: vscode.DocumentFilter[]
	const settings = workspaceConfiguration.get(SECTION_ID, {
		enabled: true,
		colorDecorators: "inherit",
		fallbackDefaultConfig: true,
		logLevel: "info",
		preferVariantWithParentheses: false,
		references: true,
		rootFontSize: 16,
		diagnostics: true,
		documentColors: false,
		hoverColorHint: "none",
		hoverUtility: "default",
		otherLanguages: [],
		minimumContrastRatio: 0,
		importLabels: [],
	}) as Settings

	const pnpContext = findPnpApi(workspaceFolder.fsPath)
	if (pnpContext) {
		console.info("Enable PnP")
		pnpContext.setup()
	}

	let instance = await init(DEFAULT_SUPPORT_LANGUAGES.concat(settings.otherLanguages))
	return instance

	async function init(languages: string[]) {
		const disposes: vscode.Disposable[] = []

		const tailwindConfigs = await findTailwindConfigs(ws.uri)

		const schemes = new Set(tailwindConfigs.map(t => t.scheme))
		schemes.add("file")
		schemes.add("untitled")
		schemes.add("tailwind")

		console.level = settings.logLevel

		const languageSet = new Set(languages)
		settings.otherLanguages.forEach(lang => languageSet.add(lang))

		function getDocumentFilters(language: string) {
			Array.from(schemes)
			const filters: vscode.DocumentFilter[] = []
			for (const scheme of schemes) {
				filters.push({
					scheme,
					language,
				})
			}
			return filters
		}

		documentSelector = Array.from(languageSet).flatMap(getDocumentFilters)

		if (settings.colorDecorators === "inherit") {
			settings.colorDecorators = workspaceConfiguration.get("editor.colorDecorators") ? "on" : "off"
		}

		if (!settings.minimumContrastRatio) {
			settings.minimumContrastRatio =
				workspaceConfiguration.get("terminal.integrated.minimumContrastRatio") ?? 4.5
		}

		// backward compatibility
		if (typeof settings.rootFontSize === "boolean") {
			settings.rootFontSize = settings.rootFontSize ? 16 : 0
		}
		if (typeof settings.colorDecorators === "boolean") {
			settings.colorDecorators = settings.colorDecorators ? "on" : "off"
		}

		for (const configPath of tailwindConfigs) {
			// const fs = vscode.workspace.fs
			// const buffer = await fs.readFile(configPath)
			// const code = new TextDecoder().decode(buffer)
			// console.log(code)
			addService(URI.parse(configPath.toString()), settings)
		}

		addDefaultService(settings)

		const completionItemProvider: vscode.CompletionItemProvider<ICompletionItem> = {
			provideCompletionItems(document, position, token, context) {
				if (!settings.enabled) return

				return matchService(document.uri, services)?.completionItemProvider.provideCompletionItems(
					document,
					position,
					token,
					context,
				)
			},
			resolveCompletionItem(item, token) {
				if (!settings.enabled) return item
				if (!item.data.uri) return item
				const srv = matchService(item.data.uri, services)
				if (!srv) return item

				srv.completionItemProvider.tabSize = getTabSize()
				return srv.completionItemProvider.resolveCompletionItem?.(item, token)
			},
		}

		const hoverProvider: vscode.HoverProvider = {
			provideHover(document, position, token) {
				if (!settings.enabled) return
				const srv = matchService(document.uri, services)
				if (!srv) return undefined

				srv.hoverProvider.tabSize = getTabSize()
				return srv.hoverProvider.provideHover(document, position, token)
			},
		}

		const codeActionProvider: vscode.CodeActionProvider = {
			async provideCodeActions(document, range, context, token) {
				let actions: vscode.CodeAction[] = []
				if (!settings.enabled) actions
				const diagnostics = diagnosticCollection.get(document.uri)
				if (!diagnostics) return actions
				diagnostics.forEach(item => {
					const diagnostic = item as IDiagnostic
					if (range.contains(diagnostic.range)) {
						if (diagnostic.codeActions) {
							actions = [...actions, ...diagnostic.codeActions]
						}
					}
				})
				return actions
			},
		}

		disposes.push(
			vscode.languages.registerCompletionItemProvider(
				documentSelector,
				completionItemProvider,
				...triggerCharacters,
			),
			vscode.languages.registerHoverProvider(documentSelector, hoverProvider),
			vscode.languages.registerCodeActionsProvider(documentSelector, codeActionProvider),
			vscode.window.onDidChangeActiveTextEditor(async editor => {
				activeTextEditor = editor
				if (activeTextEditor?.document.uri.scheme === "output") return
				console.trace("onDidChangeActiveTextEditor()")
				if (editor === activeTextEditor) {
					await render()
				}
			}),
			vscode.workspace.onDidChangeTextDocument(async event => {
				if (event.document.uri.scheme === "output") return
				console.trace("onDidChangeTextDocument()")
				if (event.document === activeTextEditor?.document) {
					await render()
				}
			}),
			vscode.workspace.onDidChangeConfiguration(async event => {
				console.trace(`onDidChangeConfiguration()`)
				const workspaceConfiguration = vscode.workspace.getConfiguration("", ws)
				const extSettings = workspaceConfiguration.get(SECTION_ID) as Settings

				let needToUpdate = false
				let needToRerenderColors = false
				let needToDiagnostics = false

				if (settings.logLevel !== extSettings.logLevel) {
					settings.logLevel = extSettings.logLevel
					needToUpdate = true
					console.info(`logLevel = ${settings.logLevel}`)
					console.level = settings.logLevel
				}

				if (!equalLanguages(settings.otherLanguages, extSettings.otherLanguages)) {
					settings.otherLanguages = extSettings.otherLanguages
					console.info(`otherLanguages = ${settings.otherLanguages.join(", ")}`)
					configFolders.clear()
					diagnosticCollection.clear()
					services.clear()
					defaultServiceRunning = false
					needToUpdate = true
					instance.dispose()
					instance = await init(DEFAULT_SUPPORT_LANGUAGES.concat(settings.otherLanguages))
				}

				if (settings.enabled !== extSettings.enabled) {
					settings.enabled = extSettings.enabled
					needToUpdate = true
					console.info(`enabled = ${settings.enabled}`)
				}

				if (settings.preferVariantWithParentheses !== extSettings.preferVariantWithParentheses) {
					settings.preferVariantWithParentheses = extSettings.preferVariantWithParentheses
					needToUpdate = true
					console.info(`preferVariantWithParentheses = ${settings.preferVariantWithParentheses}`)
				}

				if (settings.references !== extSettings.references) {
					settings.references = extSettings.references
					needToUpdate = true
					console.info(`references = ${settings.references}`)
				}

				// backward compatibility
				if (typeof extSettings.rootFontSize === "boolean") {
					extSettings.rootFontSize = extSettings.rootFontSize ? 16 : 0
				}
				if (settings.rootFontSize !== extSettings.rootFontSize) {
					settings.rootFontSize = extSettings.rootFontSize
					needToUpdate = true
					console.info(`rootFontSize = ${settings.rootFontSize}`)
				}

				// backward compatibility
				if (typeof extSettings.colorDecorators === "boolean") {
					extSettings.colorDecorators = extSettings.colorDecorators ? "on" : "off"
				}
				if (extSettings.colorDecorators === "inherit") {
					const editorColorDecorators = vscode.workspace
						.getConfiguration("editor")
						.get("colorDecorators") as boolean
					extSettings.colorDecorators = editorColorDecorators ? "on" : "off"
				}
				if (settings.colorDecorators !== extSettings.colorDecorators) {
					settings.colorDecorators = extSettings.colorDecorators
					needToUpdate = true
					needToRerenderColors = true
					console.info(`codeDecorators = ${settings.colorDecorators}`)
				}

				if (!extSettings.minimumContrastRatio) {
					const minimumContrastRatio =
						(vscode.workspace
							.getConfiguration("terminal")
							.get("integrated.minimumContrastRatio") as number) ?? 4.5
					extSettings.minimumContrastRatio = minimumContrastRatio
				}
				if (settings.minimumContrastRatio !== extSettings.minimumContrastRatio) {
					settings.minimumContrastRatio = extSettings.minimumContrastRatio
					needToUpdate = true
					needToRerenderColors = true
					console.info(`minimumContrastRatio = ${settings.minimumContrastRatio}`)
				}

				if (settings.fallbackDefaultConfig !== extSettings.fallbackDefaultConfig) {
					settings.fallbackDefaultConfig = extSettings.fallbackDefaultConfig
					console.info(`fallbackDefaultConfig = ${settings.fallbackDefaultConfig}`)
				}

				if (settings.documentColors !== extSettings.documentColors) {
					settings.documentColors = extSettings.documentColors
					console.info(`documentColors = ${settings.documentColors}`)
				}

				if (settings.hoverColorHint !== extSettings.hoverColorHint) {
					settings.hoverColorHint = extSettings.hoverColorHint
					needToUpdate = true
					console.info(`hoverColorHint = ${settings.hoverColorHint}`)
				}

				if (settings.hoverUtility !== extSettings.hoverUtility) {
					settings.hoverUtility = extSettings.hoverUtility
					needToUpdate = true
					console.info(`hoverUtility = ${settings.hoverUtility}`)
				}

				if (settings.diagnostics !== extSettings.diagnostics) {
					settings.diagnostics = extSettings.diagnostics
					needToUpdate = true
					needToDiagnostics = true
					console.info(`diagnostics = ${settings.diagnostics}`)
				}

				const labelsBefore = new Set(settings.importLabels)
				const labelsAfter = new Set(extSettings.importLabels)
				if (
					labelsBefore.size !== labelsAfter.size ||
					!Array.from(labelsAfter).every(k => labelsBefore.has(k)) ||
					!Array.from(labelsBefore).every(k => labelsAfter.has(k))
				) {
					settings.importLabels = extSettings.importLabels
					needToUpdate = true
					needToRerenderColors = true
					needToDiagnostics = true
					console.info(`importLabels = ${settings.importLabels.join(", ")}`)
				}

				if (needToUpdate) {
					for (const document of vscode.workspace.textDocuments) {
						const service = matchService(document.uri, services)
						if (service) {
							service.updateSettings(settings)
						}
					}
				}

				if (needToRerenderColors) {
					await Promise.all(
						vscode.workspace.textDocuments.map(document => {
							const srv = matchService(document.uri, services)
							srv?.colorProvider.dispose()
							return
						}),
					)
				}

				if (needToDiagnostics) {
					first_render()
				}
			}),
		)

		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(ws, "**/{tailwind,tailwind.config}.{ts,js,cjs}"),
		)
		disposes.push(
			watcher.onDidDelete(uri => {
				removeService(uri, settings, true)
			}),
			watcher.onDidCreate(uri => {
				addService(uri, settings, true)
			}),
			watcher,
		)

		first_render()

		const disposable = vscode.Disposable.from(...disposes)

		return {
			ws,
			services,
			configFolders,
			/**
			 * Dispose this object.
			 */
			dispose() {
				for (const [, srv] of services) {
					srv.dispose()
				}
				return disposable.dispose()
			},
		} as const
	}

	function getTabSize(defaultSize = 4): number {
		let tabSize: number | undefined
		if (activeTextEditor) {
			tabSize =
				typeof activeTextEditor.options.tabSize === "string" ? defaultSize : activeTextEditor.options.tabSize
		}
		if (!tabSize) {
			const s = workspaceConfiguration.get("editor.tabSize") as string | number | undefined
			tabSize = typeof s === "string" ? defaultSize : s ?? defaultSize
		}
		return tabSize
	}

	async function first_render() {
		vscode.workspace.textDocuments.forEach(async document => {
			const srv = matchService(document.uri, services)
			if (!srv) return
			const editor = vscode.window.activeTextEditor
			if (!editor) return
			if (editor.document !== document) return
			diagnosticCollection.clear()
			if (!settings.enabled) return
			if (documentSelector.every(p => p.language !== document.languageId)) return
			if (settings.colorDecorators === "on") srv.colorProvider.render(editor)
			diagnosticCollection.delete(document.uri)
			if (settings.diagnostics) {
				diagnosticCollection.set(document.uri, await srv.provideDiagnostics(document))
			}
		})
	}

	async function render(editor = vscode.window.activeTextEditor) {
		if (!editor) return
		const document = editor.document
		if (document) {
			if (document.uri.scheme === "output") return
			diagnosticCollection.clear()
			const srv = matchService(document.uri, services)
			if (!srv) return
			if (!settings.enabled) return
			if (documentSelector.every(s => s.language !== document.languageId)) return
			if (settings.colorDecorators === "on") srv.colorProvider.render(editor)
			diagnosticCollection.delete(document.uri)
			if (settings.diagnostics) {
				diagnosticCollection.set(document.uri, await srv.provideDiagnostics(document))
			}
		}
	}

	function addDefaultService(settings: Settings, startNow = false) {
		if (!settings.fallbackDefaultConfig) {
			return
		}
		if (defaultServiceRunning) {
			console.info("Default service is ready.")
			return
		}
		if (services.has(ws.uri.toString())) {
			return
		}
		const srv = createTailwindLanguageService({
			...settings,
			serverSourceMapUri,
			extensionUri,
			workspaceFolder,
			extensionMode,
			pnpContext,
		})
		services.set(ws.uri.toString(), srv)
		if (startNow) srv.start()
		defaultServiceRunning = true
	}

	function addService(configPath: URI, settings: Settings, startNow = false) {
		const folder = Utils.dirname(configPath).toString()
		const set = configFolders.get(folder)
		if (!set) {
			configFolders.set(folder, [configPath])
		} else {
			configFolders.set(folder, [...set, configPath])
		}

		const key = Utils.dirname(configPath).toString()
		const srv = services.get(key)

		if (!srv) {
			const srv = createTailwindLanguageService({
				...settings,
				configPath,
				serverSourceMapUri,
				extensionUri,
				workspaceFolder,
				extensionMode,
				pnpContext,
			})
			services.set(key, srv)
			if (startNow) srv.start()
		} else {
			const ext = Utils.extname(configPath)
			const srvExt = Utils.extname(srv.configPath)
			if (priority.indexOf(ext) < priority.indexOf(srvExt)) {
				const s = createTailwindLanguageService({
					...settings,
					configPath,
					serverSourceMapUri,
					extensionUri,
					workspaceFolder,
					extensionMode,
					pnpContext,
				})
				console.info("remove:", srv.configPath.path)
				srv.dispose()
				services.delete(key)
				services.set(key, s)
				if (startNow) s.start()
			} else {
				console.info("abort:", configPath.path)
			}
		}
	}

	function removeService(configPath: URI, settings: Settings, startNow = false) {
		const folder = Utils.dirname(configPath).toString()
		const srv = services.get(folder)
		if (srv && srv.configPath.toString() === configPath.toString()) {
			console.info("remove:", srv.configPath.path)
			srv.dispose()
			services.delete(folder)
			const set = configFolders.get(folder)
			if (set) {
				const index = set.findIndex(p => p.toString() === configPath.toString())
				if (index >= 0) {
					set.splice(index, 1)
					configFolders.set(folder, set)
				}
				if (set.length > 0) {
					const configPath = set.sort(prioritySorter)[0]
					const srv = createTailwindLanguageService({
						...settings,
						configPath,
						serverSourceMapUri,
						extensionUri,
						workspaceFolder,
						extensionMode,
						pnpContext,
					})
					services.set(folder, srv)
					if (startNow) srv.start()
				}
			}
		}

		if (services.size === 0) {
			addDefaultService(settings, true)
		}
	}
}
