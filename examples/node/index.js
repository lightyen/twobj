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
				matchUtilities(
					{
						custom(value) {
							return { "--helloworld": value }
						},
					},
					{ type: "color", values: theme("colors") },
				)
			},
		],
	}),
)


console.log(JSON.stringify(ctx.css("test"), null, 2))
console.log(JSON.stringify(ctx.css("custom-[red]/10"), null, 2))
