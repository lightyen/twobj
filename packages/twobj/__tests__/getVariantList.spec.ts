import { context } from "./context"
import variantList from "./variants.json"

test("variantList", async () => {
	const variantListSet = context.getVariants()
	const originSet = new Set<string>(variantList)

	for (const s of variantListSet) {
		expect(originSet).toContain(s)
	}

	for (const s of originSet) {
		expect(variantListSet).toContain(s)
	}
})
