import type { ConfigJS, CorePlugin, UnnamedPlugin } from "./types"

/** Create a tailwind plugin. */
export function plugin(handler: UnnamedPlugin): CorePlugin
export function plugin(pluginName: string, handler: UnnamedPlugin): CorePlugin
export function plugin(handler: UnnamedPlugin, config: ConfigJS): CorePlugin
export function plugin(pluginName: string, handler: UnnamedPlugin, config: ConfigJS): CorePlugin
export function plugin(first: string | UnnamedPlugin, second?: unknown, third?: unknown): CorePlugin {
	// prevent plugin name to be minified
	if (typeof first === "string") {
		Object.defineProperty(second, "name", { value: first, writable: false })
		return second as CorePlugin
	}
	return first
}
