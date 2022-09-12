import pluginTester from "babel-plugin-tester"
import path from "path"
import babelPlugin from "../../src/index"

pluginTester({
	plugin: babelPlugin,
	pluginName: "twobj",
	title: "emotion react twobj",
	pluginOptions: {
		tailwindConfig: {},
		useClassName: true,
		thirdParty: {
			name: "emotion",
			cssProp: "@emotion/babel-plugin",
			styled: "@emotion/styled",
			className: "@emotion/css",
		},
	},
	babelOptions: {
		presets: [["@babel/preset-typescript"]],
	},
	snapshot: true,
	fixtures: path.join(__dirname, "__fixtures__"),
})
