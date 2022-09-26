import type { BabelFile, NodePath, Visitor } from "@babel/core"
import babel from "@babel/types"
import type { CSSProperties, ParseError } from "twobj"
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

function getPlugin({ name }: ThirdParty) {
	switch (name) {
		case "emotion":
			return plugins.emotion
		case "styled-components":
			return plugins.styledComponents
		case "linaria":
			return plugins.linaria
		default:
			return undefined
	}
}

export function createVisitor({
	babel,
	options: { useClassName = false },
	config,
	moduleType,
	thirdParty,
	throwError,
}: {
	babel: typeof import("babel__core")
	options: PluginOptions
	config: unknown
	moduleType: "esm" | "cjs"
	thirdParty: ThirdParty | undefined
	throwError: boolean
}): Visitor<import("@babel/core").PluginPass> {
	const t = babel.types
	const resolved = resolveConfig(config as Parameters<typeof resolveConfig>[0])
	const ctx = createContext(resolved, { throwError })

	const visitor: Visitor<State> = {
		// add globalStyles to global scope
		Identifier(path, state) {
			if (state.imports.length === 0) return
			if (path.parentPath.isImportSpecifier()) return

			for (const { variables, path: importPath } of state.imports) {
				for (const { localName, importedName } of variables) {
					if (importedName === "globalStyles" && path.node.name === localName) {
						const parent = path.parentPath
						if (
							parent.isExpression() ||
							parent.isAssignmentPattern() ||
							parent.isVariableDeclarator() ||
							parent.isExpressionStatement()
						) {
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
						} else {
							throw Error("not match")
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
									path.replaceWith(buildStyle(value, quasi, state.file))
								}
								skip = true
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
								skip = true
								break
							}
							case "css":
							case "createGlobalStyle": {
								// no skip
								break
							}
							default:
								skip = true
								break
						}
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
		Object.values(plugins).forEach(plugin => {
			for (const keyword of plugin.lookup) {
				lookup.add(keyword)
			}
		})
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
				const plugin = getPlugin(thirdParty)
				if (plugin) {
					program.traverse<State & PluginState>(
						plugin({
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

	function buildStyle(input: string, errPath: NodePath, file: BabelFile) {
		try {
			return buildStyleObjectExpression(t, ctx.css(input))
		} catch (error) {
			throw createError(error as ParseError, errPath, file)
		}
	}

	function buildWrap(input: string, errPath: NodePath, file: BabelFile) {
		try {
			return buildWrapObjectExpression(t, ctx.wrap(input)(Math.E as unknown as CSSProperties))
		} catch (error) {
			throw createError(error as ParseError, errPath, file)
		}
	}

	function createError(error: ParseError, errPath: NodePath, file: BabelFile) {
		if (errPath.node.loc == undefined) {
			return errPath.buildCodeFrameError(error.message)
		}
		let loc = errPath.node.loc
		if (errPath.isJSXAttribute()) {
			loc.start.column += 3 // tw=
			const value = errPath.get("value")
			if (value && value.isJSXExpressionContainer()) {
				loc.start.column += 2
			} else {
				loc.start.column += 1
			}
		}

		loc = getLocation(file.code, loc, error.node.range)
		errPath.node.loc = loc
		const retErr = errPath.buildCodeFrameError(
			`${error.message}\n\n${file.opts.filename}:${loc.start.line}:${loc.start.column + 1}`,
		)
		return retErr
	}

	function getLocation(
		rawLines: string,
		{ start, end }: babel.SourceLocation,
		[a, b]: [number, number],
	): babel.SourceLocation {
		const lineOffsets = computeLineOffsets(rawLines)
		start.line -= 1
		end.line -= 1
		end = positionAt(offsetAt(start) + b)
		start = positionAt(offsetAt(start) + a)
		start.line += 1
		end.line += 1
		return { start, end }

		function offsetAt(position: { line: number; column: number }) {
			if (position.line >= lineOffsets.length) {
				return rawLines.length
			} else if (position.line < 0) {
				return 0
			}
			const lineOffset = lineOffsets[position.line]
			const nextLineOffset =
				position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : rawLines.length
			return Math.max(Math.min(lineOffset + position.column, nextLineOffset), lineOffset)
		}

		function positionAt(offset: number): { line: number; column: number } {
			offset = Math.max(Math.min(offset, rawLines.length), 0)
			let low = 0,
				high = lineOffsets.length
			if (high === 0) {
				return { line: 0, column: offset }
			}
			while (low < high) {
				const mid = Math.floor((low + high) / 2)
				if (lineOffsets[mid] > offset) {
					high = mid
				} else {
					low = mid + 1
				}
			}
			// low is the least x for which the line offset is larger than the current offset
			// or array.length if no line offset is larger than the current offset
			const line = low - 1
			return { line, column: offset - lineOffsets[line] }
		}
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

function computeLineOffsets(text: string): number[] {
	const result: number[] = [0]
	for (let i = 0; i < text.length; i++) {
		const ch = text.charCodeAt(i)
		// cr lf
		if (ch === 13 || ch === 10) {
			if (ch === 13 && i + 1 < text.length && text.charCodeAt(i + 1) === 10) {
				i++
			}
			result.push(i + 1)
		}
	}
	return result
}
