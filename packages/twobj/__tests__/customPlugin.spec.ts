import { createContext, resolveConfig } from "../src"
import { createTw } from "./context"

test("addBase", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				({ addBase }) => {
					addBase({
						".custom": {
							backgroundColor: "black",
						},
						"div.custom": {
							color: "white",
						},
					})
				},
			],
		}),
	)
	expect(ctx.globalStyles).toMatchObject({
		".custom": {
			backgroundColor: "black",
		},
		"div.custom": {
			color: "white",
		},
	})
})

test("addUtilities with object", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addUtilities }) {
					addUtilities({
						".custom-object-fill": {
							"object-fit": "fill",
						},
						".custom-object-contain": {
							"object-fit": "contain",
						},
						".custom-object-cover": {
							"object-fit": "cover",
						},
					})
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`custom-object-fill`).toEqual({
		objectFit: "fill",
	})

	expect(tw`custom-object-contain`).toEqual({
		objectFit: "contain",
	})

	expect(tw`custom-object-cover`).toEqual({
		objectFit: "cover",
	})
})

test("addUtilities with array", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addUtilities }) {
					addUtilities([
						{
							".custom-object-fill": {
								"object-fit": "fill",
							},
							".custom-object-contain": {
								"object-fit": "contain",
							},
							".custom-object-cover": {
								"object-fit": "cover",
							},
						},
					])
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`custom-object-fill`).toEqual({
		objectFit: "fill",
	})

	expect(tw`custom-object-contain`).toEqual({
		objectFit: "contain",
	})

	expect(tw`custom-object-cover`).toEqual({
		objectFit: "cover",
	})
})

test("addVariant and addUtilities", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addUtilities, addVariant }) {
					addVariant("test", () => ["@media (test)"])
					addUtilities({
						".foo": {
							display: "grid",
							"& > *": {
								"grid-column": "span 2",
							},
						},
					})
				},
			],
		}),
	)

	expect(ctx.css("test:foo")).toEqual({
		"@media (test)": {
			display: "grid",
			"& > *": {
				gridColumn: "span 2",
			},
		},
	})
})

test("addComponents", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addComponents }) {
					addComponents({
						".btn-blue": {
							backgroundColor: "blue",
							color: "white",
							padding: ".5rem 1rem",
							borderRadius: ".25rem",
						},
						".btn-blue:hover": {
							backgroundColor: "darkblue",
						},
					})
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`btn-blue`).toEqual({
		backgroundColor: "blue",
		color: "white",
		padding: ".5rem 1rem",
		borderRadius: ".25rem",
		"&:hover": {
			backgroundColor: "darkblue",
		},
	})
})

test("addComponents with media queries", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addComponents }) {
					addComponents({
						".custom-container": {
							width: "100%",
						},
						"@media (min-width: 100px)": {
							".custom-container": {
								maxWidth: "100px",
							},
						},
						"@media (min-width: 200px)": {
							".custom-container": {
								maxWidth: "200px",
							},
						},
						"@media (min-width: 300px)": {
							".custom-container": {
								maxWidth: "300px",
							},
						},
					})
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`custom-container`).toEqual({
		width: "100%",
		"@media (min-width: 100px)": {
			maxWidth: "100px",
		},
		"@media (min-width: 200px)": {
			maxWidth: "200px",
		},
		"@media (min-width: 300px)": {
			maxWidth: "300px",
		},
	})
})

test("addComponents with nested rules", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addComponents }) {
					addComponents({
						".btn-blue": {
							backgroundColor: "blue",
							color: "white",
							padding: ".5rem 1rem",
							borderRadius: ".25rem",
							"&:hover": {
								backgroundColor: "darkblue",
							},
							"@media (min-width: 500px)": {
								"&:hover": {
									backgroundColor: "orange",
								},
							},
							"> a": {
								color: "red",
							},
							"h1 &": {
								color: "purple",
							},
						},
					})
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`btn-blue`).toEqual({
		backgroundColor: "blue",
		color: "white",
		padding: ".5rem 1rem",
		borderRadius: ".25rem",
		"&:hover": {
			backgroundColor: "darkblue",
		},
		"@media (min-width: 500px)": {
			"&:hover": {
				backgroundColor: "orange",
			},
		},
		"> a": {
			color: "red",
		},
		"h1 &": {
			color: "purple",
		},
	})
})

