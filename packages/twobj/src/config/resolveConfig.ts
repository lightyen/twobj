/* eslint-disable @typescript-eslint/no-explicit-any */

// import resolveConfigObjects from "tailwindcss/lib/util/resolveConfig.js"

import type {
	ConfigJS,
	CustomTheme,
	PresetFunction,
	ResolvedConfigJS,
	UserPlugin,
	UserPluginFunctionWithOption,
	UserPluginObject,
} from "../types"
import defaultConfig from "./defaultConfig"
import { resolveFunctionKeys } from "./resolveFuncionKey"

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

function normalizeConfig(config: ResolvedConfigJS): ResolvedConfigJS {
	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}
	return config
}

function extractPluginConfigs(configs: ConfigJS[]): ConfigJS[] {
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

function defaults(target: Record<string | symbol, unknown>, ...sources: Record<string | symbol, unknown>[]): any {
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

function isObject(value: unknown) {
	return typeof value === "object" && value !== null
}

function mergeWith(target: any, sources: any[], customizer: (objValue: any, srcValue: any) => unknown) {
	for (const source of sources) {
		for (const k in source) {
			const merged = customizer(target[k], source[k])

			if (merged !== undefined) {
				target[k] = merged
				continue
			}

			if (isObject(target[k]) && isObject(source[k])) {
				target[k] = mergeWith(target[k], source[k], customizer)
			} else {
				target[k] = source[k]
			}
		}
	}

	return target
}

function mergeExtensionCustomizer(merged: any, value: any) {
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

function collectExtends(themes: Array<CustomTheme>) {
	return themes.reduce((merged, { extend }) => {
		return mergeWith(merged, [extend], (mergedValue, extendValue) => {
			if (mergedValue === undefined) {
				return [extendValue]
			}

			if (Array.isArray(mergedValue)) {
				return [extendValue, ...mergedValue]
			}

			return [extendValue, mergedValue]
		})
	}, {})
}

function mergeThemes(themes: Array<CustomTheme>): { theme: unknown; extend: unknown[] } {
	return {
		extend: collectExtends(themes),
		theme: themes.reduce(
			(merged, theme) =>
				defaults(merged as Record<string | symbol, unknown>, theme as Record<string | symbol, unknown>),
			{},
		),
	}
}

function value(valueToResolve: unknown, ...args: any[]) {
	return typeof valueToResolve === "function" ? valueToResolve(...args) : valueToResolve
}

function mergeExtensions({ extend, theme }: { theme: unknown; extend: unknown[] }) {
	return mergeWith(theme, [extend], (themeValue, extensions) => {
		// The `extend` property is an array, so we need to check if it contains any functions
		if (
			typeof themeValue !== "function" &&
			(!Array.isArray(extensions) || !extensions.some(e => typeof e === "function"))
		) {
			return mergeWith({}, [themeValue, ...extensions], mergeExtensionCustomizer)
		}

		return (resolveThemePath: any, configUtils: any) =>
			mergeWith(
				{},
				[themeValue, ...extensions].map(e => value(e, resolveThemePath, configUtils)),
				mergeExtensionCustomizer,
			)
	})
}

function resolveConfigObjects(configs: ConfigJS[]) {
	const allConfigs: ConfigJS[] = [...extractPluginConfigs(configs)]

	const themes = allConfigs.map(t => t.theme).filter((t): t is CustomTheme => t != null)

	return normalizeConfig(
		defaults(
			{
				theme: resolveFunctionKeys(mergeExtensions(mergeThemes(themes))),
				plugins: resolvePluginLists(configs.map(c => c?.plugins ?? [])),
			},
			...(allConfigs as Record<string | symbol, unknown>[]),
		) as ResolvedConfigJS,
	)
}
