import { expect, test } from "vitest"
import { createContext, resolveConfig } from "../src"

test("prefix", async () => {
	let ctx = createContext(resolveConfig({ prefix: "xt-" }))
	expect(ctx.css("(text-black)")).toEqual({})
	expect(ctx.css("(xt-text-black)")).toEqual({ color: "#000" })
	expect(ctx.css("xt-text-[#000]/30")).toEqual({ color: "color-mix(in srgb, rgb(0 0 0) 30%, transparent)" })
	expect(ctx.css("[color: #000]")).toEqual({ color: "#000" })

	ctx = createContext(resolveConfig({ prefix: "xt-", important: "#app" }))
	expect(ctx.css("after:(xt-text-black)")).toEqual({
		"#app &": {
			"&::after": {
				"--tw-content": "''",
				color: "#000",
				content: "var(--tw-content)",
			},
		},
	})
	expect(ctx.css("xt-text-[#000]/30")).toEqual({
		"#app &": { color: "color-mix(in srgb, rgb(0 0 0) 30%, transparent)" },
	})
	expect(ctx.css("[color: #000]")).toEqual({ "#app &": { color: "#000" } })
})
