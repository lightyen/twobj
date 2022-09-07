import { createContext, resolveConfig } from "../src"
import * as parser from "../src/parser"
import { createParser, NodeType, removeComments } from "../src/parser"

test("getUnitFromNumberFunction", async () => {
	expect(parser.getUnitFromNumberFunction("bottom 0px center")).toBeUndefined()
	expect(parser.getUnitFromNumberFunction("min(0, 300)")).toBeNull()
	expect(parser.getUnitFromNumberFunction("min(0px, 200rem)")).toEqual("px")
	expect(parser.getUnitFromNumberFunction("min(0rem, 200px)")).toEqual("rem")
})

test("parseColor", async () => {
	expect(parser.parseColor("red")).toEqual({ fn: "rgb", params: ["255", "0", "0"], range: [0, 3] })
	expect(parser.parseColor("#ff0000")).toEqual({ fn: "rgb", params: ["255", "0", "0"], range: [0, 7] })
	expect(parser.parseColor("rgb(41, 3, 120)")).toEqual({ fn: "rgb", params: ["41", "3", "120"], range: [0, 15] })
	expect(parser.parseColor("rgb(41 3 120)")).toEqual({ fn: "rgb", params: ["41", "3", "120"], range: [0, 13] })
	expect(parser.parseColor("hsl(33 93% 40%)")).toEqual({ fn: "hsl", params: ["33", "93%", "40%"], range: [0, 15] })
	expect(parser.parseColor("hsl(a b% c%)")).toEqual({ fn: "hsl", params: ["a", "b%", "c%"], range: [0, 12] })
	expect(parser.parseColor("hsl(var(--color))")).toEqual({
		fn: "hsl",
		params: [{ fn: "var", params: ["--color"], range: [4, 16] }],
		range: [0, 17],
	})
	expect(parser.parseColor("var(--color)")).toEqual({ fn: "var", params: ["--color"], range: [0, 12] })
})

