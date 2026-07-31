import { defineConfig } from "tsdown"

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["esm"],
		dts: true,
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
		format: ["esm"],
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
		entry: ["src/index.ts"],
		format: ["cjs"],
		dts: true,
		deps: { alwaysBundle: ["cssesc", "parsel-js"] },
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
		format: ["cjs"],
		deps: { alwaysBundle: ["cssesc", "parsel-js"] },
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
