/* eslint-disable @typescript-eslint/ban-ts-comment */
import Module from "module"
import path from "path"
import { createVisitor } from "./visitor"
import type { PluginOptions } from "./options"
import type { ThirdPartyName } from "./types"

function readConfig({ tailwindConfig, debug }: PluginOptions): unknown {
	if (typeof tailwindConfig === "object" && tailwindConfig !== null) {
		return tailwindConfig
	}

	let configPath: string | undefined
	if (typeof tailwindConfig === "string") {
		configPath = tailwindConfig
	}

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

function findThirdParty(): ThirdPartyName | undefined {
	// emotion
	if (isModule("@emotion/react")) {
		return "emotion"
	}
	if (isModule("@emotion/css")) {
		return "emotion"
	}
	if (isModule("@emotion/babel-plugin")) {
		return "emotion"
	}

	// linaria
	if (isModule("@linaria/core")) {
		return "linaria"
	}
	if (isModule("@linaria/react")) {
		return "linaria"
	}

	return undefined
}

function babelPlugin(
	babel: typeof import("babel__core"),
	options: import("./options").PluginOptions,
): import("babel__core").PluginObj {
	let config
	try {
		config = readConfig(options)
	} catch {
		config = {}
	}
	const thirdParty = options.thirdParty ?? "auto"
	return {
		name: "tw",
		visitor: createVisitor({
			babel,
			options,
			config,
			moduleType: "cjs",
			thirdParty: thirdParty === "auto" ? findThirdParty() : thirdParty,
		}),
	}
}

module.exports = babelPlugin
