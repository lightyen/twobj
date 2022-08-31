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
