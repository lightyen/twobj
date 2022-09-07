import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import path from "path"
import glob from "tiny-glob/sync"
import TsPathsResolvePlugin from "ts-paths-resolve-plugin"
import { Configuration, EnvironmentPlugin } from "webpack"
import WebpackbarPlugin from "webpackbar"

export default function (): Configuration {
	const workspaceFolder = path.resolve(__dirname, "..")
	const isDev = process.env.NODE_ENV !== "production"
	const outputCSS = "css"
	const outputJS = "js"
	const publicPath = "/"

	const src = path.resolve(workspaceFolder, "src")
	const dist = path.resolve(workspaceFolder, "build")

	const join_network = (...args: string[]) => path.join(...args).replace(path.sep, "/")

	const indices = glob("index.*", { cwd: src })

	const styleLoader = {
		loader: isDev ? "style-loader" : MiniCssExtractPlugin.loader,
		options: {
			...(!isDev && { publicPath: path.relative(path.join(publicPath, outputCSS), publicPath) }),
		},
	}

	return {
		target: "web",
		plugins: [
			new EnvironmentPlugin({
				NODE_ENV: process.env.NODE_ENV,
				APP_NAME: "react-emotion-typescript",
			}),
			new TsPathsResolvePlugin(),
			new MiniCssExtractPlugin({
				filename: join_network(outputCSS, "[name].css?[fullhash]"),
				chunkFilename: join_network(outputCSS, "[name].chunk.css?[fullhash:8]"),
			}),
			new HtmlWebpackPlugin({
				title: "",
				inject: true,
				minify: true,
				template: path.join(workspaceFolder, "public", "index.html"),
			}),
			new WebpackbarPlugin({ color: "blue" }),
		],
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
		},
		entry: indices.map(i => path.resolve(src, i)),
		output: {
			path: dist,
			filename: join_network(outputJS, "[name].js?[fullhash]"),
			chunkFilename: join_network(outputJS, "[name].js?[fullhash:8]"),
			publicPath,
		},
		module: {
			rules: [
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules|__tests?__|\.(test|spec)\.[jt]sx?$|\.worker\.[jt]s$/,
					use: ["babel-loader", "@linaria/webpack5-loader"],
				},
				{
					test: /\.worker\.[jt]s$/,
					exclude: /node_modules/,
					use: ["worker-loader", "babel-loader"],
				},
				{
					test: /\.(png|jpe?g|gif|ico)$/i,
					type: "asset",
					parser: {
						dataUrlCondition: {
							maxSize: 4 << 10,
						},
					},
					generator: {
						filename: join_network("img", "[hash][ext]"),
					},
				},
				{
					test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
					type: "asset/resource",
					generator: {
						filename: join_network("fonts", "[hash][ext]"),
					},
				},

				{
					test: /\.svg$/,
					use: ["babel-loader", "@svgr/webpack"],
				},
				{
					test: /\.ya?ml$/,
					use: "js-yaml-loader",
				},
				{
					exclude: /node_modules/,
					test: /\.css$/,
					use: [
						styleLoader,
						{
							loader: "css-loader",
							options: {
								url: true,
								sourceMap: true,
							},
						},
					],
				},
			],
		},
	}
}
