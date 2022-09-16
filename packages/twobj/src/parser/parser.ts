import * as nodes from "./nodes"
import { findRightBracket, isSpace, removeComments } from "./util"

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

export function escapeRegexp(value: string) {
	return value.replace(/[/\\^$+?.()|[\]{}]/g, "\\$&")
}

export const validChars = /[^\s:()[\]{}!]/

export interface ParsedResult {
	expr?: nodes.Expression
	lastIndex: number
}

type TokenU = string
type TokenV = [string, TokenExpr?]
export type TokenExpr = TokenV | TokenU | TokenExpr[]

export interface SpreadedItem {
	target: nodes.Classname | nodes.ArbitraryClassname | nodes.ArbitraryProperty | nodes.ShortCss
	value: string
	variants: nodes.Variant[]
	important: boolean
}

export interface SpreadResult {
	items: SpreadedItem[]
	emptyGroup: nodes.Group[]
	emptyVariants: nodes.VariantSpan[]
	notClosed: nodes.BracketNode[]
}

export interface HoverResultVariant {
	type: "variant"
	target: nodes.Variant
}

export interface HoverResultClassName {
	type: "classname"
	target: nodes.Classname | nodes.ArbitraryClassname | nodes.ArbitraryProperty
	value: string
	variants: nodes.Variant[]
	important: boolean
}

export type HoverResult = HoverResultVariant | HoverResultClassName

export interface SuggestResult {
	inComment: boolean
	variants: nodes.Variant[]
	target?:
		| nodes.Classname
		| nodes.ArbitraryClassname
		| nodes.ArbitraryProperty
		| nodes.SimpleVariant
		| nodes.ArbitrarySelector
		| nodes.ArbitraryVariant
}

