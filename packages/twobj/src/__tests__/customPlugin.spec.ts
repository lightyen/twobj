import { resolveConfig } from "../config/resolveConfig"
import { createContext } from "../core"

test("addUtilities with object", () => {
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

	expect(ctx.css`custom-object-fill`).toEqual({
		objectFit: "fill",
	})

	expect(ctx.css`custom-object-contain`).toEqual({
		objectFit: "contain",
	})

	expect(ctx.css`custom-object-cover`).toEqual({
		objectFit: "cover",
	})
})

test("addUtilities with array", () => {
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

	expect(ctx.css`custom-object-fill`).toEqual({
		objectFit: "fill",
	})

	expect(ctx.css`custom-object-contain`).toEqual({
		objectFit: "contain",
	})

	expect(ctx.css`custom-object-cover`).toEqual({
		objectFit: "cover",
	})
})

test("addComponents", () => {
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

	expect(ctx.css`btn-blue`).toEqual({
		backgroundColor: "blue",
		color: "white",
		padding: ".5rem 1rem",
		borderRadius: ".25rem",
		"&:hover": {
			backgroundColor: "darkblue",
		},
	})
})

test("addComponents with media queries", () => {
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

	expect(ctx.css`custom-container`).toEqual({
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

test("addComponents with nested rules", () => {
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

	expect(ctx.css`btn-blue`).toEqual({
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

test("escaped selectors", () => {
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

	expect(ctx.css`custom-top-1/4`).toEqual({
		top: "25%",
	})
})
