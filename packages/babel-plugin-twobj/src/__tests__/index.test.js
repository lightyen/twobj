import pluginTester from "babel-plugin-tester"
import path from "path"
import babelPlugin from "../index"

pluginTester({
	plugin: babelPlugin,
	pluginName: "twobj",
	title: "describe twobj",
	pluginOptions: {
		tailwindConfig: {},
	},
	babelOptions: {
		presets: [
			["@babel/preset-typescript"],
			["@babel/preset-react", { runtime: "automatic", importSource: "@emotion/react" }],
		],
		plugins: ["@emotion"],
	},
	snapshot: true,
	fixtures: path.join(__dirname, "__fixtures__"),
})
