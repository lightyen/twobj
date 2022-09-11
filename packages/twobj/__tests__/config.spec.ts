import { resolveConfig } from "../src"
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
