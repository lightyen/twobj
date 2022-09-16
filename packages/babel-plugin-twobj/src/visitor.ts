import type { NodePath, Visitor } from "@babel/core"
import babel from "@babel/types"
import type { CSSProperties } from "twobj"
import { createContext, resolveConfig } from "twobj"
import * as plugins from "./plugins"
import type { ImportLibrary, PluginOptions, PluginState, State, ThirdParty } from "./types"
import {
	buildArrayExpression,
	buildObjectExpression,
	buildPrimitive,
	buildStyleObjectExpression,
	buildWrapObjectExpression,
	getFirstQuasi,
	isObject,
} from "./util"

export const packageName = "twobj"

export function createVisitor({
	babel,
	options: { useClassName = false },
	config,
	moduleType,
	thirdParty,
}: {
	babel: typeof import("babel__core")
	options: PluginOptions
	config: unknown
	moduleType: "esm" | "cjs"
	thirdParty: ThirdParty | undefined
}): Visitor<import("@babel/core").PluginPass> {
	const t = babel.types
	const resolved = resolveConfig(config as Parameters<typeof resolveConfig>[0])
	const ctx = createContext(resolved)

	const visitor: Visitor<State> = {
		// add globalStyles to global scope
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
									const result = buildStyleObjectExpression(t, ctx.globalStyles)
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
								const quasi = getFirstQuasi(path)
								if (quasi) {
									const value = quasi.node.value.cooked ?? quasi.node.value.raw
									path.replaceWith(buildStyle(value))
								}
								break
							}
							case "theme": {
								const quasi = getFirstQuasi(path)
								if (quasi) {
									const value = quasi.node.value.cooked ?? quasi.node.value.raw
									let themeValue = ctx.theme(value)
									if (Array.isArray(themeValue) && themeValue.every(v => typeof v === "string")) {
										themeValue = themeValue.join(", ")
									}

									let expr: babel.Expression
									if (Array.isArray(themeValue)) {
										expr = buildArrayExpression(t, themeValue)
									} else if (typeof themeValue === "object" && themeValue !== null) {
										expr = buildObjectExpression(t, themeValue as Record<string, unknown>)
									} else {
										expr = buildPrimitive(t, themeValue)
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

	const lookup = new Set([packageName])

	if (thirdParty) {
		plugins[thirdParty.name].lookup.forEach(v => lookup.add(v))
	}

	return {
		Program(program) {
			const state: State = { file: this.file, imports: [] }
			program.get("body").forEach(path => {
				if (!path.isImportDeclaration()) return
				const lib = getImportLibrary(t, lookup, path)
				if (lib) {
					state.imports.push(lib)
				}
			})

			function addImportDeclaration(declaration: babel.ImportDeclaration) {
				program.unshiftContainer("body", declaration)
			}

			if (thirdParty) {
				program.traverse<State & PluginState>(
					plugins[thirdParty.name]({
						thirdParty,
						t,
						buildStyle,
						buildWrap,
						addImportDeclaration,
						useClassName,
					}),
					Object.assign(state, { styled: { imported: false, localName: "styled" } }),
				)
			}

			// transfrom tw template tag
			program.traverse<State>(visitor, state)

			for (const { path, libName } of state.imports) {
				if (packageName === libName) {
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
							case "wrap":
								p.remove()
								break
						}
					}
					if (path.get("specifiers").length === 0) {
						path.remove()
					}
				}
			}

			program.scope.crawl()
		},
	}

	function buildStyle(input: string) {
		return buildStyleObjectExpression(t, ctx.css(input))
	}

	function buildWrap(input: string) {
		return buildWrapObjectExpression(t, ctx.wrap(input)(Math.E as unknown as CSSProperties))
	}
}

function getImportLibrary(
	t: typeof babel,
	lookup: Set<string>,
	path: NodePath<babel.ImportDeclaration>,
): ImportLibrary | null {
	const { node } = path
	if (!lookup.has(node.source.value)) {
		return null
	}

	const lib: ImportLibrary = {
		path,
		libName: node.source.value,
		variables: [],
	}

	const specifiers = path.get("specifiers")

	for (let i = 0; i < specifiers.length; i++) {
		const spec = specifiers[i]
		if (spec.isImportSpecifier()) {
			const local = spec.get("local")
			const imported = spec.get("imported")
			if (local.isIdentifier() && imported.isIdentifier()) {
				lib.variables.push({
					localName: local.node.name,
					importedName: imported.node.name,
				})
			}
		} else if (spec.isImportDefaultSpecifier()) {
			const local = spec.get("local")
			if (local.isIdentifier()) {
				lib.defaultName = local.node.name
			}
		}
	}

	return lib
}
