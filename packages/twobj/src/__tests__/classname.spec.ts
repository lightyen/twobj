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

	expect(tw`before:bg-black`).toEqual({
		"&::before": {
			backgroundColor: "#000",
			content: "var(--tw-content)",
		},
	})

	expect(tw`before:(content-none bg-black)`).toEqual({
		"&::before": {
			"--tw-content": "none",
			backgroundColor: "#000",
			content: "var(--tw-content)",
		},
	})

	expect(tw`before:(content-['ABC'] bg-black)`).toEqual({
		"&::before": {
			"--tw-content": "'ABC'",
			backgroundColor: "#000",
			content: "var(--tw-content)",
		},
	})

	expect(tw`before:(content-['ABC'] bg-black content-none)`).toEqual({
		"&::before": {
			"--tw-content": "none",
			backgroundColor: "#000",
			content: "var(--tw-content)",
		},
	})
})
