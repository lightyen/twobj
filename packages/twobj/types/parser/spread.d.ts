import * as nodes from "./nodes"
import { getVariant } from "./util"
export declare type SpreadDescription = {
	target: nodes.Classname | nodes.ArbitraryClassname | nodes.ArbitraryProperty
	value: string
	variants: ReturnType<typeof getVariant>[]
	important: boolean
}
export declare function spread(
	text: string,
	{
		separator,
	}?: {
		separator?: string
	},
): {
	readonly items: SpreadDescription[]
	readonly emptyGroup: nodes.Group[]
	readonly emptyVariants: nodes.VariantSpan[]
	readonly notClosed: nodes.BracketNode[]
}
