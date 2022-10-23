import * as culori from "culori"
import * as parser from "twobj/parser"
import vscode from "vscode"
import { getCSSLanguageService, getSCSSLanguageService } from "vscode-css-languageservice"
import { TextDocument as LspTextDocument } from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver-types"
import { calcFraction } from "~/common"
import type { ExtractedToken, ExtractedTokenKind, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import type { ServiceOptions } from "~/shared"
import type { ICompletionItem } from "~/typings/completion"
import { Now } from "../common/time"
import type { TailwindLoader } from "./tailwind"

function inComment(source: string, position: number, [start = 0, end = source.length] = []): boolean {
	const regexp = /(")|(')|(-\[)|(\/\/[^\r\n]*(?:[^\r\n]|$))|((?:\/\*).*?(?:\*\/|$))/gs
	let match: RegExpExecArray | null
	regexp.lastIndex = start
	source = source.slice(0, end)
	let strings: 1 | 2 | undefined

	while ((match = regexp.exec(source))) {
		const [, doubleQuote, singleQuote, bracket, lineComment, blockComment] = match
		if (doubleQuote) {
			if (!strings) {
				strings = 1
			} else {
				strings = undefined
			}
		} else if (singleQuote) {
			if (!strings) {
				strings = 2
			} else {
				strings = undefined
			}
		} else if (bracket) {
			const rb = parser.findRightBracket({
				text: source,
				start: regexp.lastIndex - 1,
				end,
				brackets: [91, 93],
				comments: false,
			})
			regexp.lastIndex = rb ? rb + 1 : end
		} else if (!strings && (lineComment || blockComment)) {
			if (position >= match.index && position <= regexp.lastIndex) {
				return true
			}
		}
	}
	return false
}

function walk(
	program: parser.Program,
	check: (node: parser.Leaf) => boolean | void,
	variantGroup: (node: parser.GroupVariant) => void,
) {
	for (const expr of program.expressions) {
		if (walkExpr(expr, check, variantGroup) === false) {
			break
		}
	}

	return

	function walkExpr(
		expr: parser.Expression,
		check: (node: parser.Leaf) => boolean | void,
		variantGroup: (node: parser.GroupVariant) => void,
	): boolean | void {
		if (expr.type === parser.NodeType.Group) {
			for (const e of expr.expressions) {
				if (walkExpr(e, check, variantGroup) === false) {
					return false
				}
			}
			return
		}

		if (expr.type === parser.NodeType.VariantSpan) {
			const { variant, child } = expr
			switch (variant.type) {
				case parser.NodeType.GroupVariant:
					variantGroup(variant)
					for (const e of variant.expressions) {
						if (walkExpr(e, check, variantGroup) === false) {
							return false
						}
					}
					break
				default:
					if (check(variant) === false) {
						return false
					}
					break
			}
			if (child) {
				return walkExpr(child, check, variantGroup)
			}
			return
		}

		return check(expr)
	}
}

function completeProgram(program: parser.Program, position: number) {
	const inRange = (node: parser.Node) => position >= node.start && position <= node.end
	let _node: parser.Leaf | undefined
	let _variantGroup = false
	walk(
		program,
		node => {
			if (inRange(node)) {
				_node = node
				return false
			}
		},
		node => {
			if (inRange(node)) {
				_variantGroup = true
			}
		},
	)
	return [_node, _variantGroup] as [parser.Leaf | undefined, boolean]
}

export default function completion(
	result: ExtractedToken | undefined,
	document: TextDocument,
	position: vscode.Position,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> | undefined {
	if (!result) return undefined

	const start = Now()
	const list = doComplete(result)
	const end = Now()
	console.trace(`completion (${Number(end - start)}ms)`)
	return list

	function doComplete(result: ExtractedToken) {
		try {
			const index = document.offsetAt(position)
			const { kind, ...token } = result
			const text = token.value
			const offset = token.start
			const pos = index - token.start
			if (kind === "theme") {
				const list = themeCompletion(document, offset, text, pos, state)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			} else {
				const list = twCompletion(document, offset, text, pos, kind, state, options)
				for (let i = 0; i < list.items.length; i++) {
					list.items[i].data.uri = document.uri
				}
				return list
			}
		} catch (error) {
			console.error(error)
			console.error("build completion list failed.")
		}
		return undefined
	}
}

interface CompletionFeature {
	(
		document: TextDocument,
		kind: ExtractedTokenKind,
		offset: number,
		text: string,
		position: number,
		target: parser.Leaf | undefined,
		variantGroup: boolean,
		state: TailwindLoader,
		options: ServiceOptions,
	): ICompletionItem[] | null | undefined
}

function appendSpace() {
	return (item: ICompletionItem) => {
		if (item.insertText) {
			if (typeof item.insertText !== "string") {
				item.insertText = new vscode.SnippetString(item.insertText.value + " ")
			} else {
				item.insertText = item.insertText + " "
			}
		} else {
			item.insertText = item.label + " "
		}
	}
}

function prependSpace() {
	return (item: ICompletionItem) => {
		if (item.insertText) {
			if (typeof item.insertText !== "string") {
				item.insertText = new vscode.SnippetString(" " + item.insertText.value)
			} else {
				item.insertText = " " + item.insertText
			}
		} else {
			item.insertText = " " + item.label
		}
	}
}

function replace(range: vscode.Range) {
	return (item: ICompletionItem) => {
		item.range = range
	}
}

function twCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	kind: ExtractedTokenKind,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> {
	if (inComment(text, position)) {
		return new vscode.CompletionList<ICompletionItem>(undefined)
	}
	const [target, variantGroup] = completeProgram(state.tw.context.parser.createProgram(text), position)
	let items: ICompletionItem[] = []
	applyFeatures(variantCompletion, classnameCompletion, arbitraryPropertyCompletion, arbitraryVariantValueCompletion)
	return new vscode.CompletionList<ICompletionItem>(items)
	function applyFeatures(...features: CompletionFeature[]) {
		for (const fn of features) {
			const ret = fn(document, kind, offset, text, position, target, variantGroup, state, options)
			if (ret == undefined) continue
			items = items.concat(ret)
		}
	}
}

const classnameCompletion: CompletionFeature = (
	document,
	kind,
	offset,
	text,
	position,
	target,
	variantGroup,
	state,
) => {
	if (kind === "wrap") return
	if (variantGroup) return

	if (!target) return state.provideClassCompletionList()

	const { start, end } = target
	switch (target.type) {
		case parser.NodeType.ArbitrarySelector:
		case parser.NodeType.SimpleVariant:
		case parser.NodeType.ArbitraryVariant:
		case parser.NodeType.UnknownVariant: {
			if (position > start && position < end) return
			break
		}
		case parser.NodeType.ArbitraryProperty: {
			if (position > start && position <= end) return
			break
		}
		case parser.NodeType.ArbitraryClassname: {
			if (position === end) return
			const pb = target.key.end
			if (position > pb + 1) return
			break
		}
		case parser.NodeType.UnknownClassname: {
			if (position === end) return
			const pb = target.key.end
			if (position > pb) return
			break
		}
	}

	const items = state.provideClassCompletionList()

	const endChar = text.slice(end, end + 1)
	const insertSpace = text.slice(start, end) !== "!" && endChar !== "" && endChar.match(/[\s)]/) == null
	const transfrom = (callback: (item: ICompletionItem) => void) => {
		for (const item of items) callback(item)
	}

	switch (target.type) {
		case parser.NodeType.ArbitrarySelector:
		case parser.NodeType.SimpleVariant:
		case parser.NodeType.ArbitraryVariant:
		case parser.NodeType.UnknownVariant: {
			if (insertSpace) transfrom(appendSpace())
			return items
		}
		case parser.NodeType.ArbitraryClassname:
		case parser.NodeType.UnknownClassname: {
			if (position === start) {
				if (insertSpace) transfrom(appendSpace())
				return items
			}
			transfrom(replace(new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))))
			return items
		}
		case parser.NodeType.ArbitraryProperty: {
			transfrom(appendSpace())
			return items
		}
	}

	if (insertSpace || position === start) {
		transfrom(appendSpace())
	} else if (position === end) {
		transfrom(replace(new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))))
	} else {
		// NOTE: for `bg-black/50`, `bg-black/[0.5]`
		let shrinkB = end
		const value = target.text
		if (target.type === parser.NodeType.Classname) {
			const pluginName = state.tw.context.getUtilityPluginName(value)
			if (pluginName && /Color|fill|stroke/.test(pluginName)) {
				const slash = value.lastIndexOf("/")
				if (slash !== -1) shrinkB += slash - value.length
			}
		}

		transfrom(item => {
			const _end = item.kind === vscode.CompletionItemKind.Color && item.documentation ? shrinkB : end
			item.range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + _end))
		})
	}
	return items
}

