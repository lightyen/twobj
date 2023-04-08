import * as culori from "culori"
import { sha1 } from "object-hash"
import type { AtRule, Root, Rule } from "postcss"
import postcss from "postcss"
import postcssJs from "postcss-js"
import type { Plugin } from "prettier"
import cssPrettier from "prettier/plugins/postcss"
import * as prettier from "prettier/standalone"
import type { CSSProperties, ResolvedConfigJS, ValueType } from "twobj"
import { createContext } from "twobj"
import * as parser from "twobj/parser"
import { isColorFunction, isColorHexValue, isColorIdentifier, parse as parseColors } from "~/common/color"
import { defaultLogger as console } from "~/common/logger"

async function beautify(root: Root, tabSize: number) {
	const text = root.toString()
	try {
		const formatted = await format(text)
		const result = postcss().process(formatted, { from: undefined })
		root = result.root
		const raws = root.raws
		raws.indent = "".padStart(tabSize)
		return root
	} catch (error) {
		console.error(error)
		return root
	}

	function format(code: string) {
		return prettier.format(code, {
			parser: "scss",
			plugins: [cssPrettier as unknown as Plugin],
			useTabs: false,
			tabWidth: tabSize,
		})
	}
}

function comment(node: Root): void {
	node.each(node => {
		switch (node.type) {
			case "atrule":
			case "rule":
				addComment(node)
				break
		}
	})

	return

	function addComment(node: AtRule | Rule) {
		if (node.nodes.every(n => n.type === "decl")) {
			node.prepend(postcss.comment({ text: "..." }))
			return
		}
		node.each(node => {
			switch (node.type) {
				case "atrule":
				case "rule":
					addComment(node)
					break
			}
		})
	}
}

export type ColorDesc = {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

export type TwContext = Awaited<ReturnType<typeof createTwContext>>

export type CssText = string
export type ScssText = string

function guessValue(typ: ValueType | "any") {
	switch (typ) {
		case "number":
			return "1"
		case "percentage":
			return "1%"
		case "background-position":
			return "center"
		case "background-size":
			return "auto 100%"
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

export async function createTwContext(config: ResolvedConfigJS) {
	if (typeof config.prefix === "function") {
		console.info("function prefix is not supported.")
		config.prefix = ""
	}

	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}

	const context = createContext(config)

	const s = Object.keys(config.theme.screens).map(key => ({ key, value: "" }))
	await Promise.all(
		s.map(o => async () => {
			o.value = await renderVariant(o.key)
		}),
	)
	s.sort((a, b) => screenSorter(a.value, b.value))
	const screens = s.map(o => o.key)

	const variantSet = context.getVariants()

	const variants: [string[], string[], string[], string[]] = [screens, [], [], []]
	for (const k of variantSet) {
		switch (k) {
			case "dark":
				variants[1].push(k)
				break
			case "placeholder":
				variants[2].push(k)
				break
			default:
				if (screens.indexOf(k) === -1) {
					variants[3].push(k)
				}
				break
		}
	}

	const decorationColors: Map<string, ColorDesc> = new Map()
	const completionColors: Map<string, string | undefined> = new Map()
	for (const [key, values] of context.getColorUtilities().entries()) {
		const result = getDecorationColor(values)
		if (result) {
			decorationColors.set(key, { backgroundColor: result })
		}
		if (values.length > 0) {
			completionColors.set(key, getCompletionColor(values[0]))
		}
	}

	const declsCache: Map<string, ReturnType<typeof renderDecls>> = new Map()

	const utilitySet = context.getUtilities()

	const arbitrary: Record<string, Partial<Record<ValueType | "any", Set<string>>>> = {}

	for (const [key, valueTypes] of context.arbitraryUtilities) {
		const prefix = key
		if (!arbitrary[prefix]) {
			arbitrary[prefix] = {}
		}

		for (const type of valueTypes) {
			const input = `${key}-[${guessValue(type)}]`
			const { decls } = renderDecls(input)
			const types = arbitrary[prefix][type]
			if (!types) {
				arbitrary[prefix][type] = new Set(decls.keys())
			} else {
				for (const prop of decls.keys()) {
					types.add(prop)
				}
			}
		}
	}

	let globalStyles: Root | undefined

	return {
		context,
		tailwindConfig: config,
		variants,
		variantSet,
		utilitySet,
		screens,
		isSimpleVariant,
		renderVariant,
		renderVariantScope,
		renderClassname,
		renderDecls,
		renderGlobalStyles,
		decorationColors,
		completionColors,
		prefix: config.prefix,
		arbitrary,
	} as const

	async function renderVariant(value: string | parser.Variant, tabSize = 4) {
		const fn = context.wrap(value)
		let { root } = postcss().process(fn(), {
			from: undefined,
			parser: postcssJs,
		})

		root = await beautify(root, tabSize)
		comment(root)
		return root.toString()
	}

	function renderVariantScope(...variants: parser.Variant[]): string {
		const fn = context.wrap(...variants)
		const hash = sha1(fn()) as string
		return hash
	}

	function renderScope(style: CSSProperties) {
		style = copyWithoutProps(style)
		return sha1(style) as string
		function copyWithoutProps(obj: CSSProperties) {
			const retValue: CSSProperties = {}
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

	function render(classname: string, tabSize = 4, showVariants = false, variants: parser.Variant[] = []) {
		let css = context.css(classname)
		if (showVariants) {
			css = context.wrap(...variants)(css)
		}
		const result = postcss().process(wrap(css), {
			from: undefined,
			parser: postcssJs,
		})
		const root = result.root
		const raws = root.raws as { indent: string }
		raws.indent = "".padStart(tabSize)
		return { root, css }

		function wrap(style: CSSProperties) {
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

	async function renderClassname({
		classname,
		variants = [],
		important = false,
		rootFontSize = 0,
		tabSize = 4,
		colorHint = "none",
		showVariants = false,
	}: {
		classname: string
		variants?: parser.Variant[]
		important?: boolean
		rootFontSize?: number
		tabSize?: number
		colorHint?: "none" | "hex" | "rgb" | "hsl"
		showVariants?: boolean
	}) {
		let { root } = render(classname, tabSize, showVariants, variants)
		root = await beautify(root, tabSize)
		if (important || rootFontSize) {
			root.walkDecls(decl => {
				decl.important ||= important
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
		return getWidth(a) - getWidth(b)
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

	async function renderGlobalStyles({
		rootFontSize = 0,
		tabSize = 4,
		colorHint = "none",
	}: {
		rootFontSize?: number
		tabSize?: number
		colorHint?: "none" | "hex" | "rgb" | "hsl"
	}) {
		if (globalStyles) {
			const clone = globalStyles.clone()
			decorate(clone)
			return clone.toString()
		}

		const { root } = postcss().process(context.globalStyles, {
			from: undefined,
			parser: postcssJs,
		})

		globalStyles = await beautify(root, tabSize)
		const clone = globalStyles.clone()
		decorate(clone)
		return clone.toString()

		function decorate(root: Root) {
			const raws = root.raws as { indent: string }
			raws.indent = "".padStart(tabSize)
			if (rootFontSize) {
				root.walkDecls(decl => {
					if (colorHint && colorHint !== "none") decl.value = extendColorValue(decl.value, colorHint)
					decl.value = toPixelUnit(decl.value, rootFontSize)
				})
			}
		}
	}

	function isSimpleVariant(value: string) {
		return variantSet.has(value)
	}
}
