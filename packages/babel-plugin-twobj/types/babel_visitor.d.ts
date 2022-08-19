import type { BabelFile, NodePath, Visitor } from "@babel/core"
import babel from "@babel/types"
interface ImportLibrary {
	path: NodePath<babel.ImportDeclaration>
	libName: string
	defaultName?: string
	variables: Array<{
		localName: string
		importedName: string
	}>
}
export interface State {
	file: BabelFile
	imports: Array<ImportLibrary>
	globalInserted?: boolean
}
export declare type LibName = "emotion" | "linaria" | "default"
export declare function createVisitor({
	babel,
	options,
	config,
	moduleType,
	lib,
}: {
	babel: typeof import("babel__core")
	options: import("../options.js").PluginOptions
	config: unknown
	moduleType: "esm" | "cjs"
	lib: LibName
}): Visitor<import("@babel/core").PluginPass>
export {}
