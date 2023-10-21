import ts from "typescript"
import type { ExtractedToken, ExtractedTokenKind, Extractor } from "./types"

interface Features {
	twIds: Set<string>
	themeIds: Set<string>
	wrapIds: Set<string>
	globalStyles: ExtractedToken | undefined
}

function transfromToken(
	result: { kind: ExtractedTokenKind; token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral },
	source: ts.SourceFile,
): ExtractedToken {
	const value = result.token.text
	const start = result.token.getStart(source) + 1
	const end = result.token.getEnd()
	return { kind: result.kind, start, end, value }
}

function findNode(
	source: ts.SourceFile,
	node: ts.Node,
	position: number,
	features: Features,
	includeEnd: boolean,
): { token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: ExtractedTokenKind } | undefined {
	if (position < node.getStart(source) || position >= node.getEnd()) {
		return undefined
	}

	if (ts.isJsxAttribute(node)) {
		const attrName = node.name.getText(source)
		if (attrName === "tw" && node.initializer) {
			let token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | undefined
			if (ts.isStringLiteral(node.initializer)) {
				token = node.initializer
			} else if (ts.isJsxExpression(node.initializer)) {
				const { expression } = node.initializer
				if (expression) {
					if (ts.isStringLiteral(expression)) {
						token = expression
					} else if (ts.isNoSubstitutionTemplateLiteral(expression)) {
						token = expression
					}
				}
			}
			if (token && position >= token.getStart(source) + 1 && !greaterThenEnd(token)) {
				return { token, kind: "tw" }
			}
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const { tag, template } = node
		if (ts.isNoSubstitutionTemplateLiteral(template)) {
			let id: ts.Identifier | undefined
			let e = tag
			while (ts.isCallExpression(e) || ts.isPropertyAccessExpression(e)) {
				e = e.expression
			}
			if (ts.isIdentifier(e)) {
				id = e
			}
			if (id) {
				if (features.twIds.has(id.text)) {
					if (position < template.getStart(source) + 1 || greaterThenEnd(template)) {
						return undefined
					}
					return { token: template, kind: "tw" }
				} else if (features.themeIds.has(id.text)) {
					if (position < template.getStart(source) + 1 || greaterThenEnd(template)) {
						return undefined
					}
					return { token: template, kind: "theme" }
				} else if (features.wrapIds.has(id.text)) {
					if (position < template.getStart(source) + 1 || greaterThenEnd(template)) {
						return undefined
					}
					return { token: template, kind: "wrap" }
				}
			}
		}
	}

	return ts.forEachChild(node, child => findNode(source, child, position, features, includeEnd))

	function greaterThenEnd(node: ts.Node): boolean {
		return includeEnd ? position >= node.getEnd() : position >= node.getEnd() - 1
	}
}

function findAllNode(
	source: ts.SourceFile,
	node: ts.Node,
	features: Features,
): Array<{ token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral; kind: ExtractedTokenKind }> {
	if (ts.isJsxAttribute(node)) {
		const attrName = node.name.getText(source)
		if (attrName === "tw" && node.initializer) {
			let token: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | undefined
			if (ts.isStringLiteral(node.initializer)) {
				token = node.initializer
			} else if (ts.isJsxExpression(node.initializer)) {
				const { expression } = node.initializer
				if (expression) {
					if (ts.isStringLiteral(expression)) {
						token = expression
					} else if (ts.isNoSubstitutionTemplateLiteral(expression)) {
						token = expression
					}
				}
			}
			if (token) {
				return [{ token, kind: "tw" }]
			}
		}
	} else if (ts.isTaggedTemplateExpression(node)) {
		const { tag, template } = node
		if (ts.isNoSubstitutionTemplateLiteral(template)) {
			let id: ts.Identifier | undefined
			let e = tag
			while (ts.isCallExpression(e) || ts.isPropertyAccessExpression(e)) {
				e = e.expression
			}
			if (ts.isIdentifier(e)) {
				id = e
			}
			if (id) {
				if (features.twIds.has(id.text)) {
					return [{ token: template, kind: "tw" }]
				} else if (features.wrapIds.has(id.text)) {
					return [{ token: template, kind: "wrap" }]
				} else if (features.themeIds.has(id.text)) {
					return [{ token: template, kind: "theme" }]
				}
			}
		}
	}

	return node
		.getChildren(source)
		.map(c => findAllNode(source, c, features))
		.flat()
}

function checkImportTw(source: ts.SourceFile, importLabels: string[]): Features {
	const twIds = new Set<string>()
	const themeIds = new Set<string>()
	const wrapIds = new Set<string>()
	let globalStyles: ExtractedToken | undefined

	source.forEachChild(node => {
		if (ts.isImportDeclaration(node)) {
			const { moduleSpecifier } = node
			if (ts.isStringLiteral(moduleSpecifier) && importLabels.includes(moduleSpecifier.text)) {
				const clause = node.importClause
				if (clause) {
					const { namedBindings } = clause
					if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
						namedBindings.elements.forEach(node => {
							const localName = node.name?.text
							if (!localName) return

							const importedName = node.propertyName?.text ?? localName
							switch (importedName) {
								case "theme":
									themeIds.add(localName)
									break
								case "tw":
									twIds.add(localName)
									break
								case "wrap":
									wrapIds.add(localName)
									break
								case "globalStyles": {
									globalStyles = {
										kind: "globalStyles",
										start: node.name.getStart(source),
										end: node.name.getEnd(),
										value: "globalStyles",
									}
									break
								}
							}
						})
					}
				}
			}
		}
	})
	return { twIds, themeIds, wrapIds, globalStyles } as const
}

