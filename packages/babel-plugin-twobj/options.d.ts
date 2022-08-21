import type { LibName } from "./babel_visitor"
export interface PluginOptions {
	configPath?: string
	debug?: boolean
	lib?: LibName | "auto"
}
