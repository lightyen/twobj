import * as nodes from "./nodes"
import { normalizeSelector } from "./util"

interface Context {
	separator: string
	preserveVariant: boolean
}

export function normalize(
	node: nodes.Node,
	{ separator = ":", preserveVariant = false }: Context = {
		separator: ":",
		preserveVariant: false,
	},
): string {
	const ctx: Context = { separator, preserveVariant }
	switch (node.type) {
		case nodes.NodeType.Program:
			return normalizeProgram(node, ctx)
		case nodes.NodeType.SimpleVariant:
		case nodes.NodeType.ArbitrarySelector:
		case nodes.NodeType.ArbitraryVariant:
		case nodes.NodeType.UnknownVariant:
		case nodes.NodeType.GroupVariant:
			return normalizeVariant(node, ctx)
		case nodes.NodeType.Value:
		case nodes.NodeType.Modifier:
			return node.text
		default:
			return normalizeExpression(node, ctx)
	}
}

function normalizeProgram(node: nodes.Program, ctx: Context): string {
	return node.expressions.map(s => normalizeExpression(s, ctx)).join(" ")
}

function normalizeExpression(node: nodes.Expression, ctx: Context): string {
	switch (node.type) {
		case nodes.NodeType.Group: {
			const im = node.important ? "!" : ""
			if (node.expressions.length === 0) {
				return ""
			}
			if (node.expressions.length === 1) {
				return im + normalizeExpression(node.expressions[0], ctx)
			}
			const rb = node.closed ? ")" : ""
			return im + "(" + node.expressions.map(s => normalizeExpression(s, ctx)).join(" ") + rb
		}
		case nodes.NodeType.VariantSpan:
			return normalizeVariantSpan(node, ctx)

		case nodes.NodeType.Classname: {
			const { important, key, m } = node
			const im = important ? "!" : ""
			return im + key.text + normalizeModifier(m)
		}
		case nodes.NodeType.ArbitraryClassname:
		case nodes.NodeType.UnknownClassname: {
			const { important, key, closed, value, m } = node
			const im = important ? "!" : ""
			let v = ""
			if (closed) {
				v = "[" + value.text.trim() + "]"
			} else {
				v = "[" + value.text.trim()
			}
			return im + key.text + "-" + v + normalizeModifier(m)
		}
		case nodes.NodeType.ArbitraryProperty: {
			const { important, decl, closed } = node
			const im = important ? "!" : ""
			let v = ""
			if (closed) {
				v = "[" + decl.text.trim() + "]"
			} else {
				v = "[" + decl.text.trim()
			}
			return im + v
		}
		default:
			return ""
	}
}

function normalizeVariantSpan(node: nodes.VariantSpan, ctx: Context): string {
	if (!node.child) {
		if (!ctx.preserveVariant) {
			return ""
		}
		return node.variant.text
	}
	const str = normalizeExpression(node.child, ctx)
	if (!ctx.preserveVariant && !str) {
		return ""
	}
	return normalizeVariant(node.variant, ctx) + str
}

function normalizeVariant(node: nodes.Variant, ctx: Context): string {
	switch (node.type) {
		case nodes.NodeType.SimpleVariant:
			return node.text
		case nodes.NodeType.GroupVariant: {
			const c: Context = { ...ctx, preserveVariant: true }
			return "(" + node.expressions.map(s => normalizeExpression(s, c)).join(" ") + ")" + ctx.separator
		}
		case nodes.NodeType.ArbitrarySelector: {
			const { selector } = node
			return "[" + normalizeSelector(selector.text) + "]" + ctx.separator
		}
		case nodes.NodeType.ArbitraryVariant: {
			const { key, value, m } = node
			const v = "[" + value.text.trim() + "]"
			return key.text + "-" + v + normalizeModifier(m) + ctx.separator
		}
		default:
			return node.text
	}
}

function normalizeModifier(m?: nodes.Modifier | null | undefined): string {
	if (!m) {
		return ""
	}
	if (!m.wrapped || !m.closed) {
		return "/" + m.text.trim()
	}
	return "/[" + m.text.trim() + "]"
}
