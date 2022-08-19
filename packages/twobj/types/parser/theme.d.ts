/// <reference types="tailwind-types" />
import { ThemePathNode } from "./nodes"
export declare function resolveThemeFunc(config: Tailwind.ResolvedConfigJS, value: string): string
export declare function parseThemeValue({
	config,
	useDefault,
	text,
	start,
	end,
}: {
	config: Tailwind.ResolvedConfigJS
	useDefault?: boolean
	text: string
	start?: number
	end?: number
}): {
	path: ThemePathNode[]
	range: import("./nodes").Range
}
export declare function theme(
	config: Tailwind.ResolvedConfigJS,
	path: ThemePathNode[],
	useDefault?: boolean,
): {
	value: unknown
	opacityValue: string | undefined
}
export declare function tryOpacityValue(path: ThemePathNode[]):
	| {
			path: ThemePathNode[]
			opacityValue?: undefined
	  }
	| {
			path: ThemePathNode[]
			opacityValue: string | undefined
	  }
export declare function renderThemePath(
	config: Tailwind.ResolvedConfigJS,
	path: Array<string | ThemePathNode>,
	useDefault?: boolean,
): string
export declare function resolvePath(obj: unknown, path: Array<string | ThemePathNode>, useDefault?: boolean): unknown
export declare function renderThemeValue({ value, opacityValue }?: { value?: unknown; opacityValue?: string }): string
