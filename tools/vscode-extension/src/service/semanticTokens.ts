import * as parser from "twobj/parser"
import vscode from "vscode"
import type { ExtractedToken, TextDocument } from "~/common/extractors/types"
import { defaultLogger as console } from "~/common/logger"
import type { ServiceOptions } from "~/shared"
import { TailwindLoader } from "./tailwind"

export function semanticTokens(
	tokens: ExtractedToken[],
	document: TextDocument,
	range: vscode.Range,
	state: TailwindLoader,
	options: ServiceOptions,
): vscode.SemanticTokens {
	//

	const docRange: [number, number] = [document.offsetAt(range.start), document.offsetAt(range.end)]
	const builder = new vscode.SemanticTokensBuilder()
	const start = process.hrtime.bigint()

	for (const token of tokens) {
		const { kind, start, end, value } = token
		if (start < docRange[0] || end >= docRange[1]) continue
		if (kind === "tw") {
			const { items } = parser.spread(value, { separator: state.separator })
			for (const { variants } of items) {
				for (const variant of variants) {
					const [a, b] = variant.range
					const position = document.positionAt(start + a)
					builder.push(position.line, position.character, b - a, 0, 1)
				}
			}
		}
	}

	const end = process.hrtime.bigint()
	console.trace(`semantic tokens (${Number((end - start) / 10n ** 6n)}ms)`)
	return builder.build()
}
