import * as nodes from "./nodes"
import * as parser from "./parse_regexp"
import { getVariant } from "./util"

interface HoverResult {
	target:
		| nodes.SimpleVariant
		| nodes.ArbitrarySelector
		| nodes.ArbitraryVariant
		| nodes.Classname
		| nodes.ArbitraryClassname
		| nodes.ArbitraryProperty
	value: string
	variants: string[]
	important: boolean
}

export function hover({
	position,
	text,
	separator = ":",
}: {
	position: number
	text: string
	separator?: string
}): HoverResult | undefined {
	interface Context {
		important: boolean
		variants: string[]
	}

	const inRange = (node: nodes.Node) => position >= node.range[0] && position < node.range[1]

	const travel = (node: nodes.Node, ctx: Context): HoverResult | undefined => {
		const walk = (node: nodes.Node): HoverResult | undefined => {
			if (nodes.NodeType.VariantSpan === node.type) {
				const variants = ctx.variants.slice()
				if (inRange(node.variant)) {
					return {
						target: node.variant,
						value: getVariant(node.variant, separator).value,
						important: false,
						variants,
					}
				}
				if (!node.child) return undefined
				variants.push(getVariant(node.variant, separator).value)
				return travel(node.child, { ...ctx, variants })
			}

			if (nodes.NodeType.Group === node.type) {
				return travel(
					{ type: nodes.NodeType.Program, expressions: node.expressions, range: node.range },
					{ ...ctx, important: ctx.important || node.important },
				)
			}

			if (nodes.NodeType.ClassName === node.type) {
				return {
					target: node,
					value: text.slice(node.range[0], node.range[1]),
					important: ctx.important || node.important,
					variants: ctx.variants,
				}
			}

			if (nodes.NodeType.ArbitraryProperty === node.type) {
				return {
					target: node,
					value: text.slice(node.decl.range[0], node.decl.range[1]),
					important: ctx.important || node.important,
					variants: ctx.variants,
				}
			}

			if (nodes.NodeType.ArbitraryClassname === node.type) {
				return {
					target: node,
					value: text.slice(node.range[0], node.range[1]),
					important: ctx.important || node.important,
					variants: ctx.variants,
				}
			}

			return undefined
		}

		if (node == undefined) {
			return undefined
		}

		if (nodes.NodeType.Program === node.type) {
			const expr = node.expressions.find(inRange)
			if (expr) return walk(expr)
			return undefined
		}

		if (inRange(node)) {
			return walk(node)
		}

		return undefined
	}

	parser.setSeparator(separator)
	return travel(parser.parse(text, { breac: position }), {
		important: false,
		variants: [],
	})
}
