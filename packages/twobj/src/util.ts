/* eslint-disable @typescript-eslint/no-explicit-any */

import * as parser from "./parser"
import type {
	ColorValue,
	ConfigValue,
	CSSProperties,
	CSSValue,
	CustomPalette,
	Func,
	LookupSpec,
	Palette,
	PlainCSSProperties,
	PostModifier,
	StaticSpec,
} from "./types"

export function isCSSValue(value: unknown): value is CSSValue {
	return typeof value === "string" || typeof value === "number"
}

export function isConfigValue(value: unknown): value is ConfigValue {
	return !isObject(value)
}

export function isString(value: unknown): value is string {
	return typeof value === "string"
}

export function isNumber(value: unknown): value is number {
	return typeof value === "number"
}

export function isObject(value: unknown): value is Record<string | symbol, unknown> {
	return typeof value === "object" && value !== null
}

export function isFunction(value: unknown): value is Func {
	return typeof value === "function"
}

export function isExists<T>(value: T): value is Exclude<T, null | undefined> {
	return value !== null && value !== undefined
}

export function isNotEmpty<T>(value: T): value is Exclude<T, null | undefined | "" | 0> {
	return !!value
}

export function isPlainCSSProperties(css: CSSProperties): css is PlainCSSProperties {
	return Object.values(css).every(value => typeof value !== "object")
}

export const IMPORTANT = "!important"

export function applyImportant(css: CSSProperties): CSSProperties {
	return applyModifier(css, (css = {}) => {
		return Object.fromEntries(
			Object.entries(css).map(arr => {
				const [, value] = arr
				if (typeof value === "string" && value.includes(IMPORTANT)) {
					return arr
				}
				arr[1] = `${value} ${IMPORTANT}`
				return arr
			}),
		)
	})
}

export function applyCamelCase(css: CSSProperties): CSSProperties {
	return applyModifier(css, (css = {}) => {
		return Object.fromEntries(
			Object.entries(css).map(arr => {
				const [prop, value] = arr
				if (isCSSValue(value)) {
					arr[0] = parser.camelCase(prop)
				}
				return arr
			}),
		)
	})
}

export function applyModifier(css: CSSProperties, modifier: PostModifier): CSSProperties {
	if (isPlainCSSProperties(css)) {
		return modifier(css)
	}
	for (const key in css) {
		const value = css[key]
		if (value === undefined) {
			continue
		}
		if (isCSSValue(value)) {
			continue
		}
		css[key] = applyModifier(value, modifier)
	}
	return css
}

export function isPlainObject(value: unknown): value is {} {
	if (Object.prototype.toString.call(value) !== "[object Object]") {
		return false
	}
	const prototype = Object.getPrototypeOf(value)
	return prototype === null || prototype === Object.prototype
}

export function isPlainArray(value: unknown): value is Array<unknown> {
	if (Object.prototype.toString.call(value) !== "[object Array]") {
		return false
	}
	const prototype = Object.getPrototypeOf(value)
	return prototype === null || prototype === Array.prototype
}

export function assignImpotant(target: any, source: any): any {
	if (typeof source === "string" && source.includes(IMPORTANT)) return source
	if (typeof target === "string" && target.includes(IMPORTANT)) return target
	return source
}

export function merge(target: any, ...sources: any[]): any {
	if (!sources.length) return target
	const source = sources.shift()

	if (isPlainObject(target) && isPlainObject(source)) {
		for (const key in source) {
			if (isPlainObject(source[key])) {
				if (isPlainObject(target[key])) {
					merge(target[key], source[key])
				} else {
					// value <- object
					target[key] = source[key]
				}
			} else {
				target[key] = assignImpotant(target[key], source[key])
			}
		}
	}

	return merge(target, ...sources)
}

export function flattenColorPalette(colors: Palette | null | undefined): {
	[color: string | string]: Exclude<ColorValue, CustomPalette>
} {
	return Object.assign(
		{},
		...Object.entries(colors ?? {}).flatMap(([key, child]) => {
			if (typeof child !== "object" || child === null) {
				return [{ [key]: child }]
			}
			return Object.entries(flattenColorPalette(child as Palette | null | undefined)).map(([k, v]) => {
				return {
					[key + (k === "DEFAULT" ? "" : "-" + k)]: v,
				}
			})
		}),
	)
}

export function excludeDefaultPalette(palette: ReturnType<typeof flattenColorPalette>) {
	const { DEFAULT, "-DEFAULT": _, ...rest } = palette
	return rest
}

/** opacityToFloat accept: ("48", "0.48", "48%") => (0.48, 0.48, 0.48) */
export function opacityToFloat(value: string): number {
	if (!value) return NaN

	const dot = value.indexOf(".") !== -1
	let percent = false
	if (value.endsWith("%")) {
		value = value.slice(0, -1)
		percent = true
	}

	let ret = Number(value)
	if (percent) {
		ret /= 100.0
	} else if (!dot) {
		ret /= 100.0
	}

	return ret
}

