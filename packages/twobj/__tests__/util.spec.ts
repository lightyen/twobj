import { flattenColorPalette, merge } from "../src/util"

test("merge object", async () => {
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

test("flattenColorPalette", async () => {
	expect(
		flattenColorPalette({
			abc: {
				x: {
					100: 123,
					200: 223,
				},
				y: {
					100: 123,
					200: 223,
				},
			},
		}),
	).toEqual({
		"abc-x-100": 123,
		"abc-x-200": 223,
		"abc-y-100": 123,
		"abc-y-200": 223,
	})
})
