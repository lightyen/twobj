import { merge } from "../util"

it("merge object", () => {
	const a = { a: { b: { c: 24 } } }
	const b = { a: { b: { d: "he" } } }
	const result = merge(a, b)
	expect(result).toEqual({
		a: {
			b: {
				c: 24,
				d: "he",
			},
		},
	})
})
