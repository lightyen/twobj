import * as culori from "culori"
import { sha1 } from "object-hash"
import type { AtRule, Root, Rule } from "postcss"
import postcss from "postcss"
import * as twobj from "twobj"
import * as parser from "twobj/parser"
import { isColorFunction, isColorHexValue, isColorIdentifier, parse as parseColors } from "~/common/color"
import { defaultLogger as console } from "~/common/logger"

import postcssJs from "postcss-js"

export type ColorDesc = {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

export type TwContext = ReturnType<typeof createTwContext>

export type CssText = string
export type ScssText = string

function guessValue(typ: twobj.ValueType | "any") {
	switch (typ) {
		case "number":
			return "1"
		case "percentage":
			return "1%"
		case "position":
			return "center"
		case "length":
			return "1px"
		case "color":
			return "red"
		case "angle":
			return "1deg"
		case "line-width":
			return "thin"
		case "shadow":
			return "2px 0px 5px 6px red"
		case "url":
			return "url()"
		case "image":
			return "image()"
		case "absolute-size":
			return "small"
		case "relative-size":
			return "larger"
		case "generic-name":
			return "serif"
		case "family-name":
			return "A, B"
		default:
			return "var()"
	}
}

export function createTwContext(config: Tailwind.ResolvedConfigJS) {
	const context = twobj.createContext(config)
	const screens = Object.keys(config.theme.screens).sort(screenSorter)

	if (typeof config.prefix === "function") {
		console.info("function prefix is not supported.")
		config.prefix = ""
	}

	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}

	const restVariants = Array.from(context.variants.keys()).filter(
		key => screens.indexOf(key) === -1 && key !== "dark" && key !== "light" && key !== "placeholder",
	)

	const decorationColors: Map<string, ColorDesc> = new Map()
	const completionColors: Map<string, string | undefined> = new Map()
	for (const [key, values] of context.getColorClasses().entries()) {
		const result = getDecorationColor(values)
		if (result) {
			decorationColors.set(key, { backgroundColor: result })
		}
		if (values.length > 0) {
			completionColors.set(key, getCompletionColor(values[0]))
		}
	}

	const declsCache: Map<string, ReturnType<typeof renderDecls>> = new Map()
	// sorted variants
	const variants: [string[], string[], string[], string[]] = [
		screens,
		["dark", "light"],
		["placeholder"],
		restVariants,
	]
	const classnames = context.getClassList()

	const arbitrary: Record<string, Partial<Record<twobj.ValueType | "any", string[]>>> = {}

	for (const [key, valueTypes] of context.arbitraryUtilities) {
		const prefix = key + "-"
		if (!arbitrary[prefix]) {
			arbitrary[prefix] = {}
		}

		const props = new Set<string>()
		for (const type of valueTypes) {
			const input = `${config.prefix}${key}-[${guessValue(type)}]`
			const { decls } = renderDecls(input)
			for (const key of decls.keys()) {
				props.add(key)
			}
			const types = arbitrary[prefix][type]
			if (!types) {
				arbitrary[prefix][type] = Array.from(props)
			} else {
				arbitrary[prefix][type] = types.concat(Array.from(props))
			}
		}
	}

	return {
		context,
		tailwindConfig: config,
		variants,
		classnames,
		screens,
		isVariant,
		renderVariant,
		renderVariantScope,
		renderClassname,
		renderDecls,
		getPluginName(classname: string) {
			return context.getPluginName(trimPrefix(classname))
		},
		decorationColors,
		completionColors,
		prefix: config.prefix,
		trimPrefix,
		arbitrary,
	} as const

	function trimPrefix(classname: string): string {
		return classname.slice(config.prefix.length)
	}

	function replaceSelectorAndComment(node: AtRule | Rule | Root, tabSize = 4) {
		if ((node.type === "rule" || node.type === "atrule") && node.nodes.every(n => n.type === "decl")) {
			const raws = node.raws
			raws.indent = "".padStart(tabSize)
			node.prepend(postcss.comment({ text: "..." }))
			return
		}
		node.each(node => {
			switch (node.type) {
				case "rule":
				case "atrule":
					replaceSelectorAndComment(node, tabSize)
					break
			}
		})
	}

	function renderVariant(value: string | parser.Variant, tabSize = 4): ScssText {
		const fn = context.cssVariant(value)
		const result = postcss().process(fn(), {
			from: undefined,
			parser: postcssJs,
		})

		const root = result.root
		root.each(node => {
			switch (node.type) {
				case "atrule":
				case "rule":
					replaceSelectorAndComment(node, tabSize)
					break
			}
		})
		return root.toString()
	}

	function renderVariantScope(...variants: parser.Variant[]): string {
		const fn = context.cssVariant(...variants)
		const hash = sha1(fn()) as string
		return hash
	}

	function renderScope(style: twobj.CSSProperties) {
		style = copyWithoutProps(style)
		return sha1(style) as string
		function copyWithoutProps(obj: twobj.CSSProperties) {
			const retValue: twobj.CSSProperties = {}
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value !== "string" && typeof value !== "number") {
					retValue[key] = copyWithoutProps(value)
				}
			}
			return retValue
		}
	}

	function toPixelUnit(cssValue: string, rootFontSize: number) {
		if (rootFontSize <= 0) {
			return cssValue
		}
		const reg = /(-?\d[.\d+e]*)rem/
		const match = reg.exec(cssValue)
		if (!match) {
			return cssValue
		}
		const [text, n] = match
		const val = parseFloat(n)
		if (Number.isNaN(val)) {
			return cssValue
		}

		const len = rootFontSize * val
		return cssValue.replace(reg, text + `/** ${Number.isInteger(len) ? len.toFixed(0) : len.toFixed(1)}px */`)
	}

	function extendColorValue(cssValue: string, colorHint: "hex" | "rgb" | "hsl") {
		let ret = ""
		let start = 0
		for (const c of parseColors(cssValue)) {
			const [a, b] = c.range
			const val = cssValue.slice(a, b)
			let colorVal: string | undefined
			if (isColorFunction(c)) {
				if (!c.fnName.startsWith(colorHint)) {
					if (c.fnName.startsWith("rgb")) {
						colorVal = getValue({
							mode: "rgb",
							r: +c.args[0] / 255,
							g: +c.args[1] / 255,
							b: +c.args[2] / 255,
							alpha: 1,
						})
					} else if (c.fnName.startsWith("hsl")) {
						colorVal = getValue(culori.parse(`hsl(${c.args.slice(0, 3).join(" ")})`))
					}
				}
			} else if (isColorHexValue(c) && colorHint !== "hex") {
				colorVal = getValue(culori.parse(val))
			} else if (isColorIdentifier(c)) {
				colorVal = getValue(culori.parse(val))
			}
			ret += cssValue.slice(start, b)
			if (colorVal) ret += `/** ${colorVal} */`
			start = b
		}
		if (start < cssValue.length) {
			ret += cssValue.slice(start)
		}

		return ret

		function getValue(color: culori.Color | undefined) {
			if (!color) return undefined
			switch (colorHint) {
				case "hex":
					return culori.formatHex(color)
				case "rgb":
					return culori.formatRgb(color)
				case "hsl":
					return culori.formatHsl(color)
			}
		}
	}

	function render(classname: string, tabSize = 4) {
		const css = context.css(classname)
		const result = postcss().process(wrap(css), {
			from: undefined,
			parser: postcssJs,
		})
		const root = result.root
		const raws = root.raws as { indent: string }
		raws.indent = "".padStart(tabSize)
		return { root, css }

		function wrap(style: twobj.CSSProperties) {
			if (
				Object.values(style).some(value => {
					return typeof value === "string" || typeof value === "number"
				})
			) {
				return { "&": style }
			}
			return style
		}
	}

	function renderClassname({
		classname,
		important = false,
		rootFontSize = 0,
		tabSize = 4,
		colorHint = "none",
	}: {
		classname: string
		important?: boolean
		rootFontSize?: number
		tabSize?: number
		colorHint?: "none" | "hex" | "rgb" | "hsl"
	}): ScssText {
		const { root } = render(classname, tabSize)
		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.important = important
				if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
				decl.value = toPixelUnit(decl.value, rootFontSize)
			})
		}
		return root.toString()
	}

	function getDecorationColor(values: string[]): string | undefined {
		for (const value of values) {
			const color = parser.parseColor(value)
			if (!color) {
				if (value === "transparent") {
					return value
				}
				continue
			}

			const { fn, params } = color

			const retValue = fn + "(" + params.slice(0, 3).join(" ") + ")"

			const c = culori.parse(retValue)
			if (c) {
				return retValue
			}
		}
		return undefined
	}

	function getCompletionColor(value: string): string {
		const color = parser.parseColor(value)
		if (!color) {
			if (value === "transparent") {
				return "rgba(0, 0, 0, 0.0)"
			}
			return value
		}

		const { fn, params } = color
		const retValue = fn + "(" + params.slice(0, 3).join(" ") + ")"
		const c = culori.parse(retValue)
		if (c) {
			return culori.formatHex(c)
		}

		return value
	}

	function screenSorter(a: string, b: string) {
		function getWidth(value: string) {
			const match = value.match(/@media\s+\(.*width:\s*(\d+)px/)
			if (match != null) {
				const [, px] = match
				return Number(px)
			}
			return 0
		}
		return getWidth(renderVariant(a)) - getWidth(renderVariant(b))
	}

	function renderDecls(classname: string): {
		decls: Map<string, string[]>
		rules: number
		scope: string
	} {
		const cached = declsCache.get(classname)
		if (cached) {
			return cached
		}

		const decls: Map<string, string[]> = new Map()

		const { root, css } = render(classname)
		const scope = renderScope(css)
		root.walkDecls(({ prop, value, variable }) => {
			const values = decls.get(prop)
			if (values) {
				values.push(value)
			} else {
				decls.set(prop, [value])
			}
		})

		let rules = 0
		root.walkRules(_ => {
			rules++
		})

		const ret = { decls, scope, rules }
		declsCache.set(classname, ret)
		return ret
	}

	function isVariant(value: string) {
		return context.variants.has(value)
	}
}
