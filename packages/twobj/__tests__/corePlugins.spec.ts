import { createContext, resolveConfig } from "../src"

test("preflight", async () => {
	expect(
		createContext(
			resolveConfig({
				corePlugins: {
					preflight: false,
				},
			}),
		).globalStyles,
	).toEqual({})

	expect(createContext(resolveConfig({})).globalStyles).toMatchSnapshot()

	expect(createContext(resolveConfig({})).globalStyles).toMatchObject({})
})

test("addDefaults", async () => {
	expect(
		createContext(
			resolveConfig({
				corePlugins: {
					preflight: false,
				},
				plugins: [
					function ({ addDefaults }) {
						addDefaults("myplugin", {
							"--hehehe": "358px",
						})
					},
				],
			}),
		).globalStyles,
	).toEqual({
		"*, ::before, ::after": {
			"--hehehe": "358px",
		},
		"::backdrop": {
			"--hehehe": "358px",
		},
	})
})

test("disable corePlugins", async () => {
	const ctx = createContext(
		resolveConfig({
			corePlugins: {
				backgroundColor: false,
			},
		}),
	)
	expect(ctx.css("bg-black")).toEqual({})
	expect(ctx.css("bg-auto")).toEqual({ backgroundSize: "auto" })
})

test("disable all corePlugins", async () => {
	let ctx = createContext(
		resolveConfig({
			corePlugins: [],
		}),
	)
	expect(ctx.css("bg-black")).toEqual({})
	expect(ctx.css("bg-auto")).toEqual({})

	ctx = createContext(
		resolveConfig({
			corePlugins: false,
		}),
	)
	expect(ctx.css("bg-black")).toEqual({})
	expect(ctx.css("bg-auto")).toEqual({})
})

test("addVariant", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				({ addVariant }) => {
					addVariant("prose-headings", ":where(&) :is(h1, h2, h3, h4)")
				},
			],
		}),
	)

	expect(ctx.css("prose-headings:text-black")).toEqual({
		":where(&) :is(h1, h2, h3, h4)": {
			color: "#000",
		},
	})
})

test("matchVariant", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				({ matchVariant, e }) => {
					matchVariant("tab", value => {
						if (!value) return "& > *"
						return `&.${e(value)} > *`
					})
				},
			],
		}),
	)

	expect(ctx.css("tab-[]:text-black")).toEqual({
		"& > *": {
			color: "#000",
		},
	})

	expect(ctx.css("tab-[test]:text-black")).toEqual({
		"&.test > *": {
			color: "#000",
		},
	})
})
