import { resolveConfig } from "../config"
import { createContext } from "../core"

test("expandAtRules", () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addUtilities }) {
					addUtilities({
						".test": {
							[`@screen\n  md`]: { borderColor: "black" },
						},
					})
				},
			],
		}),
	)

	expect(ctx.css`test`).toEqual({
		"@media (min-width: 768px)": {
			borderColor: "black",
		},
	})
})
