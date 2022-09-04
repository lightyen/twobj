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
	},
	babelOptions: {
		presets: [
			["@babel/preset-typescript"],
			["@babel/preset-react", { runtime: "automatic", importSource: "@emotion/react" }],
		],
		plugins: [["@emotion", { sourceMap: false }]],
	},
	snapshot: true,
	fixtures: path.join(__dirname, "__fixtures__"),
})
