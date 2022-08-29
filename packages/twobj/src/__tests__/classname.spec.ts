import { tw } from "./defaultContext"

it("content", async () => {
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
