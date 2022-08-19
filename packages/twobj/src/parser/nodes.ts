// NOTE:
//
// classname: aa-bbb
// arbitrary-classname: aa-[value]
// arbitrary-property: [aaa: value]
// simple-variant: aa-bbb:
// arbitrary-variant: aa-[value]:
// arbitrary-selector: [&:bbb, &:ccc]:

export enum NodeType {
	Program = "Program",
	Group = "Group",
	VariantSpan = "VariantSpan",
	ClassName = "ClassName",
	SimpleVariant = "SimpleVariant",
	ArbitraryClassname = "ArbitraryClassname",
	ArbitraryVariant = "ArbitraryVariant",
	ArbitraryProperty = "ArbitraryProperty",
	ArbitrarySelector = "ArbitrarySelector",
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

export interface NodeToken {
	range: Range
}

export interface NodeData {
	value: string
}

export type TokenString = NodeToken & NodeData

export interface BaseNode extends NodeToken {
	type: NodeType
}

export interface Important {
	important: boolean
}

export interface Closed {
	closed: boolean
}

export interface Identifier extends BaseNode, NodeData {
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

export type Variant = SimpleVariant | ArbitrarySelector | ArbitraryVariant

export interface CssSelector extends BaseNode, NodeData {
	type: NodeType.CssSelector
}

export interface Classname extends BaseNode, NodeData, Important {
	type: NodeType.ClassName
}

export interface CssExpression extends BaseNode, NodeData {
	type: NodeType.CssExpression
}

export interface WithOpacity extends BaseNode, Closed {
	type: NodeType.WithOpacity
	opacity: Identifier
}

export interface EndOpacity extends BaseNode, NodeData {
	type: NodeType.EndOpacity
}

export interface ArbitraryClassname extends BaseNode, Important, Closed {
	type: NodeType.ArbitraryClassname
	prefix: Identifier
	expr?: CssExpression
	e?: WithOpacity | EndOpacity
}

export interface CssDeclaration extends BaseNode, NodeData {
	type: NodeType.CssDeclaration
}

export interface ArbitraryProperty extends BaseNode, NodeData, Important, Closed {
	type: NodeType.ArbitraryProperty
	decl: CssDeclaration
}

export interface VariantSpan extends BaseNode {
	type: NodeType.VariantSpan
	variant: SimpleVariant | ArbitrarySelector | ArbitraryVariant
	child?: TwExpression
}

export type TwExpression = Classname | ArbitraryClassname | ArbitraryProperty | VariantSpan | Group

export interface Group extends BaseNode, Important, Closed {
	type: NodeType.Group
	expressions: TwExpression[]
}

export interface Program extends BaseNode {
	type: NodeType.Program
	expressions: TwExpression[]
}

export type Node =
	| Program
	| TwExpression
	| SimpleVariant
	| ArbitrarySelector
	| ArbitraryVariant
	| CssSelector
	| CssExpression
	| WithOpacity
	| EndOpacity

export type BracketNode =
	| Group
	| ArbitrarySelector
	| ArbitraryVariant
	| ArbitraryClassname
	| ArbitraryProperty
	| WithOpacity

export interface ThemeFunctionNode extends BaseNode, Closed {
	type: NodeType.ThemeFunction
	value: ThemeValueNode
	valueRange: Range
	defaultValue?: string
	toString(): string
}

export interface ThemeValueNode extends BaseNode {
	type: NodeType.ThemeValue
	path: ThemePathNode[]
	toString(): string
}

export interface ThemePathNode extends BaseNode, NodeData, Closed {
	type: NodeType.ThemePath
	toString(): string
}
