import { createContext, resolveConfig } from "../src"

test("maxWidth extend", async () => {
	const ctx = createContext(
		resolveConfig({
			theme: {
				extend: {
					screens: {
						xxx: ["123px", "456px"],
						yyy: { min: "777px", max: "999px" },
					},
				},
			},
		}),
	)
	expect(ctx.css`max-w-screen-xxx`).toEqual({ maxWidth: "456px" })
	expect(ctx.css`max-w-screen-yyy`).toEqual({ maxWidth: "999px" })
})
