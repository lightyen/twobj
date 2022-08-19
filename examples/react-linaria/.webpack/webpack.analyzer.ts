import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer"
import { merge } from "webpack-merge"
import createBaseConfig from "./webpack.common"

export default merge(createBaseConfig(), {
	plugins: [
		new BundleAnalyzerPlugin({
			analyzerMode: "server",
			analyzerHost: "127.0.0.1",
			analyzerPort: 0,
			reportFilename: "report.html",
			defaultSizes: "parsed",
			openAnalyzer: true,
			generateStatsFile: false,
			statsFilename: "stats.json",
			statsOptions: null,
			logLevel: "info",
		}),
	],
})
