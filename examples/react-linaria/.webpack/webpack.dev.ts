import ReactRefreshPlugin from "@pmmmwh/react-refresh-webpack-plugin"
import { merge } from "webpack-merge"
import createBaseConfig from "./webpack.common"

process.env.NODE_ENV = "development"
process.env.PUBLIC_URL = ""

export default merge(createBaseConfig(), {
	mode: "development",
	devtool: "inline-source-map",
	devServer: {
		hot: true,
		compress: true,
		open: false,
		historyApiFallback: true,
	},
	stats: {
		children: false,
		modules: false,
		entrypoints: false,
	},
	cache: {
		type: "memory",
	},
	plugins: [
		// new ForkTsCheckerPlugin({
		// 	typescript: {
		// 		configFile: path.resolve(__dirname, "../src/tsconfig.json"),
		// 	},
		// 	devServer: false,
		// }),
		new ReactRefreshPlugin(),
	],
})
