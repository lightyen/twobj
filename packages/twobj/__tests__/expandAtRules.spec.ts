import { resolveConfig } from "../src/config"
import { createContext } from "../src/core"

test("expandAtRules", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				function ({ addUtilities }) {
					addUtilities({
						".test": {
							[`@screen\n  md`]: { borderColor: "black" },
						},
						".test2": {
							"@apply bg-black text-white md:bg-yellow-400": {},
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

	expect(ctx.css`test2`).toEqual({
		backgroundColor: "#000",
		color: "#fff",
		"@media (min-width: 768px)": {
			backgroundColor: "#facc15",
		},
	})
})
