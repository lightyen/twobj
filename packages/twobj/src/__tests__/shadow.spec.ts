import { formatBoxShadowValues } from "../values"

it("shadow value", () => {
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
