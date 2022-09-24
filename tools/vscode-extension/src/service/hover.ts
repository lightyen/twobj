import * as parser from "twobj/parser"
import vscode from "vscode"
import { getEntryDescription } from "vscode-css-languageservice/lib/esm/languageFacts/entry"
import type { ExtractedToken, ExtractedTokenKind, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import type { ServiceOptions } from "~/shared"
import { getDescription, getReferenceLinks } from "./referenceLink"
import type { TailwindLoader } from "./tailwind"

function walk(
	program: parser.Program,
	check: (node: parser.Leaf, important: boolean) => boolean | void,
	variantGroup: (node: parser.GroupVariant) => void,
) {
	for (const expr of program.expressions) {
		if (walkExpr(expr, check, variantGroup, false) === false) {
			break
		}
	}

	return

	function walkExpr(
		expr: parser.Expression,
		check: (node: parser.Leaf, important: boolean) => boolean | void,
		variantGroup: (node: parser.GroupVariant) => void,
		important: boolean,
	): boolean | void {
		if (expr.type === parser.NodeType.Group) {
			important ||= expr.important
			for (const e of expr.expressions) {
				if (walkExpr(e, check, variantGroup, important) === false) {
					return false
				}
			}
			return
		}

		if (expr.type === parser.NodeType.VariantSpan) {
			const { variant, child } = expr
			switch (variant.type) {
				case parser.NodeType.GroupVariant:
					variantGroup(variant)
					for (const e of variant.expressions) {
						if (walkExpr(e, check, variantGroup, true) === false) {
							return false
						}
					}
					break
				default:
					if (check(variant, important) === false) {
						return false
					}
					break
			}
			if (child) {
				return walkExpr(child, check, variantGroup, important)
			}
			return
		}

		important ||= expr.important
		return check(expr, important)
	}
}

function isVariant(
	node: parser.Leaf,
): node is parser.SimpleVariant | parser.ArbitraryVariant | parser.ArbitrarySelector {
	switch (node.type) {
		case parser.NodeType.SimpleVariant:
		case parser.NodeType.ArbitraryVariant:
		case parser.NodeType.ArbitrarySelector:
			return true
	}
	return false
}

function hoverProgram(program: parser.Program, position: number) {
	const inRange = (node: parser.Node) => position >= node.range[0] && position < node.range[1]
	let _node: parser.Leaf | undefined
	let _important = false
	let variantGroup = false
	walk(
		program,
		(node, important) => {
			if (inRange(node)) {
				_node = node
				_important = important
				return false
			}
		},
		node => {
			if (inRange(node)) {
				variantGroup = true
			}
		},
	)
	return [_node, _important, variantGroup] as [parser.Leaf | undefined, boolean, boolean]
}

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
				const node = parser.parse_theme_val(token.value)
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

				const [target, important, variantGroup] = hoverProgram(
					program,
					document.offsetAt(position) - token.start,
				)
				if (!target) return undefined

				const [start, end] = target.range

				const range = new vscode.Range(
					document.positionAt(token.start + start),
					document.positionAt(token.start + end),
				)

				if (isVariant(target)) {
					const header = new vscode.MarkdownString()
					if (target.type === parser.NodeType.SimpleVariant) {
						const variant = target.id.getText()
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
					} else if (target.type === parser.NodeType.ArbitraryVariant) {
						header.appendMarkdown("**arbitrary variant**")
					} else if (target.type === parser.NodeType.ArbitrarySelector) {
						header.appendMarkdown("**arbitrary selector**")
					}

					const code = state.tw.renderVariant(target, tabSize)
					const codes = new vscode.MarkdownString()
					if (code) codes.appendCodeblock(code, "scss")
					if (!header.value && !codes.value) return undefined
					return {
						range,
						contents: [header, codes],
					}
				}

				if (kind === "wrap" || variantGroup) {
					return undefined
				}

				const header = new vscode.MarkdownString()
				if (target.type === parser.NodeType.ArbitraryProperty) {
					const rawText = target.decl.getText()
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

				const value = target.getText()

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
					important,
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
