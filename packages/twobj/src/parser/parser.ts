import { HYPHEN, SLASH, SQUARE_BRACKETS } from "./charCode"
import * as nodes from "./nodes"
import { findRightBracket, generateKmpNext, isCharExclamationMark, isCharSpace, kmp, removeComments } from "./util"

export function isCharHyphen(char: number) {
	return char === HYPHEN
}

export function isCharSlash(char: number) {
	return char === SLASH
}

export function escapeRegexp(value: string) {
	return value.replace(/[/\\^$+?.()|[\]{}]/g, "\\$&")
}

export function stripBrackets(value: string): [string, boolean] {
	let a = 0
	let b = value.length
	let ok = false

	if (value.charCodeAt(a) === SQUARE_BRACKETS[0]) {
		a++
		if (value.charCodeAt(b - 1) === SQUARE_BRACKETS[1]) {
			ok = true
			b--
		}
		return [value.slice(a, b), ok]
	}

	return [value, ok]
}

export const validChars = /[^\s:()[\]{}!]/

export interface ParsedResult {
	expr?: nodes.Expression
	lastIndex: number
}

type TokenU = string
type TokenV = [string, TokenExpr?]
export type TokenExpr = TokenV | TokenU | TokenExpr[]

export function createParser(separator = ":") {
	if (!validSeparator(separator)) {
		console.warn("[warn] invalid separator:", separator)
	}
	let regexp = compileRegexp(escapeRegexp(separator))
	let kmpNext = generateKmpNext(separator)
	return {
		get separator() {
			return separator
		},
		set separator(sep: string) {
			if (!validSeparator(sep)) {
				console.warn("[warn] invalid separator:", sep)
			}
			regexp = compileRegexp(escapeRegexp(sep))
			separator = sep
			kmpNext = generateKmpNext(sep)
		},
		validSeparator,
		createProgram,
		tokenize,
	}

	function validSeparator(sep: string) {
		return /[^\s()[\]{}/!-]/.test(sep)
	}

	function compileRegexp(sep: string) {
		return new RegExp(
			`(${validChars.source}+?${sep})|(!?\\[)|!?((?!\\/)(?:${validChars.source})+)\\[|(!?(?:${validChars.source})+)!?|(!?\\()|(\\S+)`,
			"gs",
		)
	}

	function createProgram(source: string, [start = 0, end = source.length, breac = Infinity] = []): nodes.Program {
		const code = source.slice(0, start) + removeComments(source.slice(start, end), true) + source.slice(end)
		return nodes.program(parseExpressions(code, [start, end, breac]), source, start, end)
	}

	function parseExpressions(source: string, [start = 0, end = source.length, breac = Infinity] = []) {
		let expressions: nodes.Expression[] = []
		while (start < end) {
			const { expr, lastIndex } = parseExpression(source, [start, end])
			if (expr) {
				if (expr instanceof Array) {
					expressions = [...expressions, ...expr]
				} else {
					expressions.push(expr)
				}
			}
			if (lastIndex > breac) break
			start = lastIndex
			if (!start) break
		}
		return expressions
	}

	function parseExpression(source: string, [start = 0, end = source.length] = []): ParsedResult {
		let match: RegExpExecArray | null
		regexp.lastIndex = start
		source = source.slice(0, end)

		if ((match = regexp.exec(source))) {
			const [, simpleVariant, leftSquareBracket, prefixLeftSquareBracket, utility, group, others] = match
			start = match.index
			const exclamationLeft = isCharExclamationMark(source.charCodeAt(start))
			const key_start = exclamationLeft ? start + 1 : start
			const value_start = regexp.lastIndex

			if (simpleVariant) {
				const variant = nodes.variant(
					nodes.identifier(source, start, regexp.lastIndex - separator.length),
					undefined,
					source,
					key_start,
					start + simpleVariant.length,
				)

				regexp.lastIndex = variant.end

				// NOTE: variant is not support exclamation mark yet.
				// if (exclamationLeft) {
				// 	// ...
				// }

				if (isCharSpace(source.charCodeAt(variant.end))) {
					const span = nodes.variantSpan(variant, null, source, start, variant.end)
					return { expr: span, lastIndex: regexp.lastIndex }
				}

				const { expr, lastIndex } = parseExpression(source, [variant.end])
				const span = nodes.variantSpan(variant, expr, source, start, lastIndex)
				return { expr: span, lastIndex }
			}

			if (leftSquareBracket) {
				const ar_rb = findRightBracket({
					text: source,
					start: key_start,
					end,
					brackets: SQUARE_BRACKETS,
				})

				const closed = ar_rb != undefined

				if (!closed) {
					const arbitraryProperty = nodes.arbitraryProperty(
						nodes.value(source, value_start, end),
						exclamationLeft,
						closed,
						source,
						key_start,
						end,
					)
					return { expr: arbitraryProperty, lastIndex: end }
				}

				let isVariant = true
				for (let i = 0; i < separator.length; i++) {
					if (source.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
						isVariant = false
						break
					}
				}

				if (isVariant) {
					const variant = nodes.arbitrarySelector(
						nodes.value(source, value_start, ar_rb),
						source,
						key_start,
						ar_rb + 1 + separator.length,
					)

					regexp.lastIndex = variant.end

					// NOTE: variant is not support exclamation mark yet.
					// if (exclamationLeft) {
					// 	// ...
					// }

					if (isCharSpace(source.charCodeAt(variant.end))) {
						const span = nodes.variantSpan(variant, null, source, start, variant.end)
						return { expr: span, lastIndex: regexp.lastIndex }
					}

					const { expr, lastIndex } = parseExpression(source, [variant.end])
					const span = nodes.variantSpan(variant, expr, source, start, lastIndex)
					return { expr: span, lastIndex }
				}

				let lastIndex = ar_rb + 1
				let exclamationRight = false
				if (isCharExclamationMark(source.charCodeAt(lastIndex))) {
					exclamationRight = true
					lastIndex += 1
				}

				const arbitraryProperty = nodes.arbitraryProperty(
					nodes.value(source, value_start, ar_rb),
					exclamationLeft || exclamationRight,
					closed,
					source,
					key_start,
					ar_rb + 1,
				)

				return { expr: arbitraryProperty, lastIndex }
			}

			if (prefixLeftSquareBracket) {
				// NOTE: `aaa-bbb/mmm` is a simple classname

				// List: ClassName, Variant, ArbitraryClassname, ArbitraryVariant, UnknownClassname, UnknownVariant

				const lastChar = source.charCodeAt(regexp.lastIndex - 2)

				// aaa-[vvv], aaa-[vvv]/mmm, aaa-[vvv]/[mmm]
				const hyphen = isCharHyphen(lastChar)

				// aaa-bbb/[mmm]
				const slash = isCharSlash(lastChar)

				const key: nodes.Identifier = nodes.identifier(
					source,
					key_start,
					key_start + prefixLeftSquareBracket.length + (slash || hyphen ? -1 : 0),
				)

				const ar_rb = findRightBracket({
					text: source,
					start: regexp.lastIndex - 1,
					end,
					brackets: SQUARE_BRACKETS,
					comments: false,
				})

				const closed = ar_rb != undefined
				const isUnknown = !slash && !hyphen

				// aaa-bbb/[mmm]
				if (slash) {
					const modifier = nodes.modifier(closed, true, source, regexp.lastIndex, closed ? ar_rb : end)

					if (!closed) {
						const classname = nodes.classname(
							nodes.identifier(source, key_start, regexp.lastIndex - 2),
							exclamationLeft,
							modifier,
							source,
							key_start,
							end,
						)
						return { expr: classname, lastIndex: end }
					}

					let isVariant = true
					for (let i = 0; i < separator.length; i++) {
						if (source.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
							isVariant = false
							break
						}
					}

					if (isVariant) {
						const variant = nodes.variant(key, modifier, source, key.start, ar_rb + 1 + separator.length)

						regexp.lastIndex = variant.end

						// NOTE: variant is not support exclamation mark yet.
						// if (exclamationLeft) {
						// 	// ...
						// }

						if (isCharSpace(source.charCodeAt(variant.end))) {
							const span = nodes.variantSpan(variant, null, source, start, variant.end)
							return { expr: span, lastIndex: regexp.lastIndex }
						}

						const { expr, lastIndex } = parseExpression(source, [variant.end])
						const span = nodes.variantSpan(variant, expr, source, start, lastIndex)
						return { expr: span, lastIndex }
					}

					let lastIndex = ar_rb + 1
					let exclamationRight = false
					if (isCharExclamationMark(source.charCodeAt(lastIndex))) {
						exclamationRight = true
						lastIndex += 1
					}

					const classname = nodes.classname(
						nodes.identifier(source, key_start, regexp.lastIndex - 2),
						exclamationLeft || exclamationRight,
						modifier,
						source,
						key_start,
						ar_rb + 1,
					)
					return { expr: classname, lastIndex }
				}

				// aaa-[vvv], aaa-[vvv]/mmm, aaa-[vvv]/[mmm]
				const value = nodes.value(source, value_start, closed ? ar_rb : end)

				if (!closed) {
					const classname = nodes.arbitraryClassname(
						isUnknown,
						key,
						value,
						exclamationLeft,
						closed,
						null,
						source,
						key_start,
						end,
					)
					return { expr: classname, lastIndex: end }
				}

				// aaa-[..]:
				// aaa-[..]!
				// aaa-[..]\s
				// xxx-[..]/[mmm
				// aaa-[..]/[mmm]:
				// aaa-[..]/[mmm]!
				// aaa-[..]/[mmm]\s
				// aaa-[..]/mmm:
				// aaa-[..]/mmm!
				// aaa-[..]/mmm\s
				let isVariant = true
				for (let i = 0; i < separator.length; i++) {
					if (source.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
						isVariant = false
						break
					}
				}

				if (isVariant) {
					const variant = nodes.arbitraryVariant(
						isUnknown,
						key,
						value,
						null,
						source,
						start,
						ar_rb + 1 + separator.length,
					)

					regexp.lastIndex = variant.end

					// NOTE: variant is not support exclamation mark yet.
					// if (exclamationLeft) {
					// 	// ...
					// }

					if (isCharSpace(source.charCodeAt(variant.end))) {
						const span = nodes.variantSpan(variant, null, source, start, variant.end)
						return { expr: span, lastIndex: regexp.lastIndex }
					}

					const { expr, lastIndex } = parseExpression(source, [variant.end])
					const span = nodes.variantSpan(variant, expr, source, start, lastIndex)
					return { expr: span, lastIndex }
				}

				const s = source.charCodeAt(ar_rb + 1)

				if (isCharExclamationMark(s)) {
					const arbitraryClassname = nodes.arbitraryClassname(
						isUnknown,
						key,
						value,
						true,
						closed,
						null,
						source,
						key_start,
						ar_rb + 2,
					)
					return { expr: arbitraryClassname, lastIndex: ar_rb + 2 }
				}

				if (!isCharSlash(s)) {
					const arbitraryClassname = nodes.arbitraryClassname(
						isUnknown,
						key,
						value,
						exclamationLeft,
						closed,
						null,
						source,
						key_start,
						ar_rb + 1,
					)
					return { expr: arbitraryClassname, lastIndex: ar_rb + 1 }
				}

				// xxx-[..]/[mmm
				// aaa-[..]/[mmm]:
				// aaa-[..]/[mmm]!
				// aaa-[..]/[mmm]\s
				// aaa-[..]/mmm:
				// aaa-[..]/mmm!
				// aaa-[..]/mmm\s
				const a = ar_rb + 2
				let modifier: nodes.Modifier | undefined
				let term = a

				if (source.charCodeAt(a) === SQUARE_BRACKETS[0]) {
					// tooltip-[foo]/[..]:mb-2
					// bar:mb-2
					const rb = findRightBracket({
						text: source,
						start: a,
						end,
						brackets: SQUARE_BRACKETS,
						comments: false,
					})
					const closed = rb != undefined
					if (closed) {
						term = rb + 1
					} else {
						term = end
					}

					modifier = nodes.modifier(closed, true, source, a + 1, closed ? rb : end)

					if (!closed) {
						const arbitraryClassname = nodes.arbitraryClassname(
							isUnknown,
							key,
							value,
							exclamationLeft,
							closed,
							modifier,
							source,
							key_start,
							end,
						)
						return { expr: arbitraryClassname, lastIndex: end }
					}

					isVariant = true
					for (let i = 0; i < separator.length; i++) {
						if (source.charCodeAt(term + i) !== separator.charCodeAt(i)) {
							isVariant = false
							break
						}
					}
				} else {
					// tooltip-[foo]/bar:mb-2
					// bar:mb-2
					// TODO: search separator
					const { index, lastIndex } = kmp(separator, kmpNext, source.slice(a))
					if (lastIndex > 0) {
						modifier = nodes.modifier(true, false, source, a, a + lastIndex)
					}
					isVariant = index !== -1
					term = a + lastIndex
				}

				if (isVariant) {
					const variant = nodes.arbitraryVariant(
						isUnknown,
						key,
						value,
						modifier,
						source,
						start,
						term + separator.length,
					)

					regexp.lastIndex = variant.end

					// NOTE: variant is not support exclamation mark yet.
					// if (exclamationLeft) {
					// 	// ...
					// }

					if (isCharSpace(source.charCodeAt(variant.end))) {
						const span = nodes.variantSpan(variant, null, source, start, variant.end)
						return { expr: span, lastIndex: regexp.lastIndex }
					}

					const { expr, lastIndex } = parseExpression(source, [variant.end])
					const span = nodes.variantSpan(variant, expr, source, start, lastIndex)
					return { expr: span, lastIndex }
				}

				let lastIndex = term
				let exclamationRight = false
				if (isCharExclamationMark(source.charCodeAt(lastIndex))) {
					exclamationRight = true
					lastIndex += 1
				}

				const arbitraryClassname = nodes.arbitraryClassname(
					isUnknown,
					key,
					value,
					exclamationLeft || exclamationRight,
					closed,
					modifier,
					source,
					key_start,
					term,
				)

				return { expr: arbitraryClassname, lastIndex }
			}

			if (utility) {
				let exclamationRight = false
				let b = regexp.lastIndex
				if (isCharExclamationMark(source.charCodeAt(b - 1))) {
					exclamationRight = true
					b -= 1
				}
				const classname = nodes.classname(
					nodes.identifier(source, key_start, b),
					exclamationLeft || exclamationRight,
					null,
					source,
					key_start,
					b,
				)
				return { expr: classname, lastIndex: regexp.lastIndex }
			}

			if (group) {
				const rb = findRightBracket({ text: source, start: key_start, end })
				const closed = rb != undefined

				if (!closed) {
					const expressions = parseExpressions(source, [key_start + 1, end])
					const group = nodes.group(expressions, exclamationLeft, closed, source, start, end)
					return { expr: group, lastIndex: end }
				}

				let isVariant = true
				for (let i = 0; i < separator.length; i++) {
					if (source.charCodeAt(rb + 1 + i) !== separator.charCodeAt(i)) {
						isVariant = false
						break
					}
				}

				if (isVariant) {
					const expressions = parseExpressions(source, [key_start + 1, rb])
					const variant = nodes.groupVariant(expressions, source, start, rb + 1 + separator.length)

					regexp.lastIndex = variant.end

					// NOTE: variant is not support exclamation mark yet.
					// if (exclamationLeft) {
					// 	// ...
					// }

					if (isCharSpace(source.charCodeAt(variant.end))) {
						const span = nodes.variantSpan(variant, null, source, start, variant.end)
						return { expr: span, lastIndex: regexp.lastIndex }
					}

					const { expr, lastIndex } = parseExpression(source, [variant.end])
					const span = nodes.variantSpan(variant, expr, source, start, lastIndex)
					return { expr: span, lastIndex }
				}

				let lastIndex = rb + 1
				let exclamationRight = false
				if (isCharExclamationMark(source.charCodeAt(lastIndex))) {
					exclamationRight = true
					lastIndex += 1
				}

				const expressions = parseExpressions(source, [key_start + 1, rb])
				const group = nodes.group(
					expressions,
					exclamationLeft || exclamationRight,
					closed,
					source,
					start,
					lastIndex,
				)
				return { expr: group, lastIndex }
			}

			if (others) {
				const classname = nodes.classname(
					nodes.identifier(source, start, regexp.lastIndex),
					false,
					null,
					source,
					start,
					regexp.lastIndex,
				)
				return { expr: classname, lastIndex: regexp.lastIndex }
			}
		}

		return { lastIndex: regexp.lastIndex }
	}

	function tokenize(source: string, [start = 0, end = source.length] = []): TokenExpr[] {
		const expressions = parseExpressions(source, [start, end])
		return expressions.map(_tokennize)

		function _tokennize(expr: nodes.Expression): TokenExpr {
			switch (expr.type) {
				case nodes.NodeType.VariantSpan: {
					if (expr.child) {
						return [source.slice(expr.variant.start, expr.variant.end), _tokennize(expr.child)]
					}
					return [source.slice(expr.variant.start, expr.variant.end)]
				}
				case nodes.NodeType.Group: {
					return expr.expressions.map(_tokennize)
				}
				case nodes.NodeType.Classname: {
					return source.slice(expr.start, expr.end)
				}
				case nodes.NodeType.ArbitraryClassname: {
					return source.slice(expr.start, expr.end)
				}
				case nodes.NodeType.ArbitraryProperty: {
					return source.slice(expr.start, expr.end)
				}
				case nodes.NodeType.UnknownClassname: {
					return source.slice(expr.start, expr.end)
				}
			}
		}
	}
}