test("splitCssParams", async () => {
	const source = "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
	expect(parser.splitCssParams(source)).toEqual([
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

test("spread", async () => {
	const parser = createParser()
	const source = `bg-gray-500 padding[ 3rem ]!
	hover:(border-4 border-blue-500)
	[
		.group:hover,
		// .group:focus]
	]:!(text-red-700)// bg-primary
	/* text-error ()
	*/()
	custom/30 text-yellow-600/80 bg-gray-500/[.3]
	bg-[url(http://example)]
	text-[rgba(3 3 3 / .8)]/[.2] sm:hover: ( q-test`
	const result = parser.spread(source)
	expect(removeComments(source, true).length).toEqual(source.length)
	expect(result.items.map(i => [i.target.type, source.slice(...i.target.range)])).toEqual([
		[NodeType.ClassName, "bg-gray-500"],
		[NodeType.ShortCss, "padding[ 3rem ]"],
		[NodeType.ClassName, "border-4"],
		[NodeType.ClassName, "border-blue-500"],
		[NodeType.ClassName, "text-red-700"],
		[NodeType.ClassName, "custom/30"],
		[NodeType.ClassName, "text-yellow-600/80"],
		[NodeType.ArbitraryClassname, "bg-gray-500/[.3]"],
		[NodeType.ArbitraryClassname, "bg-[url(http://example)]"],
		[NodeType.ArbitraryClassname, "text-[rgba(3 3 3 / .8)]/[.2]"],
	])
})

test("spread all", () => {
	const parser = createParser()
	const text = `
		class-value
		(class-value)
		hover:class-value
		hover:(class-value)
		[]:class-value
		hover:[]:class-value
		any-[]:class-value
		hover:any-[]:class-value
		class-[value]
		class-value/opacity
		class-[value]/[opacity]
		class-[value]/opacity
		class-value/[opacity]
		[prop: value]
		prop[value]
		x

		// important prefix
		!class-value
		!(class-value)
		hover:!class-value
		hover:!(class-value)
		[]:!class-value
		hover:[]:!class-value
		any-[]:!class-value
		hover:any-[]:!class-value
		!class-[value]
		!class-value/opacity
		!class-[value]/[opacity]
		!class-[value]/opacity
		!class-value/[opacity]
		![prop: value]
		!prop[value]

		// important after
		class-value!
		(class-value)!
		hover:class-value!
		hover:(class-value)!
		[]:class-value!
		hover:[]:class-value!
		any-[]:class-value!
		hover:any-[]:class-value!
		class-[value]!
		class-value/opacity!
		class-[value]/[opacity]!
		class-[value]/opacity!
		class-value/[opacity]!
		[prop: value]!
		prop[value]!
	`
	expect(removeComments(text, true).length).toEqual(text.length)
	expect(parser.spread(text).items.map(i => i.target.type)).toEqual([
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryProperty,
		NodeType.ShortCss,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryProperty,
		NodeType.ShortCss,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ClassName,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryClassname,
		NodeType.ArbitraryProperty,
		NodeType.ShortCss,
	])

	expect(parser.spread(text).items.map(i => i.important)).toEqual([
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
	])

	expect(parser.spread(text).items.map(i => i.target.important)).toEqual([
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		false,
		true,
		false,
		true,
		false,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		false,
		true,
		false,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		true,
	])
})

test("hover and suggest", async () => {
	const parser = createParser()
	const source = `bg-gray-500 padding[ 3rem ]!
	hover:(border-4 border-blue-500)
	[
		.group:hover,
		// .group:focus]
	]:!(text-red-700)// bg-primary
	/* text-error ()
	*/()
	custom/30 text-yellow-600/80 bg-gray-500/[.3]
	bg-[url(http://example)]
	text-[rgba(3 3 3 / .8)]/[.2] sm:hover: ( q-test`
	expect(removeComments(source, true).length).toEqual(source.length)

	expect(parser.hover(source, 32)).toMatchObject({
		type: "variant",
		target: {
			type: NodeType.SimpleVariant,
			range: [30, 36],
			id: {
				type: NodeType.Identifier,
				range: [30, 35],
			},
		},
	})

	expect(parser.hover(source, 117)).toMatchObject({
		type: "classname",
		important: true,
		target: {
			type: NodeType.ClassName,
			range: [106, 118],
			important: false,
		},
		value: "text-red-700",
		variants: [
			{
				type: NodeType.ArbitrarySelector,
				range: [64, 104],
				selector: {
					type: NodeType.CssSelector,
					range: [65, 102],
				},
			},
		],
	})

	expect(parser.hover(source, 118)).toEqual(undefined)

	expect(parser.suggest(source, 118)).toMatchObject({
		inComment: false,
		target: {
			type: NodeType.ClassName,
			range: [106, 118],
			important: false,
		},
		variants: [
			{
				type: NodeType.ArbitrarySelector,
				range: [64, 104],
				selector: {
					type: NodeType.CssSelector,
					range: [65, 102],
				},
			},
		],
	})

	const code = `
	//bg-black
	bg-[url(http://sdfsdsdos)]
	w-1//1
	h-1/3//asas
	after:(
		bg-black
		bg-[url(http://sdfsdsdos)]
		bg-[url(http://sdfsdsdos)]/10%
		w-1//1
		w-1/[23]//1
		h-1/3d//asas
		accent-red-100/1//0%/20%
		accent-[url(http://sdfsdsdos)]   sa
	)
	[
		// comment
	]
	[
		// comment
	]:
	`
	expect(parser.suggest(code, 12)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 40)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 48)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 61)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 70)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 81)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 110)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 143)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 152)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 166)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 181)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 208)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 240)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 241)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 242)).toMatchObject({ inComment: false })
	expect(parser.suggest(code, 265)).toMatchObject({ inComment: true })
	expect(parser.suggest(code, 284)).toMatchObject({ inComment: true })

	expect(removeComments(code, true).length).toEqual(code.length)

	expect(removeComments(`[color: url(http://example)]`, true)).toEqual(`[color: url(http://example)]`)
	expect(removeComments(`[// comments\n]:bg-black`, true)).toEqual(`[           \n]:bg-black`)
})