export function createParser(separator = ":") {
	if (!validSeparator(separator)) {
		console.warn("[warn] invalid separator:", separator)
	}
	let regexp = compileRegexp(escapeRegexp(separator))
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
		},
		validSeparator,
		parse,
		hover,
		suggest,
		spread,
		tokenize,
	}

	function validSeparator(sep: string) {
		return /[^\s()[\]{}/!-]/.test(sep)
	}

	function compileRegexp(sep: string) {
		return new RegExp(
			`([\\w<>@#$%&=?-]+?${sep})|(!?\\[)|!?((?!\\/)(?:${validChars.source})+)\\[|(!?(?:${validChars.source})+)!?|(!?\\()|(\\S+)`,
			"gs",
		)
	}

	function parse(source: string, [start = 0, end = source.length, breac = Infinity] = []): nodes.Program {
		source = source.slice(0, start) + removeComments(source.slice(start, end), true) + source.slice(end)
		return {
			type: nodes.NodeType.Program,
			range: [start, end],
			expressions: parseExpressions(source, [start, end, breac]),
			getText() {
				return source.slice(this.range[0], this.range[1])
			},
		}
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
			const [, simpleVariant, leftSquareBracket, prefixLeftSquareBracket, classnames, group, others] = match
			start = match.index

			if (simpleVariant) {
				start += simpleVariant.length
				const variant: nodes.SimpleVariant = {
					type: nodes.NodeType.SimpleVariant,
					range: [match.index, start],
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
					id: {
						type: nodes.NodeType.Identifier,
						range: [match.index, start - separator.length],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					},
				}

				if (isSpace(source.charCodeAt(start)) || isComment(start)) {
					const span: nodes.VariantSpan = {
						type: nodes.NodeType.VariantSpan,
						variant: variant,
						range: [match.index, regexp.lastIndex],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					}
					return { expr: span, lastIndex: regexp.lastIndex }
				}

				const { expr, lastIndex } = parseExpression(source, [start])
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant: variant,
					range: [match.index, lastIndex],
					child: expr,
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
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
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
						decl: {
							type: nodes.NodeType.CssDeclaration,
							range: [match.index + 1, end],
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
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
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
							decl: {
								type: nodes.NodeType.CssDeclaration,
								range: [start + 1, ar_rb],
								getText() {
									return source.slice(this.range[0], this.range[1])
								},
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
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					}
					return { expr: classname, lastIndex: start + 1 }
				}

				start = ar_rb + 1 + separator.length
				regexp.lastIndex = start

				const variant: nodes.ArbitrarySelector = {
					type: nodes.NodeType.ArbitrarySelector,
					range: [match.index, regexp.lastIndex],
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
					selector: {
						type: nodes.NodeType.CssSelector,
						range: [match.index + 1, ar_rb],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					},
				}

				if (isSpace(source.charCodeAt(start)) || isComment(start)) {
					const span: nodes.VariantSpan = {
						type: nodes.NodeType.VariantSpan,
						variant,
						range: [match.index, regexp.lastIndex],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					}
					return { expr: span, lastIndex: regexp.lastIndex }
				}

				const { expr, lastIndex } = parseExpression(source, [start])
				const span: nodes.VariantSpan = {
					type: nodes.NodeType.VariantSpan,
					variant,
					range: [match.index, lastIndex],
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
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
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
				}

				const ar_rb = findRightBracket({
					text: source,
					start: regexp.lastIndex - 1,
					end,
					brackets: [91, 93],
					comments: false,
				})
				if (ar_rb == undefined) {
					if (exclamationLeft) start++
					const expr: nodes.CssExpression = {
						type: nodes.NodeType.CssExpression,
						range: [regexp.lastIndex, end],
						value: source.slice(regexp.lastIndex, end),
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					}
					if (hyphen) {
						// text-[
						const node: nodes.ArbitraryClassname = {
							type: nodes.NodeType.ArbitraryClassname,
							prefix,
							expr,
							important: exclamationLeft,
							range: [start, end],
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
							closed: false,
						}
						return { expr: node, lastIndex: end }
					}

					if (slash) {
						// text-color/[
						prefix.range[1] = prefix.range[1] - 1
						const node: nodes.ArbitraryClassname = {
							type: nodes.NodeType.ArbitraryClassname,
							prefix,
							expr: undefined,
							important: exclamationLeft,
							range: [start, end],
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
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
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
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
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
						}
						return { expr: classname, lastIndex: start + 1 }
					}

					// any-[]:
					const prefix: nodes.Identifier = {
						type: nodes.NodeType.Identifier,
						range: [start, regexp.lastIndex - 1],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
					}

					start = ar_rb + 1 + separator.length
					const variant: nodes.ArbitraryVariant = {
						type: nodes.NodeType.ArbitraryVariant,
						range: [match.index, start],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
						prefix,
						selector: {
							type: nodes.NodeType.CssSelector,
							range: [regexp.lastIndex, ar_rb],
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
						},
					}
					regexp.lastIndex = start

					if (isSpace(source.charCodeAt(start)) || isComment(start)) {
						const span: nodes.VariantSpan = {
							type: nodes.NodeType.VariantSpan,
							variant,
							range: [match.index, regexp.lastIndex],
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
						}
						return { expr: span, lastIndex: regexp.lastIndex }
					}

					const { expr, lastIndex } = parseExpression(source, [start])
					const span: nodes.VariantSpan = {
						type: nodes.NodeType.VariantSpan,
						variant,
						range: [match.index, lastIndex],
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
						child: expr,
					}
					return { expr: span, lastIndex }
				}

				if (exclamationLeft) start++
				const expr: nodes.CssExpression = {
					type: nodes.NodeType.CssExpression,
					range: [regexp.lastIndex, ar_rb],
					value: source.slice(regexp.lastIndex, ar_rb),
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
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
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
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
								comments: false,
							})
							if (rb != undefined) {
								e = {
									type: nodes.NodeType.WithOpacity,
									range: [regexp.lastIndex, rb + 1],
									getText() {
										return source.slice(this.range[0], this.range[1])
									},
									opacity: {
										type: nodes.NodeType.Identifier,
										range: [regexp.lastIndex + 1, rb],
										getText() {
											return source.slice(this.range[0], this.range[1])
										},
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
									getText() {
										return source.slice(this.range[0], this.range[1])
									},
									opacity: {
										type: nodes.NodeType.Identifier,
										range: [regexp.lastIndex + 1, end],
										getText() {
											return source.slice(this.range[0], this.range[1])
										},
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
								getText() {
									return source.slice(this.range[0], this.range[1])
								},
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
						getText() {
							return source.slice(this.range[0], this.range[1])
						},
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
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
				}

				if (slash) {
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
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
					important: exclamationLeft || exclamationRight,
				}

				return { expr: classname, lastIndex: regexp.lastIndex }
			}

			if (group) {
				const rb = findRightBracket({ text: source, start, end })
				let hasSeparator = rb != undefined
				if (rb != undefined) {
					for (let i = 0; i < separator.length; i++) {
						if (source.charCodeAt(rb + 1 + i) !== separator.charCodeAt(i)) {
							hasSeparator = false
							break
						}
					}

					// (variant1: variant2:):
					if (hasSeparator) {
						const expressions = parseExpressions(source, [start + 1, rb])
						const variant: nodes.GroupVariant = {
							type: nodes.NodeType.GroupVariant,
							important: exclamationLeft,
							range: [start + 1, rb],
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
							expressions,
						}

						regexp.lastIndex = rb + 1 + separator.length

						if (isSpace(source.charCodeAt(regexp.lastIndex)) || isComment(regexp.lastIndex)) {
							const span: nodes.VariantSpan = {
								type: nodes.NodeType.VariantSpan,
								variant,
								range: [start, regexp.lastIndex],
								getText() {
									return source.slice(this.range[0], this.range[1])
								},
							}
							return { expr: span, lastIndex: regexp.lastIndex }
						}

						start = regexp.lastIndex

						const { expr, lastIndex } = parseExpression(source, [start])
						const span: nodes.VariantSpan = {
							type: nodes.NodeType.VariantSpan,
							variant: variant,
							range: [match.index, lastIndex],
							child: expr,
							getText() {
								return source.slice(this.range[0], this.range[1])
							},
						}

						return { expr: span, lastIndex }
					}
				}

				let exclamationRight = false

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
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
					expressions,
				}

				return { expr: group, lastIndex }
			}

			if (others) {
				const classname: nodes.Classname = {
					type: nodes.NodeType.ClassName,
					important: false,
					range: [match.index, regexp.lastIndex],
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
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

	function hover(text: string, position: number): HoverResult | undefined {
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
						{
							type: nodes.NodeType.Program,
							expressions: node.expressions,
							range: node.range,
							getText() {
								return text.slice(this.range[0], this.range[1])
							},
						},
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

		return travel(parse(text, [undefined, undefined, position]), {
			important: false,
			variants: [],
		})
	}

	function suggest(text: string, position: number): SuggestResult {
		interface Context {
			variants: nodes.Variant[]
		}
		interface TravelResult {
			variants: nodes.Variant[]
			target?:
				| nodes.Classname
				| nodes.ArbitraryClassname
				| nodes.ArbitraryProperty
				| nodes.SimpleVariant
				| nodes.ArbitrarySelector
				| nodes.ArbitraryVariant
		}

		const result = travel(parse(text, [undefined, undefined, position]), { variants: [] })

		if (!result.target) {
			return {
				variants: result.variants,
				inComment: inComment(text, position),
			}
		}

		return {
			...result,
			inComment: inComment(text, position),
		}

		function inComment(source: string, position: number, [start = 0, end = source.length] = []): boolean {
			const regexp = /(")|(')|(-\[)|(\/\/[^\r\n]*(?:[^\r\n]|$))|((?:\/\*).*?(?:\*\/|$))/gs
			let match: RegExpExecArray | null
			regexp.lastIndex = start
			source = source.slice(0, end)
			let strings: 1 | 2 | undefined

			while ((match = regexp.exec(source))) {
				const [, doubleQuote, singleQuote, bracket, lineComment, blockComment] = match
				if (doubleQuote) {
					if (!strings) {
						strings = 1
					} else {
						strings = undefined
					}
				} else if (singleQuote) {
					if (!strings) {
						strings = 2
					} else {
						strings = undefined
					}
				} else if (bracket) {
					const rb = findRightBracket({
						text: source,
						start: regexp.lastIndex - 1,
						end,
						brackets: [91, 93],
						comments: false,
					})
					regexp.lastIndex = rb ? rb + 1 : end
				} else if (!strings && (lineComment || blockComment)) {
					if (position >= match.index && position <= regexp.lastIndex) {
						return true
					}
				}
			}
			return false
		}

		function inRange(node: nodes.Node) {
			return position >= node.range[0] && position <= node.range[1]
		}

		function travel(node: nodes.Node, ctx: Context): TravelResult {
			if (node == undefined) {
				return { variants: [] }
			}

			if (nodes.NodeType.Program === node.type) {
				const expr = node.expressions.find(inRange)
				if (expr) return walk(expr)
				return { ...ctx }
			}

			if (inRange(node)) return walk(node)

			return { ...ctx }

			function walk(node: nodes.Node) {
				if (nodes.NodeType.VariantSpan === node.type) {
					const variants = ctx.variants.slice()
					if (inRange(node.variant)) {
						if (nodes.NodeType.GroupVariant === node.variant.type) {
							return travel(
								{
									type: nodes.NodeType.Program,
									expressions: node.variant.expressions,
									range: node.variant.range,
									getText() {
										return text.slice(this.range[0], this.range[1])
									},
								},
								{ ...ctx },
							)
						}
						if (position === node.variant.range[1]) {
							variants.push(node.variant)
						}
						return { target: node.variant, variants }
					}
					if (!node.child) return { variants: [] }
					variants.push(node.variant)
					return travel(node.child, { ...ctx, variants })
				}

				if (nodes.NodeType.Group === node.type) {
					return travel(
						{
							type: nodes.NodeType.Program,
							expressions: node.expressions,
							range: node.range,
							getText() {
								return text.slice(this.range[0], this.range[1])
							},
						},
						{ ...ctx },
					)
				}

				if (nodes.NodeType.ArbitraryProperty === node.type || nodes.NodeType.ArbitraryClassname === node.type) {
					return { target: node, variants: ctx.variants }
				}

				if (nodes.NodeType.ClassName === node.type) {
					return { target: node, variants: ctx.variants }
				}

				return { variants: [] }
			}
		}
	}

	function spread(source: string): SpreadResult {
		interface Context {
			variants: nodes.Variant[]
			important: boolean
		}

		const items: SpreadedItem[] = []
		const emptyGroup: nodes.Group[] = []
		const emptyVariants: nodes.VariantSpan[] = []
		const notClosed: nodes.BracketNode[] = []

		const walk = (node: nodes.Expression | undefined, ctx: Context): void => {
			if (node == undefined) return

			if (nodes.NodeType.VariantSpan === node.type) {
				if (node.child == undefined) {
					emptyVariants.push(node)
					return
				}
				const variants = ctx.variants.slice()
				variants.push(node.variant)
				walk(node.child, { ...ctx, variants })
			} else if (nodes.NodeType.Group === node.type) {
				if (!node.closed) {
					notClosed.push(node)
					return
				}

				if (node.expressions.length === 0) {
					emptyGroup.push(node)
					return
				}

				node.expressions.forEach(n => walk(n, { ...ctx, important: ctx.important || node.important }))
			} else if (nodes.NodeType.ArbitraryClassname === node.type) {
				if (!node.closed) {
					notClosed.push(node)
					return
				}

				if (node.e && node.e.type === nodes.NodeType.WithOpacity && node.e.closed === false) {
					notClosed.push(node.e)
					return
				}

				items.push({
					target: node,
					value: source.slice(...node.range),
					...ctx,
					important: ctx.important || node.important,
				})
			} else if (nodes.NodeType.ArbitraryProperty === node.type) {
				if (!node.closed) {
					notClosed.push(node)
					return
				}

				items.push({
					target: node,
					value: source.slice(...node.range),
					...ctx,
					important: ctx.important || node.important,
				})
			} else if (nodes.NodeType.ShortCss === node.type) {
				if (!node.closed) {
					// notClosed.push(node)
					return
				}

				items.push({
					target: node,
					value: source.slice(...node.range),
					...ctx,
					important: ctx.important || node.important,
				})
			} else if (nodes.NodeType.ClassName === node.type) {
				items.push({
					target: node,
					value: node.getText(),
					...ctx,
					important: ctx.important || node.important,
				})
			}
		}

		const program = parse(source)
		program.expressions.forEach(expr => walk(expr, { variants: [], important: false }))

		return { items, emptyGroup, emptyVariants, notClosed } as const
	}

	function tokenize(source: string, [start = 0, end = source.length] = []): TokenExpr[] {
		const expressions = parseExpressions(source, [start, end])
		return expressions.map(_tokennize)

		function _tokennize(expr: nodes.Expression): TokenExpr {
			switch (expr.type) {
				case nodes.NodeType.VariantSpan: {
					if (expr.child) {
						return [source.slice(...expr.variant.range), _tokennize(expr.child)]
					}
					return [source.slice(...expr.variant.range)]
				}
				case nodes.NodeType.Group: {
					return expr.expressions.map(_tokennize)
				}
				case nodes.NodeType.ClassName: {
					return source.slice(...expr.range)
				}
				case nodes.NodeType.ArbitraryClassname: {
					return source.slice(...expr.range)
				}
				case nodes.NodeType.ArbitraryProperty: {
					return source.slice(...expr.range)
				}
				case nodes.NodeType.ShortCss: {
					return source.slice(...expr.range)
				}
			}
		}
	}
}
