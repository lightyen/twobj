import { context, tw } from "./context"

const s = context.getAmbiguous()

test.each(Array.from(context.arbitraryUtilities.keys()))("%s-[]", key => {
	if (s.has(key)) {
		expect(tw(`${key}-[ ]`)).toEqual({})
	} else {
		expect(tw(`${key}-[ ]`)).not.toEqual({})
	}
})

test.each(Array.from(context.arbitraryUtilities.entries()))("%s-[xxx]", (key, type) => {
	if (s.has(key)) {
		if (key === "font") {
			expect(tw(`font-[xxx]`)).not.toEqual({})
		} else {
			expect(tw(`${key}-[xxx]`)).toEqual({})
		}
	} else {
		expect(tw(`${key}-[xxx]`)).not.toEqual({})
	}
})
