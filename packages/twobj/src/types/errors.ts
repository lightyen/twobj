import type * as parser from "../parser"

export interface ParseError extends Error {
	node: parser.Node
}

export function createParseError(node: parser.Node, message = "twobj error"): ParseError {
	const err = new Error(message) as ParseError
	err.name = "ParseError"
	err.node = node
	return err
}
