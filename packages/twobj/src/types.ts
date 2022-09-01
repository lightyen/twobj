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
	/** escape css */
	e(classname: string): string
	/**
	 * Do nothing
	 * @deprecated
	 */
	prefix(classname: string): string
	/**
	 * Do nothing
	 * @deprecated
	 */
	variants(corePlugin: string): string[]

	/** Look up values in the user's Tailwind configuration. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	config(path: string, defaultValue?: unknown): any
	/** Look up values in the user's theme configuration. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	theme(path: string, defaultValue?: unknown): any
	/** Test a feature exists whether or not */
	corePlugins(feature: keyof Tailwind.CorePluginFeatures): boolean
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

	/** Register new utility */
	addUtilities(
		utilities: CSSProperties | CSSProperties[],
		options?: {
			// respectPrefix?: boolean // always true
			// respectImportant?: boolean // always true
		},
	): void

	/** Same as addUtilities */
	addComponents(
		components: CSSProperties | CSSProperties[],
		options?: {
			// respectPrefix?: boolean // always true
			// respectImportant?: boolean // always true
		},
	): void

	/** Register new utility */
	matchUtilities(
		utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		options?: MatchUtilitiesOption,
	): void

	/** Same as matchUtilities */
	matchComponents(
		components: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		options?: MatchUtilitiesOption,
	): void

	/** Register custom variant */
	addVariant(
		variantName: string,
		variantDesc: string | string[],
		options?: {
			postModifier?: PostModifier
		},
	): void

	/** Register arbitrary variant */
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

export interface Context extends PluginOptions {
	/** globalStyles */
	globalStyles: Record<string, CSSProperties>

	utilities: Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>
	variants: Map<string, VariantSpec>
	arbitraryVariants: Map<string, (value: string) => VariantSpec>
	arbitraryUtilities: Map<string, Set<ValueType | "any">>
	features: Set<string>

	/** Transfrom tailwind declarations to css object */
	css(strings: string): CSSProperties
	css(strings: TemplateStringsArray): CSSProperties
	css(strings: string | TemplateStringsArray): CSSProperties

	/** Compose all variants */
	cssVariant(...variants: Array<parser.Variant | string>): VariantSpec

	/** Reverse utilities mapping */
	getPluginName(value: string): string | undefined

	/** Look up values in the user's Tailwind configuration */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	config(path: string, defaultValue?: unknown): any
	/** Look up values in the user's theme configuration */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	theme(path: string, defaultValue?: unknown): any

	/** Signature: `theme(colors.red.500, <default-value>)` */
	renderThemeFunc(value: string): string

	/** Signature: `colors.red.500` */
	renderTheme(value: string): string

	/** List all utilities */
	getClassList(): string[]

	/** List all color's utilities */
	getColorClasses(): Map<string, string[]>

	getAmbiguous(): Map<string, LookupSpec[]>

	getThemeValueCompletion(param: { position: number; text: string; start?: number; end?: number }): {
		range: parser.Range
		candidates: Array<[string, string]>
	}
}
