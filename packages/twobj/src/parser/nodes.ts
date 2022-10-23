/**
 *  Node Types
 *
 * - *classname*
 *    ```tw
 *    aaa
 *    aaa-bbb
 *    aaa-bbb/modifier
 *    ```
 * <br />
 * - *arbitrary-classname*
 *    ```tw
 *    aaa-[value]
 *    aaa-[value]/modifier
 *    ```
 * <br />
 * - *arbitrary-property*
 *    ```tw
 *    [aaa: value]
 *    ```
 * <br />
 * - *simple-variant*
 *    ```tw
 *    aaa-bbb:
 *    aaa-bbb/modifier:
 *    ```
 * <br />
 * - *arbitrary-variant*
 *    ```tw
 *    aaa-[value]:
 *    aaa-[value]/modifier:
 *    ```
 * <br />
 * - *arbitrary-selector*
 *    ```tw
 *    [.bbb, &:hover]:
 *    ```
 * <br />
 * - *unknown-classname*
 *    ```tw
 *    aaa[value]
 *    ```
 * <br />
 * - *unknown-variant*
 *    ```tw
 *    aaa[value]:
 *    ```
 */

export enum NodeType {
	Program = "Program",
	Group = "Group",
	VariantSpan = "VariantSpan",
	SimpleVariant = "SimpleVariant",
	/** syntax: ```{key}/{modifier}``` */
	Classname = "Classname",
	/** syntax: ```{key}-[{value}]/{modifier}``` */
	ArbitraryClassname = "ArbitraryClassname",
	/** syntax: ```{key}-[{value}]/{modifier}{sep}``` */
	ArbitraryVariant = "ArbitraryVariant",
	/** syntax: ```({variant}{sep} {variant}{sep} ...){sep}``` */
	GroupVariant = "GroupVariant",
	ArbitraryProperty = "ArbitraryProperty",
	ArbitrarySelector = "ArbitrarySelector",
	UnknownClassname = "UnknownClassname",
	UnknownVariant = "UnknownVariant",
	Identifier = "Identifier",
	Value = "Value",
	Modifier = "Modifier",
	ThemeFunction = "ThemeFunction",
	ThemeValue = "ThemeValue",
	ThemePath = "ThemePath",
}

export type Range = [number, number]

export interface BaseNode {
	type: NodeType
	get text(): string
	source: string
	start: number
	end: number
}

export interface Important {
	important: boolean
}

export interface Closed {
	closed: boolean
}

export interface HasValue {
	value: Value
	/** resolved value from theme function */
	resolved?: string
}

export interface IModifier {
	m?: Modifier | null | undefined
}

export interface Identifier extends BaseNode {
	type: NodeType.Identifier
}

export interface Value extends BaseNode {
	type: NodeType.Value
}

/** Not including brackets */
export interface Modifier extends BaseNode, Closed {
	type: NodeType.Modifier
	wrapped: boolean
}

/**
 * API: addUtilities()
 */
export interface Classname extends BaseNode, Important, IModifier {
	type: NodeType.Classname
	key: Identifier
}

/**
 * API: addVariant()
 * NOTE: variant is always closed.
 */
export interface SimpleVariant extends BaseNode, IModifier {
	type: NodeType.SimpleVariant
	/** without separator */
	key: Identifier
}

/** API: matchUtilities() */
export interface ArbitraryClassname extends BaseNode, HasValue, Important, Closed, IModifier {
	type: NodeType.ArbitraryClassname
	/** without dash */
	key: Identifier
}

/**
 * API: matchVariant()
 * NOTE: variant is always closed.
 */
export interface ArbitraryVariant extends BaseNode, HasValue, IModifier {
	type: NodeType.ArbitraryVariant
	/** without dash */
	key: Identifier
}

export interface ArbitraryProperty extends BaseNode, Important, Closed {
	type: NodeType.ArbitraryProperty
	decl: Value
}

export interface ArbitrarySelector extends BaseNode {
	type: NodeType.ArbitrarySelector
	selector: Value
}

export interface UnknownClassname extends BaseNode, HasValue, Important, Closed, IModifier {
	type: NodeType.UnknownClassname
	key: Identifier
}

export interface UnknownVariant extends BaseNode, HasValue, IModifier {
	type: NodeType.UnknownVariant
	key: Identifier
}

export interface GroupVariant extends BaseNode {
	type: NodeType.GroupVariant
	expressions: Expression[]
}

export interface Group extends BaseNode, Important, Closed {
	type: NodeType.Group
	expressions: Expression[]
}

export interface Program extends BaseNode {
	type: NodeType.Program
	source: string
	expressions: Expression[]
}

export type Variant = SimpleVariant | ArbitrarySelector | ArbitraryVariant | GroupVariant | UnknownVariant

export interface VariantSpan extends BaseNode {
	type: NodeType.VariantSpan
	variant: Variant
	child?: Expression | null | undefined
}

export type Expression = Classname | ArbitraryClassname | ArbitraryProperty | UnknownClassname | VariantSpan | Group

export type Node =
	| Program
	| Expression
	| SimpleVariant
	| ArbitrarySelector
	| ArbitraryVariant
	| UnknownVariant
	| GroupVariant
	| Value
	| Modifier

