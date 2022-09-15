import type * as parser from "../parser"
import { CSSProperties, CSSValue } from "./base"

export interface Template {
	(value: CSSValue): CSSProperties
}

export interface VariantSpec {
	(css?: CSSProperties): CSSProperties
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
