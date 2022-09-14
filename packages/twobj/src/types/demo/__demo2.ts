import colors from "../../config/defaultColors"
import { plugin } from "../../plugin"
import { CSSProperties, CSSValue } from "./../base"
import { ConfigJS } from "./../config"

const config: ConfigJS = {
	theme: {
		extend: {
			container: {
				padding: { sm: 123 },
			},
			colors: {
				...colors,
				custom: ({ opacityValue }) => {
					return `rgba(217, 245, 56, ${opacityValue})`
				},
			},
		},
	},
	plugins: [
		{
			handler({ addUtilities, theme }) {
				addUtilities(
					Object.fromEntries<CSSProperties>(
						Object.entries(theme("testPlugin")).map<[string, CSSProperties]>(([k, v]) => {
							return [`.test-${k}`, { testProperty: v as CSSValue }]
						}),
					),
				)
			},
			config: {
				theme: {
					testPlugin: {
						sm: "1rem",
						md: "2rem",
						lg: "3rem",
					},
				},
			},
		},
		plugin(
			({ addUtilities, theme }) => {
				addUtilities(
					Object.fromEntries<CSSProperties>(
						Object.entries(theme("testPlugin")).map<[string, CSSProperties]>(([k, v]) => {
							return [`.test-${k}`, { testProperty: v as CSSValue }]
						}),
					),
				)
				addUtilities({ color: "red" })
				addUtilities([{ color: "red" }])
			},
			{
				theme: {
					testPlugin: {
						sm: "1rem",
						md: "2rem",
						lg: "3rem",
					},
				},
			},
		),
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
			matchComponents({
				card: (value): CSSProperties[] => {
					return [
						{ color: value },
						{
							".card-header": {
								borderTopWidth: 3,
								borderTopColor: value,
							},
						},
						{
							".card-footer": {
								borderBottomWidth: 3,
								borderBottomColor: value,
							},
						},
					]
				},
			})
			matchVariant({
				tab(value) {
					if (value == null) return "& > *"
					return `&.${e(value ?? "")} > *`
				},
			})
		},
		function ({ addVariant }) {
			addVariant("test", "&::test")
			addVariant("test", ["& *::test", "&::test"])
		},
		({ addUtilities, addDefaults }) => {
			addDefaults("my-type", {
				"--my-var": "proximity",
			})

			addUtilities({
				".my-none": { "my-type": "none" },
				".my-x": {
					"@defaults my-type": {},
					"my-type": "x var(--my-var)",
				},
			})
		},
		plugin.withOptions<unknown>(() => {
			return function ({ addUtilities }) {
				//
			}
		})(),
		plugin.withOptions<unknown>(() => {
			return function ({ addUtilities }) {
				//
			}
		}),
	],
}
config
