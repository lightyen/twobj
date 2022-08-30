import type { ThirdParty } from "./types"

export interface PluginOptions {
	tailwindConfig?: unknown
	debug?: boolean
	thirdParty?: ThirdParty | "auto"
}
