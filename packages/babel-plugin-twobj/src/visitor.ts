import type { BabelFile, NodePath, PluginPass, Visitor } from "@babel/core"
import babel from "@babel/types"
import { createContext, resolveConfig, type CSSProperties, type ParseError } from "twobj"
import { NodeType } from "twobj/parser"
import { basePlugin, createProgramState, isKeyword, mypackage } from "./base"
import * as plugins from "./plugins"
import type { ProgramState, ThirdParty } from "./types"
import { buildObjectExpression } from "./util"

function getThirdPartyPlugin(t: typeof import("babel__core").types, p?: ThirdParty) {
	switch (p?.name) {
		case "emotion":
			p.plugin = plugins.emotion
			return plugins.emotion
		default:
			return undefined
	}
}

export function visitor({
	babel,
	config,
	throwError,
	thirdParty,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	config: any
	babel: typeof import("babel__core")
	throwError: boolean
	thirdParty?: ThirdParty
}): Visitor<PluginPass> {
	const context = createContext(resolveConfig(config), { throwError })

	const thirdPartyPlugin = getThirdPartyPlugin(babel.types, thirdParty)

	return {
		Program(program) {
			const state = createProgramState({
				types: babel.types,
				thirdParty,
				file: this.file,
				program,
			})

			if (thirdPartyPlugin) {
				program.traverse<ProgramState>(
					thirdPartyPlugin({
						types: babel.types,
						context,
						buildStyle(twDeclaration, path) {
							return buildStyle(twDeclaration, path, state.file)
						},
						buildWrap(twDeclaration, path) {
							return buildWrap(twDeclaration, path, state.file)
						},
					}),
					state,
				)
			}

			program.traverse<ProgramState>(
				basePlugin({
					types: babel.types,
					context,
					buildStyle(twDeclaration, path) {
						return buildStyle(twDeclaration, path, state.file)
					},
					buildWrap(twDeclaration, path) {
						return buildWrap(twDeclaration, path, state.file)
					},
				}),
				state,
			)

			state.added.reverse().forEach(node => {
				program.unshiftContainer("body", node)
			})

			for (const { path, source } of state.imports) {
				if (source === mypackage) {
					const t = babel.types
					for (const p of path.get("specifiers")) {
						if (!p.isImportSpecifier()) {
							p.remove()
							continue
						}
						const imported = p.node.imported
						const importedName = t.isIdentifier(imported) ? imported.name : imported.value
						if (isKeyword(importedName)) {
							p.remove()
						}
					}
					if (path.get("specifiers").length === 0) {
						path.remove()
					}
				}
			}

			program.scope.crawl()

			return
		},
	}

	function buildStyle(twDeclaration: string, path: NodePath, file: BabelFile): babel.ObjectExpression {
		try {
			return buildObjectExpression(babel.types, context.css(twDeclaration))
		} catch (error) {
			throw createError(error as ParseError, path, file)
		}
	}

	function buildWrap(twDeclaration: string, path: NodePath, file: BabelFile): babel.ArrowFunctionExpression {
		try {
			return babel.types.arrowFunctionExpression(
				[babel.types.identifier("e")],
				buildObjectExpression(
					babel.types,
					context.wrap(twDeclaration)(Math.E as unknown as CSSProperties),
					true,
				),
			)
		} catch (error) {
			throw createError(error as ParseError, path, file)
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

		switch (error.node.type) {
			case NodeType.ArbitraryClassname:
			case NodeType.ArbitraryProperty:
			case NodeType.Group:
				loc = getLocation(file.code, loc, [error.node.start, error.node.start + 1])
				break
			default:
				loc = getLocation(file.code, loc, [error.node.start, error.node.end])
				break
		}

		errPath.node.loc = loc
		const retErr = errPath.buildCodeFrameError(
			`${error.message}\n\n${file.opts.filename}:${loc.start.line}:${loc.start.column + 1}`,
		)
		return retErr
	}

	function getLocation(
		rawLines: string,
		{ start, end, ...rest }: babel.SourceLocation,
		[a, b]: [number, number],
	): babel.SourceLocation {
		const lineOffsets = computeLineOffsets(rawLines)
		start.line -= 1
		end.line -= 1
		end = { ...end, ...positionAt(offsetAt(start) + b) }
		start = { ...start, ...positionAt(offsetAt(start) + a) }
		start.line += 1
		end.line += 1
		return { start, end, ...rest }

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
