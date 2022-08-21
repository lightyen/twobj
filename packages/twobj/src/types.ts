import type * as parser from "./parser"

export type CSSValue = string | number

export type CSSProperties = {
	[key: string]: CSSValue | CSSProperties
}

export interface PlainCSSProperties {
	[key: string]: CSSValue
}

export interface Template {
	(value: CSSValue): CSSProperties
}

export interface VariantSpec {
	(css: CSSProperties | undefined): CSSProperties
}

export interface PostModifier {
	(css: PlainCSSProperties | undefined): PlainCSSProperties
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
