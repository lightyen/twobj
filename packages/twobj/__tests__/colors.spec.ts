import { tw } from "./context"

test("color-function", async () => {
	expect(tw`bg-[rgb(1 2 3 / 0.1)]`).toEqual({ backgroundColor: "rgb(1 2 3 / 0.1)" })

	expect(tw`bg-[rgb(var(--color))]`).toEqual({ backgroundColor: "rgb(var(--color))" })
	expect(tw`bg-[rgb(var(--color))]/68`).toEqual({
		backgroundColor: "color-mix(in srgb, rgb(var(--color)) 68%, transparent)",
	})

	expect(tw`bg-[theme(colors.red.500)]`).toEqual({ backgroundColor: "oklch(63.7% 0.237 25.331)" })
	expect(tw`bg-[theme(colors.red.500)]/50`).toEqual({
		backgroundColor: "color-mix(in oklab, oklch(63.7% 0.237 25.331) 50%, transparent)",
	})
	expect(tw`bg-[theme(colors.red.500 / 0.5)]`).toEqual({ backgroundColor: "oklch(63.7% 0.237 25.331 / 0.5)" })

	expect(tw`bg-[var(--color)]`).toEqual({ backgroundColor: "var(--color)" })
	expect(tw`bg-[var(--color)]/33`).toEqual({ backgroundColor: "color-mix(in oklab, var(--color) 33%, transparent)" })
	expect(tw`bg-[color:var(--color)]`).toEqual({ backgroundColor: "var(--color)" })
	expect(tw`bg-[color:var(--color)]/30`).toEqual({
		backgroundColor: "color-mix(in oklab, var(--color) 30%, transparent)",
	})
})
