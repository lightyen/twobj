import * as nodes from "./nodes"
import { findRightBracket, isSpace, splitAtTopLevelOnly } from "./util"

const regexThemeFn = /\btheme\(/gs

export function parse_theme({ text, start = 0, end = text.length }: { text: string; start?: number; end?: number }) {
	let ret: nodes.ThemeFunctionNode[] = []
	while (start < end) {
		const { expr, lastIndex } = parse_theme_fn({ text, start, end })
		if (expr) ret = ret.concat(expr)
		start = lastIndex
		if (!start) break
	}
	return ret
}

function parse_theme_fn({ text, start = 0, end = text.length }: { text: string; start?: number; end?: number }): {
	expr?: nodes.ThemeFunctionNode
	lastIndex: number
} {
	regexThemeFn.lastIndex = start
	const match = regexThemeFn.exec(text)
	if (match == null) return { lastIndex: end }

	let defaultValue: string | undefined

	const rb = findRightBracket({
		text,
		start: regexThemeFn.lastIndex - 1,
		end,
	})
	if (rb == undefined) {
		let valueEnd = end
		const params = splitAtTopLevelOnly(text.slice(start, valueEnd), false)
		if (params.length > 1) {
			const [first, ...rest] = params
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
			value: parse_theme_val({ text, start: regexThemeFn.lastIndex, end }),
			defaultValue,
			toString() {
				return text.slice(this.range[0], this.range[1])
			},
		}
		return { expr: node, lastIndex: end }
	}

	start = regexThemeFn.lastIndex
	end = rb

	const params = splitAtTopLevelOnly(text.slice(start, end), false)
	if (params.length > 1) {
		const [first, ...rest] = params
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
		value: parse_theme_val({ text, start, end }),
		toString() {
			return text.slice(this.range[0], this.range[1])
		},
	}
	return { expr: node, lastIndex: rb + 1 }
}

const regexThemePath = /(\[)|(\.[^.\s[]*)|([^.\s[]+)/gs

export function parse_theme_val({
	text,
	start = 0,
	end = text.length,
}: {
	text: string
	start?: number
	end?: number
}) {
	while (start < end && isSpace(text.charCodeAt(start))) start++
	while (start < end && isSpace(text.charCodeAt(end - 1))) end--

	// unquote
	if (text.charCodeAt(start) === 34 || text.charCodeAt(start) === 39) {
		if (text.charCodeAt(end - 1) === text.charCodeAt(start)) {
			end--
		}
		start++
	} else if (text.charCodeAt(end - 1) === 34 || text.charCodeAt(end - 1) === 39) {
		end--
	}

	const node: nodes.ThemeValueNode = {
		type: nodes.NodeType.ThemeValue,
		range: [start, end],
		path: [],
		toString() {
			return text.slice(this.range[0], this.range[1])
		},
	}

	text = text.slice(0, end)
	while (start < end) {
		regexThemePath.lastIndex = start
		const match = regexThemePath.exec(text)
		if (match == null) break
		const [, leftSquareBracket, dotKey, firstKey] = match
		if (leftSquareBracket) {
			const rb = findRightBracket({
				text,
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
					value: text.slice(a + 1, b),
					closed: false,
					toString() {
						return text.slice(this.range[0], this.range[1])
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
				value: text.slice(a + 1, b - 1),
				closed: true,
				toString() {
					return text.slice(this.range[0], this.range[1])
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
				value: text.slice(a + 1, b),
				closed: true,
				toString() {
					return text.slice(this.range[0], this.range[1])
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
				value: text.slice(a, b),
				closed: true,
				toString() {
					return text.slice(this.range[0], this.range[1])
				},
			}
			node.path = node.path.concat(n)
			start = regexThemePath.lastIndex
			continue
		}
	}

	return node
}
