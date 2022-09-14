/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as parser from "../parser"
import { CSSProperties, CSSValue, PlainCSSProperties } from "./base"
import { ConfigObject, ResolvedConfigJS, ResolvePath } from "./config"
import { CorePluginFeatures } from "./features"

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
		negative: boolean,
	): CSSProperties | undefined
	supportsNegativeValues: boolean
	filterDefault: boolean
	isColor?: boolean
	pluginName?: string
	respectPrefix: boolean
	respectImportant: boolean
}

export interface StaticSpec {
	type: "static"
	css: CSSProperties
	supportsNegativeValues: false
	pluginName?: string
	respectPrefix: boolean
	respectImportant: boolean
}

export interface CorePluginOptions extends UserPluginOptions {
	configObject: ResolvedConfigJS
	themeObject: ResolvedConfigJS["theme"]
}

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

export interface UnnamedPlugin {
	(api: CorePluginOptions): void
}

export interface CorePlugin {
	(api: CorePluginOptions): void
	readonly name: string
}

export interface Context extends UserPluginOptions {
	/** core parser */
	parser: ReturnType<typeof parser.createParser>

	/** globalStyles */
	globalStyles: Record<string, CSSProperties>

	utilities: Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>
	variantMap: Map<string, VariantSpec>
	arbitraryVariants: Map<string, (value: string) => VariantSpec>
	arbitraryUtilities: Map<string, Set<ValueType | "any">>
	features: Set<string>

	/** Transfrom tailwind declarations to css object. */
	css(strings: string): CSSProperties
	css(strings: TemplateStringsArray): CSSProperties
	css(strings: string | TemplateStringsArray): CSSProperties

	/** Compose all variants. */
	cssVariant(...variants: Array<parser.Variant | string>): VariantSpec

	/** Reverse utilities mapping. */
	getPluginName(value: string): string | undefined

	/** Look up values in the user's Tailwind configuration. */
	config(path: string, defaultValue?: unknown): any

	/** Signature: `theme(colors.red.500, <default-value>)` */
	renderThemeFunc(value: string): string

	/** Signature: `colors.red.500` */
	renderTheme(value: string): string

	/** List all utilities. */
	getClassList(): string[]

	/** List all color's utilities. */
	getColorClasses(): Map<string, string[]>

	getAmbiguous(): Map<string, LookupSpec[]>

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