const variantCompletion: CompletionFeature = (
	document,
	kind,
	offset,
	text,
	position,
	target,
	variantGroup,
	state,
	{ preferVariantWithParentheses },
) => {
	if (target) {
		const { start, end } = target
		switch (target.type) {
			case parser.NodeType.ArbitrarySelector: {
				if (position !== start && position !== end) return
				break
			}
			case parser.NodeType.ArbitraryVariant:
			case parser.NodeType.UnknownVariant: {
				const pb = target.key.end
				if (position >= pb && position < end) return
				break
			}
			case parser.NodeType.ArbitraryClassname:
			case parser.NodeType.ArbitraryProperty: {
				if (position !== start) return
				break
			}
			case parser.NodeType.Classname: {
				if (position !== start && position !== end) return
				if (text.charCodeAt(end - 1) === 47) return
				break
			}
		}
	}

	let items: ICompletionItem[] = []
	const [screens, darkmode, placeholder, restVariants] = state.tw.variants
	items = items
		.concat(
			screens.map((value, index) => ({
				label: value + state.separator,
				sortText: index.toString().padStart(5, " "),
				kind: vscode.CompletionItemKind.Module,
				data: { type: "screen" },
				command: {
					title: "Suggest",
					command: "editor.action.triggerSuggest",
				},
			})),
		)
		.concat(
			darkmode.map(value => ({
				label: value + state.separator,
				sortText: "*" + value,
				kind: vscode.CompletionItemKind.Color,
				data: { type: "variant" },
				command: {
					title: "Suggest",
					command: "editor.action.triggerSuggest",
				},
			})),
		)
		.concat(
			placeholder.map(value => ({
				label: value + state.separator,
				sortText: "*" + value,
				kind: vscode.CompletionItemKind.Method,
				data: { type: "variant" },
				command: {
					title: "Suggest",
					command: "editor.action.triggerSuggest",
				},
			})),
		)
		.concat(
			restVariants.map(value => ({
				label: value + state.separator,
				sortText: "~~~" + value,
				kind: vscode.CompletionItemKind.Method,
				data: { type: "variant" },
				command: {
					title: "Suggest",
					command: "editor.action.triggerSuggest",
				},
			})),
		)

	if (!target) return items

	const { start, end } = target
	const nextCharacter = text.charCodeAt(position)
	const transfrom = (callback: (item: ICompletionItem) => void) => {
		for (const item of items) callback(item)
	}

	const next = text.slice(end, end + 1)
	const insertSpace = next != "" && next.match(/[\s)]/) == null

	if (preferVariantWithParentheses) {
		if (nextCharacter !== 40) {
			transfrom(item => {
				item.insertText = new vscode.SnippetString(item.label + "($0)" + (insertSpace ? " " : ""))
			})
		}
	}

	if (target.type === parser.NodeType.SimpleVariant || target.type === parser.NodeType.ArbitraryVariant) {
		if (position > start && position < end) {
			transfrom(replace(new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))))
		}
	} else if (target.type === parser.NodeType.Classname) {
		transfrom(replace(new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))))
	}

	return items
}

