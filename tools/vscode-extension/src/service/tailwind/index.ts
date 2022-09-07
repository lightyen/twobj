import type { PnpApi } from "@yarnpkg/pnp"
import chokidar from "chokidar"
import Fuse from "fuse.js"
import * as twobj from "twobj"
import defaultConfig from "twobj/config/defaultConfig"
import * as vscode from "vscode"
import { URI } from "vscode-uri"
import { calcFraction } from "~/common"
import type { Extractor } from "~/common/extractors/types"
import { importFrom } from "~/common/module"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import { ICompletionItem } from "~/typings/completion"
import { createTwContext, TwContext } from "./tw"

export type TailwindLoader = ReturnType<typeof createTailwindLoader>

export enum ExtensionMode {
	/**
	 * The extension is installed normally (for example, from the marketplace
	 * or VSIX) in the editor.
	 */
	Production = 1,

	/**
	 * The extension is running from an `--extensionDevelopmentPath` provided
	 * when launching the editor.
	 */
	Development = 2,

	/**
	 * The extension is running from an `--extensionTestsPath` and
	 * the extension host is running unit tests.
	 */
	Test = 3,
}

/**
 * Completion item tags are extra annotations that tweak the rendering of a completion
 * item.
 */
export enum CompletionItemTag {
	/**
	 * Render a completion as obsolete, usually using a strike-out.
	 */
	Deprecated = 1,
}

interface CreateTailwindLoaderOptions {
	configPath?: URI | undefined
	pnp?: PnpApi | undefined
	mode: ExtensionMode
	onChange(): void
}

function isExtrator(value: unknown): value is Extractor {
	if (value == undefined || typeof value !== "object") return false
	if (Object.prototype.hasOwnProperty.call(value, "acceptLanguage")) {
		if (typeof (value as Extractor).acceptLanguage !== "function") return false
	} else return false
	if (Object.prototype.hasOwnProperty.call(value, "find")) {
		if (typeof (value as Extractor).acceptLanguage !== "function") return false
	} else return false
	if (Object.prototype.hasOwnProperty.call(value, "findAll")) {
		if (typeof (value as Extractor).acceptLanguage !== "function") return false
	} else return false
	return true
}

export function createTailwindLoader() {
	let classCompletionList: ICompletionItem[] | undefined
	let cssPropsCompletionList: ICompletionItem[] | undefined

	let config: twobj.ResolvedConfigJS
	let tw: TwContext
	let variants: Fuse<string>
	let classnames: Fuse<string>
	let watcher: chokidar.FSWatcher

	return {
		get separator() {
			return config.separator
		},
		get tw() {
			return tw
		},
		get config() {
			return config
		},
		get variants() {
			return variants
		},
		get classnames() {
			return classnames
		},
		get extractors(): Extractor[] {
			return config && Array.isArray(config.extrators) ? config.extrators.filter(isExtrator) : []
		},
		dispose,
		readTailwind,
		provideClassCompletionList,
		provideCssPropsCompletionList,
		isDeprecated,
	} as const

	function dispose() {
		if (watcher) watcher.close()
	}

	function readTailwind({ configPath, pnp, mode, onChange }: CreateTailwindLoaderOptions) {
		dispose()
		let __config: twobj.ConfigJS
		const deps: string[] = []
		if (configPath) {
			try {
				__config = importFrom(configPath.fsPath, {
					pnp,
					cache: false,
					deps,
					header:
						mode === ExtensionMode.Development
							? "process.env.NODE_ENV = 'development';\n"
							: "process.env.NODE_ENV = 'production';\n",
				})
			} finally {
				watcher = chokidar.watch(deps, { ignoreInitial: true })
				watcher.on("change", onChange)
				watcher.on("unlink", onChange)
				watcher.on("add", onChange)
			}
		} else {
			__config = defaultConfig
		}

		if (__config) {
			config = twobj.resolveConfig(__config)
		}

		createContext()
	}

	function createContext() {
		tw = createTwContext(config)
		classCompletionList = undefined
		variants = new Fuse(tw.variants.flat(), { includeScore: true })
		classnames = new Fuse(tw.classnames, { includeScore: true })
	}

	function formatLabel(label: string) {
		const reg = /([a-zA-Z-]+)([0-9/.]+)/
		const match = label.match(reg)
		if (!match) return label
		let val = Number(match[2])
		if (Number.isNaN(val)) val = calcFraction(match[2])
		if (Number.isNaN(val)) return label
		const prefix = match[1] + (Number.isNaN(Number(match[2])) ? "_" : "@")
		return prefix + val.toFixed(3).padStart(7, "0")
	}

	function provideClassCompletionList() {
		if (classCompletionList != undefined) {
			for (const item of classCompletionList) {
				item.range = undefined
				item.insertText = undefined
			}
			return classCompletionList
		}

		classCompletionList = tw.classnames.map(value => {
			const item: ICompletionItem = {
				label: value,
				data: { type: "utility" },
				kind: vscode.CompletionItemKind.Constant,
				sortText: (value.startsWith("-") ? "~~" : "~") + formatLabel(value),
			}

			const isColor = tw.completionColors.has(value)
			if (isColor) {
				item.kind = vscode.CompletionItemKind.Color
				item.data = { type: "color" }
				item.documentation = tw.completionColors.get(value)
			}

			if (isDeprecated(value)) {
				item.tags = [CompletionItemTag.Deprecated]
			}
			return item
		})
		return classCompletionList
	}

	function provideCssPropsCompletionList() {
		if (cssPropsCompletionList != undefined) {
			for (const item of cssPropsCompletionList) {
				item.range = undefined
				item.insertText = undefined
			}
			return cssPropsCompletionList
		}

		cssPropsCompletionList = cssDataManager.getProperties().map<ICompletionItem>(entry => ({
			label: entry.name,
			sortText: "~~~~" + entry.name,
			kind: vscode.CompletionItemKind.Field,
			command: {
				title: "Suggest",
				command: "editor.action.triggerSuggest",
			},
			data: {
				type: "cssProp",
				entry,
			},
		}))

		return cssPropsCompletionList
	}

	function isDeprecated(label: string) {
		//
		return false
	}
}
