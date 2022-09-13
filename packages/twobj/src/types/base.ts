export type CSSValue = string | number

export type CSSProperties = {
	[key: string]: CSSProperties | CSSValue
}

export interface PlainCSSProperties {
	[key: string]: CSSValue
}