function isTextEdit(te: lsp.TextEdit | lsp.InsertReplaceEdit | undefined): te is lsp.TextEdit {
	if (te === undefined) return false
	return (te as lsp.TextEdit).range !== undefined
}

const cssLanguageSrv = getCSSLanguageService()
function getCssDeclarationCompletionList(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	exprRange: [start: number, end: number],
	css: string | [prop: string, value: string],
	state: TailwindLoader,
): ICompletionItem[] {
	for (const t of parser.parse_theme(text, exprRange)) {
		if (position >= t.value.start && position <= t.value.end) {
			return themeCompletion(document, offset, text, position, state, [t.value.start, t.value.end]).items
		}
	}

	const code = Array.isArray(css) ? `.generated {${css[0]}: ${css[1]}}` : `.generated {${css}}`
	let delta = 12
	if (Array.isArray(css)) {
		delta = delta + css[0].length + 2
	}
	const doc = LspTextDocument.create("generated", "css", 0, code)
	const sheet = cssLanguageSrv.parseStylesheet(doc)
	const list = cssLanguageSrv.doComplete(doc, doc.positionAt(delta + position - exprRange[0]), sheet)
	const bias = offset + exprRange[0]
	const items = list.items.map<ICompletionItem>(item => {
		const c: ICompletionItem = {
			data: { type: "css" },
			label: item.label,
			sortText: item.sortText,
			detail: item.detail,
			command: item.command,
			tags: item.tags,
			commitCharacters: item.commitCharacters,
			preselect: item.preselect,
		}
		if (isTextEdit(item.textEdit)) {
			const start = doc.offsetAt(item.textEdit.range.start) - delta
			const end = doc.offsetAt(item.textEdit.range.end) - delta
			const range = new vscode.Range(document.positionAt(bias + start), document.positionAt(bias + end))
			c.insertText = item.textEdit.newText
			if (c.insertText.endsWith(";")) {
				c.insertText = c.insertText.slice(0, -1)
			}
			c.range = range
			if (item.insertTextFormat === lsp.InsertTextFormat.Snippet) {
				c.insertText = new vscode.SnippetString(c.insertText)
			}
			item.textEdit = undefined
		}
		if (item.kind) {
			c.kind = item.kind - 1
		}
		if (item.documentation) {
			if (typeof item.documentation !== "string") {
				c.documentation = new vscode.MarkdownString(item.documentation.value)
			} else {
				c.documentation = item.documentation
			}
		}
		return c
	})

	if (code.indexOf(":") > 0) {
		if (items.length > 0) {
			items.push({
				data: { type: "css" },
				label: "theme()",
				documentation: "Evaluates the value from tailwind theme configuration.",
				insertText: new vscode.SnippetString("theme($1)"),
				command: { title: "Suggest", command: "editor.action.triggerSuggest" },
				range: items[0].range,
				kind: vscode.CompletionItemKind.Function,
			})
		}
	}
	return items
}

