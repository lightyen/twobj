import defaultConfig from "../../config/defaultConfig"
import { resolveConfig } from "../../config/resolveConfig"
import { ConfigJS, ConfigObject } from "./../config"

const a: ConfigJS = defaultConfig
a

const b: ConfigJS = resolveConfig(a)
b

const c: ConfigObject = b
c

resolveConfig({
	theme: {
		stroke: {
			black: "#000",
		},
		extend: {
			//
		},
	},
	plugins: [
		({ addUtilities }) => {
			//
		},
	],
})
