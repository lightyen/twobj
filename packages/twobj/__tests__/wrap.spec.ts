import { tw, wrap } from "./context"

test("wrap function", async () => {
	expect(wrap`hover:`({ color: "black" })).toEqual({
		"@media (hover: hover) and (pointer: fine)": {
			"&:hover": { color: "black" },
		},
	})
	expect(wrap`sm:hover:`({ color: "black" })).toEqual({
		"@media (min-width: 640px)": {
			"@media (hover: hover) and (pointer: fine)": {
				"&:hover": { color: "black" },
			},
		},
	})
	expect(wrap`sm:hover:marker:`({ color: "black" })).toEqual({
		"@media (min-width: 640px)": {
			"@media (hover: hover) and (pointer: fine)": {
				"&:hover": {
					"& *::marker, &::marker": { color: "black" },
				},
			},
		},
	})
	expect(wrap`hover: active:`({ color: "black" })).toEqual({
		"@media (hover: hover) and (pointer: fine)": {
			"&:hover": { color: "black" },
		},
		"&:active": { color: "black" },
	})
	expect(wrap`sm:(hover: active:):`({ color: "black" })).toEqual({
		"@media (min-width: 640px)": {
			"@media (hover: hover) and (pointer: fine)": {
				"&:hover": { color: "black" },
			},
			"&:active": { color: "black" },
		},
	})
	expect(wrap`sm:(odd: active:):`({ color: "black" })).toEqual({
		"@media (min-width: 640px)": {
			"&:nth-child(odd), &:active": { color: "black" },
		},
	})
	expect(tw`sm:(odd: active:):text-black`).toEqual({
		"@media (min-width: 640px)": {
			"&:nth-child(odd), &:active": { color: "#000" },
		},
	})
	expect(tw`sm:((odd: md:):text-black bg-white)`).toEqual({
		"@media (min-width: 640px)": {
			"&:nth-child(odd)": { color: "#000" },
			"@media (min-width: 768px)": { color: "#000" },
			backgroundColor: "#fff",
		},
	})
	expect(tw`sm:((odd: active:):text-black bg-white)`).toEqual({
		"@media (min-width: 640px)": {
			"&:nth-child(odd), &:active": { color: "#000" },
			backgroundColor: "#fff",
		},
	})
	expect(tw`sm:((odd: active:):(text-black divide-black first:border-t-2) bg-white)`).toEqual({
		"@media (min-width: 640px)": {
			"&:nth-child(odd), &:active": {
				color: "#000",
				"& > :not([hidden]) ~ :not([hidden])": {
					borderColor: "#000",
				},
				"&:first-child": {
					borderTopWidth: "2px",
				},
			},
			backgroundColor: "#fff",
		},
	})
})
