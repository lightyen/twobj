import { createContext, resolveConfig } from "../src"

test("darkMode", async () => {
	const ctx0 = createContext(resolveConfig())
	const ctx1 = createContext(resolveConfig({ darkMode: "class" }))
	const ctx2 = createContext(resolveConfig({ darkMode: ["class", ".test-dark"] }))

	expect(ctx0.css("dark:bg-black")).toEqual({
		"@media (prefers-color-scheme: dark)": {
			backgroundColor: "#000",
		},
	})
	expect(ctx1.css("dark:bg-black")).toEqual({
		".dark &": {
			backgroundColor: "#000",
		},
	})
	expect(ctx2.css("dark:bg-black")).toEqual({
		".test-dark &": {
			backgroundColor: "#000",
		},
	})
})
