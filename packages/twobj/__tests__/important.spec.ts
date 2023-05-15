import { createContext, resolveConfig } from "../src"
import { tw } from "./context"

test("important", async () => {
	expect(tw`text-black! text-white`).toEqual({ color: "#000 !important" })
	expect(tw`!text-black text-white`).toEqual({ color: "#000 !important" })
	expect(tw`(text-black)! text-white`).toEqual({ color: "#000 !important" })
	expect(tw`!(text-black)`).toEqual({ color: "#000 !important" })
	expect(tw`text-[#000]/30!`).toEqual({ color: "rgb(0 0 0 / 0.3) !important" })
	expect(tw`!text-[#000]/30`).toEqual({ color: "rgb(0 0 0 / 0.3) !important" })
	expect(tw`(text-[#000]/30)!`).toEqual({ color: "rgb(0 0 0 / 0.3) !important" })
	expect(tw`!(text-[#000]/30)`).toEqual({ color: "rgb(0 0 0 / 0.3) !important" })
	expect(tw`[color: #000]!`).toEqual({ color: "#000 !important" })
	expect(tw`![color: #000]`).toEqual({ color: "#000 !important" })
	expect(tw`([color: #000])!`).toEqual({ color: "#000 !important" })
	expect(tw`!([color: #000])`).toEqual({ color: "#000 !important" })

	let ctx = createContext(resolveConfig({ important: true }))
	expect(ctx.css("(text-black)")).toEqual({ color: "#000 !important" })
	expect(ctx.css("text-[#000]/30")).toEqual({ color: "rgb(0 0 0 / 0.3) !important" })
	expect(ctx.css("[color: #000]")).toEqual({ color: "#000 !important" })

	ctx = createContext(resolveConfig({ important: "#app" }))
	expect(ctx.css("after:(text-black)")).toEqual({
		"#app &": {
			"&::after": {
				"--tw-content": "''",
				color: "#000",
				content: "var(--tw-content)",
			},
		},
	})
	expect(ctx.css("text-[#000]/30")).toEqual({ "#app &": { color: "rgb(0 0 0 / 0.3)" } })
	expect(ctx.css("[color: #000]")).toEqual({ "#app &": { color: "#000" } })
	expect(ctx.css("[color: #000]!")).toEqual({ "#app &": { color: "#000 !important" } })
})
