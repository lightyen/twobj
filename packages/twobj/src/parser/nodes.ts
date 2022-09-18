/**
 *  Node Types
 *
 * 1. simple-classname
 * aa-bbb
 *
 * 2. simple-variant
 * aa-bbb:
 *
 * 3. arbitrary-classname
 * aa-[value]
 *
 * 4. arbitrary-variant
 * aa-[value]:
 *
 * 5. arbitrary-property
 * [aaa: value]
 *
 * 6. arbitrary-selector
 * [&:bbb, &:ccc]:
 *
 * 7. short-css
 * aaa[value]
 */

export enum NodeType {
	Program = "Program",
	Group = "Group",
	VariantSpan = "VariantSpan",
	ClassName = "ClassName",
	SimpleVariant = "SimpleVariant",
	ArbitraryClassname = "ArbitraryClassname",
	ArbitraryVariant = "ArbitraryVariant",
	GroupVariant = "GroupVariant",
	ArbitraryProperty = "ArbitraryProperty",
	ArbitrarySelector = "ArbitrarySelector",
	ShortCss = "ShortCss",
	CssSelector = "CssSelector",
	Identifier = "Identifier",
	CssDeclaration = "CssDeclaration",
	CssExpression = "CssExpression",
	WithOpacity = "WithOpacity",
	EndOpacity = "EndOpacity",
	ThemeFunction = "ThemeFunction",
	ThemeValue = "ThemeValue",
	ThemePath = "ThemePath",
}

export type Range = [number, number]

export interface BaseNode {
	type: NodeType
	range: Range
	/** Get raw text in the range. */
	getText(): string
}

export interface Important {
	important: boolean
}

export interface Closed {
	closed: boolean
}

export interface Identifier extends BaseNode {
	type: NodeType.Identifier
}

export interface SimpleVariant extends BaseNode {
	type: NodeType.SimpleVariant
	id: Identifier
}

export interface ArbitrarySelector extends BaseNode {
	type: NodeType.ArbitrarySelector
	selector: CssSelector
}

export interface ArbitraryVariant extends BaseNode {
	type: NodeType.ArbitraryVariant
	prefix: Identifier
	selector: CssSelector
}

export interface GroupVariant extends BaseNode {
	type: NodeType.GroupVariant
	important: boolean
	expressions: Expression[]
}

export type Variant = SimpleVariant | ArbitrarySelector | ArbitraryVariant | GroupVariant

export interface CssSelector extends BaseNode {
	type: NodeType.CssSelector
}

export interface Classname extends BaseNode, Important {
	type: NodeType.ClassName
}

export interface CssExpression extends BaseNode {
	type: NodeType.CssExpression
	value: string
}

export interface WithOpacity extends BaseNode, Closed {
	type: NodeType.WithOpacity
	opacity: Identifier
}

export interface EndOpacity extends BaseNode {
	type: NodeType.EndOpacity
}

export interface ArbitraryClassname extends BaseNode, Important, Closed {
	type: NodeType.ArbitraryClassname
	prefix: Identifier
	expr?: CssExpression
	e?: WithOpacity | EndOpacity
}

export interface CssDeclaration extends BaseNode {
	type: NodeType.CssDeclaration
}

export interface ArbitraryProperty extends BaseNode, Important, Closed {
	type: NodeType.ArbitraryProperty
	decl: CssDeclaration
}

export interface ShortCss extends BaseNode, Important, Closed {
	type: NodeType.ShortCss
	prefix: Identifier
	expr: CssExpression
}

export interface VariantSpan extends BaseNode {
	type: NodeType.VariantSpan
	variant: Variant
	child?: Expression
}

export type Expression = Classname | ArbitraryClassname | ArbitraryProperty | ShortCss | VariantSpan | Group

export interface Group extends BaseNode, Important, Closed {
	type: NodeType.Group
	expressions: Expression[]
}

export interface Program extends BaseNode {
	type: NodeType.Program
	source: string
	expressions: Expression[]
	walk(accept: (node: Leaf, important: boolean) => boolean | void): void
	walkVariants(callback: (node: Exclude<Variant, GroupVariant>) => void): void
	walkUtilities(callback: (node: Exclude<Expression, Group | VariantSpan>, important: boolean) => void): {
		notClosed: BracketNode[]
	}
}

export type Node =
	| Program
	| Expression
	| SimpleVariant
	| ArbitrarySelector
	| ArbitraryVariant
	| GroupVariant
	| CssSelector
	| CssExpression
	| WithOpacity
	| EndOpacity

export type Utility = Classname | ArbitraryClassname | ArbitraryProperty | ShortCss

export type Leaf =
	| Classname
	| ArbitraryClassname
	| ArbitraryProperty
	| ShortCss
	| SimpleVariant
	| ArbitrarySelector
	| ArbitraryVariant

export type BracketNode =
	| Group
	| ArbitrarySelector
	| ArbitraryVariant
	| ArbitraryClassname
	| ArbitraryProperty
	| ShortCss
	| WithOpacity

export function isVariant(node: unknown): node is Variant {
	if (typeof node !== "object" || node === null) {
		return false
	}
	switch (node["type"]) {
		case NodeType.SimpleVariant:
		case NodeType.ArbitrarySelector:
		case NodeType.ArbitraryVariant:
		case NodeType.GroupVariant:
			return true
		default:
			return false
	}
}

export function fromVariantSpan(node: VariantSpan): Variant[] {
	let e: Expression | undefined = node
	const ret: Variant[] = []
	while (e) {
		if (e.type === NodeType.VariantSpan) {
			ret.push(e.variant)
			e = e.child
			continue
		}
		break
	}
	return ret
}

export interface ThemeFunctionNode extends BaseNode, Closed {
	type: NodeType.ThemeFunction
	value: ThemeValueNode
	valueRange: Range
	defaultValue?: string
}

export interface ThemeValueNode extends BaseNode {
	type: NodeType.ThemeValue
	path: ThemePathNode[]
}

export interface ThemePathNode extends BaseNode, Closed {
	type: NodeType.ThemePath
	value: string
}
