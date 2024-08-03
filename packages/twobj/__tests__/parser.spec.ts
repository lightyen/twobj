import { createContext, resolveConfig } from "../src"
import * as parser from "../src/parser"
import { createParser } from "../src/parser"

test("getUnitFromNumberFunction", async () => {
	expect(parser.getUnitFromNumberFunction("bottom 0px center")).toBeUndefined()
	expect(parser.getUnitFromNumberFunction("min(0, 300)")).toBeNull()
	expect(parser.getUnitFromNumberFunction("min(0px, 200rem)")).toEqual("px")
	expect(parser.getUnitFromNumberFunction("min(0rem, 200px)")).toEqual("rem")
})

test("splitAtTopLevelOnly", async () => {
	expect(parser.splitAtTopLevelOnly("bottom 0px center")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("min(0, 300)")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("min(0px, 200rem)")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("min(0rem, 200px)")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("top,right")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("top,right,[bottom,left]")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("top,right,[bottom,left], min(0px, 200em)")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly("top,right,'[bottom,left], min(0px, 200em)'")).toMatchSnapshot()
	expect(parser.splitAtTopLevelOnly(",right")).toEqual([
		{ value: "", range: [0, 0] },
		{ value: "right", range: [1, 6] },
	])
})

test("normalizeSelector", async () => {
	expect(parser.normalizeSelector("&:hover")).toEqual("&:hover")
	expect(parser.normalizeSelector(":hover")).toEqual("&:hover")
	expect(parser.normalizeSelector("svg")).toEqual("& svg")
	expect(parser.normalizeSelector("> *")).toEqual("& > *")
	expect(parser.normalizeSelector("::placeholder")).toEqual("&::placeholder")
	expect(parser.normalizeSelector(".test")).toEqual("& .test")
	expect(parser.normalizeSelector(".test &")).toEqual(".test &")
	expect(parser.normalizeSelector("@media print")).toEqual("@media print")
	expect(parser.normalizeSelector(".foo,.bar")).toEqual("& .foo, & .bar")
	expect(parser.normalizeSelector(".foo,.bar &")).toEqual("& .foo, .bar &")
	expect(parser.normalizeSelector("&.foo,.bar &")).toEqual("&.foo, .bar &")
	expect(parser.normalizeSelector(".foo,:nth-child(1)")).toEqual("& .foo, &:nth-child(1)")
	expect(parser.normalizeSelector("")).toEqual("&")
})

test("parseColor", async () => {
	expect(parser.parseColor("red")).toMatchObject({ fn: "rgb", params: ["255", "0", "0"], range: [0, 3] })
	expect(parser.parseColor("#ff0000")).toMatchObject({ fn: "rgb", params: ["255", "0", "0"], range: [0, 7] })
	expect(parser.parseColor("rgb(41, 3, 120)")).toMatchObject({
		kind: "color",
		fn: "rgb",
		params: ["41", "3", "120"],
		range: [0, 15],
		getText: expect.any(Function),
	})
	expect(parser.parseColor("rgb(41 3 120)")).toMatchObject({ fn: "rgb", params: ["41", "3", "120"], range: [0, 13] })
	expect(parser.parseColor("hsl(33 93% 40%)")).toMatchObject({
		kind: "color",
		fn: "hsl",
		params: ["33", "93%", "40%"],
		range: [0, 15],
		getText: expect.any(Function),
	})
	expect(parser.parseColor("hsl(a b% c%)")).toMatchObject({ fn: "hsl", params: ["a", "b%", "c%"], range: [0, 12] })
	expect(parser.parseColor("hsl(var(--color))")).toMatchObject({
		kind: "color",
		fn: "hsl",
		params: [{ fn: "var", params: ["--color"], range: [4, 16] }],
		range: [0, 17],
		getText: expect.any(Function),
	})
})

test("splitCssParams", async () => {
	const source = "0 20px 25px -5px rgb(0 0 0 / 0.1)"
	expect(parser.splitCssParams(source)).toMatchObject([
		"0",
		"20px",
		"25px",
		"-5px",
		expect.objectContaining({
			kind: "color",
			fn: "rgb",
			params: ["0", "0", "0"],
			opacity: "0.1",
			range: [17, 33],
			getText: expect.any(Function),
		}),
	])
})

test("tokenize", async () => {
	const parser = createParser()
	expect(parser.tokenize("bg-black")).toEqual(["bg-black"])
	expect(parser.tokenize("bg-black   text-black")).toEqual(["bg-black", "text-black"])
	expect(parser.tokenize("(  bg-black  )")).toEqual([["bg-black"]])
	expect(parser.tokenize("( (bg-black) )")).toEqual([[["bg-black"]]])
	expect(parser.tokenize("hover:bg-black")).toEqual([["hover:", "bg-black"]])
	expect(parser.tokenize("hover:(text-black bg-black)")).toEqual([["hover:", ["text-black", "bg-black"]]])
	expect(parser.tokenize("hover:")).toEqual([["hover:"]])
	expect(parser.tokenize("md:")).toEqual([["md:"]])
	expect(parser.tokenize(">md:")).toEqual([[">md:"]])
	expect(parser.tokenize("<md:")).toEqual([["<md:"]])
	expect(parser.tokenize("@md:")).toEqual([["@md:"]])
	expect(parser.tokenize("$md:")).toEqual([["$md:"]])
	expect(parser.tokenize("?md:")).toEqual([["?md:"]])
	expect(parser.tokenize("h-1/3d")).toEqual(["h-1/3d"])
})

test("separator", async () => {
	{
		const ctx = createContext(resolveConfig({ separator: "|" }))
		expect(ctx.css("in-range|text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range|text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range|!text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%) !important" },
		})
	}

	{
		const ctx = createContext(resolveConfig({ separator: "👎" }))
		expect(ctx.css("in-range👎text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range👎text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range👎!text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%) !important" },
		})
	}

	{
		const ctx = createContext(resolveConfig({ separator: "||" }))
		expect(ctx.css("in-range||text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range||text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range||!text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%) !important" },
		})
	}
})

test("parse the group of variants", async () => {
	const code1 = `!(variant1: variant2:(variant3:
		// comment
		variant4:) unknown [unknown: value]):!bg-black`
	const parser1 = createParser()
	const program = parser1.createProgram(code1)
	expect(program).toMatchSnapshot()
})
