import type { ResolvedConfigJS } from "../types"
import * as css from "./css"
import * as nodes from "./nodes"
import { NodeType, ThemePathNode } from "./nodes"
import { dlv, findRightBracket, isSpace, splitAtTopLevelOnly } from "./util"

/**
 * @param source example: "theme(colors.black / 30%) theme(colors.white)"
 */
export function parse_theme(source: string, [start = 0, end = source.length] = []) {
	let ret: nodes.ThemeFunctionNode[] = []
	while (start < end) {
		const { expr, lastIndex } = parse_theme_fn(source, [start, end])
		if (expr) ret = ret.concat(expr)
		start = lastIndex
		if (!start) break
	}
	return ret
}

/**
 * @param source example: "theme(colors.black / 30%)"
 */
function parse_theme_fn(source: string, [start = 0, end = source.length] = []) {
	const regexThemeFn = /\btheme\(/gs
	regexThemeFn.lastIndex = start
	const match = regexThemeFn.exec(source)
	if (match == null) return { lastIndex: end }

	let defaultValue: string | undefined

	const rb = findRightBracket({
		text: source,
		start: regexThemeFn.lastIndex - 1,
		end,
	})
	if (rb == undefined) {
		let valueEnd = end
		const params = splitAtTopLevelOnly(source.slice(start, valueEnd), false)
		if (params.length > 1) {
			const [first, ...rest] = params.map(v => v.value)
			if (first.length !== valueEnd - start) {
				defaultValue = rest.join(",").trim()
				valueEnd = start + first.length
			}
		}
		const node: nodes.ThemeFunctionNode = {
			type: nodes.NodeType.ThemeFunction,
			closed: false,
			range: [match.index, end],
			valueRange: [regexThemeFn.lastIndex, valueEnd],
			value: parse_theme_val(source, [regexThemeFn.lastIndex, end]),
			defaultValue,
			getText() {
				return source.slice(this.range[0], this.range[1])
			},
		}
		return { expr: node, lastIndex: end }
	}

	start = regexThemeFn.lastIndex
	end = rb

	const params = splitAtTopLevelOnly(source.slice(start, end), false)
	if (params.length > 1) {
		const [first, ...rest] = params.map(v => v.value)
		if (first.length !== end - start) {
			defaultValue = rest.join(",").trim()
			end = start + first.length
		}
	}

	const node: nodes.ThemeFunctionNode = {
		type: nodes.NodeType.ThemeFunction,
		closed: true,
		range: [match.index, rb + 1],
		valueRange: [start, end],
		defaultValue,
		value: parse_theme_val(source, [start, end]),
		getText() {
			return source.slice(this.range[0], this.range[1])
		},
	}
	return { expr: node, lastIndex: rb + 1 }
}

/**
 * @param source example: "colors.black / 30%"
 */
export function parse_theme_val(source: string, [start = 0, end = source.length] = []) {
	while (start < end && isSpace(source.charCodeAt(start))) start++
	while (start < end && isSpace(source.charCodeAt(end - 1))) end--

	// unquote
	if (source.charCodeAt(start) === 34 || source.charCodeAt(start) === 39) {
		if (source.charCodeAt(end - 1) === source.charCodeAt(start)) {
			end--
		}
		start++
	} else if (source.charCodeAt(end - 1) === 34 || source.charCodeAt(end - 1) === 39) {
		end--
	}

	const node: nodes.ThemeValueNode = {
		type: nodes.NodeType.ThemeValue,
		range: [start, end],
		path: [],
		getText() {
			return source.slice(this.range[0], this.range[1])
		},
	}

	source = source.slice(0, end)

	const regexThemePath = /(\[)|(\.[^.\s[]*)|([^.\s[]+)/gs
	while (start < end) {
		regexThemePath.lastIndex = start
		const match = regexThemePath.exec(source)
		if (match == null) break
		const [, leftSquareBracket, dotKey, firstKey] = match
		if (leftSquareBracket) {
			const rb = findRightBracket({
				text: source,
				start,
				end,
				brackets: [91, 93],
			})
			if (rb == undefined) {
				const a = match.index
				const b = end
				const n: nodes.ThemePathNode = {
					type: nodes.NodeType.ThemePath,
					range: [a, b],
					value: source.slice(a + 1, b),
					closed: false,
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
				}
				node.path = node.path.concat(n)
				start = end
				continue
			}

			const a = match.index
			const b = rb + 1
			const n: nodes.ThemePathNode = {
				type: nodes.NodeType.ThemePath,
				range: [a, b],
				value: source.slice(a + 1, b - 1),
				closed: true,
				getText() {
					return source.slice(this.range[0], this.range[1])
				},
			}
			node.path = node.path.concat(n)
			start = rb + 1
			continue
		}

		if (dotKey) {
			const a = match.index
			const b = regexThemePath.lastIndex
			const n: nodes.ThemePathNode = {
				type: nodes.NodeType.ThemePath,
				range: [a, b],
				value: source.slice(a + 1, b),
				closed: true,
				getText() {
					return source.slice(this.range[0], this.range[1])
				},
			}
			node.path = node.path.concat(n)
			start = regexThemePath.lastIndex
			continue
		}

		if (firstKey) {
			const a = match.index
			const b = regexThemePath.lastIndex
			const n: nodes.ThemePathNode = {
				type: nodes.NodeType.ThemePath,
				range: [a, b],
				value: source.slice(a, b),
				closed: true,
				getText() {
					return source.slice(this.range[0], this.range[1])
				},
			}
			node.path = node.path.concat(n)
			start = regexThemePath.lastIndex
			continue
		}
	}

	return node
}

/**
 * Render theme paths.
 *
 * @param source example: "theme(colors.black / 30%)"
 */
export function renderThemeFunc(config: ResolvedConfigJS, source: string): string {
	let start = 0
	let ret = ""

	for (const node of parse_theme(source)) {
		const [value, opacity] = theme(config, node.value.path)
		const val = value !== undefined ? renderThemeValue(value, opacity) : node.defaultValue ?? ""
		ret += source.slice(start, node.range[0]) + val
		start = node.range[1]
	}

	if (start < source.length) {
		ret += source.slice(start)
	}
	return ret.trim()
}

/**
 * Render theme path.
 *
 * @param source example: "colors.black / 30%"
 */
export function renderTheme(config: ResolvedConfigJS, source: string): string {
	const node = parse_theme_val(source)
	const [value, opacity] = theme(config, node.path)
	return value !== undefined ? renderThemeValue(value, opacity) : ""
}

/**
 * Resolve theme path.
 *
 * @param source example: "colors.black / 30%"
 * @return value target
 */
export function resolveThemeNoDefault(
	config: { theme?: unknown },
	source: string,
	defaultValue: unknown = undefined,
): unknown {
	const node = parse_theme_val(source)
	let target = resolve(config.theme, node.path, false)
	if (target) {
		return resolveThemeValue(target)
	}

	let opacity: string | undefined
	const ret = tryOpacity(node.path)
	if (ret.opacity) {
		opacity = ret.opacity
		node.path = ret.path
	}

	target = resolve(config.theme, node.path, false)
	return target !== undefined ? resolveThemeValue(target, opacity) : defaultValue ?? ""
}

/**
 * Parse theme path.
 *
 * @param source example: "colors.black / 30%"
 */
export function parseThemeValue(
	config: ResolvedConfigJS,
	source: string,
	[start = 0, end = source.length] = [],
	useDefault = false,
) {
	const node = parse_theme_val(source, [start, end])
	const value = resolve(config.theme, node.path, useDefault)
	if (value === undefined) {
		const ret = tryOpacity(node.path)
		if (ret.opacity) {
			node.path = ret.path
		}
	}
	return { path: node.path, range: node.range }
}

export function theme(
	config: ResolvedConfigJS,
	path: ThemePathNode[],
	useDefault = false,
): [value: unknown, opacity: string | undefined] {
	let value = resolve(config.theme, path, useDefault)
	if (value !== undefined) {
		return [value, undefined]
	}

	let opacity: string | undefined
	const ret = tryOpacity(path)
	if (ret.opacity) {
		value = resolve(config.theme, ret.path, useDefault)
		opacity = ret.opacity
		path = ret.path
	}
	return [value, opacity]
}

export function tryOpacity(path: ThemePathNode[]) {
	let opacity: string | undefined
	let arr = path.slice().reverse()
	let end: number | undefined
	for (let i = 0; i < arr.length; i++) {
		const n = arr[i]
		const x = n.value.lastIndexOf("/")
		if (x === -1) {
			if (end != undefined && end !== n.range[1]) {
				return { path }
			}
			end = n.range[0]
			opacity = n.getText() + (opacity ?? "")
			continue
		}

		opacity = n.value.slice(x + 1) + (opacity ?? "")

		const raw = n.getText()
		const k = raw.lastIndexOf("/")
		const rest = raw.slice(0, k)

		if (end != undefined && end !== n.range[1]) {
			if (k > 0 && k < raw.length - 1) {
				return { path }
			}
		}

		if (rest === "") {
			arr = arr.slice(i + 1)
			break
		}

		const t: ThemePathNode = { ...n, range: [n.range[0], n.range[1]] }
		t.value = n.value.slice(0, n.value.lastIndexOf("/"))
		t.range[1] = t.range[0] + k
		arr[i] = t
		arr = arr.slice(i)

		break
	}

	arr = arr.reverse()
	return { path: arr, opacity }
}

export function renderThemePath(
	config: ResolvedConfigJS,
	path: Array<string | ThemePathNode>,
	useDefault = false,
): string {
	const keys = path.map<ThemePathNode>(value => {
		if (typeof value !== "string") {
			return value
		}
		return {
			type: NodeType.ThemePath,
			closed: true,
			value,
			range: [0, value.length],
			getText() {
				return "." + value
			},
		}
	})
	return renderThemeValue(...theme(config, keys, useDefault))
}

export function resolve(obj: unknown, path: Array<string | ThemePathNode>, useDefault = false): unknown {
	const keys = path.map<string>(p => (typeof p === "string" ? p : p.value))
	let value = dlv(obj, keys)
	if (useDefault && value?.["DEFAULT"] != undefined) {
		value = value["DEFAULT"]
	}
	return value
}

export function renderThemeValue(target: unknown, opacity?: string): string {
	if (target == null) {
		return `[${target}]`
	}

	if (typeof target === "object") {
		if (Array.isArray(target)) {
			if (target.every(v => typeof v === "string")) {
				return target.join(", ")
			}
			return `Array[${target.join(", ")}]`
		}
		return (
			`Object{\n` +
			Object.keys(target)
				.map(k => `\t"${k}": "...",\n`)
				.join("") +
			"}\n"
		)
	}

	if (typeof target === "function") {
		const result = target({ opacityValue: opacity ?? "1" })
		if (typeof result === "string") {
			return result
		}
		return String(target)
	}

	if (typeof target === "string") {
		if (target.includes("<alpha-value>")) {
			return target.replace("<alpha-value>", opacity ?? "1")
		}

		if (opacity) {
			const color = css.parseColor(target)
			if (color && css.isOpacityFunction(color.fn)) {
				const { fn, params } = color
				return fn + "(" + params.slice(0, 3).join(" ") + " / " + opacity + ")"
			}

			const result = css.unwrapCssFunction(target)
			if (result) {
				const { fn, params } = result
				if (css.isOpacityFunction(fn)) {
					return fn + "(" + params + " / " + opacity + ")"
				}
				// prefer rgb()
				return "rgb(" + target + " / " + opacity + ")"
			}
		}
	}

	return String(target)
}

export function resolveThemeValue(target: unknown, opacity?: string): unknown {
	if (target == null || typeof target === "object") {
		return target
	}

	if (typeof target === "function") {
		const result = target({ opacityValue: opacity ?? "1" })
		if (typeof result === "string") {
			return result
		}
		return target
	}

	if (typeof target === "string") {
		if (target.includes("<alpha-value>")) {
			return target.replace("<alpha-value>", opacity ?? "1")
		}

		if (opacity) {
			const color = css.parseColor(target)
			if (color && css.isOpacityFunction(color.fn)) {
				const { fn, params } = color
				return fn + "(" + params.slice(0, 3).join(" ") + " / " + opacity + ")"
			}

			const result = css.unwrapCssFunction(target)
			if (result) {
				const { fn, params } = result
				if (css.isOpacityFunction(fn)) {
					return fn + "(" + params + " / " + opacity + ")"
				}
				// prefer rgb()
				return "rgb(" + target + " / " + opacity + ")"
			}
		}
	}

	return target
}
