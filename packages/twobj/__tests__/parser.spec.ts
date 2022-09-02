import { getUnitFromNumberFunction } from "../src/parser"

test("getUnitFromNumberFunction", async () => {
	expect(getUnitFromNumberFunction("bottom 0px center")).toBeUndefined()
	expect(getUnitFromNumberFunction("min(0, 300)")).toBeNull()
	expect(getUnitFromNumberFunction("min(0px, 200rem)")).toEqual("px")
	expect(getUnitFromNumberFunction("min(0rem, 200px)")).toEqual("rem")
})
