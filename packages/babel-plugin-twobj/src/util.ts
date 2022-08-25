import { NodePath } from "@babel/core"
import babel from "@babel/types"

export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

export function getFirstQuasi(
	path: NodePath<babel.TaggedTemplateExpression>,
): NodePath<babel.TemplateElement> | undefined {
	const quasi = path.get("quasi")
	const expressions = quasi.get("expressions")
	if (expressions.length > 0) {
		throw expressions[0].buildCodeFrameError("twobj: only allow plain text in template string.")
	}
	const quasis = quasi.get("quasis")
	if (quasis.length > 0) {
		return quasis[0]
	}
	return undefined
}

export function buildPrimitive(t: typeof babel, value: unknown) {
	if (typeof value === "string") {
		return t.stringLiteral(value)
	}
	if (typeof value === "number") {
		return t.numericLiteral(value)
	}
	if (typeof value === "boolean") {
		return t.booleanLiteral(value)
	}
	if (value === undefined) {
		return t.identifier("undefined")
	}
	return t.nullLiteral()
}

export function buildArrayExpression(t: typeof babel, value: unknown[]): babel.ArrayExpression {
	return t.arrayExpression(
		value.map((val: unknown) => {
			if (Array.isArray(val)) {
				return buildArrayExpression(t, val)
			}
			if (isObject(val)) {
				return buildObjectExpression(t, val)
			}
			return buildPrimitive(t, val)
		}),
	)
}

export function buildObjectExpression(t: typeof babel, obj: Record<string, unknown>): babel.ObjectExpression {
	const members: babel.ObjectProperty[] = []
	for (const k in obj) {
		const key = /^[a-zA-Z]\w*$/.test(k) ? t.identifier(k) : t.stringLiteral(k)
		const v = obj[k]

		if (Array.isArray(v)) {
			members.push(t.objectProperty(key, buildArrayExpression(t, v)))
			continue
		}

		if (isObject(v)) {
			members.push(t.objectProperty(key, buildObjectExpression(t, v)))
			continue
		}

		members.push(t.objectProperty(key, buildPrimitive(t, v)))
	}
	return t.objectExpression(members)
}

export function buildStyleObjectExpression(t: typeof babel, obj: Record<string, unknown>) {
	const members: babel.ObjectProperty[] = []
	for (const k in obj) {
		const key = /^[a-zA-Z]\w*$/.test(k) ? t.identifier(k) : t.stringLiteral(k)
		let v = (obj as Record<string, unknown>)[k]
		if (isObject(v)) {
			const result = buildStyleObjectExpression(t, v)
			if (result) {
				members.push(t.objectProperty(key, result))
			}
			continue
		}

		if (Array.isArray(v) && v[v.length - 1] != undefined) {
			v = v[v.length - 1] // pick last value
		}

		if (Array.isArray(v)) {
			continue
		}

		members.push(t.objectProperty(key, buildPrimitive(t, v)))
	}
	return t.objectExpression(members)
}
