import babel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"

/** @type {import("rollup").InputOptions[]} */
const configs = [
	{
		external: ["twobj"],
		input: "src/index.cts",
		output: [
			{
				file: "index.cjs",
				format: "cjs",
				exports: "named",
			},
		],
		plugins: [
			babel({
				babelrc: false,
				babelHelpers: "bundled",
				sourceType: "unambiguous",
				presets: [["@babel/preset-env", { modules: false }], "@babel/preset-typescript"],
				extensions: [".js", ".ts", ".cjs", ".cts"],
				exclude: "node_modules/**",
			}),
			nodeResolve({ extensions: [".ts", ".cts"] }),
			commonjs(),
		],
	},
	{
		external: ["twobj"],
		input: "src/index.mts",
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
				extensions: [".js", ".ts", ".mjs", ".mts"],
				exclude: "node_modules/**",
			}),
			nodeResolve({ extensions: [".ts", ".mts"] }),
			commonjs(),
		],
	},
]
export default configs
