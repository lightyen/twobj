import { tw } from "./context"

test("hover", async () => {
	expect(tw`hover:bg-black`).toEqual({
		"@media (hover: hover) and (pointer: fine)": {
			"&:hover": {
				backgroundColor: "#000",
			},
		},
	})
})

test("marker", async () => {
	expect(tw`marker:bg-black`).toEqual({
		"& *::marker": {
			backgroundColor: "#000",
		},
		"&::marker": {
			backgroundColor: "#000",
		},
	})
})

test("open", async () => {
	expect(tw`open:bg-black`).toEqual({
		"&[open]": {
			backgroundColor: "#000",
		},
	})
})

test("first-of-type", async () => {
	expect(tw`first-of-type:bg-black`).toEqual({
		"&:first-of-type": {
			backgroundColor: "#000",
		},
	})
})

test("indeterminate", async () => {
	expect(tw`indeterminate:bg-black`).toEqual({
		"&:indeterminate": {
			backgroundColor: "#000",
		},
	})
})

test("before and after", async () => {
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
