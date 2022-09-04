/* eslint-disable @typescript-eslint/ban-ts-comment */
import Module from "module"
import path from "path"
import * as plugins from "./plugins"
import type { PluginOptions, ThirdParty } from "./types"
import { createVisitor } from "./visitor"

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

function findThirdParty(): ThirdParty | undefined {
	for (const {
		id,
		manifest: { cssProp, styled, className },
	} of Object.values(plugins)) {
		const payload: ThirdParty = {
			name: id,
		}
		if (cssProp && isModule(cssProp)) {
			payload.cssProp = cssProp
		}
		if (styled && isModule(styled)) {
			payload.styled = styled
		}
		if (className && isModule(className)) {
			payload.className = className
		}
		if (payload.cssProp || payload.styled || payload.className) {
			return payload
		}
	}
	return undefined
}

function babelPlugin(babel: typeof import("babel__core"), options: PluginOptions): import("babel__core").PluginObj {
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
