import { css_beautify } from "js-beautify"
import { NodeType, parse_theme_val, renderThemePath, ThemeValueNode } from "twobj/parser"
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
				const node = parse_theme_val(token.value)
				const range = new vscode.Range(
					document.positionAt(token.start + node.range[0]),
					document.positionAt(token.start + node.range[1]),
				)
				return resolveThemeValue({ kind, range, node, state, options })
			} else {
				const hoverResult = state.tw.context.parser.hover(
					token.value,
					document.offsetAt(position) - token.start,
				)
				if (!hoverResult) return undefined

				const [start, end] = hoverResult.target.range

				const range = new vscode.Range(
					document.positionAt(token.start + start),
					document.positionAt(token.start + end),
				)

				if (hoverResult.type === "variant") {
					const header = new vscode.MarkdownString()
					if (hoverResult.target.type === NodeType.SimpleVariant) {
						const variant = hoverResult.target.id.getText()
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

					const code = beautify(state.tw.renderVariant(hoverResult.target, tabSize))
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")
					if (!header.value && !codes.value) return undefined
					return {
						range,
						contents: [header, codes],
					}
				}

				if (kind === "wrap") {
					if (hoverResult.target.type === NodeType.ClassName) {
						const value = hoverResult.target.getText()
						if (value === "$e") {
							return {
								range,
								contents: [new vscode.MarkdownString("anchor")],
							}
						}
					}
					return
				}

				const header = new vscode.MarkdownString()
				if (hoverResult.target.type === NodeType.ArbitraryProperty) {
					const rawText = hoverResult.target.decl.getText()
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

				const value = hoverResult.target.getText()

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
					important: hoverResult.important,
					rootFontSize: options.rootFontSize,
					colorHint: options.hoverColorHint,
					tabSize,
				})
				const codes = new vscode.MarkdownString()
				if (code) codes.appendCodeblock(beautify(code), "scss")

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
			space_around_combinator: false,
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
	node: ThemeValueNode
	state: TailwindLoader
	options: ServiceOptions
}): vscode.Hover | undefined {
	const text = renderThemePath(state.config, node.path)
	if (text === "[undefined]") return
	const markdown = new vscode.MarkdownString()
	markdown.value = `\`\`\`txt\n${text}\n\`\`\``
	return {
		range,
		contents: [markdown],
	}
}
