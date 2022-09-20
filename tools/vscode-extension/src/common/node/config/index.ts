import chokidar from "chokidar"
import { ExtensionMode } from "vscode"
import type { TailwindConfigReader } from "../../config"
import { importFrom } from "./module"
export { findPnpApi } from "./pnp"

export function createConfigReader(): TailwindConfigReader {
	let watcher: chokidar.FSWatcher
	return {
		async load({ uri, pnp, mode, onChange }) {
			if (uri == undefined) {
				return undefined
			}
			let config: import("twobj").ConfigJS
			const deps: string[] = []
			try {
				config = importFrom(uri.fsPath, {
					pnp,
					cache: false,
					deps,
					header:
						mode === ExtensionMode.Development
							? "process.env.NODE_ENV = 'development';\n"
							: "process.env.NODE_ENV = 'production';\n",
				})
			} finally {
				watcher = chokidar.watch(deps, { ignoreInitial: true })
				watcher.on("change", onChange)
				watcher.on("unlink", onChange)
				watcher.on("add", onChange)
			}
			return config
		},
		closeWatcher() {
			if (watcher) watcher.close()
		},
	}
}
