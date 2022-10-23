import Fuse from "fuse.js"
import * as parser from "twobj/parser"
import vscode from "vscode"
import type { ExtractedToken, ExtractedTokenKind, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import { cssDataManager } from "~/common/vscode-css-languageservice"
import type { ServiceOptions } from "~/shared"
import { DIAGNOSTICS_ID } from "~/shared"
import { Now } from "../common/time"
import { TailwindLoader } from "./tailwind"

export interface IDiagnostic extends vscode.Diagnostic {
	codeActions?: vscode.CodeAction[]
}

const cssProperties = cssDataManager.getProperties().map(c => c.name)
const csspropSearcher = new Fuse(cssProperties, { includeScore: true, isCaseSensitive: true })

function createDiagnosticArray() {
	const arr: vscode.Diagnostic[] = []
	const MAXSZIE = 20
	let errors = 0
	let warnings = 0
	let others = 0
	return new Proxy(arr, {
		get(target, prop, ...rest) {
			switch (prop) {
				case "push":
					return function (item: vscode.Diagnostic) {
						switch (item.severity) {
							case vscode.DiagnosticSeverity.Error:
								if (errors >= MAXSZIE) return 0
								errors++
								break
							case vscode.DiagnosticSeverity.Warning:
								if (warnings >= MAXSZIE << 1) return 0
								warnings++
								break
							default:
								if (others >= MAXSZIE << 2) return 0
								others++
								break
						}
						target.push(item)
						return 1
					}
				default:
					return Reflect.get(target, prop, ...rest)
			}
		},
		set(target, prop, value, ...rest) {
			switch (prop) {
				default:
					return Reflect.set(target, prop, value, ...rest)
			}
		},
	}) as IDiagnostic[]
}

export function validate(
	tokens: ExtractedToken[],
	document: TextDocument,
	state: TailwindLoader,
	options: ServiceOptions,
) {
	const diagnostics = createDiagnosticArray()
	const start = Now()
	const answer = doValidate()
	const end = Now()
	console.trace(`diagnostic (${Number(end - start)}ms)`)
	return answer

	function doValidate() {
		try {
			for (const token of tokens) {
				const { kind, start, value } = token
				if (kind === "theme") {
					if (
						!validateTwTheme({
							document,
							text: value,
							offset: start,
							kind,
							diagnosticOptions: options.diagnostics,
							state,
							diagnostics,
						})
					) {
						return diagnostics
					}
				} else if (kind === "globalStyles") {
					// ...
				} else if (
					!validateTw({
						document,
						text: value,
						offset: start,
						kind,
						diagnosticOptions: options.diagnostics,
						state,
						diagnostics,
					})
				) {
					return diagnostics
				}
			}
			return diagnostics
		} catch (error) {
			console.error(error)
			console.error("do validation failed.")
		}

		return diagnostics
	}
}

function walk(
	program: parser.Program,
	check: (node: parser.Leaf, variants: parser.Variant[], important: boolean, variantGroup: boolean) => boolean | void,
	notClose: (
		node:
			| parser.Group
			| parser.ArbitraryClassname
			| parser.ArbitraryProperty
			| parser.Modifier
			| parser.UnknownClassname,
	) => boolean | void,
) {
	for (const expr of program.expressions) {
		if (walkExpr(expr, check, notClose, [], false, false) === false) {
			break
		}
	}

	return

	function walkExpr(
		expr: parser.Expression,
		check: (
			node: parser.Leaf,
			variants: parser.Variant[],
			important: boolean,
			variantGroup: boolean,
		) => boolean | void,
		notClose: (
			node:
				| parser.Group
				| parser.ArbitraryClassname
				| parser.ArbitraryProperty
				| parser.Modifier
				| parser.UnknownClassname,
		) => boolean | void,
		variants: parser.Variant[],
		important: boolean,
		variantGroup: boolean,
	): boolean | void {
		if (expr.type === parser.NodeType.Group) {
			if (!expr.closed) {
				if (!notClose(expr) === false) {
					return false
				}
			}
			important ||= expr.important
			for (const e of expr.expressions) {
				if (walkExpr(e, check, notClose, variants, important, variantGroup) === false) {
					return false
				}
			}
			return
		}

		if (expr.type === parser.NodeType.VariantSpan) {
			const { variant, child } = expr
			switch (variant.type) {
				case parser.NodeType.GroupVariant:
					for (const e of variant.expressions) {
						if (walkExpr(e, check, notClose, variants, important, true) === false) {
							return false
						}
					}
					break
				default:
					if (check(variant, variants, important, variantGroup) === false) {
						return false
					}
					break
			}
			if (child) {
				return walkExpr(child, check, notClose, [...variants, variant], important, variantGroup)
			}
			return
		}

		important ||= expr.important
		if (expr.type !== parser.NodeType.Classname) {
			if (expr.type === parser.NodeType.ArbitraryClassname) {
				if (!expr.closed) {
					if (!notClose(expr) === false) {
						return false
					}
				}
				if (expr.m) {
					if (expr.m.wrapped && !expr.m.closed) {
						if (!notClose(expr.m) === false) {
							return false
						}
					}
				}
			} else {
				if (!expr.closed) {
					if (!notClose(expr) === false) {
						return false
					}
				}
			}
		} else if (expr.m) {
			if (expr.m.wrapped && !expr.m.closed) {
				if (!notClose(expr.m) === false) {
					return false
				}
			}
		}

		return check(expr, variants, important, variantGroup)
	}
}

function isUtility(leaf: parser.Leaf): leaf is parser.Utility {
	switch (leaf.type) {
		case parser.NodeType.SimpleVariant:
		case parser.NodeType.ArbitraryVariant:
		case parser.NodeType.ArbitrarySelector:
			return false
	}
	return true
}

function validateTw({
	document,
	text,
	offset,
	kind,
	state,
	diagnosticOptions,
	diagnostics,
}: {
	document: TextDocument
	text: string
	offset: number
	kind: ExtractedTokenKind
	state: TailwindLoader
	diagnosticOptions: ServiceOptions["diagnostics"]
	diagnostics: IDiagnostic[]
}): boolean {
	const rangeMappings: Record<string, parser.Range[]> = {}

	function addRange(key: string, value: parser.Range) {
		const target = rangeMappings[key]
		if (target instanceof Array) {
			target.push(value)
		} else {
			rangeMappings[key] = [value]
		}
	}

	const program = state.tw.context.parser.createProgram(text)

	walk(
		program,
		(node, variants, important, variantGroup) => {
			if (isUtility(node)) {
				if (kind === "wrap" || variantGroup) {
					const range = new vscode.Range(
						document.positionAt(offset + node.start),
						document.positionAt(offset + node.end),
					)
					if (
						!diagnostics.push({
							source: DIAGNOSTICS_ID,
							message: "Unknown token",
							range,
							severity: vscode.DiagnosticSeverity.Error,
						})
					)
						return false
					return
				}

				switch (node.type) {
					case parser.NodeType.Classname: {
						const result = checkTwClassName(node, document, text, offset, state)
						for (const r of result) {
							if (!diagnostics.push(r)) return false
						}
						break
					}
					case parser.NodeType.ArbitraryClassname: {
						const result = checkArbitraryClassname(node, document, text, offset, state)
						for (const r of result) {
							if (!diagnostics.push(r)) return false
						}
						break
					}
					case parser.NodeType.ArbitraryProperty: {
						const result = checkArbitraryProperty(node, document, offset)
						for (const r of result) {
							if (!diagnostics.push(r)) return false
						}
						break
					}
					case parser.NodeType.UnknownClassname: {
						const result = rejectUnknownClassname(node, document, offset)
						for (const r of result) {
							if (!diagnostics.push(r)) return false
						}
						break
					}
				}

				// Check duplicate items
				const hash = state.tw.renderVariantScope(...variants)
				if (node.type === parser.NodeType.ArbitraryProperty) {
					const value = node.decl.text
					const i = value.indexOf(":")
					if (i < 0) {
						return
					}
					const prop = value.slice(0, i).trim()
					if (isLooseProperty(prop)) {
						const key = [hash, prop].join(".")
						addRange(key, [node.start, node.end])
						return
					}
					const key = [undefined, hash, prop].join(".")
					addRange(key, [node.start, node.end])
				} else {
					const classname = node.text
					const { decls, scope } = state.tw.renderDecls(classname)
					if (decls.size === 0) {
						return
					}
					if (isLoose(state, classname, decls)) {
						const key = [hash, scope, Array.from(decls.keys()).sort().join(":")].join(".")
						addRange(key, [node.start, node.end])
					} else {
						for (const [prop] of decls) {
							const key = [undefined, hash, scope, prop].join(".")
							addRange(key, [node.start, node.end])
						}
					}
				}
			} else {
				const result = checkVariants(node, document, offset, state)
				if (result) {
					if (!diagnostics.push(result)) return false
				}
			}
		},
		node => {
			const { start } = node
			let end = node.end
			if (node.type === parser.NodeType.ArbitraryClassname) {
				end = node.key.end + 1
			}
			return !!diagnostics.push({
				source: DIAGNOSTICS_ID,
				message: "Brackets are not balanced.",
				range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
				severity: vscode.DiagnosticSeverity.Error,
			})
		},
	)

	for (const payload in rangeMappings) {
		const items = rangeMappings[payload]
		if (items.length > 1) {
			const parts = payload.split(".")
			const prop = parts[parts.length - 1]
			for (const [a, b] of items) {
				const message = `${text.slice(a, b)} is duplicated on these properties: ${prop.split(":").join(", ")}`
				if (
					!diagnostics.push({
						source: DIAGNOSTICS_ID,
						message,
						range: new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b)),
						severity: vscode.DiagnosticSeverity.Warning,
					})
				) {
					return false
				}
			}
		}
	}

	return true
}

