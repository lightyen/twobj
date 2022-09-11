import type {
	ConfigJS,
	PresetFunction,
	ResolvedConfigJS,
	ResolveThemePath,
	UserPlugin,
	UserPluginFunctionWithOption,
	UserPluginObject,
} from "../types"
import type { AnyTheme, AnyThemeEntry, AnyThemeObject } from "../types/config"
import defaultConfig from "./defaultConfig"
import { configUtils, resolveFunctionKeys } from "./resolveFuncionKey"

function getAllConfigs(config: ConfigJS): ConfigJS[] {
	const presets = (config.presets ?? [defaultConfig])
		.slice()
		.reverse()
		.flatMap((preset: PresetFunction | ConfigJS) => getAllConfigs(preset instanceof Function ? preset() : preset))
	return [config, ...presets]
}

/** Resolve all tailwind configurations. */
export function resolveConfig(...args: Array<ConfigJS | null | undefined>) {
	let configs = args.filter((c): c is ConfigJS => Boolean(c))
	if (configs.length === 0) {
		configs = [defaultConfig]
	}
	const [, ...presets] = getAllConfigs(configs[0])
	return resolveConfigObjects([...configs, ...presets])
}

function normalizeConfig(config: ResolvedConfigJS) {
	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}
	return config
}

function extractPluginConfigs(configs: ConfigJS[]) {
	let allConfigs: ConfigJS[] = []

	configs.forEach(config => {
		allConfigs = [...allConfigs, config]

		const plugins = config?.plugins ?? []

		if (plugins.length === 0) {
			return
		}

		plugins.forEach(plugin => {
			if ((plugin as UserPluginFunctionWithOption).__isOptionsFunction) {
				plugin = (plugin as UserPluginFunctionWithOption)()
			}
			const pluginConfig = (plugin as UserPluginObject).config
			if (pluginConfig) {
				allConfigs = [...allConfigs, ...extractPluginConfigs([pluginConfig])]
			}
		})
	})

	return allConfigs
}

function resolvePluginLists(pluginLists: Array<UserPlugin>[]) {
	return pluginLists.reduceRight((resolved, pluginList) => {
		return [...resolved, ...pluginList]
	}, [])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaults(target: Record<string | symbol, any>, ...sources: Record<string | symbol, any>[]) {
	for (const source of sources) {
		for (const k in source) {
			if (!Object.prototype.hasOwnProperty.call(target, k)) {
				target[k] = source[k]
			}
		}

		for (const k of Object.getOwnPropertySymbols(source)) {
			if (!Object.prototype.hasOwnProperty.call(target, k)) {
				target[k] = source[k]
			}
		}
	}

	return target
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isFunction(value: unknown): value is Function {
	return typeof value === "function"
}

function value(valueToResolve: unknown, ...args: unknown[]) {
	return isFunction(valueToResolve) ? valueToResolve(...args) : valueToResolve
}

export function mergeWith<Item extends Array<AnyThemeEntry | AnyThemeObject> | AnyThemeObject, Return>(
	customizer: (objValue: Array<AnyThemeEntry | AnyThemeObject> | AnyThemeObject, srcValue: Item) => AnyThemeEntry,
	target: Return,
	...sources: (Item | undefined)[]
) {
	for (const source of sources) {
		if (!isObject(source)) {
			continue
		}
		for (const k in source) {
			const merged = customizer(target[k], source[k])

			if (merged === undefined) {
				const t = target[k]
				const s = source[k]
				if (isObject(t) && isObject(s)) {
					target[k] = mergeWith(customizer, {}, t, s)
				} else {
					target[k] = source[k]
				}
			} else {
				target[k] = merged
			}
		}
	}

	return target

	function isObject(value: unknown): value is Array<AnyThemeEntry | AnyThemeObject> | AnyThemeObject {
		return typeof value === "object" && value !== null
	}
}

function collectExtends(themes: AnyTheme[]) {
	const init: AnyThemeObject[] = []
	return themes.reduce((merged, { extend }) => {
		return mergeWith(
			(mergedValue, extendValue) => {
				if (Array.isArray(mergedValue)) {
					return [extendValue, ...mergedValue] as AnyThemeObject[]
				}
				return [extendValue, mergedValue] as AnyThemeObject[]
			},
			merged,
			extend,
		)
	}, init)
}

function collectThemes(themes: AnyTheme[]): { extend: AnyThemeObject[]; theme: AnyTheme } {
	return {
		theme: themes.reduce((merged, theme) => defaults(merged, theme), {}),
		extend: collectExtends(themes),
	}
}

function mergeExtensions({ theme, extend }: ReturnType<typeof collectThemes>) {
	return mergeWith(
		(themeValue, extensions) => {
			// The `extend` property is an array, so we need to check if it contains any functions
			if (!isFunction(themeValue) && Array.isArray(extensions) && !extensions.some(isFunction)) {
				return mergeWith(mergeExtensionCustomizer, {}, themeValue, ...extensions)
			}

			return (resolveThemePath: ResolveThemePath, utils: typeof configUtils) =>
				mergeWith(
					mergeExtensionCustomizer,
					[],
					...[themeValue, ...extensions].map(funcOrValue => value(funcOrValue, resolveThemePath, utils)),
				)
		},
		theme,
		extend,
	)

	function isObject(value: unknown): value is Array<AnyThemeEntry | AnyThemeObject> | AnyThemeObject {
		return typeof value === "object" && value !== null
	}

	function mergeExtensionCustomizer(
		merged: Array<AnyThemeEntry | AnyThemeObject> | AnyThemeObject,
		value: Array<AnyThemeEntry | AnyThemeObject> | AnyThemeObject,
	) {
		// When we have an array of objects, we do want to merge it
		if (Array.isArray(merged) && isObject(merged[0])) {
			return merged.concat(value)
		}

		// When the incoming value is an array, and the existing config is an object, prepend the existing object
		if (Array.isArray(value) && isObject(value[0]) && isObject(merged)) {
			return [merged, ...value]
		}

		// Override arrays (for example for font-families, box-shadows, ...)
		if (Array.isArray(value)) {
			return value
		}

		// Execute default behaviour
		return undefined
	}
}

function resolveConfigObjects(configs: ConfigJS[]) {
	const allConfigs: ConfigJS[] = [...extractPluginConfigs(configs)]

	const themes = getThemes(allConfigs)

	return normalizeConfig(
		defaults(
			{
				theme: resolveFunctionKeys(mergeExtensions(collectThemes(themes))),
				plugins: resolvePluginLists(configs.map(c => c?.plugins ?? [])),
			},
			...allConfigs,
		) as unknown as ResolvedConfigJS,
	)

	function isObject(value: unknown): value is object {
		return typeof value === "object" && value !== null
	}

	function getThemes(configs: ConfigJS[]) {
		return configs.filter((c): c is { theme: AnyTheme } => isObject(c.theme)).map(c => c.theme)
	}
}
