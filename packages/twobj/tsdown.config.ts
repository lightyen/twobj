import { defineConfig } from "tsdown"

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["esm", "cjs"],
		dts: {
			tsconfig: "./tsconfig.json",
		},
		outExtension({ format }) {
			if (format === "es") {
				return {
					js: ".mjs",
					dts: ".d.ts",
				}
			}
			return {
				js: ".js",
				dts: ".d.ts",
			}
		},
	},
	{
		entry: ["src/parser/index.ts"],
		outDir: "./parser",
		dts: true,
		format: ["esm", "cjs"],
		outExtension({ format }) {
			if (format === "es") {
				return {
					js: ".mjs",
					dts: ".d.ts",
				}
			}
			return {
				js: ".js",
				dts: ".d.ts",
			}
		},
	},
])
