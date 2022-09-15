import type typescript from "typescript"
import type vscode from "vscode"
import type { URI } from "vscode-uri"
import type { Logger } from "../logger"

type LanguageId = "javascript" | "javascriptreact" | "typescript" | "typescriptreact" | "tw" | string

export interface TextDocument<Position = vscode.Position> {
	offsetAt(position: Position): number
	getText(): string
	positionAt(offset: number): Position
	languageId: LanguageId
	uri: URI
}

export type ExtractedTokenKind = "tw" | "wrap" | "theme" | "globalStyles"

export interface Token {
	start: number
	end: number
	value: string
}

export interface ExtractedToken extends Token {
	kind: ExtractedTokenKind
}

export interface Extractor {
	importLabels?: string[]
	acceptLanguage(languageId: LanguageId): boolean
	find(
		languageId: LanguageId,
		code: string,
		position: number,
		includeEnd: boolean,
		context: { console: Logger; typescript: typeof typescript; typescriptExtractor: Extractor },
	): ExtractedToken | undefined
	findAll(
		languageId: LanguageId,
		code: string,
		context: { console: Logger; typescript: typeof typescript; typescriptExtractor: Extractor },
	): ExtractedToken[]
}
