import { formatBoxShadowValues } from "../src/values"
import { tw } from "./context"

test("boxShadow", async () => {
	expect(tw`shadow`).toEqual({
		"--tw-shadow-default-color-0": "rgb(0 0 0 / 0.1)",
		"--tw-shadow-default-color-1": "rgb(0 0 0 / 0.1)",
		"--tw-shadow-colored":
			"0 1px 3px 0 var(--tw-shadow-color, var(--tw-shadow-default-color-0)), 0 1px 2px -1px var(--tw-shadow-color, var(--tw-shadow-default-color-1))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
	})
	expect(tw`shadow-[0 0 1px 2px rgb(66 225 106 / 0.5)]`).toEqual({
		"--tw-shadow-default-color-0": "rgb(66 225 106 / 0.5)",
		"--tw-shadow-colored": "0 0 1px 2px var(--tw-shadow-color, var(--tw-shadow-default-color-0))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
	})
	expect(tw`shadow-[10px 10px 5px rgba(66, 225, 106, 0.5)]`).toEqual({
		"--tw-shadow-default-color-0": "rgba(66 225 106 / 0.5)",
		"--tw-shadow-colored": "10px 10px 5px var(--tw-shadow-color, var(--tw-shadow-default-color-0))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
	})
})

test("boxShadowColor", async () => {
	expect(tw`shadow-red-500`).toEqual({ "--tw-shadow-color": "#ef4444" })
	expect(tw`shadow-red-500/[0.3]`).toEqual({ "--tw-shadow-color": "rgb(239 68 68 / 0.3)" })
	expect(tw`shadow-[#ef4444]/[0.3]`).toEqual({ "--tw-shadow-color": "rgb(239 68 68 / 0.3)" })
})

test("shadow value", async () => {
	const result = formatBoxShadowValues("0 10px 15px -3px rgb(0, 0 ,0 , 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)")
	expect(result).toEqual([
		{
			color: { fn: "rgb", params: ["0", "0", "0", "0.1"] },
			value: "0 10px 15px -3px var(--tw-shadow-color, var(--tw-shadow-default-color))",
		},
		{
			color: { fn: "rgb", params: ["0", "0", "0", "0.1"] },
			value: "0 4px 6px -4px var(--tw-shadow-color, var(--tw-shadow-default-color))",
		},
	])
})

test("ring", async () => {
	expect(tw`ring`).toEqual({
		"--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
		"--tw-ring-shadow": "var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color)",
		boxShadow: "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`ring-2`).toEqual({
		"--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
		"--tw-ring-shadow": "var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color)",
		boxShadow: "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
	})
	expect(tw`ring-[3.7px]`).toEqual({
		"--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
		"--tw-ring-shadow": "var(--tw-ring-inset) 0 0 0 calc(3.7px + var(--tw-ring-offset-width)) var(--tw-ring-color)",
		boxShadow: "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
	})
})

test("ringColor", async () => {
	expect(tw`ring-black`).toEqual({ "--tw-ring-color": "#000" })
	expect(tw`ring-[hsl(210 55% 55%)]`).toEqual({ "--tw-ring-color": "hsl(210 55% 55%)" })
	expect(tw`ring-[hsl(210 55% 55%)]/[0.38]`).toEqual({ "--tw-ring-color": "hsl(210 55% 55% / 0.38)" })
})
