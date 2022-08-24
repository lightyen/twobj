import type { Extractor } from "./types"

const rawExtrator: Extractor = {
	acceptLanguage(languageId) {
		return languageId === "tw"
	},
	findAll(languageId, code) {
		return [
			{
				start: 0,
				end: code.length,
				value: code,
				kind: "tw",
			},
		]
	},
	find(languageId, code, position, hover) {
		return {
			start: 0,
			end: code.length,
			value: code,
			kind: "tw",
		}
	},
}
export default rawExtrator
