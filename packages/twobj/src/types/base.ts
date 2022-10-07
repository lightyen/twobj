export type CSSValue = string | number

export type CSSValueArray = Array<CSSValue>

export interface CSSProperties {
	[key: string]: CSSProperties | CSSValueArray | CSSValue
}

export interface PlainCSSProperties {
	[key: string]: CSSValue
}

export interface PostModifier {
	(css?: PlainCSSProperties): PlainCSSProperties
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
