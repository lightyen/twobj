/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
	ConfigJS,
	CorePlugin,
	Plugin,
	UnnamedPlugin,
	UserPluginFunctionWithOption,
	UserPluginObject,
} from "./types"

interface PluginFunction<Options> {
	(options: Options): UnnamedPlugin
}
interface ConfigFunction<Options> {
	(options: Options): ConfigJS
}

interface CreatePlugin {
	(handler: UnnamedPlugin): CorePlugin
	(pluginName: string, handler: UnnamedPlugin): CorePlugin
	(handler: UnnamedPlugin, config: ConfigJS): CorePlugin
	/** Create a tailwind plugin with options. */
	withOptions: CreatePluginWithOptions
}

interface CreatePluginWithOptions {
	/** Create a tailwind plugin with options. */
	<Options = unknown>(
		pluginFunction: PluginFunction<Options>,
		configFunction?: ConfigFunction<Options>,
	): UserPluginFunctionWithOption<Options>
	/** Create a tailwind plugin with options. */
	<Options = unknown>(
		pluginName: string,
		pluginFunction: PluginFunction<Options>,
		configFunction?: ConfigFunction<Options>,
	): UserPluginFunctionWithOption<Options>
}

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
