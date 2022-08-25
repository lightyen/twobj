import type { CorePlugin, UnnamedPlugin } from "./types"

export function plugin(fn: UnnamedPlugin): CorePlugin
export function plugin(pluginName: string, fn: UnnamedPlugin): CorePlugin
export function plugin(first: string | UnnamedPlugin, sec?: unknown): CorePlugin {
	// prevent plugin name to be minified
	if (typeof first === "string") {
		Object.defineProperty(sec, "name", { value: first, writable: false })
		return sec as CorePlugin
	}
	return first
}
