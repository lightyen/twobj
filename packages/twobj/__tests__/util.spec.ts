import { merge } from "../src/util"

test("merge object", async () => {
	expect(merge({ a: { b: { c: 24 } } }, { a: { b: { d: "he" } } })).toEqual({
		a: {
			b: {
				c: 24,
				d: "he",
			},
		},
	})

	expect(merge({ a: { b: { c: 24 } } }, { a: { b: { c: ["he", "sd"] } } })).toEqual({
		a: {
			b: {
				c: [24, "he", "sd"],
			},
		},
	})

	expect(merge({ a: { b: { c: ["12", "34"] } } }, { a: { b: { c: ["he", "sd"] } } })).toEqual({
		a: {
			b: {
				c: ["12", "34", "he", "sd"],
			},
		},
	})
})
