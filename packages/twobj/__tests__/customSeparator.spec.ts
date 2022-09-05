import { createContext, resolveConfig } from "../src"

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
		const ctx = createContext(resolveConfig({ separator: "%" }))
		expect(ctx.css("in-range%text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range%text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range%!text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%) !important" },
		})
	}

	{
		const ctx = createContext(resolveConfig({ separator: "<" }))
		expect(ctx.css("in-range<text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range<text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range<!text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%) !important" },
		})
	}

	{
		const ctx = createContext(resolveConfig({ separator: "@" }))
		expect(ctx.css("in-range@text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range@text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range@!text-[rgb(202 202 202)]/[30%]")).toEqual({
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

	{
		const ctx = createContext(resolveConfig({ separator: "--" }))
		expect(ctx.css("in-range--text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range--text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range--text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%)" },
		})
		expect(ctx.css("in-range---mt-1")).toEqual({
			"&:in-range": { marginTop: "-0.25rem" },
		})
	}

	{
		const ctx = createContext(resolveConfig({ separator: "!" }))
		expect(ctx.css("in-range!text-black/10")).toEqual({
			"&:in-range": { color: "rgb(0 0 0 / 0.1)" },
		})
		expect(ctx.css("in-range!text-[rgb(202 202 202)]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202)" },
		})
		expect(ctx.css("in-range!!text-[rgb(202 202 202)]/[30%]")).toEqual({
			"&:in-range": { color: "rgb(202 202 202 / 30%) !important" },
		})
		expect(ctx.css("in-range!!text-black")).toEqual({
			"&:in-range": { color: "#000 !important" },
		})
		expect(ctx.css("in-range!text-black!")).toEqual({})
	}
})
