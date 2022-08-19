interface Color {
	fn: string
	params: string[]
}
export declare function parseColor(css: string): Color | undefined
export declare function formatColor(color: Color | undefined): string | undefined
export declare function isOpacityFunction(fnName: string): boolean
export declare function parseColorKeyword(css: string): Color | undefined
export declare type Param = ParamObject | string
interface ParamObject {
	fn: string
	params: Param[]
}
export declare function splitCssParams(value: string): Param[]
export declare function parseAnimations(value: string): string[]
export {}
