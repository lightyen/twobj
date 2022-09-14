import * as parser from "../parser"
import { ConfigUtils } from "../types"
import { ConfigEntry, ConfigObject, ResolveThemePath } from "../types/config"
import { isPlainArray, isPlainObject } from "../util"
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

export const configUtils: ConfigUtils = {
	colors: defaultColors,
}

export function resolveFunctionKeys(themeObject: ConfigObject): ConfigObject {
	const resolveThemePath: ResolveThemePath = (path, defaultValue) => {
		const node = parser.parse_theme_val(path)

		let target: ConfigEntry = themeObject
		let paths = node.path
		let opacityValue = ""

		for (let i = 0; i < paths.length; i++) {
			const path = paths[i].value
			if (Object.prototype.hasOwnProperty.call(target, path)) {
				target = (target as ConfigObject)[path]
			} else {
				const result = parser.tryOpacity(paths)
				if (!result.opacity) {
					target = undefined
				} else {
					opacityValue = result.opacity
					paths = result.path

					if (i < paths.length && Object.prototype.hasOwnProperty.call(target, paths[i].value)) {
						target = (target as ConfigObject)[paths[i].value]
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
			if (isPlainObject(target)) {
				return cloneDeep(target)
			}
			if (isPlainArray(target)) {
				return cloneDeep(target)
			}
			if (opacityValue) {
				target = parser.resolveThemeValue(target, opacityValue) as ConfigEntry
			}
			return target
		}

		return defaultValue
	}

	resolveThemePath.theme = resolveThemePath
	resolveThemePath.colors = defaultColors

	return Object.keys(themeObject).reduce((resolved, key) => {
		const target = themeObject[key]
		if (typeof target === "function") {
			resolved[key] = target(resolveThemePath, configUtils)
		} else {
			resolved[key] = target
		}
		return resolved
	}, {})
}
