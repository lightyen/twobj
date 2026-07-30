import { expect, test } from "vitest"
import checkListArray from "./classList.json"
import { context } from "./context"

test("classList", () => {
	const twobjSet = context.getUtilities()
	const checkList = new Set<string>(checkListArray)

	for (const s of twobjSet) {
		expect(checkList).toContain(s)
	}

	for (const s of checkList) {
		expect(twobjSet).toContain(s)
	}
})