export function toArray<T>(target: T | T[]): T[] {
	if (Array.isArray(target)) return target
	return [target]
}

// Data types:
//
// { sm: '100px', md: '300px' }
// { sm: ['100px', '200px'], md: ['300px', '400px'] }
// { sm: { min: '100px', max: '200px' }, md: { min: '300px', max: '400px' } }

// => ['sm', { min: '100px', max: '200px' }, 'md', { min: '300px', max: '400px' } }]

export function normalizeScreens(screens: unknown) {
	if (!isPlainObject(screens)) {
		return {}
	}

	const result: Record<string, { raw?: CSSValue; min?: CSSValue; max?: CSSValue }> = {}

	for (const key in screens) {
		const value = screens[key]
		if (typeof value === "string") {
			result[key] = { min: value }
		} else if (isPlainArray(value)) {
			const [min, max] = value
			if (isCSSValue(min) || isCSSValue(max)) {
				result[key] = {}
				if (isCSSValue(min)) {
					result[key].min = min
				}
				if (isCSSValue(max)) {
					result[key].max = max
				}
			}
		} else if (isPlainObject(value)) {
			const { raw, min, max } = value as Record<string, string>
			if (isCSSValue(raw) || isCSSValue(min) || isCSSValue(max)) {
				result[key] = {}
				if (isCSSValue(raw)) {
					result[key].raw = raw
				}
				if (isCSSValue(min)) {
					result[key].min = min
				}
				if (isCSSValue(max)) {
					result[key].max = max
				}
			}
		}
	}
	return result
}

const colorProps = new Set<string>([
	"color",
	"outline-color",
	"border-color",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"background-color",
	"text-decoration-color",
	"accent-color",
	"caret-color",
	"fill",
	"stroke",
	"stop-color",
	"column-rule-color",
	"--tw-ring-color",
	"--tw-ring-offset-color",
	"--tw-gradient-from",
	"--tw-gradient-to",
	"--tw-gradient-stops",
	"--tw-shadow-color",
])

export function getColorClassesFrom(utilities: Map<string, LookupSpec | StaticSpec | (LookupSpec | StaticSpec)[]>) {
	const collection = new Map<string, string[]>()

	for (const entry of utilities.entries()) {
		const key = entry[0]
		let specs = entry[1]
		specs = toArray(specs)
		for (const s of specs) {
			if (s.type === "lookup" && s.isColor) {
				for (const [k, value] of Object.entries(s.values)) {
					collection.set(key + "-" + k, [toColorValue(value)])
				}
			} else if (s.type === "static") {
				const colors = extractColors(s.css)
				if (colors.length > 0) {
					collection.set(key, colors)
				}
			}
		}
	}

	return collection

	function toColorValue(value: unknown): string {
		if (typeof value === "string") {
			return value.replace("<alpha-value>", "1")
		}
		if (typeof value === "function") {
			return String(value({ opacityValue: "1" }))
		}
		return String(value)
	}

	function extractColors(style: CSSProperties): string[] {
		const colors: string[] = []
		for (const [prop, value] of Object.entries(style)) {
			if (value === undefined) {
				continue
			}
			if (isCSSValue(value)) {
				if (typeof value === "string") {
					const color = parser.parseColor(value)
					if (color && parser.isOpacityFunction(color.fn)) {
						colors.push(value)
					} else if (colorProps.has(prop)) {
						colors.push(value)
					}
				}
			} else {
				colors.push(...extractColors(value))
			}
		}
		return colors
	}
}

export function getClassListFrom(utilities: Map<string, LookupSpec | StaticSpec | (LookupSpec | StaticSpec)[]>) {
	return Array.from(utilities.entries()).flatMap(([key, specs]) => {
		specs = toArray(specs)
		return specs.flatMap(spec => {
			if (spec.type === "static") {
				return [key]
			}

			const values = Object.keys(spec.values)
			const results = values
				.map(value => {
					if (value === "DEFAULT") {
						if (spec.filterDefault) return null
						return key
					}
					return key + "-" + value
				})
				.filter((v): v is string => typeof v === "string")
			if (spec.supportsNegativeValues) {
				return results.concat(
					values
						.filter(val => parser.reverseSign(String(spec.values[val])) != undefined)
						.map(value => {
							if (value === "DEFAULT") {
								if (spec.filterDefault) return null
								return key
							}
							return "-" + key + "-" + value
						})
						.filter((v): v is string => typeof v === "string"),
				)
			}
			return results
		})
	})
}

export function getAmbiguousFrom(utilities: Map<string, LookupSpec | StaticSpec | (LookupSpec | StaticSpec)[]>) {
	const ret = new Map<string, LookupSpec[]>()
	for (const [key, u] of utilities) {
		const spec = (Array.isArray(u) ? u : [u]).filter((s): s is LookupSpec => s.type === "lookup")
		if (spec.length > 1) {
			ret.set(key, spec)
		}
	}
	return ret
}
