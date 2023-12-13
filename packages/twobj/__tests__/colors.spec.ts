import { tw } from "./context"

test("color-function", async () => {
	expect(tw`bg-[rgb(1 2 3 / 0.1)]`).toEqual({ backgroundColor: "rgb(1 2 3 / 0.1)" })

	expect(tw`bg-[rgb(var(--color))]`).toEqual({ backgroundColor: "rgb(var(--color))" })
	expect(tw`bg-[rgb(var(--color))]/68`).toEqual({ backgroundColor: "rgb(var(--color) / 0.68)" })

	expect(tw`bg-[theme(colors.red.500)]`).toEqual({ backgroundColor: "#ef4444" })
	expect(tw`bg-[theme(colors.red.500)]/50`).toEqual({ backgroundColor: "rgb(239 68 68 / 0.5)" })
	expect(tw`bg-[theme(colors.red.500 / 0.5)]`).toEqual({ backgroundColor: "rgb(239 68 68 / 0.5)" })

	expect(tw`bg-[var(--color)]`).toEqual({})
	expect(tw`bg-[var(--color)]/33`).toEqual({})
	expect(tw`bg-[color:var(--color)]`).toEqual({ backgroundColor: "var(--color)" })
	expect(tw`bg-[color:var(--color)]/30`).toEqual({ backgroundColor: "rgb(var(--color) / 0.3)" })
})
