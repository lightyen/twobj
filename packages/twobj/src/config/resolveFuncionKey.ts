import * as parser from "../parser"
import defaultColors from "./defaultColors"

function cloneDeep(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(child => cloneDeep(child))
	}
	if (typeof value === "object" && value !== null) {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneDeep(v)]))
	}
	return value
}

export default function isPlainObject(value: unknown) {
	if (Object.prototype.toString.call(value) !== "[object Object]") {
		return false
	}
	const prototype = Object.getPrototypeOf(value)
	return prototype === null || prototype === Object.prototype
}

const configUtils = {
	colors: defaultColors,
	breakpoints(screens: Record<string, unknown>) {
		return Object.keys(screens)
			.filter(key => typeof screens[key] === "string")
			.reduce(
				(breakpoints, key) => ({
					...breakpoints,
					[`screen-${key}`]: screens[key],
				}),
				{},
			)
	},
}

function parseColorFormat(value: unknown) {
	if (typeof value === "string" && value.includes("<alpha-value>")) {
		const oldValue = value
		return ({ opacityValue = "1" }) => oldValue.replace("<alpha-value>", opacityValue)
	}
	return value
}

function withAlphaValue(color: unknown, opacityValue?: string) {
	if (typeof color === "function") {
		return color({ opacityValue })
	}
	if (typeof color !== "string" || !opacityValue) {
		return color
	}
	const result = parser.parseColor(color)
	if (!result) {
		return color
	}
	if (result.params.length > 3) {
		return color
	}
	if (!parser.isOpacityFunction(result.fn)) {
		return color
	}
	opacityValue = " / " + opacityValue
	return result.fn + "(" + result.params.slice(0, 3).join(" ") + opacityValue + ")"
}

export function resolveFunctionKeys(themeObject: Record<string, unknown>): Record<string, unknown> {
	const resolveThemePath = (key: string, defaultValue?: unknown) => {
		const node = parser.parse_theme_val({ text: key })

		let target: unknown = themeObject
		let paths = node.path
		let opacityValue = ""

		for (let i = 0; i < paths.length; i++) {
			const path = paths[i].value
			if (Object.prototype.hasOwnProperty.call(target, path)) {
				target = (target as Record<string, unknown>)[path]
			} else {
				const result = parser.tryOpacityValue(paths)
				if (!result.opacityValue) {
					target = undefined
				} else {
					opacityValue = result.opacityValue
					paths = result.path

					if (i < paths.length && Object.prototype.hasOwnProperty.call(target, paths[i].value)) {
						target = (target as Record<string, unknown>)[paths[i].value]
					} else {
						target = undefined
					}
				}
				break
			}
			if (typeof target === "function" && !opacityValue) {
				target = target(resolveThemePath, configUtils)
			}
		}

		if (target !== undefined) {
			if (opacityValue) {
				if (typeof target === "string" && target.includes("<alpha-value>")) {
					target.replace("<alpha-value>", "1")
				}
				if (typeof target === "function") {
					target = target({ opacityValue })
				}
				const color = parseColorFormat(target)
				return withAlphaValue(color, opacityValue)
			}
			if (isPlainObject(target)) {
				return cloneDeep(target)
			}
			return target
		}

		return defaultValue
	}

	Object.assign(resolveThemePath, {
		theme: resolveThemePath,
		...configUtils,
	})

	return Object.keys(themeObject).reduce<Record<string, unknown>>((resolved, key) => {
		const target = themeObject[key]
		if (typeof target === "function") {
			resolved[key] = target(resolveThemePath, configUtils)
		} else {
			resolved[key] = target
		}
		return resolved
	}, {})
}
