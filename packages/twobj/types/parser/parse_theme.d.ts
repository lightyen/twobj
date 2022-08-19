import * as nodes from "./nodes"
export declare function parse_theme({
	text,
	start,
	end,
}: {
	text: string
	start?: number
	end?: number
}): nodes.ThemeFunctionNode[]
export declare function parse_theme_val({
	text,
	start,
	end,
}: {
	text: string
	start?: number
	end?: number
}): nodes.ThemeValueNode
