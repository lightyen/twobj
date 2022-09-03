import { context, tw } from "./context"

const s = context.getAmbiguous()

test.each(Array.from(context.arbitraryUtilities.keys()))("%s-[]", key => {
	if (s.has(key)) {
		expect(tw(`${key}-[ ]`)).toEqual({})
	} else {
		expect(tw(`${key}-[ ]`)).not.toEqual({})
	}
})
