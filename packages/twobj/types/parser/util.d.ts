import * as nodes from "./nodes"
export declare function kebab(value: string): string
export declare function camelCase(value: string): string
interface SimpleVariantToken extends nodes.TokenString {
	type: nodes.NodeType.SimpleVariant
}
interface ArbitrarySelectorToken extends nodes.TokenString {
	type: nodes.NodeType.ArbitrarySelector
	selector: nodes.CssSelector
}
interface ArbitraryVariantToken extends nodes.TokenString {
	type: nodes.NodeType.ArbitraryVariant
	selector: nodes.CssSelector
}
export declare function getVariant(
	variant: nodes.Variant,
	sep: string,
): SimpleVariantToken | ArbitrarySelectorToken | ArbitraryVariantToken
/** NOTE: respect quoted string */
export declare function removeComment(text: string): string
/** Try to find right bracket from left bracket, return `undefind` if not found. */
export declare function findRightBracket({
	text,
	start,
	end,
	brackets,
	comments,
}: {
	text: string
	start?: number
	end?: number
	brackets?: [number, number]
	comments?: boolean
}): number | undefined
export declare function isSpace(char: number): boolean
export declare function dlv(cur: any, paths: string[]): any
export declare function splitAtTopLevelOnly(value: string, trim?: boolean): string[]
export declare function matchValue(value: string):
	| {
			num: string
			unit?: string
	  }
	| undefined
export {}
