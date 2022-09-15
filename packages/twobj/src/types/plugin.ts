import { ConfigObject, CSSProperties, CSSValue, PostModifier } from "./base"
import { ConfigJS, ResolvedConfigJS } from "./config"
import { CorePluginFeatures } from "./features"
import { VariantSpec } from "./specification"
import { ResolvePath } from "./theme"

export type ValueType =
	| "number"
	| "percentage"
	| "length"
	| "angle"
	| "url"
	| "color"
	| "image" // backgroundImage
	| "line-width" // borderWidth
	| "absolute-size" // fontSize
	| "relative-size" // fontSize
	| "shadow" // boxShadow
	| "generic-name" // fontFamily
	| "family-name" // fontFamily
	| "background-position" // backgroundPosition
	| "background-size" // backgroundSize

export interface AddOption {
	respectPrefix?: boolean
	respectImportant?: boolean
}

export interface MatchOption {
	values?: ConfigObject
	type?: ValueType | ValueType[]
	supportsNegativeValues?: boolean
	filterDefault?: boolean
	respectPrefix?: boolean
	respectImportant?: boolean
}

export interface UserPluginOptions {
	/** Add global css. */
	addBase(bases: CSSProperties | CSSProperties[]): void

	/** Add global css variables. */
	addDefaults(pluginName: string, properties: Record<string, string | string[]>): void

	/** Register new utilities. */
	addUtilities(utilities: CSSProperties | CSSProperties[], options?: AddOption): void

	/** Register new components. */
	addComponents(components: CSSProperties | CSSProperties[], options?: AddOption): void

	/** Register new utilities. */
	matchUtilities(
		utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		options?: MatchOption,
	): void

	/** Register new components. */
	matchComponents(
		components: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		options?: MatchOption,
	): void

	/** Register a custom variant. */
	addVariant(
		variantName: string,
		variantDesc: string | string[],
		options?: {
			postModifier?: PostModifier
		},
	): void

	/** Register an arbitrary variant */
	matchVariant(
		variants: Record<string, (value?: string) => string | string[]>,
		options?: {
			values?: ConfigObject
			postModifier?: VariantSpec
		},
	): void

	/** Look up values in the user's theme configuration. */
	theme: ResolvePath

	/** Look up values in the user's Tailwind configuration. */
	config: ResolvePath

	/** Escape css. */
	e(classname: string): string
	/**
	 * Do nothing.
	 * @deprecated
	 */
	prefix(classname: string): string
	/**
	 * Do nothing.
	 * @deprecated
	 */
	variants(corePlugin: string): string[]

	/** Test a feature exists whether or not. */
	corePlugins(feature: keyof CorePluginFeatures): boolean
}

export interface CorePluginOptions extends UserPluginOptions {
	configObject: ResolvedConfigJS
	themeObject: ResolvedConfigJS["theme"]
}

export interface UnnamedPlugin {
	(api: CorePluginOptions): void
}

export interface CorePlugin {
	(api: CorePluginOptions): void
	readonly name: string
}

export interface UserPluginFunction {
	(options: UserPluginOptions): void
}

export interface UserPluginObject extends ConfigObject {
	handler?: UserPluginFunction
	config?: ConfigJS
	name?: string
}

export interface UserPluginFunctionWithOption<Options = unknown> {
	(options?: Options): UserPluginObject
}

export type Plugin = UserPluginObject | UserPluginFunction

export interface PluginFunction<Options> {
	(options: Options): UnnamedPlugin
}

export interface ConfigFunction<Options> {
	(options: Options): ConfigJS
}

export interface CreatePlugin {
	(handler: UnnamedPlugin): CorePlugin
	(pluginName: string, handler: UnnamedPlugin): CorePlugin
	(handler: UnnamedPlugin, config: ConfigJS): CorePlugin
	/** Create a tailwind plugin with options. */
	withOptions: CreatePluginWithOptions
}

export interface CreatePluginWithOptions {
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
