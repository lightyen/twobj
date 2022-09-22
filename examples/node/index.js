import { createContext, resolveConfig } from "twobj"

const ctx = createContext(
	resolveConfig({
		theme: {
			extend: {
				tabSize: {
					px: "1px",
				},
				colors: {
					bar: "rgb(var(--color) / <alpha-value>)",
					qoo: function () {
						return "rgb(var(--color))"
					},
					"foo-5": "#056660",
					"foo-5/10": "#051060",
					"foo-5/10/10%": "#651025",
					space: {
						"1/1": "#051025",
					},
				},
			},
			custom: {
				helloworld(theme, utils) {
					console.log(theme("colors.black"))
				},
			},
		},
		plugins: [
			function ({ matchUtilities, matchComponents, matchVariant, theme, e }) {
				matchUtilities({
					tab(value) {
						return {
							tabSize: value,
						}
					},
				})
				matchComponents(
					{
						test(value) {
							return {
								"&.test": {
									backgroundColor: value,
								},
							}
						},
					},
					{ values: theme("colors.cyan") },
				)
				matchVariant({
					tab(value) {
						if (value == null) return "& > *"
						return `&.${e(value ?? "")} > *`
					},
				})
				matchVariant("screen", (value) => `@media (min-width: ${value ?? "0px"})`)
			},
		],
	}),
)

// console.log(ctx.getColorClasses())
