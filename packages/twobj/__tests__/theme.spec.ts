import { createContext, resolveConfig } from "../src"

test("access tailwind config theme", async () => {
	const ctx = createContext(
		resolveConfig({
			theme: {
				colors: {
					str: "rgb(var(--color) / <alpha-value>)",
					fn({ opacityValue }) {
						return `rgb(var(--color) / ${opacityValue})`
					},
					"foo-5": "#056660",
					"foo-5/10": "#051060",
					"foo-5/10/10%": "#651025",
					space: {
						DEFAULT: "#012012",
						"1/1": "#051025",
						"1.5": "#791291",
					},
				},
			},
		}),
	)

	function theme(strings: TemplateStringsArray | string): unknown {
		let value = ""
		if (typeof strings !== "string") {
			value = strings[0] as string
		} else {
			value = strings
		}
		return ctx.renderTheme(value)
	}

	function tw(strings: TemplateStringsArray | string): unknown {
		let value = ""
		if (typeof strings !== "string") {
			value = strings[0] as string
		} else {
			value = strings
		}
		return ctx.css(value)
	}

	expect(theme`colors.str`).toEqual("rgb(var(--color) / 1)")
	expect(theme`colors.str / 0.3`).toEqual("rgb(var(--color) / 0.3)")
	expect(theme`colors.str / 24%`).toEqual("rgb(var(--color) / 24%)")
	expect(theme`colors.fn`).toEqual("rgb(var(--color) / 1)")
	expect(theme`colors.fn / 0.3`).toEqual("rgb(var(--color) / 0.3)")
	expect(theme`colors.fn / 24%`).toEqual("rgb(var(--color) / 24%)")
	expect(theme`colors.foo-5/0.1`).toEqual("rgb(5 102 96 / 0.1)")
	expect(theme`colors.foo-5 / 10%`).toEqual("rgb(5 102 96 / 10%)")
	expect(theme`colors.foo-5/10 /0.1`).toEqual("rgb(5 16 96 / 0.1)")
	expect(theme`colors.foo-5/10 /10%`).toEqual("rgb(5 16 96 / 10%)")
	expect(theme`colors.foo-5/10 / 0.2`).toEqual("rgb(5 16 96 / 0.2)")
	expect(theme`colors.foo-5/10/10%`).toEqual("#651025")
	expect(theme`colors.foo-5/10/10%/20%`).toEqual("rgb(101 16 37 / 20%)")
	expect(tw`bg-[theme(colors.foo-5 / 0.1)]`).toEqual({ backgroundColor: "rgb(5 102 96 / 0.1)" })
	expect(tw`bg-[theme(colors.foo-5/10 /10%)]`).toEqual({ backgroundColor: "rgb(5 16 96 / 10%)" })
	expect(tw`bg-foo-5/10/10%`).toEqual({ backgroundColor: "#651025" })
	expect(tw`bg-space-1/1`).toEqual({ backgroundColor: "#051025" })
	expect(tw`bg-space-1.5`).toEqual({ backgroundColor: "#791291" })
	expect(tw`bg-space`).toEqual({ backgroundColor: "#012012" })
	expect(tw`bg-[theme(colors.space)]`).toEqual({})
	expect(tw`bg-[theme(colors.space.DEFAULT)]`).toEqual({ backgroundColor: "#012012" })
	expect(tw`bg-[theme(colors.space.1/1)]`).toEqual({ backgroundColor: "#051025" })
	expect(tw`bg-[theme(colors.space[1.5])]`).toEqual({ backgroundColor: "#791291" })
	expect(tw`bg-[theme(colors.foo-5/10 0.2)]`).toEqual({})
	expect(tw`bg-[theme(colors.foo-5/10   10%)]`).toEqual({})
	expect(tw`bg-[theme(width.1/2)]`).toEqual({ backgroundSize: "50%" })
})
