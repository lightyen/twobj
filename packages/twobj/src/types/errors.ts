import type * as parser from "../parser"

export interface ParseError<N> {
	name: string
	message: string
	node: N
}

export function createParseError<
	T = parser.Classname | parser.ArbitraryClassname | parser.SimpleVariant | parser.ArbitraryVariant,
>(node: T, message = "twobj error"): ParseError<T> {
	const err = new Error(message) as unknown as ParseError<T>
	err.name = "ParseError"
	err.node = node
	return err
}
