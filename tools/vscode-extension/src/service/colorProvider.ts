import * as culori from "culori"
import { sha1 } from "object-hash"
import * as parser from "twobj/parser"
import vscode from "vscode"
import { ensureContrastRatio } from "~/common/culori"
import type { ExtractedToken, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import type { ServiceOptions } from "~/shared"
import { Now } from "../common/time"
import { ColorDesc, createTwContext, TwContext } from "./tailwind/tw"

function walk(program: parser.Program, check: (node: parser.Leaf) => boolean | void) {
	for (const expr of program.expressions) {
		if (walkExpr(expr, check) === false) {
			break
		}
	}

	return

	function walkExpr(expr: parser.Expression, check: (node: parser.Leaf) => boolean | void): boolean | void {
		if (expr.type === parser.NodeType.Group) {
			for (const e of expr.expressions) {
				if (walkExpr(e, check) === false) {
					return false
				}
			}
			return
		}

		if (expr.type === parser.NodeType.VariantSpan) {
			const { variant, child } = expr
			switch (variant.type) {
				case parser.NodeType.GroupVariant:
					break
				default:
					break
			}
			if (child) {
				return walkExpr(child, check)
			}
			return
		}

		return check(expr)
	}
}

export function createColorProvider(tw: TwContext, separator: string) {
	const colors = new Map<string, vscode.TextEditorDecorationType>()
	const rgb = culori.converter("rgb")
	const hsl = culori.converter("hsl")
	const transparent = rgb("rgba(0, 0, 0, 0)")
	return {
		dispose() {
			for (const decorationType of colors.values()) {
				decorationType.dispose()
			}
			colors.clear()
		},
		render(tokens: ExtractedToken[], editor: vscode.TextEditor, options: ServiceOptions) {
			const a = Now()
			_render()
			const b = Now()
			console.trace(`colors decoration (${Number(b - a)}ms)`)

			return

			function _render() {
				const colorRanges = getColorRanges(tokens, editor.document)
				const new_keys = new Map(colorRanges.map(v => [toKey(v[0]), v[0]]))

				for (const key of colors.keys()) {
					if (new_keys.has(key)) continue
					const deco = colors.get(key)
					deco?.dispose()
					colors.delete(key)
				}
				for (const [key, desc] of new_keys) {
					if (!colors.has(key)) {
						colors.set(key, createTextEditorDecorationType(desc, options))
					}
				}

				const cate = new Map<string, vscode.Range[]>()
				for (const [desc, range] of colorRanges) {
					const key = toKey(desc)
					const ranges = cate.get(key)
					if (ranges) {
						ranges.push(range)
					} else {
						cate.set(key, [range])
					}
				}

				// render
				for (const [key, ranges] of cate) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					editor.setDecorations(colors.get(key)!, ranges)
				}
			}
		},
	} as const

	function getColorRanges(tokens: ExtractedToken[], document: TextDocument) {
		const colors: Array<[ColorDesc, vscode.Range]> = []
		for (const token of tokens) {
			const { start: offset, kind } = token
			switch (kind) {
				case "tw": {
					const program = tw.context.parser.createProgram(token.value)
					const items: parser.Leaf[] = []
					walk(program, node => {
						items.push(node)
					})
					for (const node of items) {
						if (node.type === parser.NodeType.ClassName) {
							const color = tw.decorationColors.get(node.getText())
							if (!color) {
								const i = node.getText().lastIndexOf("/")
								if (i === -1) continue
							}
							if (color) {
								const range = new vscode.Range(
									document.positionAt(offset + node.range[0]),
									document.positionAt(offset + node.range[1]),
								)
								colors.push([color, range])
							} else {
								const i = node.getText().lastIndexOf("/")
								if (i === -1) continue
								const value = node.getText().slice(0, i)
								const color = tw.decorationColors.get(value)
								if (color) {
									const start = offset + node.range[0]
									const end = start + value.length
									const range = new vscode.Range(document.positionAt(start), document.positionAt(end))
									colors.push([color, range])
								}
							}
						} else if (node.type === parser.NodeType.ArbitraryClassname) {
							const [start] = node.range
							const end = start + node.prefix.range[1] - node.prefix.range[0]
							const value = token.value.slice(start, end)
							const color = tw.decorationColors.get(value)
							if (color) {
								const range = new vscode.Range(
									document.positionAt(offset + start),
									document.positionAt(offset + end),
								)
								colors.push([color, range])
							}
						}
					}
					break
				}
				case "theme": {
					const val = parser.parse_theme_val(token.value)
					const color = getThemeDecoration(val, tw)
					if (color) {
						const range = new vscode.Range(
							document.positionAt(offset + val.range[0]),
							document.positionAt(offset + val.range[1]),
						)
						colors.push([{ backgroundColor: color }, range])
					}
					break
				}
			}
		}
		return colors
	}

	function toKey(desc: ColorDesc) {
		return sha1(desc)
	}

	function createTextEditorDecorationType(desc: ColorDesc, opts: ServiceOptions) {
		const options: vscode.DecorationRenderOptions = { light: {}, dark: {} }
		if (desc.backgroundColor) {
			const backgroundColor = desc.backgroundColor === "transparent" ? transparent : rgb(desc.backgroundColor)
			options.backgroundColor = culori.formatRgb(backgroundColor)
			if (desc.backgroundColor === "transparent") {
				setTransparent(options)
			} else {
				const color = hsl(backgroundColor)
				color.s = 0
				const out = ensureContrastRatio(rgb(color), backgroundColor, opts.minimumContrastRatio)
				if (out) options.color = culori.formatRgb(out)
				else options.color = culori.formatRgb(color)
			}
		}

		options.borderRadius = "3px"
		if (desc.borderColor) {
			const borderColor = desc.borderColor === "transparent" ? transparent : rgb(desc.borderColor)
			options.borderColor = culori.formatRgb(borderColor)
			options.borderWidth = "2px"
			options.borderStyle = "solid"
			if (desc.borderColor === "transparent") {
				setTransparent(options)
			}
		}
		if (desc.color) {
			const color = desc.color === "transparent" ? transparent : rgb(desc.color)
			if (desc.color !== "transparent") {
				options.color = culori.formatRgb(color)
				if (!options.backgroundColor) {
					const backgroundColor = hsl(color)
					backgroundColor.s = 0
					const out = ensureContrastRatio(rgb(backgroundColor), color, opts.minimumContrastRatio)
					if (out) options.backgroundColor = culori.formatRgb(out)
					else options.backgroundColor = culori.formatRgb(backgroundColor)
				}
			} else {
				setTransparent(options)
			}
		}
		return vscode.window.createTextEditorDecorationType(options)

		function setTransparent(options: vscode.DecorationRenderOptions) {
			if (options.light) {
				options.light.borderWidth = "medium"
				options.light.borderStyle = "dashed"
				options.light.color = "rgb(28, 28, 28, 0.93)"
				options.light.borderColor = "rgba(28, 28, 28, 0.1)"
			}
			if (options.dark) {
				options.dark.borderWidth = "medium"
				options.dark.borderStyle = "dashed"
				options.dark.color = "rgba(227, 227, 227, 0.93)"
				options.dark.borderColor = "rgba(227, 227, 227, 0.1)"
			}
		}
	}

	function getThemeDecoration(
		node: parser.ThemeValueNode,
		tw: ReturnType<typeof createTwContext>,
	): string | undefined {
		const out = parser.renderThemePath(tw.tailwindConfig, node.path)
		if (out === "transparent") return out
		const color = culori.parse(out)
		if (!color) return undefined
		if (out.match(/^\d/) != null) return undefined
		color.alpha = 1
		return culori.formatRgb(color)
	}
}
