import { getUnitFromNumberFunction, parseColor, splitCssParams } from "../src/parser"

test("getUnitFromNumberFunction", async () => {
	expect(getUnitFromNumberFunction("bottom 0px center")).toBeUndefined()
	expect(getUnitFromNumberFunction("min(0, 300)")).toBeNull()
	expect(getUnitFromNumberFunction("min(0px, 200rem)")).toEqual("px")
	expect(getUnitFromNumberFunction("min(0rem, 200px)")).toEqual("rem")
})

test("parseColor", async () => {
	expect(parseColor("red")).toEqual({ fn: "rgb", params: ["255", "0", "0"], range: [0, 3] })
	expect(parseColor("#ff0000")).toEqual({ fn: "rgb", params: ["255", "0", "0"], range: [0, 7] })
	expect(parseColor("rgb(41, 3, 120)")).toEqual({ fn: "rgb", params: ["41", "3", "120"], range: [0, 15] })
	expect(parseColor("rgb(41 3 120)")).toEqual({ fn: "rgb", params: ["41", "3", "120"], range: [0, 13] })
	expect(parseColor("hsl(33 93% 40%)")).toEqual({ fn: "hsl", params: ["33", "93%", "40%"], range: [0, 15] })
	expect(parseColor("hsl(a b% c%)")).toEqual({ fn: "hsl", params: ["a", "b%", "c%"], range: [0, 12] })
	expect(parseColor("hsl(var(--color))")).toEqual({
		fn: "hsl",
		params: [{ fn: "var", params: ["--color"], range: [4, 16] }],
		range: [0, 17],
	})
	expect(parseColor("var(--color)")).toEqual({ fn: "var", params: ["--color"], range: [0, 12] })
})

test("splitCssParams", async () => {
	const source = "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
	expect(splitCssParams(source)).toEqual([
		"0",
		"20px",
		"25px",
		"-5px",
		{ fn: "rgb", params: ["0", "0", "0", "0.1"], range: [17, 33] },
		"0",
		"8px",
		"10px",
		"-6px",
		{ fn: "rgb", params: ["0", "0", "0", "0.1"], range: [51, 67] },
	])
})
