import type { PnpApi } from "@yarnpkg/pnp"
import type { ExtensionMode } from "vscode"
import type { URI } from "vscode-uri"

export interface PnpPackageLocator {
	name: string
	reference: string
}

export interface PnpPackageInformation {
	packageLocation: string
	packageDependencies: Map<string, null | string | [string, string]>
	packagePeers: Set<string>
	linkType: "HARD" | "SOFT"
}

export interface PnpApiValue extends PnpApi {
	setup: () => void
}

export function findPnpApi(lookupSource: URL | string): PnpApiValue | undefined

export interface LoadConfigOptions {
	uri: URI | undefined
	pnp: PnpApi | undefined
	mode: ExtensionMode
	onChange(): void
}

export interface TailwindConfigReader {
	load(options: LoadConfigOptions): Promise<import("twobj").ConfigJS | undefined>
	closeWatcher(): void
}

export function createConfigReader(): TailwindConfigReader
