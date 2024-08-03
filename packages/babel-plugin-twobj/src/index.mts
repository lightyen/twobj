/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createRequire, Module } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"
import * as plugins from "./plugins"
import { PluginOptions, ThirdParty } from "./types"
import { visitor } from "./visitor"

async function readConfig({ tailwindConfig, debug }: PluginOptions): Promise<unknown> {
	if (typeof tailwindConfig === "object" && tailwindConfig !== null) {
		return tailwindConfig
	}

	let configPath: string | undefined
	if (typeof tailwindConfig === "string") {
		configPath = tailwindConfig
	}

	const defaultConfigPath = path.resolve("./tailwind.config.js")
	const fileURL = pathToFileURL(configPath ?? defaultConfigPath).toString()
	if (debug) {
		console.log("load esmodule configuration", fileURL)
	}
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

async function findThirdParty(): Promise<ThirdParty | undefined> {
	for (const {
		id,
		manifest: { cssProp, styled, className },
	} of Object.values(plugins)) {
		const payload: ThirdParty = {
			name: id,
		}
		await Promise.all([
			(async () => {
				if (cssProp && (await isModule(cssProp))) {
					payload.cssProp = cssProp
				}
			})(),
			(async () => {
				if (styled && (await isModule(styled))) {
					payload.styled = styled
				}
			})(),
			(async () => {
				if (className) {
					for (const v of ([] as string[]).concat(className)) {
						if (await isModule(v)) {
							payload.className = v
						}
					}
				}
			})(),
		])
		if (payload.cssProp || payload.styled || payload.className) {
			return payload
		}
	}
	return undefined
}

export default async function babelPlugin(
	babel: typeof import("babel__core"),
	options: PluginOptions,
): Promise<import("babel__core").PluginObj> {
	let config
	try {
		config = await readConfig(options)
	} catch (error) {
		config = {}
	}
	const thirdParty = options.thirdParty ?? "auto"
	return {
		name: "tw",
		visitor: visitor({
			babel,
			config,
			thirdParty: thirdParty === "auto" ? await findThirdParty() : thirdParty,
			throwError: options.throwError ?? false,
		}),
	}
}
