import { tw } from "./context"

test("content", async () => {
	expect(tw`content`).toEqual({})

	expect(tw`content-none`).toEqual({
		"--tw-content": "none",
		content: "var(--tw-content)",
	})

	expect(tw`content-["ABC"]`).toEqual({
		"--tw-content": '"ABC"',
		content: "var(--tw-content)",
	})
})

test("display", async () => {
	expect(tw`flex`).toEqual({ display: "flex" })
})

test("flex", async () => {
	expect(tw`flex-auto`).toEqual({ flex: "1 1 auto" })
	expect(tw`flex-[1 1]`).toEqual({ flex: "1 1" })
})

test("flexGrow", async () => {
	expect(tw`flex-grow`).toEqual({})
	expect(tw`grow`).toEqual({ flexGrow: "1" })
})

test("fill", async () => {
	expect(tw`fill-red-500`).toEqual({ fill: "#ef4444" })
	expect(tw`fill-[#121029]`).toEqual({ fill: "#121029" })
	expect(tw`fill-[url(#helloworld)]`).toEqual({ fill: "url(#helloworld)" })
	expect(tw`fill-none`).toEqual({ fill: "none" })
})

test("stroke", async () => {
	expect(tw`stroke-red-500`).toEqual({ stroke: "#ef4444" })
	expect(tw`stroke-[#121029]`).toEqual({ stroke: "#121029" })
	expect(tw`stroke-none`).toEqual({ stroke: "none" })
})