export function findToken(
	source: ts.SourceFile,
	position: number,
	includeEnd: boolean,
	importLabels: string[],
): ExtractedToken | undefined {
	const features = checkImportTw(source, importLabels)
	if (!includeEnd && features.globalStyles) {
		if (position >= features.globalStyles.start && position < features.globalStyles.end) {
			return features.globalStyles
		}
	}

	const node = findNode(source, source, position, features, includeEnd)
	if (node == undefined) {
		return undefined
	}
	return transfromToken(node, source)
}

export function findAllToken(source: ts.SourceFile, importLabels: string[]): ExtractedToken[] {
	const features = checkImportTw(source, importLabels)
	return findAllNode(source, source, features).map(node => transfromToken(node, source))
}

const typescriptExtractor: Extractor = {
	importLabels: [],
	acceptLanguage(languageId) {
		switch (languageId) {
			case "javascript":
			case "javascriptreact":
			case "typescript":
			case "typescriptreact":
				return true
		}
		return false
	},
	findAll(languageId, code) {
		let scriptKind: ts.ScriptKind | undefined
		switch (languageId) {
			case "typescript":
				scriptKind = ts.ScriptKind.TS
				break
			case "javascript":
				scriptKind = ts.ScriptKind.JS
				break
			case "typescriptreact":
				scriptKind = ts.ScriptKind.TSX
				break
			case "javascriptreact":
				scriptKind = ts.ScriptKind.JSX
				break
			default:
				scriptKind = undefined
		}
		if (scriptKind) {
			const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, false, scriptKind)
			try {
				return findAllToken(source, this.importLabels ?? [])
			} catch {
				return []
			}
		}
		return []
	},
	find(languageId, code, position, includeEnd) {
		let scriptKind: ts.ScriptKind | undefined
		switch (languageId) {
			case "typescript":
				scriptKind = ts.ScriptKind.TS
				break
			case "javascript":
				scriptKind = ts.ScriptKind.JS
				break
			case "typescriptreact":
				scriptKind = ts.ScriptKind.TSX
				break
			case "javascriptreact":
				scriptKind = ts.ScriptKind.JSX
				break
			default:
				scriptKind = undefined
		}
		if (scriptKind) {
			const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, false, scriptKind)
			const token = findToken(source, position, includeEnd, this.importLabels ?? [])
			if (!token) {
				return undefined
			}
			return token
		}
		return undefined
	},
}
export default typescriptExtractor
