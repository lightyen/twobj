/* eslint-disable @typescript-eslint/ban-ts-comment */
import Module from "module"
import path from "path"
import { createVisitor, LibName } from "./babel_visitor"
import type { PluginOptions } from "./options"

function readConfig({ configPath, debug }: PluginOptions): unknown {
	const defaultConfigPath = path.resolve("./tailwind.config.js")
	const fsPath = configPath ?? defaultConfigPath
	if (debug) {
		console.log("load commonjs configuration", fsPath)
	}

	return require(fsPath)
}

function isModule(id: string) {
	try {
		// @ts-ignore TS/7016
		require.resolve(id, { paths: Module["_nodeModulePaths"](process.cwd()) })
		return true
	} catch {
		return false
	}
}

function getLibName(): LibName {
	if (isModule("@emotion/babel-plugin")) {
		return "emotion"
	} else if (isModule("@emotion/css")) {
		return "emotion"
	} else if (isModule("@emotion/react")) {
		return "emotion"
	}
	return "default"
}

function babelPlugin(
	babel: typeof import("babel__core"),
	options: import("./options").PluginOptions,
): import("babel__core").PluginObj {
	const config = readConfig(options)
	if (options.debug) console.log("commonjs result:", typeof config === "object")
	const lib = options.lib ?? "auto"

	return {
		name: "tw",
		visitor: createVisitor({ babel, options, config, moduleType: "cjs", lib: lib === "auto" ? getLibName() : lib }),
	}
}

module.exports = babelPlugin
