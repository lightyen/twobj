import * as culori from "culori"
import * as parser from "twobj/parser"
import vscode from "vscode"
import { getCSSLanguageService } from "vscode-css-languageservice"
import { TextDocument as LspTextDocument } from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver-types"
import { calcFraction } from "~/common"
import type { ExtractedToken, ExtractedTokenKind, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import type { ServiceOptions } from "~/shared"
import type { ICompletionItem } from "~/typings/completion"
import type { TailwindLoader } from "./tailwind"

export default function completion(
	result: ExtractedToken | undefined,
	document: TextDocument,
	position: vscode.Position,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.CompletionList<ICompletionItem> | undefined {
	if (!result) return undefined

	const start = process.hrtime.bigint()
	const list = doComplete(result)
	const end = process.hrtime.bigint()
	console.trace(`completion (${Number((end - start) / 10n ** 6n)}ms)`)
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
		suggestion: ReturnType<typeof parser.suggest>,
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
	const suggestion = parser.suggest({ text, position, separator: state.separator })
	if (suggestion.inComment) return new vscode.CompletionList<ICompletionItem>(undefined)
	let items: ICompletionItem[] = []
	applyFeatures(variantCompletion, classnameCompletion, arbitraryPropertyCompletion, arbitraryVariantValueCompletion)
	return new vscode.CompletionList<ICompletionItem>(items)
	function applyFeatures(...features: CompletionFeature[]) {
		for (const fn of features) {
			const ret = fn(document, kind, offset, text, position, suggestion, state, options)
			if (ret == undefined) continue
			items = items.concat(ret)
		}
	}
}

const classnameCompletion: CompletionFeature = (document, kind, offset, text, position, { target }, state) => {
	if (!target) return state.provideClassCompletionList()

	const [a, b] = target.range
	switch (target.type) {
		case parser.NodeType.ArbitrarySelector:
		case parser.NodeType.SimpleVariant:
		case parser.NodeType.ArbitraryVariant: {
			if (position > a && position < b) return
			break
		}
		case parser.NodeType.ArbitraryProperty: {
			if (position > a && position <= b) return
			break
		}
		case parser.NodeType.ArbitraryClassname: {
			if (position === b) return
			const [, pb] = target.prefix.range
			if (position > pb) return
			break
		}
	}

	const items = state.provideClassCompletionList()

	const endChar = text.slice(b, b + 1)
	const insertSpace = text.slice(a, b) !== "!" && endChar !== "" && endChar.match(/[\s)]/) == null
	const transfrom = (callback: (item: ICompletionItem) => void) => {
		for (const item of items) callback(item)
	}

	switch (target.type) {
		case parser.NodeType.ArbitrarySelector:
		case parser.NodeType.SimpleVariant:
		case parser.NodeType.ArbitraryVariant: {
			if (insertSpace) transfrom(appendSpace())
			return items
		}
		case parser.NodeType.ArbitraryClassname: {
			if (target.expr) {
				if (position === a) {
					if (insertSpace) transfrom(appendSpace())
					return items
				}
				transfrom(replace(new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))))
				return items
			}
			break
		}
		case parser.NodeType.ArbitraryProperty: {
			transfrom(appendSpace())
			return items
		}
	}

	if (insertSpace || position === a) {
		transfrom(appendSpace())
	} else if (position === b) {
		transfrom(replace(new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))))
	} else {
		// NOTE: for `bg-black/50`, `bg-black/[0.5]`
		let shrinkB = b
		const value = text.slice(...target.range)
		if (target.type === parser.NodeType.ClassName || target.type === parser.NodeType.ArbitraryClassname) {
			const pluginName = state.tw.getPluginName(value)
			if (pluginName && /Color|fill|stroke/.test(pluginName)) {
				const slash = value.lastIndexOf("/")
				if (slash !== -1) shrinkB += slash - value.length
			}
		}

		transfrom(item => {
			const end = item.kind === vscode.CompletionItemKind.Color && item.documentation ? shrinkB : b
			item.range = new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + end))
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
	{ target, variants },
	state,
	{ preferVariantWithParentheses },
) => {
	if (target) {
		const [a, b] = target.range
		switch (target.type) {
			case parser.NodeType.ArbitrarySelector: {
				if (position !== a && position !== b) return
				break
			}
			case parser.NodeType.ArbitraryVariant: {
				const [, pb] = target.prefix.range
				if (position > pb && position < b) return
				break
			}
			case parser.NodeType.ArbitraryClassname:
			case parser.NodeType.ArbitraryProperty: {
				if (position !== a) return
				break
			}
			case parser.NodeType.ClassName: {
				if (position !== a && position !== b) return
				if (text.charCodeAt(b - 1) === 47) return
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

	const [a, b] = target.range
	const nextCharacter = text.charCodeAt(position)
	const userVariants = new Set(
		variants
			.filter((v): v is parser.SimpleVariant => v.type === parser.NodeType.SimpleVariant)
			.map(v => v.id.value),
	)
	items = items.filter(item => !userVariants.has(item.label.slice(0, -state.separator.length)))
	const transfrom = (callback: (item: ICompletionItem) => void) => {
		for (const item of items) callback(item)
	}

	const next = text.slice(b, b + 1)
	const insertSpace = next != "" && next.match(/[\s)]/) == null

	if (preferVariantWithParentheses) {
		if (nextCharacter !== 40) {
			transfrom(item => {
				item.insertText = new vscode.SnippetString(item.label + "($0)" + (insertSpace ? " " : ""))
			})
		}
	}

	if (target.type === parser.NodeType.SimpleVariant || target.type === parser.NodeType.ArbitraryVariant) {
		if (position > a && position < b) {
			transfrom(replace(new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))))
		}
	} else if (target.type === parser.NodeType.ClassName) {
		transfrom(replace(new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))))
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
	for (const t of parser.parse_theme({ text, start: exprRange[0], end: exprRange[1] })) {
		if (position >= t.valueRange[0] && position <= t.valueRange[1]) {
			return themeCompletion(document, offset, text, position, state, t.valueRange).items
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

const scssLanguageSrv = getCSSLanguageService()
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

const arbitraryVariantValueCompletion: CompletionFeature = (document, kind, offset, text, position, { target }) => {
	if (!target) return
	if (target.type !== parser.NodeType.ArbitrarySelector) return
	const { range, value } = target.selector
	const [a, b] = range
	if (position < a || position > b) return
	return getScssSelectorCompletionList(document, position, offset, a, value)
}

const arbitraryPropertyCompletion: CompletionFeature = (document, kind, offset, text, position, { target }, state) => {
	if (target) {
		const [a, b] = target.range
		switch (target.type) {
			case parser.NodeType.ArbitrarySelector:
			case parser.NodeType.ArbitraryVariant:
			case parser.NodeType.SimpleVariant: {
				if (position > a && position < b) return
				break
			}
			case parser.NodeType.ArbitraryProperty: {
				if (position === b) return
				break
			}

			case parser.NodeType.ArbitraryClassname: {
				if (position === b) return
				if (position === a) break
				const expr = target.expr
				if (!expr) return
				const [pa, pb] = expr.range
				if (position < pa || position > pb) return
				const cssValueItems = new Map<string, ICompletionItem>()
				let prefix = target.prefix.value
				if (prefix[0] === "-") prefix = prefix.slice(1)
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
							expr.range,
							[prop, expr.value],
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
			const [a, b] = target.range
			if (position > a && position < b) {
				return getCssDeclarationCompletionList(
					document,
					offset,
					text,
					position,
					[target.range[0] + 1, target.range[1] - 1],
					target.decl.value,
					state,
				)
			}
		}
	}

	const items = state.provideCssPropsCompletionList()

	if (!target) return items

	const [a, b] = target.range
	const endChar = text.slice(b, b + 1)
	const insertSpace = text.slice(a, b) !== "!" && endChar !== "" && endChar.match(/[\s)]/) == null
	const transfrom = (callback: (item: ICompletionItem) => void) => {
		for (const item of items) callback(item)
	}

	transfrom(item => (item.insertText = new vscode.SnippetString(`[${item.label}: $0]`)))

	switch (target.type) {
		case parser.NodeType.ArbitrarySelector:
		case parser.NodeType.ArbitraryVariant:
		case parser.NodeType.SimpleVariant: {
			if (position === a) transfrom(prependSpace())
			if (insertSpace) transfrom(appendSpace())
			return items
		}
		case parser.NodeType.ArbitraryProperty:
		case parser.NodeType.ArbitraryClassname: {
			transfrom(appendSpace())
			return items
		}
	}
	if (position > a && position <= b) {
		transfrom(replace(new vscode.Range(document.positionAt(offset + a), document.positionAt(offset + b))))
	} else if (position === a) {
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
	const node = parser.parseThemeValue({ config: state.config, text, start, end })

	const i = node.path.findIndex(p => position >= p.range[0] && position <= p.range[1])
	if (i === -1 && node.path.length !== 0) {
		return { items: [] }
	}

	const keys = node.path.slice(0, i)
	const obj = parser.resolvePath(state.config.theme, keys)
	if (!obj || typeof obj !== "object") {
		return { items: [] }
	}

	const hit = node.path[i]
	const candidates = Object.keys(obj)
	const isScreen = node.path[0] && node.path[0].value === "screen"

	const items = candidates.map<ICompletionItem>(label => {
		const valueString = parser.renderThemePath(state.config, [...keys, label])
		const value = parser.resolvePath(state.config.theme, [...keys, label])
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
			const [a, b] = hit.range
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
