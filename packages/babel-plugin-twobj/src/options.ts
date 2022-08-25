import type { ThirdPartyName } from "./types"

export interface PluginOptions {
	tailwindConfig?: unknown
	debug?: boolean
	thirdParty?: ThirdPartyName | "auto"
}