const scssLanguageSrv = getSCSSLanguageService()
function getScssSelectorCompletionList(
	document: TextDocument,
	position: number,
	offset: number,
	start: number,
	code: string,
): ICompletionItem[] {
	const doc = LspTextDocument.create("generated", "css", 0, code)
	const sheet = scssLanguageSrv.parseStylesheet(doc)
	const list = scssLanguageSrv.doComplete(doc, doc.positionAt(position - start), sheet)
	offset += start
	return list.items.map<ICompletionItem>(item => {
		const c: ICompletionItem = {
			data: { type: "css" },
			label: item.label,
			sortText: item.sortText,
			detail: item.detail,
			command: item.command,
			tags: item.tags,
			commitCharacters: item.commitCharacters,
			preselect: item.preselect,
		}
		if (isTextEdit(item.textEdit)) {
			const start = doc.offsetAt(item.textEdit.range.start)
			const end = doc.offsetAt(item.textEdit.range.end)
			const range = new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))
			c.insertText = item.textEdit.newText
			if (c.insertText.endsWith(";")) {
				c.insertText = c.insertText.slice(0, -1)
			}
			c.range = range
			if (item.insertTextFormat === lsp.InsertTextFormat.Snippet) {
				c.insertText = new vscode.SnippetString(c.insertText)
			}
			item.textEdit = undefined
		}
		if (item.kind) {
			c.kind = item.kind - 1
		}
		if (item.documentation) {
			if (typeof item.documentation !== "string") {
				c.documentation = new vscode.MarkdownString(item.documentation.value)
			} else {
				c.documentation = item.documentation
			}
		}
		return c
	})
}

