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
	expect(tw(`[]:block`)).toEqual({
		"&": { display: "block" },
	})
	expect(tw(`[ @media abc {  } ]:block`)).toEqual({
		"@media abc": { "&": { display: "block" } },
	})
})
