import {
	ArbitrarySelector,
	ArbitraryVariant,
	Leaf,
	Node,
	NodeType,
	parse_theme_val,
	Program,
	renderThemePath,
	SimpleVariant,
	ThemeValueNode,
} from "twobj/parser"
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
			} else if (kind === "globalStyles") {
				const range = new vscode.Range(document.positionAt(token.start), document.positionAt(token.end))
				const codes = new vscode.MarkdownString()
				codes.appendCodeblock(
					state.tw.renderGlobalStyles({
						rootFontSize: options.rootFontSize,
						colorHint: options.hoverColorHint,
						tabSize,
					}),
					"scss",
				)
				codes.appendMarkdown("---")
				return {
					range,
					contents: [codes],
				}
			} else {
				const program = state.tw.context.parser.createProgram(token.value)

				const hoverResult = hoverProgram(program, document.offsetAt(position) - token.start)
				if (!hoverResult) return undefined

				const [start, end] = hoverResult.target.range

				const range = new vscode.Range(
					document.positionAt(token.start + start),
					document.positionAt(token.start + end),
				)

				if (isVariant(hoverResult.target)) {
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

					const code = state.tw.renderVariant(hoverResult.target, tabSize)
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

	function hoverProgram(program: Program, position: number) {
		const inRange = (node: Node) => position >= node.range[0] && position < node.range[1]
		let _node: Leaf | undefined
		let _important = false
		program.walk((node, important) => {
			if (inRange(node)) {
				_node = node
				_important = important
				return false
			}
		})
		return _node == undefined ? undefined : { target: _node, important: _important }
	}

	function isVariant(node: Leaf): node is SimpleVariant | ArbitraryVariant | ArbitrarySelector {
		switch (node.type) {
			case NodeType.SimpleVariant:
			case NodeType.ArbitraryVariant:
			case NodeType.ArbitrarySelector:
				return true
		}
		return false
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