const arbitraryVariantValueCompletion: CompletionFeature = (document, kind, offset, text, position, target) => {
	if (!target) return
	if (target.type !== parser.NodeType.ArbitrarySelector) return
	const { start, end } = target.selector
	const value = target.selector.text
	if (position < start || position > end) return
	return getScssSelectorCompletionList(document, position, offset, start, value)
}

const arbitraryPropertyCompletion: CompletionFeature = (
	document,
	kind,
	offset,
	text,
	position,
	target,
	variantGroup,
	state,
) => {
	if (kind === "wrap") return
	if (variantGroup) return

	if (target) {
		const { start, end } = target
		switch (target.type) {
			case parser.NodeType.ArbitrarySelector:
			case parser.NodeType.ArbitraryVariant:
			case parser.NodeType.UnknownVariant:
			case parser.NodeType.SimpleVariant: {
				if (position > start && position < end) return
				break
			}
			case parser.NodeType.ArbitraryProperty: {
				if (position === end) return
				break
			}

			case parser.NodeType.ArbitraryClassname:
			case parser.NodeType.UnknownClassname: {
				if (position === end) return
				if (position === start) break
				const { start: pa, end: pb } = target.value
				if (position < pa || position > pb) return
				const cssValueItems = new Map<string, ICompletionItem>()
				let prefix = target.key.text
				if (prefix.startsWith(state.tw.prefix)) prefix = prefix.slice(state.tw.prefix.length)
				const propAndTypes = state.tw.arbitrary[prefix]
				if (!propAndTypes) return

				Object.entries(propAndTypes).forEach(([valueType, props]) => {
					props.forEach(prop => {
						getCssDeclarationCompletionList(
							document,
							offset,
							text,
							position,
							[target.value.start, target.value.end],
							[prop, target.value.text],
							state,
						).forEach(item => {
							cssValueItems.set(item.label, item)
						})
					})
				})
				return Array.from(cssValueItems.values())
			}
		}

		if (target.type === parser.NodeType.ArbitraryProperty) {
			const { start, end } = target
			if (position > start && position < end) {
				return getCssDeclarationCompletionList(
					document,
					offset,
					text,
					position,
					[target.start + 1, target.end - 1],
					target.decl.text,
					state,
				)
			}
		}
	}

	const items = state.provideCssPropsCompletionList()

	if (!target) return items

	const { start, end } = target
	const endChar = text.slice(end, end + 1)
	const insertSpace = text.slice(start, end) !== "!" && endChar !== "" && endChar.match(/[\s)]/) == null
	const transfrom = (callback: (item: ICompletionItem) => void) => {
		for (const item of items) callback(item)
	}

	const oldValue = target.type === parser.NodeType.UnknownClassname ? target.value.text : ""
	transfrom(item => (item.insertText = new vscode.SnippetString(`[${item.label}: ${oldValue}$0]`)))

	switch (target.type) {
		case parser.NodeType.ArbitrarySelector:
		case parser.NodeType.ArbitraryVariant:
		case parser.NodeType.UnknownVariant:
		case parser.NodeType.SimpleVariant: {
			if (position === start) transfrom(prependSpace())
			if (insertSpace) transfrom(appendSpace())
			return items
		}
		case parser.NodeType.ArbitraryProperty:
		case parser.NodeType.ArbitraryClassname:
		case parser.NodeType.UnknownClassname: {
			transfrom(appendSpace())
			return items
		}
	}
	if (position > start && position <= end) {
		transfrom(replace(new vscode.Range(document.positionAt(offset + start), document.positionAt(offset + end))))
	} else if (position === start) {
		transfrom(appendSpace())
	}
	return items
}

