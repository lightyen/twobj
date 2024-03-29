import { createContext, resolveConfig } from "../src"
import { ConfigJS } from "../src/types"

test("defaultConfig", async () => {
	expect(resolveConfig()).toMatchSnapshot()
})

test("resolveConfig", async () => {
	const resolved1 = resolveConfig({})
	const resolved2 = resolveConfig(resolved1)
	const resolved3 = resolveConfig(resolved2)
	expect(resolved1).toEqual(resolved2)
	expect(resolved2).toEqual(resolved3)
})

test("resolveConfig undefined", async () => {
	const resolved1 = resolveConfig(undefined)
	const resolved2 = resolveConfig(resolved1)
	const resolved3 = resolveConfig(resolved2)
	expect(resolved1).toEqual(resolved2)
	expect(resolved2).toEqual(resolved3)
})

test("overwrite defaultConfig", async () => {
	const data: ConfigJS = { darkMode: "class", prefix: "tw-", separator: "||", important: "#app" }
	const resolved = resolveConfig(data)
	expect(resolved).toMatchObject(data)
})

test("extend", async () => {
	const ctx = createContext(resolveConfig({ theme: { extend: { colors: { foo: "#fff" } } } }))
	expect(ctx.css("text-white")).toEqual({ color: "#fff" })
	expect(ctx.css("text-foo")).toEqual({ color: "#fff" })
})

test("does not duplicate extended configs every time resolveConfig is called", () => {
	const shared = {
		foo: { bar: { baz: [{ color: "red" }] } },
	}

	const createConfig = (color: string) =>
		resolveConfig({
			theme: {
				foo: shared.foo,
				extend: {
					foo: { bar: { baz: { color } } },
				},
			},
		})

	createConfig("orange")
	createConfig("yellow")
	createConfig("green")

	const result = createConfig("blue")

	expect(shared.foo.bar.baz).toMatchObject([{ color: "red" }])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const foo = result.theme.foo as any
	expect(foo?.bar?.baz).toMatchObject([{ color: "red" }, { color: "blue" }])
})

test("overwrite default colors", async () => {
	let ctx = createContext(resolveConfig({ theme: { extend: { colors: { blue: "#fff", green: undefined } } } }))
	expect(ctx.css("text-blue")).toEqual({ color: "#fff" })
	expect(ctx.css("text-blue-100")).toEqual({})
	expect(ctx.css("text-green")).toEqual({})
	expect(ctx.css("text-green-100")).toEqual({})

	ctx = createContext(resolveConfig({ theme: { extend: { textColor: { blue: "#fff", green: undefined } } } }))
	expect(ctx.css("text-blue")).toEqual({ color: "#fff" })
	expect(ctx.css("text-blue-100")).toEqual({})
	expect(ctx.css("text-green")).toEqual({})
	expect(ctx.css("text-green-100")).toEqual({})

	ctx = createContext(resolveConfig({ theme: { extend: { colors: { blue: null } } } }))
	expect(ctx.css("text-blue")).toEqual({})
	expect(ctx.css("text-blue-100")).toEqual({})
})

test("raw screen value", async () => {
	const ctx = createContext(
		resolveConfig({
			theme: {
				extend: {
					screens: {
						"ar-1/10": { raw: "(min-aspect-ratio: 1/10)" },
						"ar-1_10": { raw: "(min-aspect-ratio: 1/10)" },
					},
				},
			},
		}),
	)
	expect(ctx.css("ar-1/10:text-blue-500")).toEqual({ "@media (min-aspect-ratio: 1/10)": { color: "#3b82f6" } })
	expect(ctx.css("ar-1_10:text-blue-500")).toEqual({ "@media (min-aspect-ratio: 1/10)": { color: "#3b82f6" } })
})
