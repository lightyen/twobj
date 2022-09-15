import { ConfigJS, ConfigObject, FontSizeValueExtension } from ".."
import { defaultConfig } from "../../defaultConfig"
import { resolveConfig } from "../../resolveConfig"

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
		extend: {
			//
			stroke: {
				black: "#000",
			},
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
