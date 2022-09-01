import { tw } from "./context"

test("wrap function", async () => {
	expect(tw`hover:$e`).toEqual({
		"@media (hover: hover) and (pointer: fine)": {
			"&:hover": Math.E,
		},
	})
	expect(tw`sm:hover:$e`).toEqual({
		"@media (min-width: 640px)": {
			"@media (hover: hover) and (pointer: fine)": {
				"&:hover": Math.E,
			},
		},
	})
	expect(tw`sm:hover:marker:$e`).toEqual({
		"@media (min-width: 640px)": {
			"@media (hover: hover) and (pointer: fine)": {
				"&:hover": {
					"& *::marker": Math.E,
					"&::marker": Math.E,
				},
			},
		},
	})
})
