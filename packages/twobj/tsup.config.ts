import { defineConfig } from "tsup"

export default defineConfig([
	{
		entry: ["src/index.ts"],
		outDir: ".",
		splitting: false,
		sourcemap: false,
		clean: false,
		dts: true,
		format: ["esm", "cjs"],
	},
	{
		entry: ["src/parser/index.ts"],
		outDir: "./parser",
		splitting: false,
		sourcemap: false,
		clean: false,
		dts: true,
		format: ["esm", "cjs"],
	},
])
