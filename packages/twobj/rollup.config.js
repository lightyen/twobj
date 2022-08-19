import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import { terser } from "rollup-plugin-terser"

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
		plugins: [
			babel({
				babelrc: false,
				babelHelpers: "bundled",
				sourceType: "unambiguous",
				presets: [["@babel/preset-env", { modules: false }], "@babel/preset-typescript"],
				extensions: [".js", ".ts"],
				exclude: "node_modules/**",
			}),
			nodeResolve({ extensions: [".ts"] }),
			commonjs(),
			terser(),
		],
	},
	{
		input: "src/index.ts",
		output: [
			{
				file: "index.mjs",
				format: "esm",
			},
		],
		plugins: [
			babel({
				babelrc: false,
				babelHelpers: "bundled",
				presets: [["@babel/preset-env", { modules: false }], "@babel/preset-typescript"],
				extensions: [".js", ".ts"],
				exclude: "node_modules/**",
			}),
			nodeResolve({ extensions: [".ts"] }),
			commonjs(),
			terser(),
		],
	},
]
export default configs