function checkVariants(
	node: Exclude<parser.Variant, parser.GroupVariant>,
	document: TextDocument,
	offset: number,
	state: TailwindLoader,
) {
	if (
		node.type === parser.NodeType.ArbitrarySelector ||
		node.type === parser.NodeType.ArbitraryVariant ||
		node.type === parser.NodeType.UnknownVariant
	) {
		return
	}

	const { start, end, key } = node
	const variant = key.text
	if (state.tw.isSimpleVariant(variant)) {
		return
	}
	if (state.tw.context.isVariant(node.text)) {
		return
	}
	const ret = state.variants.search(variant)
	const ans = ret?.[0]?.item
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	const diagnostic: IDiagnostic = {
		message: "",
		source: DIAGNOSTICS_ID,
		range,
		severity: vscode.DiagnosticSeverity.Error,
	}

	if (ans) {
		const action = new vscode.CodeAction(`Replace '${variant}' with '${ans}'`, vscode.CodeActionKind.QuickFix)
		action.edit = new vscode.WorkspaceEdit()
		action.edit.replace(document.uri, range, ans)
		diagnostic.message = `'${variant}' is an unknown variant, did you mean '${ans}'?`
		diagnostic.codeActions = [action]
	} else {
		diagnostic.message = `'${variant}' is an unknown variant.`
	}

	return diagnostic
}

