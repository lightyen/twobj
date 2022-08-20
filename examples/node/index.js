import { createContext, resolveConfig } from "twobj"

const ctx = createContext(
	resolveConfig({
		theme: {
			extend: {
				colors: {
					primary: {
						DEFAULT: "rgb(var(--primary) / <alpha-value>)",
					},
				},
			},
		},
		plugins: [
			({ addUtilities, matchUtilities, theme }) => {
				addUtilities({
					".test": {
						color: theme("colors.primary"),
					},
				})
			},
		],
	}),
)

console.log(ctx.theme("spacing"))
console.log(ctx.theme("spacing.2"))
console.log(ctx.theme("fontSize.xl"))
console.log(ctx.theme("colors.red.500/0.1"))
console.log(ctx.theme("colors.primary.DEFAULT/0.2"))
console.log(ctx.theme("colors.primary/0.3"))
console.log(ctx.theme("colors.primary"))
console.log(JSON.stringify(ctx.css("test"), null, 2))
