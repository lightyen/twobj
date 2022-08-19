import * as nodes from "./nodes"
export declare function parse(
	text: string,
	{
		breac,
	}?: {
		breac?: number
	},
): nodes.Program
export declare function parseExpressions({
	text,
	start,
	end,
	breac,
}: {
	text: string
	start?: number
	end?: number
	breac?: number
}): nodes.TwExpression[]
export declare function escapeRegexp(value: string): string
export declare function setSeparator(sep: string): void
