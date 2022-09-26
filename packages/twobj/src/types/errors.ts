import type * as parser from "../parser"

export interface ParseError extends Error {
	node: parser.Classname | parser.ArbitraryClassname | parser.SimpleVariant | parser.ArbitraryVariant
}

export function createParseError(
	node: parser.Classname | parser.ArbitraryClassname | parser.SimpleVariant | parser.ArbitraryVariant,
	message = "twobj error",
): ParseError {
	const err = new Error(message) as ParseError
	err.name = "ParseError"
	err.node = node
	return err
}