test("escaped selectors", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ e, addUtilities }) {
					addUtilities({
						[`.${e("custom-top-1/4")}`]: {
							top: "25%",
						},
					})
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`custom-top-1/4`).toEqual({
		top: "25%",
	})
})

test("addVariant", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addVariant }) {
					addVariant("abc", "abc &")
					addVariant("x", ["&:abc", "&:def"])
					addVariant("y", () => "&:xyz")
					addVariant("z", ["&:hover", () => ["&::placeholder { :test }"]])
				},
			],
		}),
	)
	const tw = createTw(ctx)

	expect(tw`abc:inline`).toEqual({
		"abc &": {
			display: "inline",
		},
	})
	expect(tw`x:inline`).toEqual({
		"&:abc, &:def": {
			display: "inline",
		},
	})
	expect(tw`y:inline`).toEqual({
		"&:xyz": {
			display: "inline",
		},
	})
	expect(tw`z:inline`).toEqual({
		"&:hover": {
			display: "inline",
		},
		"&::placeholder": {
			"&:test": {
				display: "inline",
			},
		},
	})
	expect(tw`(y:z:):inline`).toEqual({
		"&:xyz": {
			"&:hover": {
				display: "inline",
			},
			"&::placeholder": {
				"&:test": {
					display: "inline",
				},
			},
		},
	})
	expect(tw`(y: z:):inline`).toEqual({
		"&:xyz, &:hover": {
			display: "inline",
		},
		"&::placeholder": {
			"&:test": {
				display: "inline",
			},
		},
	})
})

test("matchUtilities", async () => {
	const ctx = createContext(
		resolveConfig({
			corePlugins: { preflight: false },
			plugins: [
				function ({ matchUtilities }) {
					matchUtilities(
						{
							test: (value, { modifier }) => {
								if (modifier) {
									if (modifier === "foo") {
										value = value + "_" + "mewtwo"
									} else {
										value = value + "_" + modifier
									}
								}
								return {
									color: value,
								}
							},
						},
						{
							values: {
								DEFAULT: "default",
								bar: "bar",
								"1": "one",
							},
						},
					)
				},
			],
		}),
	)

	expect(ctx.css("test")).toEqual({ color: "default" })
	expect(ctx.css("test/foo")).toEqual({ color: "default_mewtwo" })
	expect(ctx.css("test-1/foo")).toEqual({ color: "one_mewtwo" })
	expect(ctx.css("test/bar")).toEqual({ color: "default_bar" })
	expect(ctx.css("test/[bar]")).toEqual({ color: "default_bar" })
	expect(ctx.css("test-1/[bar]")).toEqual({ color: "one_bar" })
	expect(ctx.css("test-1/[bar]")).toEqual({ color: "one_bar" })
})

test("matchVariant", async () => {
	const ctx = createContext(
		resolveConfig({
			corePlugins: { preflight: false },
			plugins: [
				function ({ matchVariant }) {
					matchVariant(
						"tooltip",
						(value, { modifier }) => {
							const selectors = `&[data-location="${value}"]`
							if (modifier) {
								return selectors + " ." + modifier
							}
							return selectors
						},
						{
							values: {
								DEFAULT: "default",
								bottom: "bottom",
								top: "top",
							},
						},
					)
				},
			],
		}),
	)

	expect(ctx.css("tooltip-bottom:mt-2")).toEqual({
		'&[data-location="bottom"]': {
			marginTop: "0.5rem",
		},
	})
	expect(ctx.css("tooltip-top:mb-2")).toEqual({
		'&[data-location="top"]': {
			marginBottom: "0.5rem",
		},
	})
	expect(ctx.css("tooltip-[right]:mb-2")).toEqual({
		'&[data-location="right"]': {
			marginBottom: "0.5rem",
		},
	})
	expect(ctx.css("tooltip:mb-2")).toEqual({
		'&[data-location="default"]': {
			marginBottom: "0.5rem",
		},
	})
	expect(ctx.css("tooltip/bar:mb-2")).toEqual({
		'&[data-location="default"] .bar': {
			marginBottom: "0.5rem",
		},
	})
	expect(ctx.css("tooltip-top/bar:mb-2")).toEqual({
		'&[data-location="top"] .bar': {
			marginBottom: "0.5rem",
		},
	})
	expect(ctx.css("tooltip-[foo]/bar:mb-2")).toEqual({
		'&[data-location="foo"] .bar': {
			marginBottom: "0.5rem",
		},
	})
})
