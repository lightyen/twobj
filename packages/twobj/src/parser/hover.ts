import * as nodes from "./nodes"
import * as parser from "./parse_regexp"

interface HoverResultVariant {
	type: "variant"
	target: nodes.Variant
}

interface HoverResultClassName {
	type: "classname"
	target: nodes.Classname | nodes.ArbitraryClassname | nodes.ArbitraryProperty
	value: string
	variants: nodes.Variant[]
	important: boolean
}

type HoverResult = HoverResultVariant | HoverResultClassName

export function hover({
	position,
	text,
	separator = ":",
}: {
	position: number
	text: string
	separator?: string
}): HoverResultClassName | HoverResultVariant | undefined {
	interface Context {
		important: boolean
		variants: nodes.Variant[]
	}

	const inRange = (node: nodes.Node) => position >= node.range[0] && position < node.range[1]

	const travel = (node: nodes.Node, ctx: Context): HoverResult | undefined => {
		const walk = (node: nodes.Node): HoverResult | undefined => {
			if (nodes.NodeType.VariantSpan === node.type) {
				const variants = ctx.variants.slice()
				if (inRange(node.variant)) {
					return {
						type: "variant",
						target: node.variant,
					}
				}
				if (!node.child) return undefined
				variants.push(node.variant)
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
					type: "classname",
					target: node,
					value: text.slice(node.range[0], node.range[1]),
					important: ctx.important || node.important,
					variants: ctx.variants,
				}
			}

			if (nodes.NodeType.ArbitraryProperty === node.type) {
				return {
					type: "classname",
					target: node,
					value: text.slice(node.decl.range[0], node.decl.range[1]),
					important: ctx.important || node.important,
					variants: ctx.variants,
				}
			}

			if (nodes.NodeType.ArbitraryClassname === node.type) {
				return {
					type: "classname",
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
	return travel(parser.parse(text, [undefined, undefined, position]), {
		important: false,
		variants: [],
	})
}
