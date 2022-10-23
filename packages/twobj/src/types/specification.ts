import type * as parser from "../parser"

export type CSSValue = string | number

export interface CSSProperties {
	[key: string]: CSSProperties | CSSValue
}

export interface PlainCSSProperties {
	[key: string]: CSSValue
}

export type Primitive = string | bigint | number | boolean | symbol | null | undefined

export interface Func {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(...args: any): any
}

/// TailwindConfig

export type ConfigValue = Func | Primitive

export interface ConfigObject {
	[key: string | symbol]: ConfigEntry
}

export type ConfigArray = Array<ConfigEntry>

export type ConfigEntry = ConfigValue | ConfigArray | ConfigObject

export interface CustomPalette {
	[key: string | symbol]: ColorValue
}

export interface ColorValueFunc {
	(options: { opacityValue?: string }): Primitive
}

export type ColorValue = ColorValueFunc | CustomPalette | Primitive

export type ArbitraryParameters<V = unknown> = [
	value: V | string,
	options: {
		modifier?: string
		wrapped?: boolean
	},
]

export interface UtilityRender<V = unknown> {
	(...args: ArbitraryParameters<V>): CSSProperties
}

export interface VariantRender<V = unknown> {
	(...args: ArbitraryParameters<V>): string | string[]
}

export interface Variant {
	(css?: CSSProperties): CSSProperties
}

export interface Post {
	(css?: PlainCSSProperties): PlainCSSProperties
}

export interface LookupSpec {
	type: "lookup"
	values: Record<string, unknown>
	represent(
		restIndex: number,
		node: parser.Classname | parser.ArbitraryClassname,
		negative: boolean,
	): CSSProperties | undefined
	pluginName?: string
	isColor?: boolean
	filterDefault: boolean
	supportsNegativeValues: boolean
	respectPrefix: boolean
	respectImportant: boolean
}

export interface LookupVariantSpec {
	type: "lookup"
	values: Record<string, unknown>
	represent(
		restIndex: number,
		node: parser.SimpleVariant | parser.ArbitraryVariant | parser.UnknownVariant,
	): Variant | undefined
	pluginName?: string
	post?: Post
	filterDefault: boolean
}

export interface StaticSpec {
	type: "static"
	css: CSSProperties
	pluginName?: string
	supportsNegativeValues: false
	respectPrefix: boolean
	respectImportant: boolean
}

export interface VariantSpec {
	type: "static"
	variant: Variant
	pluginName?: string
	post?: Post
}
