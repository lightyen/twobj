import * as nodes from "./nodes"
import { findRightBracket, isSpace } from "./util"

// "-" 45
// "[" 91
// "]" 93
// " " 32
// "/" 47
// "*" 42
// "(" 40
// ")" 41
// "!" 33
// '"' 34
// "'" 39

function findRightBlockComment(text: string, start = 0, end = text.length): number | undefined {
	for (let i = start + 2; i < end; i++) {
		if (text.charCodeAt(i) === 42 && text.charCodeAt(i + 1) === 47) {
			return i + 1
		}
	}
	return undefined
}

export function parse(source: string, [start = 0, end = source.length, breac = Infinity] = []): nodes.Program {
	return {
		type: nodes.NodeType.Program,
		range: [start, end],
		expressions: parseExpressions(source, [start, end, breac]),
	}
}

export function parseExpressions(source: string, [start = 0, end = source.length, breac = Infinity] = []) {
	let expressions: nodes.TwExpression[] = []
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

export function escapeRegexp(value: string) {
	return value.replace(/[/\\^$+?.()|[\]{}]/g, "\\$&")
}

const validChars = /[^\s:()[\]{}!]/

function validSeparator(sep: string): boolean {
	return /[^\s()[\]{}/!-]/.test(sep)
}

let separator = ":"
export let regexp = compileRegexp(escapeRegexp(":"))

export function setSeparator(sep: string) {
	if (!validSeparator(sep)) {
		console.warn("[warn] invalid separator:", sep)
	}
	separator = sep
	regexp = compileRegexp(escapeRegexp(sep))
}

function compileRegexp(sep: string) {
	return new RegExp(
		`(\\/\\/[^\\n]*\\n?)|(\\/\\*)|([\\w<>@#$%&=?-]+?${sep})|(!?\\[)|!?((?!\\/)(?:(?!\\/\\/{1,2})${validChars.source})+)\\[|(!?(?:(?!\\/\\/|\\/\\*)${validChars.source})+)!?|(!?\\()|(\\S+)`,
		"gs",
	)
}

interface ParsedResult {
	expr?: nodes.TwExpression
	lastIndex: number
}

function parseExpression(source: string, [start = 0, end = source.length] = []): ParsedResult {
	let match: RegExpExecArray | null
	regexp.lastIndex = start
	source = source.slice(0, end)

	if ((match = regexp.exec(source))) {
		const [
			,
			lineComment,
			blockComment,
			simpleVariant,
			leftSquareBracket,
			prefixLeftSquareBracket,
			classnames,
			group,
			others,
		] = match
		start = match.index

		if (simpleVariant) {
			start += simpleVariant.length
			const variant: nodes.SimpleVariant = {
				type: nodes.NodeType.SimpleVariant,
				range: [match.index, start],
				id: {
					type: nodes.NodeType.Identifier,
					range: [match.index, start - separator.length],
					value: source.slice(match.index, start - separator.length),
				},
			}

			if (isSpace(source.charCodeAt(start)) || isComment(start)) {
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant: variant,
					range: [match.index, regexp.lastIndex],
				}
				return { expr: span, lastIndex: regexp.lastIndex }
			}

			const { expr, lastIndex } = parseExpression(source, [start])
			const span: nodes.VariantSpan = {
				type: nodes.NodeType.VariantSpan,
				variant: variant,
				range: [match.index, lastIndex],
				child: expr,
			}

			return { expr: span, lastIndex }
		}

		if (leftSquareBracket) {
			// ArbitraryProperty, ArbitrarySelector
			let exclamationLeft = false
			if (source.charCodeAt(start) === 33) {
				exclamationLeft = true
			}
			const ar_rb = findRightBracket({
				text: source,
				start: exclamationLeft ? start + 1 : start,
				end,
				brackets: [91, 93],
			})
			if (ar_rb == undefined) {
				const expr: nodes.ArbitraryProperty = {
					type: nodes.NodeType.ArbitraryProperty,
					range: [match.index, end],
					value: source.slice(match.index, end),
					decl: {
						type: nodes.NodeType.CssDeclaration,
						range: [match.index + 1, end],
						value: source.slice(match.index + 1, end),
					},
					closed: false,
					important: exclamationLeft,
				}

				return { expr, lastIndex: end }
			}

			// Does it end with separator?
			for (let i = 0; i < separator.length; i++) {
				if (source.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
					let lastIndex = ar_rb + 1
					let exclamationRight = false
					if (source.charCodeAt(ar_rb + 1) === 33) {
						exclamationRight = true
						lastIndex += 1
					}
					if (exclamationLeft) start++
					const expr: nodes.ArbitraryProperty = {
						type: nodes.NodeType.ArbitraryProperty,
						important: exclamationLeft || exclamationRight,
						range: [start, ar_rb + 1],
						value: source.slice(start, ar_rb + 1),
						decl: {
							type: nodes.NodeType.CssDeclaration,
							range: [start + 1, ar_rb],
							value: source.slice(start + 1, ar_rb),
						},
						closed: true,
					}
					return { expr, lastIndex }
				}
			}

			if (exclamationLeft) {
				const classname: nodes.Classname = {
					type: nodes.NodeType.ClassName,
					important: false,
					range: [start, start + 1],
					value: source.slice(start, start + 1),
				}
				return { expr: classname, lastIndex: start + 1 }
			}

			start = ar_rb + 1 + separator.length
			regexp.lastIndex = start

			const variant: nodes.ArbitrarySelector = {
				type: nodes.NodeType.ArbitrarySelector,
				range: [match.index, regexp.lastIndex],
				selector: {
					type: nodes.NodeType.CssSelector,
					range: [match.index + 1, ar_rb],
					value: source.slice(match.index + 1, ar_rb),
				},
			}

			if (isSpace(source.charCodeAt(start)) || isComment(start)) {
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant,
					range: [match.index, regexp.lastIndex],
				}
				return { expr: span, lastIndex: regexp.lastIndex }
			}

			const { expr, lastIndex } = parseExpression(source, [start])
			const span: nodes.VariantSpan = {
				type: nodes.NodeType.VariantSpan,
				variant,
				range: [match.index, lastIndex],
				child: expr,
			}
			return { expr: span, lastIndex }
		}

		if (prefixLeftSquareBracket) {
			// ArbitraryClassname, ArbitraryVariant, ShortCss

			// text-[___], text-[___]/opacity, text-[___]/[opacity]
			const hyphen = source.charCodeAt(regexp.lastIndex - 2) === 45
			// text-color/[opacity]
			const slash = source.charCodeAt(regexp.lastIndex - 2) === 47

			// NOTE: text-color/opacity is a normal classname.

			let exclamationLeft = false
			if (source.charCodeAt(start) === 33) {
				exclamationLeft = true
			}

			const prefix_start = exclamationLeft ? start + 1 : start
			const prefix: nodes.Identifier = {
				type: nodes.NodeType.Identifier,
				range: [prefix_start, prefix_start + prefixLeftSquareBracket.length],
				value: source.slice(prefix_start, prefix_start + prefixLeftSquareBracket.length),
			}

			const ar_rb = findRightBracket({ text: source, start: regexp.lastIndex - 1, end, brackets: [91, 93] })
			if (ar_rb == undefined) {
				if (exclamationLeft) start++
				const expr: nodes.CssExpression = {
					type: nodes.NodeType.CssExpression,
					range: [regexp.lastIndex, end],
					value: source.slice(regexp.lastIndex, end),
				}
				if (hyphen) {
					// text-[
					const node: nodes.ArbitraryClassname = {
						type: nodes.NodeType.ArbitraryClassname,
						prefix,
						expr,
						important: exclamationLeft,
						range: [start, end],
						closed: false,
					}
					return { expr: node, lastIndex: end }
				}

				if (slash) {
					// text-color/[
					prefix.value = prefix.value.slice(0, -1)
					prefix.range[1] = prefix.range[1] - 1
					const node: nodes.ArbitraryClassname = {
						type: nodes.NodeType.ArbitraryClassname,
						prefix,
						expr: undefined,
						important: exclamationLeft,
						range: [start, end],
						closed: false,
					}
					return { expr: node, lastIndex: end }
				}

				// color[
				const shortcss: nodes.ShortCss = {
					type: nodes.NodeType.ShortCss,
					prefix,
					expr,
					important: exclamationLeft,
					range: [start, regexp.lastIndex],
					closed: false,
				}
				return { expr: shortcss, lastIndex: end }
			}

			// Does it end with separator?
			let hasSeparator = true
			for (let i = 0; i < separator.length; i++) {
				if (source.charCodeAt(ar_rb + 1 + i) !== separator.charCodeAt(i)) {
					hasSeparator = false
					break
				}
			}

			if (hasSeparator) {
				if (exclamationLeft) {
					const classname: nodes.Classname = {
						type: nodes.NodeType.ClassName,
						important: false,
						range: [start, start + 1],
						value: source.slice(start, start + 1),
					}
					return { expr: classname, lastIndex: start + 1 }
				}

				// any-[]:
				const prefix: nodes.Identifier = {
					type: nodes.NodeType.Identifier,
					range: [start, regexp.lastIndex - 1],
					value: source.slice(start, regexp.lastIndex - 1),
				}

				start = ar_rb + 1 + separator.length
				const variant: nodes.ArbitraryVariant = {
					type: nodes.NodeType.ArbitraryVariant,
					range: [match.index, start],
					prefix,
					selector: {
						type: nodes.NodeType.CssSelector,
						range: [regexp.lastIndex, ar_rb],
						value: source.slice(regexp.lastIndex, ar_rb),
					},
				}
				regexp.lastIndex = start

				if (isSpace(source.charCodeAt(start)) || isComment(start)) {
					const span: nodes.VariantSpan = {
						type: nodes.NodeType.VariantSpan,
						variant,
						range: [match.index, regexp.lastIndex],
					}
					return { expr: span, lastIndex: regexp.lastIndex }
				}

				const { expr, lastIndex } = parseExpression(source, [start])
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant,
					range: [match.index, lastIndex],
					child: expr,
				}
				return { expr: span, lastIndex }
			}

			if (exclamationLeft) start++
			const expr: nodes.CssExpression = {
				type: nodes.NodeType.CssExpression,
				range: [regexp.lastIndex, ar_rb],
				value: source.slice(regexp.lastIndex, ar_rb),
			}
			const lb = regexp.lastIndex - 1
			regexp.lastIndex = ar_rb + 1

			// shortcss
			if (!slash && !hyphen) {
				const exclamationRight = source.charCodeAt(regexp.lastIndex) === 33
				if (exclamationRight) regexp.lastIndex += 1
				const shortcss: nodes.ShortCss = {
					type: nodes.NodeType.ShortCss,
					prefix,
					expr,
					important: exclamationLeft || exclamationRight,
					range: [start, exclamationRight ? regexp.lastIndex - 1 : regexp.lastIndex],
					closed: true,
				}
				return { expr: shortcss, lastIndex: regexp.lastIndex }
			}

			let e: nodes.WithOpacity | nodes.EndOpacity | undefined
			let exclamationRight = false

			// text-[]/xxx
			if (hyphen) {
				if (source.charCodeAt(regexp.lastIndex) === 47) {
					regexp.lastIndex += 1
					if (source.charCodeAt(regexp.lastIndex) === 91) {
						const rb = findRightBracket({
							text: source,
							start: regexp.lastIndex,
							end,
							brackets: [91, 93],
						})
						if (rb != undefined) {
							e = {
								type: nodes.NodeType.WithOpacity,
								range: [regexp.lastIndex, rb + 1],
								opacity: {
									type: nodes.NodeType.Identifier,
									range: [regexp.lastIndex + 1, rb],
									value: source.slice(regexp.lastIndex + 1, rb),
								},
								closed: true,
							}
							regexp.lastIndex = rb + 1

							if (source.charCodeAt(regexp.lastIndex) === 33) {
								exclamationRight = true
								regexp.lastIndex += 1
							}
						} else {
							e = {
								type: nodes.NodeType.WithOpacity,
								range: [regexp.lastIndex, end],
								opacity: {
									type: nodes.NodeType.Identifier,
									range: [regexp.lastIndex + 1, end],
									value: source.slice(regexp.lastIndex + 1, end),
								},
								closed: false,
							}
							regexp.lastIndex = end
						}
					} else {
						let k = regexp.lastIndex
						for (; k < end; k++) {
							if (isSpace(source.charCodeAt(k))) {
								break
							}
						}

						let b = k
						if (source.charCodeAt(k - 1) === 33) {
							exclamationRight = true
							b--
						}
						e = {
							type: nodes.NodeType.EndOpacity,
							range: [regexp.lastIndex, b],
							value: source.slice(regexp.lastIndex, b),
						}
						regexp.lastIndex = k
					}
				} else if (source.charCodeAt(regexp.lastIndex) === 33) {
					exclamationRight = true
					regexp.lastIndex += 1
				}
			} else if (slash) {
				e = {
					type: nodes.NodeType.WithOpacity,
					range: [lb, ar_rb + 1],
					opacity: {
						...expr,
						type: nodes.NodeType.Identifier,
					},
					closed: true,
				}

				if (source.charCodeAt(regexp.lastIndex) === 33) {
					exclamationRight = true
					regexp.lastIndex += 1
				}
			}

			const node: nodes.ArbitraryClassname = {
				type: nodes.NodeType.ArbitraryClassname,
				important: exclamationLeft || exclamationRight,
				prefix,
				expr: slash ? undefined : expr,
				e,
				closed: true,
				range: [start, exclamationRight ? regexp.lastIndex - 1 : regexp.lastIndex],
			}

			if (slash) {
				prefix.value = prefix.value.slice(0, -1)
				prefix.range[1] = prefix.range[1] - 1
			}
			return { expr: node, lastIndex: regexp.lastIndex }
		}

		let exclamationLeft = false
		if (source.charCodeAt(start) === 33) {
			exclamationLeft = true
			start += 1
		}

		if (classnames) {
			let exclamationRight = false
			let _end = regexp.lastIndex
			if (source.charCodeAt(regexp.lastIndex - 1) === 33) {
				exclamationRight = true
				_end -= 1
			}

			const classname: nodes.Classname = {
				type: nodes.NodeType.ClassName,
				range: [start, _end],
				value: source.slice(start, _end),
				important: exclamationLeft || exclamationRight,
			}

			return { expr: classname, lastIndex: regexp.lastIndex }
		}

		if (lineComment) {
			return { lastIndex: regexp.lastIndex }
		}

		if (blockComment) {
			const closeComment = findRightBlockComment(source, match.index)
			if (closeComment != undefined) {
				regexp.lastIndex = closeComment + 1
			} else {
				regexp.lastIndex = end
			}
			return { lastIndex: regexp.lastIndex }
		}

		if (group) {
			let exclamationRight = false
			const rb = findRightBracket({ text: source, start, end })
			if (rb != undefined) {
				regexp.lastIndex = rb + 1
				if (source.charCodeAt(rb + 1) === 33) {
					exclamationRight = true
					regexp.lastIndex += 1
				}
			} else {
				regexp.lastIndex = end
			}

			const _end = rb != undefined ? rb : end

			const lastIndex = regexp.lastIndex
			const expressions = parseExpressions(source, [start + 1, _end])

			const group: nodes.Group = {
				type: nodes.NodeType.Group,
				closed: rb != undefined,
				important: exclamationLeft || exclamationRight,
				range: [match.index, lastIndex],
				expressions,
			}

			return { expr: group, lastIndex }
		}

		if (others) {
			const classname: nodes.Classname = {
				type: nodes.NodeType.ClassName,
				important: false,
				range: [match.index, regexp.lastIndex],
				value: source.slice(match.index, regexp.lastIndex),
			}
			return { expr: classname, lastIndex: regexp.lastIndex }
		}
	}

	return { lastIndex: regexp.lastIndex }

	function isComment(i: number) {
		if (source.charCodeAt(i) === 47) {
			return source.charCodeAt(i) === 47 || source.charCodeAt(i) === 42
		}
		return false
	}
}
