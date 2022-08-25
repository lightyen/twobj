import type * as parser from "./parser"

export type CSSValue = string | number

export type CSSProperties = {
	[key: string]: CSSValue | CSSProperties
}

export interface PlainCSSProperties {
	[key: string]: CSSValue
}

export type ValueType =
	| "number"
	| "percentage"
	| "length"
	| "angle"
	| "url"
	| "color"
	| "position" // backgroundPosition
	| "image" // backgroundImage
	| "line-width" // borderWidth
	| "absolute-size" // fontSize
	| "relative-size" // fontSize
	| "shadow" // boxShadow
	| "generic-name" // fontFamily
	| "family-name" // fontFamily

export interface Template {
	(value: CSSValue): CSSProperties
}

export interface VariantSpec {
	(css?: CSSProperties): CSSProperties
}

export interface PostModifier {
	(css?: PlainCSSProperties): PlainCSSProperties
}

export interface LookupSpec {
	type: "lookup"
	values: Record<string, unknown>
	represent(
		restInput: string,
		node: parser.Classname | parser.ArbitraryClassname,
		getText: (node: parser.BaseNode) => string,
		config: Tailwind.ResolvedConfigJS,
		negative: boolean,
	): CSSProperties | undefined
	supportsNegativeValues: boolean
	filterDefault: boolean
	isColor?: boolean
	pluginName?: string
}

export interface StaticSpec {
	type: "static"
	css: CSSProperties
	supportsNegativeValues: false
	pluginName?: string
}

export interface CorePluginOptions extends PluginOptions {
	config: Tailwind.ResolvedConfigJS
	theme: Tailwind.ResolvedConfigJS["theme"]
	resolveTheme(path: string, defaultValue?: unknown): unknown
}

/** backwards compatibility */
export interface UserPluginOptions extends PluginOptions {
	e(classname: string): string
	variants(corePlugin: string): string[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	config(path: string, defaultValue?: unknown): any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	theme(path: string, defaultValue?: unknown): any
	corePlugins(feature: keyof Tailwind.CorePluginFeatures): boolean
	prefix(classname: string): string
}

export interface UserPlugin {
	(options: UserPluginOptions): void
}

export interface MatchUtilitiesOption {
	values?: Record<string, unknown>
	type?: ValueType | ValueType[]
	supportsNegativeValues?: boolean
	filterDefault?: boolean
	// respectPrefix?: boolean
	// respectImportant?: boolean
}

export interface PluginOptions {
	addBase(bases: CSSProperties | CSSProperties[]): void

	addDefaults(pluginName: string, properties: Record<string, string | string[]>): void

	addUtilities(
		utilities: CSSProperties | CSSProperties[],
		options?: {
			// respectPrefix?: boolean // always true
			// respectImportant?: boolean // always true
		},
	): void

	addComponents(
		components: CSSProperties | CSSProperties[],
		options?: {
			// respectPrefix?: boolean // always true
			// respectImportant?: boolean // always true
		},
	): void

	matchUtilities(
		utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		options?: MatchUtilitiesOption,
	): void
	matchComponents(
		components: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		options?: MatchUtilitiesOption,
	): void

	addVariant(
		variantName: string,
		variantDesc: string | string[],
		options?: {
			postModifier?: PostModifier
		},
	): void

	matchVariant(
		variants: Record<string, (value?: string) => string | string[]>,
		options?: {
			values?: Record<string, string>
			postModifier?: VariantSpec
		},
	): void
}

export interface UnnamedPlugin {
	(api: CorePluginOptions): void
}

export interface CorePlugin {
	(api: CorePluginOptions): void
	readonly name: string
}
