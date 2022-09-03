import { getUnitFromNumberFunction, parseColor } from "../src/parser"

test("getUnitFromNumberFunction", async () => {
	expect(getUnitFromNumberFunction("bottom 0px center")).toBeUndefined()
	expect(getUnitFromNumberFunction("min(0, 300)")).toBeNull()
	expect(getUnitFromNumberFunction("min(0px, 200rem)")).toEqual("px")
	expect(getUnitFromNumberFunction("min(0rem, 200px)")).toEqual("rem")
})

test("parseColor", async () => {
	expect(parseColor("red")).toEqual({ fn: "rgb", params: ["255", "0", "0"] })
	expect(parseColor("#ff0000")).toEqual({ fn: "rgb", params: ["255", "0", "0"] })
	expect(parseColor("rgb(41, 3, 120)")).toEqual({ fn: "rgb", params: ["41", "3", "120"] })
	expect(parseColor("rgb(41 3 120)")).toEqual({ fn: "rgb", params: ["41", "3", "120"] })
	expect(parseColor("hsl(33 93% 40%)")).toEqual({ fn: "hsl", params: ["33", "93%", "40%"] })
	expect(parseColor("hsl(a b% c%)")).toEqual({ fn: "hsl", params: ["a", "b%", "c%"] })
	expect(parseColor("hsl(var(--color))")).toEqual({ fn: "hsl", params: [{ fn: "var", params: ["--color"] }] })
	expect(parseColor("var(--color)")).toEqual({ fn: "var", params: ["--color"] })
})