function checkArbitraryClassname(
	item: parser.ArbitraryClassname,
	document: TextDocument,
	text: string,
	offset: number,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []

	const prefix = item.key.text
	// if (item.expr == undefined) {
	// 	const [start, end] = item.prefix.range
	// 	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end - 1))
	// 	const ret = guess(state, prefix)
	// 	if (ret.score === 0) {
	// 		if (item.e) {
	// 			const classname = item.getText()
	// 			const cssText = state.tw.renderClassname({ classname })
	// 			if (!cssText) {
	// 				const [start, end] = item.range
	// 				const range = new vscode.Range(
	// 					document.positionAt(offset + start),
	// 					document.positionAt(offset + end),
	// 				)
	// 				result.push({
	// 					source: DIAGNOSTICS_ID,
	// 					message: `'${classname}' is an unknown value.`,
	// 					range,
	// 					severity: vscode.DiagnosticSeverity.Error,
	// 				})
	// 			}
	// 		}
	// 		return result
	// 	}
	// 	if (ret.value) {
	// 		const action = new vscode.CodeAction(
	// 			`Replace '${prefix}' with '${ret.value}'`,
	// 			vscode.CodeActionKind.QuickFix,
	// 		)
	// 		action.edit = new vscode.WorkspaceEdit()
	// 		action.edit.replace(document.uri, range, ret.value)
	// 		result.push({
	// 			source: DIAGNOSTICS_ID,
	// 			message: `'${prefix}' is an unknown value, did you mean '${ret.value}'?`,
	// 			range,
	// 			codeActions: [action],
	// 			severity: vscode.DiagnosticSeverity.Error,
	// 		})
	// 	} else {
	// 		result.push({
	// 			source: DIAGNOSTICS_ID,
	// 			message: `'${prefix}' is an unknown value.`,
	// 			range,
	// 			severity: vscode.DiagnosticSeverity.Error,
	// 		})
	// 	}
	// 	return result
	// }

	if (!state.tw.arbitrary[prefix]) {
		const { start } = item
		const end = start + prefix.length
		const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${prefix}' is an unknown value.`,
			range,
			severity: vscode.DiagnosticSeverity.Error,
		})
	} else {
		const classname = item.text
		const cssText = state.tw.renderClassname({ classname })
		if (!cssText) {
			let { start, end } = item.value
			while (start < end && parser.isCharSpace(text.charCodeAt(start))) start++
			while (start < end && parser.isCharSpace(text.charCodeAt(end - 1))) end--
			if (start === end) {
				start = item.value.start
				end = item.value.end
			}
			const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
			result.push({
				source: DIAGNOSTICS_ID,
				message: "Fail to resolve the value.",
				range,
				severity: vscode.DiagnosticSeverity.Error,
			})
		}
	}

	return result
}

