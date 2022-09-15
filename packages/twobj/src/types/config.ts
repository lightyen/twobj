import { ConfigObject } from "./base"
import { CorePluginFeatures } from "./features"
import { Plugin, UserPluginFunction, UserPluginFunctionWithOption, UserPluginObject } from "./plugin"
import { CustomTheme, ResolvedTheme, Theme } from "./theme"

export interface ConfigJS extends StrictConfigJS, ConfigObject {}

export interface PresetFunction {
	(): ConfigJS
}

export interface StrictConfigJS {
	presets?: (ConfigJS | PresetFunction)[]
	theme?: Theme & CustomTheme & ConfigObject
	plugins?: Plugin[]
	darkMode?: "media" | "class" | ["class", string]
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
	darkMode: "media" | "class" | ["class", string]
	plugins: (UserPluginObject | UserPluginFunction | UserPluginFunctionWithOption)[]
	theme: ResolvedTheme & ConfigObject
}
