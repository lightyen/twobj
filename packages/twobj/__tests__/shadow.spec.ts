import { createContext, resolveConfig } from "../src"
import { parseBoxShadowValues } from "../src/parser"
import { tw } from "./context"

test("boxShadow", async () => {
	expect(tw`shadow`).toEqual({
		"--tw-shadow-colored":
			"0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`shadow-[0 0 1px 2px rgb(66 225 106 / 0.5)]`).toEqual({
		"--tw-shadow-colored": "0 0 1px 2px var(--tw-shadow-color, rgb(66 225 106 / 0.5))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`shadow-[10px 10px 5px rgba(66, 225, 106, 0.5)]`).toEqual({
		"--tw-shadow-colored": "10px 10px 5px var(--tw-shadow-color, rgba(66, 225, 106, 0.5))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`shadow-[10px 10px 5px #22121242]`).toEqual({
		"--tw-shadow-colored": "10px 10px 5px var(--tw-shadow-color, #22121242)",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`shadow-[10px 10px 5px theme(colors.red.500)]`).toEqual({
		"--tw-shadow-colored": "10px 10px 5px var(--tw-shadow-color, #ef4444)",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`shadow-[10px 10px 5px theme(colors.red.500 / 50%)]`).toEqual({
		"--tw-shadow-colored": "10px 10px 5px var(--tw-shadow-color, rgb(239 68 68 / 50%))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
})

test("boxShadow array value", async () => {
	const ctx = createContext(
		resolveConfig({
			theme: { boxShadow: { DEFAULT: ["0 1px 3px 0 rgb(0 0 0 / 0.3)", "0 1px 2px -1px rgb(0 0 0 / 0.3)"] } },
		}),
	)
	expect(ctx.css`shadow`).toEqual({
		"--tw-shadow-colored":
			"0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.3)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.3))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
})

test("boxShadowColor", async () => {
	expect(tw`shadow-red-500`).toEqual({ "--tw-shadow-color": "#ef4444" })
	expect(tw`shadow-red-500/[0.3]`).toEqual({ "--tw-shadow-color": "rgb(239 68 68 / 0.3)" })
	expect(tw`shadow-[#ef4444]/[0.3]`).toEqual({ "--tw-shadow-color": "rgb(239 68 68 / 0.3)" })
})

test("shadow value", async () => {
	expect(
		parseBoxShadowValues("0 10px 15px -3px rgb(0, 0 ,0 , 0.1), unknown, 0 4px 6px -4px rgb(0 0 0 / 0.2)"),
	).toMatchObject([
		{
			color: { fn: "rgb", params: ["0", "0", "0", "0.1"], range: [17, 35] },
			value: "0 10px 15px -3px var(--tw-shadow-color, rgb(0, 0 ,0 , 0.1))",
		},
		"unknown",
		{
			color: { fn: "rgb", params: ["0", "0", "0", "0.2"], range: [61, 77] },
			value: "0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.2))",
		},
	])
	expect(parseBoxShadowValues("0 10px 15px -3px rgb(0, 0 ,0 , 0.1),, 0 4px 6px -4px rgb(0 0 0 / 0.1)")).toMatchObject(
		[
			{
				color: { fn: "rgb", params: ["0", "0", "0", "0.1"], range: [17, 35] },
				value: "0 10px 15px -3px var(--tw-shadow-color, rgb(0, 0 ,0 , 0.1))",
			},
			"",
			{
				color: { fn: "rgb", params: ["0", "0", "0", "0.1"], range: [53, 69] },
				value: "0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1))",
			},
		],
	)
})

test("ring", async () => {
	expect(tw`ring`).toEqual({
		"--tw-ring-offset-shadow":
			"var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff)",
		"--tw-ring-shadow":
			"var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, rgb(59 130 246 / 0.5))",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`ring-2`).toEqual({
		"--tw-ring-offset-shadow":
			"var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff)",
		"--tw-ring-shadow":
			"var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, rgb(59 130 246 / 0.5))",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`ring-[3.7px]`).toEqual({
		"--tw-ring-offset-shadow":
			"var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff)",
		"--tw-ring-shadow":
			"var(--tw-ring-inset,) 0 0 0 calc(3.7px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, rgb(59 130 246 / 0.5))",
		boxShadow:
			"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	})
})

test("ringColor", async () => {
	expect(tw`ring-black`).toEqual({ "--tw-ring-color": "#000" })
	expect(tw`ring-[hsl(210 55% 55%)]`).toEqual({ "--tw-ring-color": "hsl(210 55% 55%)" })
	expect(tw`ring-[hsl(210 55% 55%)]/[0.38]`).toEqual({ "--tw-ring-color": "hsl(210 55% 55% / 0.38)" })
})
