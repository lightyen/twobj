import { CorePluginFeatures } from "./features"
import { Plugin, UserPluginFunction, UserPluginFunctionWithOption, UserPluginObject } from "./plugin"
import { ConfigObject } from "./specification"
import { CustomTheme, ResolvedTheme, Theme } from "./theme"

export interface ConfigJS extends StrictConfigJS, ConfigObject {}

export interface PresetFunction {
	(): ConfigJS
}

type DarkModeTupleA = [mode: "class", selector?: string]
type DarkModeTupleB = [mode: "selector", selector?: string]
type DarkModeTupleC = [
	mode: "variant",
	selector?: string | (() => string | string[]) | Array<string | (() => string | string[])>,
]

type DarkModeTuple = DarkModeTupleA | DarkModeTupleB | DarkModeTupleC

export interface StrictConfigJS {
	presets?: (ConfigJS | PresetFunction)[]
	theme?: Theme & CustomTheme & ConfigObject
	plugins?: Plugin[]
	darkMode?: "media" | "class" | "selector" | DarkModeTuple
	corePlugins?: Partial<CorePluginFeatures> | Array<keyof CorePluginFeatures> | boolean
	separator?: string
	prefix?: string
	important?: boolean | string
}

export interface ResolvedConfigJS extends StrictResolvedConfigJS, ConfigObject {}

export interface StrictResolvedConfigJS {
	presets: ConfigJS[]
	separator: string
	prefix: string
	important: boolean
	darkMode: "media" | "class" | "selector" | DarkModeTuple
	plugins: (UserPluginObject | UserPluginFunction | UserPluginFunctionWithOption)[]
	theme: ResolvedTheme & ConfigObject
}
