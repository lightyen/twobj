/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createRequire, Module } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { createVisitor } from "./visitor"
import type { PluginOptions } from "./options"
import type { ThirdPartyName } from "./types"

async function readConfig({ configPath, debug }: PluginOptions): Promise<unknown> {
	const defaultConfigPath = path.resolve("./tailwind.config.js")
	const fileURL = pathToFileURL(configPath ?? defaultConfigPath).toString()
	if (debug) {
		console.log("load esmodule configuration", fileURL)
	}
	import.meta.url
	return import(fileURL).then(m => m.default)
}

async function isModule(id: string) {
	const require = createRequire(import.meta.url)
	try {
		// @ts-ignore TS/7053
		require.resolve(id, { paths: Module["_nodeModulePaths"](process.cwd()) })
		return true
	} catch {
		return false
	}
}

async function getLibName(): Promise<ThirdPartyName> {
	// emotion
	if (await isModule("@emotion/react")) {
		return "emotion"
	}
	if (await isModule("@emotion/css")) {
		return "emotion"
	}
	if (await isModule("@emotion/babel-plugin")) {
		return "emotion"
	}

	// linaria
	if (await isModule("@linaria/core")) {
		return "linaria"
	}
	if (await isModule("@linaria/react")) {
		return "linaria"
	}

	return "default"
}

export default async function babelPlugin(
	babel: typeof import("babel__core"),
	options: import("./options").PluginOptions,
): Promise<import("babel__core").PluginObj> {
	const config = await readConfig(options)
	if (options.debug) console.log("esmodule result:", typeof config === "object")
	const thirdParty = options.thirdParty ?? "auto"

	return {
		name: "tw",
		visitor: createVisitor({
			babel,
			options,
			config,
			moduleType: "esm",
			thirdParty: thirdParty === "auto" ? await getLibName() : thirdParty,
		}),
	}
}
