import { css_beautify } from "js-beautify"
import * as parser from "twobj/parser"
import vscode from "vscode"
import { getEntryDescription } from "vscode-css-languageservice/lib/esm/languageFacts/entry"
import type { ExtractedToken, ExtractedTokenKind, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import type { ServiceOptions } from "~/shared"
import { getDescription, getReferenceLinks } from "./referenceLink"
import type { TailwindLoader } from "./tailwind"

export default async function hover(
	result: ExtractedToken | undefined,
	document: TextDocument,
	position: vscode.Position,
	state: TailwindLoader,
	options: ServiceOptions,
	tabSize: number,
): Promise<vscode.Hover | undefined> {
	if (!result) return undefined

	return doHover(result)

	function doHover(result: ExtractedToken) {
		try {
			const { kind, ...token } = result
			if (kind === "theme") {
				const node = parser.parse_theme_val({ text: token.value })
				const range = new vscode.Range(
					document.positionAt(token.start + node.range[0]),
					document.positionAt(token.start + node.range[1]),
				)
				return resolveThemeValue({ kind, range, node, state, options })
			} else {
				const selection = parser.hover({
					text: token.value,
					position: document.offsetAt(position) - token.start,
					separator: state.separator,
				})
				if (!selection) return undefined

				const [start, end] = selection.target.range

				const range = new vscode.Range(
					document.positionAt(token.start + start),
					document.positionAt(token.start + end),
				)

				if (selection.type === "variant") {
					const header = new vscode.MarkdownString()
					if (selection.target.type === parser.NodeType.SimpleVariant) {
						const variant = selection.target.id.value
						if (options.references) {
							const isScreens = state.tw.screens.indexOf(variant) === -1
							const desc = isScreens ? getDescription(variant) : getDescription("screens")
							if (typeof desc === "string" && desc) {
								header.appendMarkdown(desc + "\n")
							}

							const links = isScreens ? getReferenceLinks(variant) : getReferenceLinks("screens")

							if (links.length > 0) {
								header.appendMarkdown("\n")
								header.appendMarkdown(links.map(ref => `[Reference](${ref.url}) `).join("\n"))
							}
						}
					} else {
						header.appendMarkdown("**arbitrary variant**")
					}

					const code = beautify(state.tw.renderVariant(selection.target, tabSize))
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")
					if (!header.value && !codes.value) return undefined
					return {
						range,
						contents: [header, codes],
					}
				}

				const header = new vscode.MarkdownString()
				if (selection.target.type === parser.NodeType.ArbitraryProperty) {
					const rawText = selection.target.decl.value
					let prop = rawText.trim()
					const i = rawText.indexOf(":")
					if (i >= 0) {
						prop = rawText.slice(0, i).trim()
					}
					if (options.references) {
						const entry = cssDataManager.getProperty(prop)
						if (entry) {
							const desc = getEntryDescription(entry, true)
							if (desc) {
								header.appendMarkdown(desc.value)
							}
						}
					}
				}

				const getText = (node: parser.Node) => token.value.slice(node.range[0], node.range[1])
				const value = getText(selection.target)

				if (options.references) {
					const pluginName = state.tw.context.getPluginName(value)
					if (pluginName) {
						const desc = getDescription(pluginName)
						if (typeof desc === "string") {
							header.appendMarkdown(desc + "\n")
						}

						const links = getReferenceLinks(pluginName)
						if (links.length > 0) {
							header.appendMarkdown("\n")
							header.appendMarkdown(links.map(ref => `[Reference](${ref.url}) `).join("\n"))
						}
					}
				}

				const code = state.tw.renderClassname({
					classname: value,
					important: selection.important,
					rootFontSize: options.rootFontSize,
					colorHint: options.hoverColorHint,
					tabSize,
				})
				const codes = new vscode.MarkdownString()
				if (code) codes.appendCodeblock(code, "scss")

				if (!header.value && !codes.value) return undefined

				return {
					range,
					contents: [header, codes],
				}
			}
		} catch (error) {
			console.error(error)
			console.error("hover failed.")
		}

		return undefined
	}

	function beautify(code: string) {
		return css_beautify(code, {
			indent_char: " ",
			indent_size: tabSize,
			selector_separator_newline: false,
			space_around_combinator: true,
			space_around_selector_separator: true,
		})
	}
}

function resolveThemeValue({
	range,
	node,
	state,
}: {
	kind: ExtractedTokenKind
	range: vscode.Range
	node: parser.ThemeValueNode
	state: TailwindLoader
	options: ServiceOptions
}): vscode.Hover | undefined {
	const text = parser.renderThemePath(state.config, node.path)
	if (text === "[undefined]") return
	const markdown = new vscode.MarkdownString()
	markdown.value = `\`\`\`txt\n${text}\n\`\`\``
	return {
		range,
		contents: [markdown],
	}
}
