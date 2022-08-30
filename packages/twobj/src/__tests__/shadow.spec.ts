import { formatBoxShadowValues } from "../values"
import { tw } from "./context"

test("shadow", () => {
	expect(tw`shadow`).toEqual({
		"--tw-shadow-default-color-0": "rgb(0 0 0 / 0.1)",
		"--tw-shadow-default-color-1": "rgb(0 0 0 / 0.1)",
		"--tw-shadow-colored":
			"0 1px 3px 0 var(--tw-shadow-color, var(--tw-shadow-default-color-0)), 0 1px 2px -1px var(--tw-shadow-color, var(--tw-shadow-default-color-1))",
		"--tw-shadow": "var(--tw-shadow-colored)",
		boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
	})
})

test("shadow value", () => {
	const result = formatBoxShadowValues("0 10px 15px -3px rgb(0, 0 ,0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)")
	expect(result).toEqual([
		{
			color: { fn: "rgb", params: ["0", "0", "0", "/", "0.1"] },
			value: "0 10px 15px -3px var(--tw-shadow-color, var(--tw-shadow-default-color))",
		},
		{
			color: { fn: "rgb", params: ["0", "0", "0", "/", "0.1"] },
			value: "0 4px 6px -4px var(--tw-shadow-color, var(--tw-shadow-default-color))",
		},
	])
})