function checkArbitraryProperty(item: parser.ArbitraryProperty, document: TextDocument, offset: number) {
	const result: IDiagnostic[] = []
	let prop = item.decl.text.trim()
	if (!prop) {
		return result
	}

	const value = item.decl.text
	const i = value.indexOf(":")
	if (i >= 0) prop = value.slice(0, i).trim()
	const start = item.decl.start + value.search(/[\w-]/)
	const end = start + prop.length
	if (prop.startsWith("-")) return result
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	const ret = csspropSearcher.search(prop)
	const score = ret?.[0]?.score
	if (score == undefined) {
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${prop}' is an unknown value.`,
			range,
			severity: vscode.DiagnosticSeverity.Error,
		})
	} else if (score > 0) {
		const action = new vscode.CodeAction(`Replace '${prop}' with '${ret[0].item}'`, vscode.CodeActionKind.QuickFix)
		action.edit = new vscode.WorkspaceEdit()
		action.edit.replace(document.uri, range, ret[0].item)
		result.push({
			source: DIAGNOSTICS_ID,
			message: `'${prop}' is an unknown value, did you mean '${ret[0].item}'?`,
			range,
			codeActions: [action],
			severity: vscode.DiagnosticSeverity.Error,
		})
	}
	return result
}

function rejectUnknownClassname(item: parser.UnknownClassname, document: TextDocument, offset: number) {
	const result: IDiagnostic[] = []
	const { start, end } = item
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	result.push({
		source: DIAGNOSTICS_ID,
		message: "Unknown",
		range,
		severity: vscode.DiagnosticSeverity.Error,
	})
	return result
}

