/* eslint-disable @typescript-eslint/no-explicit-any */
import ts from "typescript"
import vscode from "vscode"
import { defaultLogger as console } from "~/common/logger"
import type { TailwindConfigReader } from "../../config"
export { findPnpApi } from "./pnp"

function transpile(code: string, compilerOptions: ts.CompilerOptions): string {
	const { outputText: transpiledCode, diagnostics } = ts.transpileModule(code, {
		compilerOptions,
	})
	if (diagnostics) {
		for (const diagnostic of diagnostics) {
			console.info(diagnostic.messageText)
		}
	}
	return transpiledCode
}

const dynamicImport = (0, eval)("u=>import(u)")

function createBlob(code: string, type = "text/javascript") {
	return new Blob([code], { type })
}

async function getObject(code: string): Promise<any> {
	code = transpile(code, {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ESNext,
	})
	const blob = createBlob(code)
	const url = URL.createObjectURL(blob)
	try {
		const obj = await dynamicImport(url)
		if (obj?.default) {
			return obj.default
		}
		console.warn("'export default' is not found in TailwindConfig.")
		return obj
	} catch (err) {
		// Failed to resolve module specifier "xxx"
		const error = err as Error
		const message = error.message
		if (message.startsWith("Failed to resolve module specifier")) {
			console.error("import statement is not support by web extension")
		}
		throw error
	} finally {
		URL.revokeObjectURL(url)
	}

	return undefined
}

export function createConfigReader(): TailwindConfigReader {
	return {
		async load({ uri, pnp, mode, onChange }) {
			if (uri) {
				const data = await vscode.workspace.fs.readFile(uri)
				const code = new TextDecoder().decode(data)
				return getObject(code)
			}
			return {}
		},
		closeWatcher() {
			//
		},
	}
}
