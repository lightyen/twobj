import type { BabelFile, NodePath, Visitor } from "@babel/core"
import type babel from "@babel/types"

export interface PluginOptions {
	tailwindConfig?: unknown
	debug?: boolean
	thirdParty?: ThirdParty | "auto"
	/** experimental */
	useClassName?: boolean
}

export interface ImportLibrary {
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

export interface PluginState {
	styled: {
		localName: string
		imported: boolean
	}
}

export type ThirdPartyName = "emotion" | "linaria"

export interface ThirdParty {
	name: ThirdPartyName // ex: emotion
	cssProp?: string // ex: @emotion/babel-plugin
	styled?: string // ex: @emotion/styled
	className?: string // ex: @emotion/css
}

export interface Plugin {
	(options: {
		thirdParty: ThirdParty
		t: typeof babel
		buildStyle: (input: string) => babel.ObjectExpression
		buildWrap: (input: string) => babel.ObjectExpression
		addImportDeclaration: (declaration: babel.ImportDeclaration) => void
		useClassName: boolean
	}): Visitor<State & PluginState>
	id: ThirdPartyName
	lookup: string[]
	manifest: {
		cssProp?: string
		styled?: string
		className?: string
	}
}
