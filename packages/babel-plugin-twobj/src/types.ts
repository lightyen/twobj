import type { BabelFile, NodePath, Visitor } from "@babel/core"
import type babel from "@babel/types"

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

export interface Plugin {
	(options: {
		t: typeof babel
		buildStyle: (input: string) => babel.ObjectExpression
		addImportDeclaration: (declaration: babel.ImportDeclaration) => void
	}): Visitor<State & PluginState>
	lookup: string[]
}

export type ThirdPartyName = "emotion" | "linaria"
