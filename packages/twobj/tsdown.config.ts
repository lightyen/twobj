import { defineConfig } from "tsdown"

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["esm"],
		dts: {
			tsconfig: "./tsconfig.json",
		},
	},
	{
		entry: ["src/parser/index.ts"],
		outDir: "./parser",
		dts: true,
		format: ["esm"],
	},
])
