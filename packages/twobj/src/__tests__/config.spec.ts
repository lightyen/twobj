import { resolveConfig } from "../config"

test("resolveConfig", () => {
	const resolved1 = resolveConfig({})
	const resolved2 = resolveConfig(resolved1)
	const resolved3 = resolveConfig(resolved2)
	expect(resolved1).toEqual(resolved2)
	expect(resolved2).toEqual(resolved3)
})

test("resolveConfig undefined", () => {
	const resolved1 = resolveConfig(undefined)
	const resolved2 = resolveConfig(resolved1)
	const resolved3 = resolveConfig(resolved2)
	expect(resolved1).toEqual(resolved2)
	expect(resolved2).toEqual(resolved3)
})
