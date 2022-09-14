import defaultConfig from "../../config/defaultConfig"
import { resolveConfig } from "../../config/resolveConfig"
import { ConfigJS, ConfigObject, FontSizeValueExtension } from "./../config"

const a: ConfigJS = defaultConfig
a

const b: ConfigJS = resolveConfig(a)
b

const c: ConfigObject = b
c

resolveConfig({}, { theme: defaultConfig.theme }, { separator: "abc" })
resolveConfig(resolveConfig({}, { theme: defaultConfig.theme }, { separator: "abc" }))

resolveConfig({
	theme: {
		fontFamily: {
			sans: ["sdf", { fontFeatureSettings: '"sdsd"sdf' }],
		},
		fontSize: {
			xxx: ["sdf", 123],
		},
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

const v: ConfigObject = {} as FontSizeValueExtension
v
