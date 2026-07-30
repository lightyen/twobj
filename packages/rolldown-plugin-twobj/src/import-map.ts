import type { ESTree } from "rolldown/utils"
import { ExprKind } from "./common"

export type LibImportMap = Record</* moduleName */ string, Record</* exportName */ string, ExprKind>>

const OFFICIAL_LIBRARIES: LibImportMap = {
	twobj: {
		tw: ExprKind.Tw,
		tx: ExprKind.Tx,
		wrap: ExprKind.Wrap,
		theme: ExprKind.Theme,
		globalStyles: ExprKind.GlobalStyles,
	},
	"@emotion/react": {
		css: ExprKind.EmotionCss,
	},
	"@emotion/styled": {
		default: ExprKind.EmotionStyled,
	},
}

export function expandImportMap(): LibImportMap {
	return OFFICIAL_LIBRARIES
}

export interface PackageMeta {
	kind: ExprKind
	decl: ESTree.ImportDeclaration
}

export interface ImportMap {
	addFromImportDecl(importDecl: ESTree.ImportDeclaration): void
	get(importedName: string): PackageMeta | undefined
	getTrackedNames(): string[]
}

export function createImportMap(registeredImports: LibImportMap): ImportMap {
	const importPackages = new Map<string, PackageMeta>()

	return {
		addFromImportDecl(importDecl) {
			if (importDecl.importKind === "type") {
				return
			}

			const src = importDecl.source.value
			const config = registeredImports[src]
			if (!config) {
				return
			}

			for (const spec of importDecl.specifiers) {
				if (spec.type === "ImportSpecifier") {
					const importedName = spec.imported.type === "Identifier" ? spec.imported.name : spec.imported.value
					const kind = config[importedName]
					if (kind !== undefined) {
						importPackages.set(spec.local.name, { kind, decl: importDecl })
					}
				} else if (spec.type === "ImportDefaultSpecifier") {
					const kind = config.default
					if (kind !== undefined) {
						importPackages.set(spec.local.name, { kind, decl: importDecl })
					}
				}
			}
		},
		get(importedName) {
			return importPackages.get(importedName)
		},
		getTrackedNames() {
			return [...importPackages.keys()]
		},
	}
}
