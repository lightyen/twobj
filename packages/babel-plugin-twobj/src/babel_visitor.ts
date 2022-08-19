import type { BabelFile, NodePath, Visitor } from "@babel/core"
import babel from "@babel/types"
import { createContext, resolveConfig } from "twobj"

interface ImportLibrary {
	path: NodePath<babel.ImportDeclaration>
	libName: string
	defaultName?: string
	variables: Array<{ localName: string; importedName: string }>
}

export interface State {
	file: BabelFile
	imports: Array<ImportLibrary>
	globalInserted?: boolean
}

function getFirstTwQuasi(path: NodePath<babel.TaggedTemplateExpression>): NodePath<babel.TemplateElement> | undefined {
	const quasi = path.get("quasi")
	const quasis = quasi.get("quasis")
	const expressions = quasi.get("expressions")
	if (expressions.length > 0) {
		throw expressions[0].buildCodeFrameError("tw: plain text only")
	}
	return quasis.at(0)
}

export type LibName = "emotion" | "linaria" | "default"

const packageName = "twobj"

export function createVisitor({
	babel,
	options,
	config,
	moduleType,
	lib,
}: {
	babel: typeof import("babel__core")
	options: import("../options.js").PluginOptions
	config: unknown
	moduleType: "esm" | "cjs"
	lib: LibName
}): Visitor<import("@babel/core").PluginPass> {
	const t = babel.types
	const resolved = resolveConfig(config as Parameters<typeof resolveConfig>[0])
	const ctx = createContext(resolved)

	const emotion: Visitor<State> = {
		JSXOpeningElement(path, state) {
			const attrs = path.get("attributes")
			let twIndex = -1
			let twAttr: NodePath<babel.JSXAttribute> | undefined
			let cssIndex = -1
			let cssAttr: NodePath<babel.JSXAttribute> | undefined
			let input = ""

			for (let i = 0; i < attrs.length; i++) {
				if (twIndex >= 0 && cssIndex >= 0) {
					break
				}
				const attr = attrs[i]
				if (!attr.isJSXAttribute()) {
					continue
				}
				const name = attr.get("name").node.name
				const value = attr.get("value")
				if (name === "tw" && value.isStringLiteral()) {
					twIndex = i
					twAttr = attr
					input = value.node.value
				}
				if (name === "css") {
					cssIndex = i
					cssAttr = attr
				}
			}

			if (twAttr) {
				const objExpr = buildStyle(input)
				if (!cssAttr) {
					const attr = t.jsxAttribute(t.jsxIdentifier("css"), t.jsxExpressionContainer(objExpr))
					twAttr.replaceWith(attr)
				} else {
					const v = cssAttr.get("value")
					if (v.isJSXExpressionContainer()) {
						const expression = v.get("expression")
						if (expression.isArrayExpression()) {
							const elements = expression.get("elements")
							if (elements.length === 0) {
								expression.replaceWith(objExpr)
							} else if (twIndex < cssIndex) {
								expression.replaceWith(t.arrayExpression([objExpr, ...elements.map(e => e.node)]))
							} else {
								expression.replaceWith(t.arrayExpression([...elements.map(e => e.node), objExpr]))
							}
						} else if (expression.isObjectExpression()) {
							if (twIndex < cssIndex) {
								expression.replaceWith(t.arrayExpression([objExpr, expression.node]))
							} else {
								expression.replaceWith(t.arrayExpression([expression.node, objExpr]))
							}
						}
					}
				}
			}
		},
	}

	const visitor: Visitor<State> = {
		Identifier(path, state) {
			if (state.imports.length === 0) return
			if (path.parentPath.isImportSpecifier()) return

			for (const { variables, path: importPath } of state.imports) {
				for (const { localName, importedName } of variables) {
					if (importedName === "globalStyles" && path.node.name === localName) {
						const parent = path.parentPath
						if (parent.isExpression() || parent.isAssignmentPattern() || parent.isVariableDeclarator()) {
							if (!state.globalInserted) {
								if (isObject(ctx.globalStyles)) {
									const result = buildStyleObjectExpression(ctx.globalStyles)
									importPath.insertBefore(
										t.variableDeclaration("const", [
											t.variableDeclarator(t.identifier(localName), result),
										]),
									)
								}
								state.globalInserted = true
							}
						}
						break
					}
				}
			}
		},
		TaggedTemplateExpression(path, state) {
			if (state.imports.length === 0) return

			const { node } = path
			const { tag } = node
			let skip = false
			for (const { variables } of state.imports) {
				for (const { localName, importedName } of variables) {
					if (t.isIdentifier(tag) && localName === tag.name) {
						switch (importedName) {
							case "tw": {
								const quasi = getFirstTwQuasi(path)
								if (quasi) {
									const value = quasi.node.value.cooked ?? quasi.node.value.raw
									path.replaceWith(buildStyle(value))
								}
								break
							}
							case "theme": {
								const quasi = getFirstTwQuasi(path)
								if (quasi) {
									const value = quasi.node.value.cooked ?? quasi.node.value.raw
									let themeValue = ctx.theme(value)
									if (Array.isArray(themeValue) && themeValue.every(v => typeof v === "string")) {
										themeValue = themeValue.join(", ")
									}

									let expr: babel.Expression
									if (Array.isArray(themeValue)) {
										expr = buildArrayExpression(themeValue)
									} else if (typeof themeValue === "object" && themeValue !== null) {
										expr = buildObjectExpression(themeValue as Record<string, unknown>)
									} else {
										expr = buildPrimitive(themeValue)
									}

									if (expr) {
										path.replaceWith(expr)
									}
								}
								break
							}
						}
						skip = true
						break
					}
				}
			}

			if (skip) {
				path.skip()
			}
		},
	}

	return {
		Program(program) {
			const state: State = { file: this.file, imports: [] }
			program.get("body").forEach(path => {
				if (!path.isImportDeclaration()) return
				const lib = getImportLibrary(path)
				if (lib) {
					state.imports.push(lib)
				}
			})

			if (lib === "emotion") {
				// transfrom tw jsx tag
				program.traverse<State>(emotion, state)
			}

			// transfrom tw template tag
			program.traverse<State>(visitor, state)

			for (const { path } of state.imports) {
				for (const p of path.get("specifiers")) {
					if (!p.isImportSpecifier()) {
						p.remove()
						continue
					}
					const imported = p.node.imported
					const importedName = t.isIdentifier(imported) ? imported.name : imported.value
					switch (importedName) {
						case "tw":
						case "theme":
						case "globalStyles":
							p.remove()
							break
					}
				}
				if (path.get("specifiers").length === 0) {
					path.remove()
				}
			}
			program.scope.crawl()
		},
	}

	function isObject(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null
	}

	function buildPrimitive(value: unknown) {
		if (typeof value === "string") {
			return t.stringLiteral(value)
		}
		if (typeof value === "number") {
			return t.numericLiteral(value)
		}
		if (typeof value === "boolean") {
			return t.booleanLiteral(value)
		}
		if (value === undefined) {
			return t.identifier("undefined")
		}
		return t.nullLiteral()
	}

	function buildArrayExpression(value: unknown[]): babel.ArrayExpression {
		return t.arrayExpression(
			value.map((val: unknown) => {
				if (Array.isArray(val)) {
					return buildArrayExpression(val)
				}
				if (isObject(val)) {
					return buildObjectExpression(val)
				}
				return buildPrimitive(val)
			}),
		)
	}

	function buildObjectExpression(obj: Record<string, unknown>): babel.ObjectExpression {
		const members: babel.ObjectProperty[] = []
		for (const k in obj) {
			const key = /^[a-zA-Z]\w*$/.test(k) ? t.identifier(k) : t.stringLiteral(k)
			const v = obj[k]

			if (Array.isArray(v)) {
				members.push(t.objectProperty(key, buildArrayExpression(v)))
				continue
			}

			if (isObject(v)) {
				members.push(t.objectProperty(key, buildObjectExpression(v)))
				continue
			}

			members.push(t.objectProperty(key, buildPrimitive(v)))
		}
		return t.objectExpression(members)
	}

	function buildStyle(input: string) {
		return buildStyleObjectExpression(ctx.css(input))
	}

	function buildStyleObjectExpression(obj: Record<string, unknown>) {
		const members: babel.ObjectProperty[] = []
		for (const k in obj) {
			const key = /^[a-zA-Z]\w*$/.test(k) ? t.identifier(k) : t.stringLiteral(k)
			let v = (obj as Record<string, unknown>)[k]
			if (isObject(v)) {
				const result = buildStyleObjectExpression(v)
				if (result) {
					members.push(t.objectProperty(key, result))
				}
				continue
			}

			if (Array.isArray(v) && v[v.length - 1] != undefined) {
				v = v[v.length - 1] // pick last value
			}

			if (Array.isArray(v)) {
				continue
			}

			members.push(t.objectProperty(key, buildPrimitive(v)))
		}
		return t.objectExpression(members)
	}

	function getImportLibrary(path: NodePath<babel.ImportDeclaration>): ImportLibrary | null {
		const { node } = path

		if (node.source.value !== packageName) {
			return null
		}

		const lib: ImportLibrary = {
			path,
			libName: node.source.value,
			variables: [],
		}
		for (let i = 0; i < node.specifiers.length; i++) {
			const s = node.specifiers[i]
			if (s.type === "ImportSpecifier" && s.importKind === "value" && t.isIdentifier(s.imported)) {
				lib.variables.push({
					localName: s.local.name,
					importedName: s.imported.name,
				})
			} else if (s.type === "ImportDefaultSpecifier") {
				lib.defaultName = s.local.name
			}
		}
		return lib
	}
}
