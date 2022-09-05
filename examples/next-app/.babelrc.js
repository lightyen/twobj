module.exports = {
	presets: [
		[
			"next/babel",
			{
				"preset-react": {
					runtime: "automatic",
					importSource: "@emotion/react",
				},
			},
		],
	],
	plugins: [["twobj", { tailwindConfig: require("./tailwind.config") }], "@emotion/babel-plugin"],
}
