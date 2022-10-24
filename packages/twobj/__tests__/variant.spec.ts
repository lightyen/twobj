import { context, tw } from "./context"

test("plugin name", async () => {
	expect(context.resolveVariant("group-hover:")[1]?.pluginName).toEqual("pseudoClassVariants")
	expect(context.resolveVariant("group-hover/xxx:")[1]?.pluginName).toEqual("pseudoClassVariants")
	expect(context.resolveVariant("group-hover/[xxx]:")[1]?.pluginName).toEqual("pseudoClassVariants")
	expect(context.resolveVariant("group-[xxx]:")[1]?.pluginName).toEqual("pseudoClassVariants")
})

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
		"& *::marker, &::marker": {
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

test("supports", async () => {
	expect(tw`supports-[display: grid]:bg-black`).toEqual({
		"@supports (display: grid)": {
			backgroundColor: "#000",
		},
	})
	expect(tw`supports-[abc-def]:bg-black`).toEqual({
		"@supports (abc-def: var(--tw))": {
			backgroundColor: "#000",
		},
	})
})

test("group", async () => {
	expect(tw`group-invalid:block`).toEqual({
		".group:invalid &": {
			display: "block",
		},
	})
	expect(tw`group-[]:block`).toEqual({
		".group &": {
			display: "block",
		},
	})
	expect(tw`group-[.is-published]:block`).toEqual({
		".group.is-published &": {
			display: "block",
		},
	})
	expect(tw`group-[:nth-of-type(3) &]:block`).toEqual({
		":nth-of-type(3) .group &": {
			display: "block",
		},
	})
})

test("peer", async () => {
	expect(tw`peer-invalid:block`).toEqual({
		".peer:invalid ~ &": {
			display: "block",
		},
	})
	expect(tw`peer-[]:block`).toEqual({
		".peer ~ &": {
			display: "block",
		},
	})
	expect(tw`peer-[xxx]:block`).toEqual({
		".peerxxx ~ &": {
			display: "block",
		},
	})
	expect(tw`peer-[.is-published]:block`).toEqual({
		".peer.is-published ~ &": {
			display: "block",
		},
	})
	expect(tw`peer-[:nth-of-type(3) &]:block`).toEqual({
		":nth-of-type(3) .peer ~ &": {
			display: "block",
		},
	})
})
