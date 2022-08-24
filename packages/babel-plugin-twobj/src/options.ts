import type { ThirdPartyName } from "./types"

export interface PluginOptions {
	configPath?: string
	debug?: boolean
	thirdParty?: ThirdPartyName | "auto"
}
