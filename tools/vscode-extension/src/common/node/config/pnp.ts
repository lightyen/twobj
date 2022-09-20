import fs from "fs"
import Module from "module"
import path from "path"
import { fileURLToPath, URL } from "url"
import type { PnpApiValue } from "../../config"

export function findPnpApi(lookupSource: URL | string): PnpApiValue | undefined {
	const lookupPath = lookupSource instanceof URL ? fileURLToPath(lookupSource) : lookupSource
	return findContext(lookupPath)

	function findContext(workspace: string): PnpApiValue | undefined {
		try {
			let pnpPath = path.resolve(workspace, ".pnp")

			if (
				!path.isAbsolute(pnpPath) &&
				!pnpPath.startsWith("." + path.sep) &&
				!pnpPath.startsWith(".." + path.sep)
			) {
				pnpPath = "." + path.sep + pnpPath
			}

			if (isExist(pnpPath + ".cjs")) pnpPath += ".cjs"
			else if (isExist(pnpPath + ".js")) pnpPath += ".js"

			// @ts-ignore TS/7016
			const filename = Module["_resolveFilename"](pnpPath, { paths: Module["_nodeModulePaths"](workspace) })
			const module = new Module("")
			return module.require(filename)
		} catch {}

		return undefined
	}
}

export function isExist(filename: string) {
	try {
		fs.accessSync(filename)
		return true
	} catch {
		return false
	}
}
