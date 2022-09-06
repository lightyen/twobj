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
