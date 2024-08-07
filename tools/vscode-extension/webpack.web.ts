import { execSync } from "child_process"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import ESLintPlugin from "eslint-webpack-plugin"
import ForkTsCheckerPlugin from "fork-ts-checker-webpack-plugin"
import path from "path"
import TerserPlugin from "terser-webpack-plugin"
import TsPathsResolvePlugin from "ts-paths-resolve-plugin"
import { Compiler, Configuration, DefinePlugin, ExternalsPlugin } from "webpack"

class ExternalsVendorPlugin {
	externals: Record<string, string>
	constructor(...deps: string[]) {
		this.externals = {}
		for (const dep of deps) {
			this.externals[dep] = dep
		}
	}
	apply(compiler: Compiler) {
		new ExternalsPlugin("commonjs", this.externals).apply(compiler)
	}
}

const clientWorkspaceFolder = path.resolve(__dirname, "src")

const configExtension: Configuration = {
	performance: {
		hints: false,
	},
	target: "webworker",
	mode: process.env.NODE_ENV === "production" ? "production" : "development",
	devtool: false,
	entry: path.join(clientWorkspaceFolder, "extension.ts"),
	output: {
		path: path.resolve(__dirname, "dist/web"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "[absolute-resource-path]",
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				minify: TerserPlugin.esbuildMinify,
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules|\.test\.ts$/,
				use: {
					loader: "swc-loader",
					options: {
						jsc: {
							parser: {
								syntax: "typescript",
							},
							target: "es2020",
						},
						module: {
							type: "commonjs",
							ignoreDynamic: true,
						},
					},
				},
			},
			{
				test: /\.ya?ml$/,
				use: "js-yaml-loader",
			},
			{
				test: /.node$/,
				loader: "node-loader",
			},
		],
		// NOTE: https://github.com/microsoft/TypeScript/issues/39436
		noParse: [require.resolve("typescript/lib/typescript.js")],
	},
	resolve: {
		extensions: [".ts", ".js", ".json"],
		alias: {
			"./common/config": path.resolve(clientWorkspaceFolder, "common/web/config"),
			"../common/config": path.resolve(clientWorkspaceFolder, "common/web/config"),
			"../../common/config": path.resolve(clientWorkspaceFolder, "common/web/config"),
		},
		fallback: {
			events: require.resolve("events"),
			util: require.resolve("util"),
			path: require.resolve("path-browserify"),
		},
	},
	plugins: [
		new TsPathsResolvePlugin({ tsConfigPath: path.resolve(clientWorkspaceFolder, "tsconfig.json") }),
		new ForkTsCheckerPlugin({
			typescript: {
				configFile: path.resolve(clientWorkspaceFolder, "tsconfig.json"),
			},
		}),
		new ExternalsVendorPlugin("vscode"),
		new ESLintPlugin({ extensions: ["ts"] }),
		new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ["extension*"] }),
		new DefinePlugin({
			__COMMIT_HASH__: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
			__VSCODE_WEB__: "true",
		}),
	],
}

export default configExtension