export type Utility = Classname | ArbitraryClassname | ArbitraryProperty | UnknownClassname

export type Leaf = Exclude<Expression, VariantSpan | Group> | Exclude<Variant, GroupVariant>

export function isVariant(node: unknown): node is Variant {
	if (typeof node !== "object" || node === null) {
		return false
	}
	switch (node["type"]) {
		case NodeType.SimpleVariant:
		case NodeType.ArbitrarySelector:
		case NodeType.ArbitraryVariant:
		case NodeType.UnknownVariant:
		case NodeType.GroupVariant:
			return true
		default:
			return false
	}
}

export function identifier(source: string, start = 0, end = source.length): Identifier {
	return {
		type: NodeType.Identifier,
		start,
		end,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function value(source: string, start = 0, end = source.length): Value {
	return {
		type: NodeType.Value,
		start,
		end,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function modifier(closed: boolean, wrapped: boolean, source: string, start = 0, end = source.length): Modifier {
	return {
		type: NodeType.Modifier,
		start,
		end,
		closed,
		wrapped,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function classname(
	key: Identifier,
	important: boolean,
	modifier: Modifier | null | undefined,
	source: string,
	start = 0,
	end = source.length,
): Classname {
	return {
		type: NodeType.Classname,
		start,
		end,
		key,
		m: modifier,
		important,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function variant(
	key: Identifier,
	modifier: Modifier | null | undefined,
	source: string,
	start = 0,
	end = source.length,
): Variant {
	return {
		type: NodeType.SimpleVariant,
		start,
		end,
		key,
		m: modifier,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function arbitraryClassname(
	isUnknown: boolean,
	key: Identifier,
	value: Value,
	important: boolean,
	closed: boolean,
	modifier: Modifier | null | undefined,
	source: string,
	start = 0,
	end = source.length,
): ArbitraryClassname | UnknownClassname {
	return {
		type: isUnknown ? NodeType.UnknownClassname : NodeType.ArbitraryClassname,
		start,
		end,
		key,
		value,
		important,
		closed,
		m: modifier,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function arbitraryVariant(
	isUnknown: boolean,
	key: Identifier,
	value: Value,
	modifier: Modifier | null | undefined,
	source: string,
	start = 0,
	end = source.length,
): ArbitraryVariant | UnknownVariant {
	return {
		type: isUnknown ? NodeType.UnknownVariant : NodeType.ArbitraryVariant,
		start,
		end,
		key,
		value,
		m: modifier,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function arbitraryProperty(
	decl: Value,
	important: boolean,
	closed: boolean,
	source: string,
	start = 0,
	end = source.length,
): ArbitraryProperty {
	return {
		type: NodeType.ArbitraryProperty,
		start,
		end,
		decl,
		important,
		closed,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function arbitrarySelector(selector: Value, source: string, start = 0, end = source.length): ArbitrarySelector {
	return {
		type: NodeType.ArbitrarySelector,
		start,
		end,
		selector,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function variantSpan(
	variant: Variant,
	child: Expression | null | undefined,
	source: string,
	start = 0,
	end = source.length,
): VariantSpan {
	return {
		type: NodeType.VariantSpan,
		start,
		end,
		variant,
		child,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function groupVariant(expressions: Expression[], source: string, start = 0, end = source.length): GroupVariant {
	return {
		type: NodeType.GroupVariant,
		start,
		end,
		expressions,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function unknownClassname(
	key: Identifier,
	value: Value,
	important: boolean,
	closed: boolean,
	modifier: Modifier | null | undefined,
	source: string,
	start = 0,
	end = source.length,
): UnknownClassname {
	return {
		type: NodeType.UnknownClassname,
		start,
		end,
		key,
		value,
		important,
		closed,
		m: modifier,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function group(
	expressions: Expression[],
	important: boolean,
	closed: boolean,
	source: string,
	start = 0,
	end = source.length,
): Group {
	return {
		type: NodeType.Group,
		start,
		end,
		important,
		closed,
		expressions,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function program(expressions: Expression[], source: string, start = 0, end = source.length): Program {
	return {
		type: NodeType.Program,
		start,
		end,
		source,
		expressions,
		get text() {
			return source.slice(this.start, this.end)
		},
	}
}

/** Theme */

export interface ThemeFunctionNode extends BaseNode, Closed {
	type: NodeType.ThemeFunction
	value: ThemeValueNode
	valueStart: number
	valueEnd: number
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

export function themeFunction(
	closed: boolean,
	value: ThemeValueNode,
	source: string,
	valueStart: number,
	valueEnd: number,
	start = 0,
	end = source.length,
): ThemeFunctionNode {
	return {
		type: NodeType.ThemeFunction,
		start,
		end,
		closed,
		value,
		valueStart,
		valueEnd,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}

export function themeValue(source: string, start = 0, end = source.length): ThemeValueNode {
	return {
		type: NodeType.ThemeValue,
		start,
		end,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
		path: [],
	}
}

export function themePath(
	value: string,
	closed: boolean,
	source: string,
	start = 0,
	end = source.length,
): ThemePathNode {
	return {
		type: NodeType.ThemePath,
		start,
		end,
		value,
		closed,
		source,
		get text() {
			return this.source.slice(this.start, this.end)
		},
	}
}