function checkTwClassName(
	item: parser.Classname,
	document: TextDocument,
	text: string,
	offset: number,
	state: TailwindLoader,
) {
	const result: IDiagnostic[] = []

	const { start, end } = item
	const value = text.slice(start, end)
	const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
	if (state.tw.renderDecls(value).decls.size === 0) {
		const ret = guess(state, value)
		if (ret.score === 0) {
			switch (ret.kind) {
				case PredictionKind.CssProperty:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Invalid token '${value}', missing square brackets?`,
						range,
						severity: vscode.DiagnosticSeverity.Error,
					})
					break
				case PredictionKind.Variant:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `Invalid token '${value}', missing separator?`,
						range,
						severity: vscode.DiagnosticSeverity.Error,
					})
					break
				default:
					result.push({
						source: DIAGNOSTICS_ID,
						message: `'${value}' is an unknown value.`,
						range,
						severity: vscode.DiagnosticSeverity.Error,
					})
			}
		} else if (ret.value) {
			const action = new vscode.CodeAction(
				`Replace '${value}' with '${ret.value}'`,
				vscode.CodeActionKind.QuickFix,
			)
			action.edit = new vscode.WorkspaceEdit()
			action.edit.replace(document.uri, range, ret.value)
			result.push({
				source: DIAGNOSTICS_ID,
				message: `'${value}' is an unknown value, did you mean '${ret.value}'?`,
				range,
				codeActions: [action],
				severity: vscode.DiagnosticSeverity.Error,
			})
		} else {
			result.push({
				source: DIAGNOSTICS_ID,
				message: `'${value}' is an unknown value.`,
				range,
				severity: vscode.DiagnosticSeverity.Error,
			})
		}
	}

	return result
}

enum PredictionKind {
	Unknown,
	Classname,
	CssProperty,
	Variant,
}

function guess(state: TailwindLoader, text: string): { kind: PredictionKind; value: string; score: number } {
	const a = state.classnames.search(text)
	const b = state.variants.search(text)
	const c = csspropSearcher.search(text)
	let kind = PredictionKind.Unknown
	let value = ""
	let score = +Infinity

	if (a?.[0]?.score != undefined && a[0].score < score) {
		kind = PredictionKind.Classname
		value = a[0].item
		score = a[0].score
	}

	if (b?.[0]?.score != undefined && b[0].score < score) {
		kind = PredictionKind.Variant
		value = b[0].item
		score = b[0].score
	}

	if (c?.[0]?.score != undefined && c[0].score < score) {
		kind = PredictionKind.CssProperty
		value = c[0].item
		score = c[0].score
	}

	return {
		kind,
		value,
		score,
	}
}

function isLoose(state: TailwindLoader, label: string, decls: Map<string, string[]>) {
	const pluginName = state.tw.context.getUtilityPluginName(label)
	if (!pluginName) return true
	switch (pluginName) {
		case "lineHeight":
		case "transitionDuration":
		case "transitionDelay":
		case "transitionTimingFunction":
			return true
	}

	for (const k of decls.keys()) {
		if (isLooseProperty(k)) return true
	}
	return false
}

function isLooseProperty(prop: string) {
	if (/\b(?:top|right|bottom|left)\b/.test(prop)) return true
	if (prop.startsWith("--")) return true
	return false
}

function validateTwTheme({
	document,
	text,
	offset,
	kind,
	state,
	diagnosticOptions,
	diagnostics,
}: {
	document: TextDocument
	text: string
	offset: number
	kind: ExtractedTokenKind
	state: TailwindLoader
	diagnosticOptions: ServiceOptions["diagnostics"]
	diagnostics: IDiagnostic[]
}): boolean {
	let diagnostic: IDiagnostic | undefined
	const { path, start, end } = parser.parse_theme_val(text)
	for (const { closed, start } of path) {
		if (!closed) {
			diagnostic = {
				range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + start)),
				source: DIAGNOSTICS_ID,
				message: "Syntax Error",
				severity: vscode.DiagnosticSeverity.Error,
			}
			break
		}
	}
	if (!diagnostic) {
		const [value] = parser.theme(state.config, path)
		if (value === undefined) {
			diagnostic = {
				range: new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end)),
				source: DIAGNOSTICS_ID,
				message: "value is undefined",
				severity: vscode.DiagnosticSeverity.Error,
			}
		}
	}
	if (diagnostic) {
		return diagnostics.push(diagnostic) > 0
	}
	return true
}