function themeCompletion(
	document: TextDocument,
	offset: number,
	text: string,
	position: number,
	state: TailwindLoader,
	[start, end]: [start: number, end: number] = [0, text.length],
): vscode.CompletionList<ICompletionItem> {
	const node = parser.parseThemeValue(state.config, text, [start, end])

	const i = node.path.findIndex(p => position >= p.start && position <= p.end)
	if (i === -1 && node.path.length !== 0) {
		return { items: [] }
	}

	const keys = node.path.slice(0, i)
	const obj = parser.resolve(state.config.theme, keys)
	if (!obj || typeof obj !== "object") {
		return { items: [] }
	}

	const hit = node.path[i]
	const candidates = Object.keys(obj)
	const isScreen = node.path[0] && node.path[0].value === "screen"

	const items = candidates.map<ICompletionItem>(label => {
		const valueString = parser.renderThemePath(state.config, [...keys, label])
		const value = parser.resolve(state.config.theme, [...keys, label])
		const item: ICompletionItem = {
			label,
			sortText: isScreen ? state.tw.screens.indexOf(label).toString().padStart(5, " ") : formatCandidates(label),
			data: { type: "theme" },
		}

		if (typeof value === "object") {
			item.kind = vscode.CompletionItemKind.Module
			item.documentation = new vscode.MarkdownString(`\`\`\`text\n${valueString}\n\`\`\``)
			item.detail = label
		} else if (typeof value === "function") {
			item.kind = vscode.CompletionItemKind.Function
			item.documentation = new vscode.MarkdownString(`\`\`\`text\n${valueString}\n\`\`\``)
			item.detail = label
		} else {
			if (typeof value === "string") {
				if (value === "transparent") {
					item.kind = vscode.CompletionItemKind.Color
					item.documentation = "rgba(0, 0, 0, 0.0)"
					return item
				}

				const color = culori.parse(valueString)
				if (color && valueString.match(/^\d/) == null) {
					item.kind = vscode.CompletionItemKind.Color
					item.documentation = culori.formatHex(color)
				} else {
					item.kind = vscode.CompletionItemKind.Constant
					item.documentation = new vscode.MarkdownString(`\`\`\`txt\n${value}\n\`\`\``)
					item.detail = label
				}
			}
		}

		if (hit) {
			const { start: a, end: b } = hit
			if (label.match(/[.]/)) {
				item.insertText = `[${label}]`
				item.filterText = item.insertText
				if (text.charCodeAt(a) === 46) item.filterText = "." + item.insertText
			} else {
				item.insertText = keys.length > 0 ? "." + label : label
				item.filterText = item.insertText
				if (text.charCodeAt(a) === 91) item.filterText = `[${label}]`
			}
			item.range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))
		}

		return item
	})

	return { items }

	function formatCandidates(value: string) {
		const reg = /^[-0-9/.]+$/
		const match = value.match(reg)
		if (!match) return value
		value = match[0]
		const isNegtive = value.charCodeAt(0) === 45
		if (isNegtive) value = value.slice(1)
		let val = Number(value)
		if (Number.isNaN(val)) val = calcFraction(value)
		if (Number.isNaN(val)) return value
		return (isNegtive ? "" : "+") + (Number.isNaN(Number(value)) ? "_" : "@") + val.toFixed(3).padStart(7, "0")
	}
}
