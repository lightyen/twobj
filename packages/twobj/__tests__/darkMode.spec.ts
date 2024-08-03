import { createContext, resolveConfig } from "../src"

test("darkMode0", async () => {
	const ctx0 = createContext(resolveConfig())
	const ctx1 = createContext(resolveConfig({ darkMode: "class" }))
	const ctx2 = createContext(resolveConfig({ darkMode: ["class", ".test-dark"] }))

	expect(ctx0.css("dark:bg-black")).toEqual({
		"@media (prefers-color-scheme: dark)": {
			backgroundColor: "#000",
		},
	})
	expect(ctx1.css("dark:bg-black")).toEqual({
		":is(.dark &)": {
			backgroundColor: "#000",
		},
	})
	expect(ctx2.css("dark:bg-black")).toEqual({
		":is(.test-dark &)": {
			backgroundColor: "#000",
		},
	})
})

test("darkMode1", async () => {
	const ctx1 = createContext(resolveConfig({ darkMode: "selector" }))
	const ctx2 = createContext(resolveConfig({ darkMode: ["selector", ".test-dark"] }))

	expect(ctx1.css("dark:bg-black")).toEqual({
		"&:where(.dark, .dark *)": {
			backgroundColor: "#000",
		},
	})
	expect(ctx2.css("dark:bg-black")).toEqual({
		"&:where(.test-dark, .test-dark *)": {
			backgroundColor: "#000",
		},
	})
})

test("darkMode2", async () => {
	const ctx0 = createContext(resolveConfig({ darkMode: ["variant", ".test-dark"] }))
	const ctx1 = createContext(resolveConfig({ darkMode: ["variant", ".test-dark &"] }))
	const ctx2 = createContext(resolveConfig({ darkMode: ["variant", () => ":is([abc])"] }))

	expect(ctx0.css("dark:bg-black")).toEqual({
		"& .test-dark": {
			backgroundColor: "#000",
		},
	})

	expect(ctx1.css("dark:bg-black")).toEqual({
		".test-dark &": {
			backgroundColor: "#000",
		},
	})

	expect(ctx2.css("dark:bg-black")).toEqual({
		"&:is([abc])": {
			backgroundColor: "#000",
		},
	})
})
