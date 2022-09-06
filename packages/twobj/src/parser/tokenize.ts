import * as nodes from "./nodes"
import * as parser from "./parse_regexp"

export type TokenU = string
export type TokenV = [string, TokenExpr?]
export type TokenExpr = TokenV | TokenU | TokenExpr[]

export function tokenize(source: string, [start = 0, end = source.length] = []): TokenExpr[] {
	const expressions = parser.parseExpressions(source, [start, end])
	return expressions.map(_tokennize)

	function _tokennize(expr: nodes.TwExpression): TokenExpr {
		switch (expr.type) {
			case nodes.NodeType.VariantSpan: {
				if (expr.child) {
					return [source.slice(...expr.variant.range), _tokennize(expr.child)]
				}
				return [source.slice(...expr.variant.range)]
			}
			case nodes.NodeType.Group: {
				return expr.expressions.map(_tokennize)
			}
			case nodes.NodeType.ClassName: {
				return source.slice(...expr.range)
			}
			case nodes.NodeType.ArbitraryClassname: {
				return source.slice(...expr.range)
			}
			case nodes.NodeType.ArbitraryProperty: {
				return source.slice(...expr.range)
			}
			case nodes.NodeType.ShortCss: {
				return source.slice(...expr.range)
			}
		}
	}
}
