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
