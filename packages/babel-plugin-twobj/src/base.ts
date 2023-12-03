import type { BabelFile, NodePath } from "@babel/core"
import babel from "@babel/types"
import type { ImportDeclaration, Plugin, ProgramState, ThirdParty } from "./types"
import { buildArrayExpression, buildObjectExpression, buildPrimitive, getFirstQuasi, isObject } from "./util"

export const mypackage = "twobj"

export type Keyword = "tw" | "tx" | "wrap" | "theme" | "globalStyles"

const keywords = ["tw", "tx", "wrap", "theme", "globalStyles"]

export function isKeyword(value: string): value is Keyword {
	switch (value) {
		case "tw":
		case "tx":
		case "wrap":
		case "theme":
		case "globalStyles":
			return true
	}
	return false
}

export const basePlugin: Plugin = ({ context, buildStyle, buildWrap }) => {
	return {
		/**
		 * globalStyles ==> {...}
		 */
		Identifier(path, state) {
			if (state.globalStyles) {
				return
			}
			if (path.parentPath.isImportSpecifier()) {
				return
			}

			const name = path.node.name
			const importPath = state.twIdentifiers["globalStyles"].get(name)
			if (importPath == undefined) {
				return
			}

			const parent = path.parentPath
			if (
				parent.isExpression() ||
				parent.isAssignmentPattern() ||
				parent.isVariableDeclarator() ||
				parent.isExpressionStatement() ||
				parent.isJSXExpressionContainer()
			) {
				const t = state.types
				if (isObject(context.globalStyles)) {
					const data = buildObjectExpression(t, context.globalStyles)
					importPath.insertBefore(
						t.variableDeclaration("const", [t.variableDeclarator(t.identifier(name), data)]),
					)
				}
				state.globalStyles = true
			} else {
				throw Error("cannot transform globalStyles")
			}
		},
		/**
		 * tw`` ==> {...}
		 * wrap`` ==> (e) => ({...})
		 * theme`` ==> {...}
		 */
		TaggedTemplateExpression(path, state) {
			const t = state.types
			if (!t.isIdentifier(path.node.tag)) {
				return
			}

			let skip = false

			const tag = path.node.tag.name

			if (state.twIdentifiers["tw"].get(tag)) {
				const quasi = getFirstQuasi(path)
				if (quasi) {
					const value = quasi.node.value.cooked ?? quasi.node.value.raw
					path.replaceWith(buildStyle(value, quasi))
				}
				skip = true
			} else if (state.twIdentifiers["wrap"].get(tag)) {
				const quasi = getFirstQuasi(path)
				if (quasi) {
					const value = quasi.node.value.cooked ?? quasi.node.value.raw
					path.replaceWith(buildWrap(value, quasi))
				}
				skip = true
			} else if (state.twIdentifiers["theme"].get(tag)) {
				const quasi = getFirstQuasi(path)
				if (quasi) {
					const value = quasi.node.value.cooked ?? quasi.node.value.raw
					let themeValue = context.theme(value)
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
				skip = true
			} else if (tag !== "css" && tag !== "createGlobalStyle") {
				skip = true
			}

			if (skip) {
				path.skip()
			}
		},
	}
}
basePlugin.id = "base"
basePlugin.lookup = []
basePlugin.manifest = {}

export function createProgramState(args: {
	types: typeof import("babel__core").types
	file: BabelFile
	program: NodePath<babel.Program>
	thirdParty?: ThirdParty
}): ProgramState {
	const { types, program, file, thirdParty } = args
	const lookup = new Set([mypackage])
	if (thirdParty?.plugin) {
		thirdParty.plugin.lookup.forEach(k => {
			lookup.add(k)
		})
	}
	const imports = parseImportDeclarations(types, lookup, program)
	const twIdentifiers: Record<string, Map<string, NodePath<babel.ImportDeclaration>>> = {}
	keywords.forEach(k => {
		twIdentifiers[k] = new Map()
	})

	imports.forEach(({ path, source, variables }) => {
		if (source !== mypackage) {
			return
		}
		variables.forEach(({ imported, local }) => {
			if (!isKeyword(imported)) {
				return
			}
			twIdentifiers[imported].set(local, path)
		})
	})

	let cssLocalName = ""
	let styledLocalName = ""

	if (thirdParty?.plugin) {
		for (const { source, variables, defaultId } of imports) {
			if (source === thirdParty.plugin.manifest.className) {
				for (const { imported, local } of variables) {
					if (imported === "css") {
						cssLocalName = local
						break
					}
				}
			} else if (source === thirdParty.plugin.manifest.styled) {
				if (defaultId) {
					styledLocalName = defaultId
				}
			}
		}
	}

	return {
		types,
		file,
		styles: new Map(),
		imports,
		twIdentifiers,
		added: [],
		thirdParty,
		cssLocalName,
		styledLocalName,
	}
}

function parseImportDeclarations(
	types: typeof import("babel__core").types,
	lookup: Set<string>,
	program: NodePath<babel.Program>,
): ImportDeclaration[] {
	const result: ImportDeclaration[] = []
	program.get("body").forEach(path => {
		if (!path.isImportDeclaration()) {
			return
		}

		const { node } = path
		const source = node.source.value

		if (!lookup.has(source)) {
			return
		}

		const decl: ImportDeclaration = {
			path,
			source,
			variables: [],
		}

		path.get("specifiers").forEach(path => {
			const node = path.node
			if (types.isImportSpecifier(node)) {
				const local = node.local.name
				const imported = types.isIdentifier(node.imported) ? node.imported.name : node.imported.value
				decl.variables.push({ local, imported })
			} else if (types.isImportDefaultSpecifier(node)) {
				decl.defaultId = node.local.name
			}
		})

		if (decl) {
			result.push(decl)
		}
	})

	return result
}
