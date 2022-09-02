import { context } from "./context"

test("consider to remove unambiguous utilities's type because of useless", async () => {
	const result: [string, string][] = []
	for (const [key, types] of context.arbitraryUtilities) {
		const t = Array.from(types.keys())
		if (t.length === 1 && t[0] !== "any" && t[0] !== "color") {
			result.push([t[0], key])
		}
	}
	expect(result).toEqual([])
})
