import { defineConfig } from "tsdown"

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["esm"],
	},
	{
		entry: ["src/parser/index.ts"],
		outDir: "./parser",
		dts: true,
		format: ["esm"],
	},
])
