import { defineConfig } from "tsup"

export default defineConfig([
	{
		external: ["twobj"],
		entry: ["src/index.ts"],
		outDir: ".",
		splitting: false,
		sourcemap: false,
		clean: false,
		format: ["cjs"],
	},
	{
		external: ["twobj"],
		entry: ["src/index.mts"],
		outDir: ".",
		splitting: false,
		sourcemap: false,
		clean: false,
		format: ["esm"],
	},
])
