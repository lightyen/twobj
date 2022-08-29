import { defineConfig } from "tsup"

export default defineConfig([
	{
		entry: ["src/index.ts"],
		outDir: ".",
		splitting: false,
		sourcemap: false,
		clean: false,
		format: ["esm", "cjs"],
	},
	{
		entry: ["src/parser/index.ts"],
		outDir: "./parser",
		splitting: false,
		sourcemap: false,
		clean: false,
		format: ["esm", "cjs"],
	},
	{
		entry: ["src/config/defaultConfig.ts"],
		outDir: "./config",
		splitting: false,
		sourcemap: false,
		clean: false,
		format: ["esm", "cjs"],
	},
])
