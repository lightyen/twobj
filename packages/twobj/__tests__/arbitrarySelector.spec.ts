import { tw } from "./context"

test("arbitrary selector", async () => {
	expect(tw(`[.test]:block`)).toEqual({
		"& .test": { display: "block" },
	})
	expect(tw(`[&.test]:block`)).toEqual({
		"&.test": { display: "block" },
	})
	expect(tw(`[.test &]:block`)).toEqual({
		".test &": { display: "block" },
	})
	expect(tw(`[ @media abc { .test & } ]:block`)).toEqual({
		"@media abc": { ".test &": { display: "block" } },
	})
	expect(tw(`[ @media abc { .test } ]:block`)).toEqual({
		"@media abc": { "& .test": { display: "block" } },
	})
	expect(tw(`[ @media abc { ::test } ]:block`)).toEqual({
		"@media abc": { "&::test": { display: "block" } },
	})
})
