import type { PnpApi } from "@yarnpkg/pnp"
import type { ExtensionMode } from "vscode"
import { URI } from "vscode-uri"

export const NAME = "Twobj IntelliSense"
export const SECTION_ID = "twobj"
export const DIAGNOSTICS_ID = "twobj"

export interface Settings {
	enabled: boolean
	colorDecorators: "inherit" | "on" | "off"
	references: boolean
	preferVariantWithParentheses: boolean
	fallbackDefaultConfig: boolean
	diagnostics: boolean
	rootFontSize: number
	logLevel: "none" | "error" | "warning" | "info" | "debug" | "trace"
	documentColors: boolean
	hoverColorHint: "none" | "hex" | "rgb" | "hsl"
	hoverUtility: "default" | "showVariants"
	otherLanguages: string[]
	minimumContrastRatio: number
	importLabels: string[]
}

export interface ColorDecoration {
	color?: string
	backgroundColor?: string
	borderColor?: string
}

/**
 * Completion item tags are extra annotations that tweak the rendering of a completion
 * item.
 */
export enum CompletionItemTag {
	/**
	 * Render a completion as obsolete, usually using a strike-out.
	 */
	Deprecated = 1,
}

export interface Environment {
	configPath?: URI
	workspaceFolder: URI
	extensionUri: URI
	serverSourceMapUri: URI
	extensionMode: ExtensionMode
	pnpContext: PnpApi | undefined
}

export type ServiceOptions = Settings & Environment
