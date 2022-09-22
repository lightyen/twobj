import { defaultConfig } from "./defaultConfig"
import { isPluginWithOptions } from "./plugin"
import { resolveFunctionKeys } from "./resolveFuncionKey"
import type {
	ConfigArray,
	ConfigEntry,
	ConfigJS,
	ConfigObject,
	ConfigUtils,
	Plugin,
	PresetFunction,
	ResolvedConfigJS,
	ResolveThemePath,
} from "./types"
import { isFunction } from "./util"

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

function extractPluginConfigs(configs: ConfigJS[]) {
	let allConfigs: ConfigJS[] = []

	configs.forEach(config => {
		allConfigs = [...allConfigs, config]

		const plugins = config?.plugins ?? []

		if (plugins.length === 0) {
			return
		}

		plugins.forEach(plugin => {
			// Must check the type of plugin
			if (isPluginWithOptions(plugin)) {
				plugin = plugin()
			}

			if (isFunction(plugin)) {
				return
			}

			if (plugin.config) {
				allConfigs = [...allConfigs, ...extractPluginConfigs([plugin.config])]
			}
		})
	})

	return allConfigs
}

function resolvePluginLists(pluginLists: Array<Plugin>[]) {
	return pluginLists.reduceRight((resolved, pluginList) => {
		return [...resolved, ...pluginList]
	}, [])
}

function defaults(target: Record<string | symbol, ConfigEntry>, ...sources: Record<string | symbol, ConfigEntry>[]) {
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

function isObject(value: ConfigEntry): value is ConfigArray | ConfigObject {
	return typeof value === "object" && value !== null
}

export function mergeWith<T extends ConfigArray | ConfigObject>(
	customizer: (objValue: ConfigEntry, srcValue: ConfigEntry) => ConfigEntry,
	target: T,
	...sources: ConfigEntry[]
): T {
	for (const source of sources) {
		if (!isObject(source)) {
			continue
		}

		for (const key in source) {
			const t = target[key]
			const s = source[key]

			const merged = customizer(t, s)

			if (merged !== undefined) {
				target[key] = merged
				continue
			}

			if (isObject(t) && isObject(s)) {
				target[key] = mergeWith(customizer, {}, t, s)
				continue
			}

			target[key] = s
		}
	}

	return target
}

export function collectExtends(themes: ConfigObject[]) {
	return themes.reduce((merged, { extend }) => {
		return mergeWith(
			(mergedValue, extendValue) => {
				if (mergedValue === undefined) {
					return [extendValue]
				}
				if (Array.isArray(mergedValue)) {
					return [extendValue, ...mergedValue]
				}
				return [extendValue, mergedValue]
			},
			merged,
			extend,
		)
	}, {})
}

function collectThemes(themes: ConfigObject[]): { extend: ConfigObject; theme: ConfigObject } {
	return {
		theme: themes.reduce((merged, theme) => defaults(merged, theme), {}),
		extend: collectExtends(themes),
	}
}

function mergeExtensions({ theme, extend }: { extend: ConfigObject; theme: ConfigObject }) {
	return mergeWith(
		(themeValue, extensions) => {
			if (!Array.isArray(extensions)) {
				return undefined
			}

			if (isFunction(themeValue) || extensions.some(isFunction)) {
				return (theme: ResolveThemePath, configUtils: ConfigUtils) =>
					mergeWith(
						mergeExtensionCustomizer,
						{},
						...[themeValue, ...extensions].map(funcOrValue => {
							if (isFunction(funcOrValue)) {
								return funcOrValue(theme, configUtils)
							}
							return funcOrValue
						}),
					)
			}

			if (!isFunction(themeValue) && !extensions.some(isFunction)) {
				return mergeWith(mergeExtensionCustomizer, {}, themeValue, ...extensions)
			}

			return (theme: ResolveThemePath, configUtils: ConfigUtils) =>
				mergeWith(
					mergeExtensionCustomizer,
					{},
					...[themeValue, ...extensions].map(funcOrValue => {
						if (isFunction(funcOrValue)) {
							return funcOrValue(theme, configUtils)
						}
						return funcOrValue
					}),
				)
		},
		theme,
		extend,
	)

	function isObject(value: unknown): value is Array<ConfigEntry | ConfigObject> | ConfigObject {
		return typeof value === "object" && value !== null
	}

	function mergeExtensionCustomizer(merged: ConfigArray | ConfigObject, value: ConfigArray | ConfigObject) {
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
	}
}

function resolveConfigObjects(configs: ConfigJS[]) {
	const allConfigs: ConfigJS[] = [...extractPluginConfigs(configs)]

	const themes = allConfigs.map(c => c.theme).filter((c): c is ConfigObject => c != null)

	return normalizeConfig(
		defaults(
			{
				theme: resolveFunctionKeys(mergeExtensions(collectThemes(themes))),
				plugins: resolvePluginLists(configs.map(c => c?.plugins ?? [])),
			},
			...allConfigs,
		) as unknown as ResolvedConfigJS,
	)

	function normalizeConfig(config: ResolvedConfigJS) {
		if (typeof config.prefix !== "string") {
			config.prefix = ""
		}
		return config
	}
}
