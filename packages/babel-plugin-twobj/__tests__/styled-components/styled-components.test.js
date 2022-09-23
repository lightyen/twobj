import pluginTester from "babel-plugin-tester"
import path from "path"
import babelPlugin from "../../src/index"

pluginTester({
	plugin: babelPlugin,
	pluginName: "twobj",
	title: "emotion react twobj",
	pluginOptions: {
		tailwindConfig: {},
		thirdParty: {
			name: "styled-components",
			cssProp: "babel-plugin-styled-components",
			styled: "styled-components",
		},
	},
	babelOptions: {
		presets: [["@babel/preset-typescript"]],
	},
	snapshot: true,
	fixtures: path.join(__dirname, "__fixtures__"),
})
