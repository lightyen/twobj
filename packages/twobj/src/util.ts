/* eslint-disable @typescript-eslint/no-explicit-any */

import * as parser from "./parser"
import type {
	ColorValue,
	CSSProperties,
	CSSValue,
	CustomPalette,
	Func,
	LookupSpec,
	Palette,
	PlainCSSProperties,
	Post,
	Primitive,
	StaticSpec,
} from "./types"

export function isCSSValue(value: unknown): value is CSSValue {
	return typeof value === "string" || typeof value === "number"
}

export function isString(value: unknown): value is string {
	return typeof value === "string"
}

export function isNumber(value: unknown): value is number {
	return typeof value === "number"
}

export function isObject<T>(value: T): value is Exclude<T, Primitive | Func> {
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

export function isPlainCSSProperties(css: CSSProperties[string]): css is PlainCSSProperties {
	return Object.values(css).every(isCSSValue)
}

export function isPlainObject<T>(value: T): value is Exclude<T, Primitive | Func> {
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

export const IMPORTANT = "!important"

export function applyImportant(css: CSSProperties): CSSProperties {
	return applyPost(css, (css = {}) => {
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
	return applyPost(css, (css = {}) => {
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

export function applyPost(css: CSSProperties, post: Post): CSSProperties {
	if (isPlainCSSProperties(css)) {
		return post(css)
	}
	for (const key in css) {
		const value = css[key]
		if (value === undefined) {
			continue
		}
		if (isCSSValue(value)) {
			continue
		}
		css[key] = applyPost(value, post)
	}
	return css
}

export function assignImpotant(target: any, source: any): any {
	if (typeof source === "string" && source.lastIndexOf(IMPORTANT) !== -1) return source
	if (typeof target === "string" && target.lastIndexOf(IMPORTANT) !== -1) return target
	return source
}

export function merge(target: CSSProperties, ...sources: CSSProperties[string][]): CSSProperties {
	const source = sources.shift()
	if (source == undefined) return target

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			const dist = target[key]
			const src = source[key]

			// TODO: support array merge?
			if (isObject(src)) {
				if (isObject(dist)) {
					merge(dist, src)
				} else {
					target[key] = src
				}
				continue
			}

			target[key] = assignImpotant(dist, src)
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
				if (child == undefined) {
					return []
				}
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

export function parseLength(value: string): { value: number; unit: string } | undefined {
	const unit = parser.lengthUnits.find(u => value.endsWith(u))
	if (!unit) {
		return undefined
	}

	value = value.slice(0, -unit.length)
	const num = Number(value)
	if (Number.isNaN(num)) {
		return undefined
	}

	return { value: num, unit }
}

export interface Breakpoint {
	key: string
	value: number
}

export function normalizeScreens(screens: Record<string, CSSValue>): Array<Breakpoint> {
	if (!screens || !isPlainObject(screens)) {
		return []
	}

	const breakpoints: Array<{ key: string; value: number }> = []

	for (const key in screens) {
		const value = screens[key]
		if (typeof value === "string") {
			const val = parseLength(value)
			if (val != undefined) {
				const { value, unit } = val
				if (value > 1 && unit === "px") {
					breakpoints.push({ key, value })
				}
			}
		} else if (typeof value === "number") {
			if (value > 1) {
				breakpoints.push({ key, value })
			}
		}
	}

	breakpoints.sort((a, b) => a.value - b.value)

	return breakpoints
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
