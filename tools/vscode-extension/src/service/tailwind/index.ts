import Fuse from "fuse.js"
import type { ConfigJS, ResolvedConfigJS } from "twobj"
import { defaultConfig, resolveConfig } from "twobj"
import * as vscode from "vscode"
import { calcFraction } from "~/common"
import type { Extractor } from "~/common/extractors/types"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import { ICompletionItem } from "~/typings/completion"
import { createConfigReader, LoadConfigOptions } from "../../common/config"
import { createTwContext, TwContext } from "./tw"

export type TailwindLoader = ReturnType<typeof createTailwindLoader>

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

	let config: ResolvedConfigJS
	let tw: TwContext
	let variants: Fuse<string>
	let classnames: Fuse<string>
	const reader = createConfigReader()

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
		get extractors() {
			const extrators = config?.extrators as unknown
			if (Array.isArray(extrators)) {
				return extrators.filter(isExtrator)
			}
			return []
		},
		dispose,
		readTailwind,
		provideClassCompletionList,
		provideCssPropsCompletionList,
	} as const

	function dispose() {
		reader.closeWatcher()
	}

	async function readTailwind(options: LoadConfigOptions) {
		dispose()
		let __config: ConfigJS | undefined
		if (options.uri) {
			try {
				__config = await reader.load(options)
			} catch (error) {
				__config = defaultConfig
				throw error
			} finally {
				config = resolveConfig(__config)
				createContext()
			}
		} else {
			config = resolveConfig(defaultConfig)
			createContext()
		}
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
}
