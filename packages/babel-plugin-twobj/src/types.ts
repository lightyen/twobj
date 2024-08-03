import type { BabelFile, Node, NodePath, Visitor } from "@babel/core"
import babel from "@babel/types"
import { Context } from "twobj"
import { Keyword } from "./base"

export type Parser = ReturnType<typeof import("twobj/parser").createParser>

export interface PluginOptions {
	tailwindConfig?: unknown
	throwError?: boolean
	debug?: boolean
	thirdParty?: ThirdParty | "auto"
}

export type ThirdPartyName = "emotion"

export interface ThirdParty {
	name: string // ex: emotion
	cssProp?: string // ex: @emotion/babel-plugin
	styled?: string // ex: @emotion/styled
	className?: string // ex: @emotion/css
	plugin?: Plugin
}

export interface ImportDeclaration {
	path: NodePath<babel.ImportDeclaration>
	source: string
	variables: { local: string; imported: string }[]
	defaultId?: string
}

export interface ProgramState {
	types: typeof import("babel__core").types
	parser: Parser
	thirdParty?: ThirdParty
	file: BabelFile
	styles: Map<string, babel.MemberExpression>
	imports: ImportDeclaration[]
	globalStyles?: boolean
	twIdentifiers: Record<Keyword, Map<string, NodePath<babel.ImportDeclaration>>>
	added: Node[]
	cssLocalName: string
	styledLocalName: string
}

export interface Plugin {
	(args: {
		context: Context
		types: typeof import("babel__core").types
		buildStyle(twDeclaration: string, path: NodePath): babel.ObjectExpression
		buildWrap(twDeclaration: string, path: NodePath): babel.ArrowFunctionExpression
	}): Visitor<ProgramState>
	id: string
	lookup: string[]
	manifest: {
		cssProp?: string
		styled?: string
		className?: string | string[]
	}
}
