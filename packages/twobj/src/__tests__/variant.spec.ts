import { tw } from "./defaultContext"

it("before and after", async () => {
	expect(tw`before:bg-black`).toEqual({
		"&::before": {
			backgroundColor: "#000",
			content: "var(--tw-content)",
		},
	})
	expect(tw`after:bg-black`).toEqual({
		"&::after": {
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

	expect(tw`after:(content-none bg-black)`).toEqual({
		"&::after": {
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

	expect(tw`after:(content-['ABC'] bg-black)`).toEqual({
		"&::after": {
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

	expect(tw`after:(content-['ABC'] bg-black content-none)`).toEqual({
		"&::after": {
			"--tw-content": "none",
			backgroundColor: "#000",
			content: "var(--tw-content)",
		},
	})

	expect(tw`sm:(
			hover:(
				text-pink-500
				before:(
					content-['ABC'] bg-black content-none
				)
			)
			flex
		)`).toEqual({
		"@media (min-width: 640px)": {
			"@media (hover: hover) and (pointer: fine)": {
				"&:hover": {
					color: "#ec4899",
					"&::before": {
						"--tw-content": "none",
						backgroundColor: "#000",
						content: "var(--tw-content)",
					},
				},
			},
			display: "flex",
		},
	})
})
