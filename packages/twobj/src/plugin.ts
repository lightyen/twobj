/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
	ConfigFunction,
	CorePlugin,
	CreatePlugin,
	Plugin,
	PluginFunction,
	UnnamedPlugin,
	UserPluginFunctionWithOption,
	UserPluginObject,
} from "./types"

/** Create a tailwind plugin. */
export const plugin: CreatePlugin = (first: string | UnnamedPlugin, second?: unknown, third?: unknown) => {
	// prevent plugin name to be minified
	if (typeof first === "string") {
		Object.defineProperty(second, "name", { value: first, writable: false })
		return second as CorePlugin
	}
	return first
}

plugin.withOptions = pluginWithOptions

/** Create a tailwind plugin with options. */
export function pluginWithOptions<Options = unknown>(
	first: string | ((options: Options) => UnnamedPlugin),
	second: unknown,
	third?: unknown,
): UserPluginFunctionWithOption<Options> {
	const pluginName = typeof first === "string" ? first : ""

	let pluginFunction: PluginFunction<Options>
	let configFunction: ConfigFunction<Options>
	if (typeof first === "string") {
		pluginFunction = second as PluginFunction<Options>
		configFunction = (third ?? (() => ({}))) as ConfigFunction<Options>
	} else {
		pluginFunction = first
		configFunction = (second ?? (() => ({}))) as ConfigFunction<Options>
	}

	function optionsFunction(options: Options): UserPluginObject {
		return {
			name: pluginName,
			handler: pluginFunction(options),
			config: configFunction(options),
		}
	}

	Object.setPrototypeOf(optionsFunction, pluginWithOptions.prototype)
	return optionsFunction
}

export function isPluginWithOptions(plugin: Plugin): plugin is UserPluginFunctionWithOption {
	return plugin instanceof pluginWithOptions
}
