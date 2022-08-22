import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
// import { terser } from "rollup-plugin-terser"

const plugins = [
	babel({
		babelrc: false,
		babelHelpers: "bundled",
		presets: [["@babel/preset-env", { modules: false }], "@babel/preset-typescript"],
		extensions: [".js", ".ts"],
		exclude: "node_modules/**",
	}),
	nodeResolve({ extensions: [".ts"] }),
	commonjs(),
	// terser(),
]

/** @type {import("rollup").InputOptions[]} */
const configs = [
	{
		input: "src/index.ts",
		output: [
			{
				file: "index.cjs",
				format: "cjs",
			},
		],
		plugins,
	},
	{
		input: "src/index.ts",
		output: [
			{
				file: "index.mjs",
				format: "esm",
			},
		],
		plugins,
	},
	{
		input: "src/parser/index.ts",
		output: [
			{
				file: "parser/index.cjs",
				format: "cjs",
			},
		],
		plugins,
	},
	{
		input: "src/parser/index.ts",
		output: [
			{
				file: "parser/index.mjs",
				format: "esm",
			},
		],
		plugins,
	},
	{
		input: "src/config/defaultConfig.ts",
		output: [
			{
				file: "config/defaultConfig.cjs",
				format: "cjs",
				exports: "auto",
			},
		],
		plugins,
	},
	{
		input: "src/config/defaultConfig.ts",
		output: [
			{
				file: "config/defaultConfig.mjs",
				format: "esm",
			},
		],
		plugins,
	},
]
export default configs
