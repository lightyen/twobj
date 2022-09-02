import { createContext } from "tailwindcss/lib/lib/setupContextUtils.js"
import resolveConfig from "tailwindcss/resolveConfig"
import { context } from "./context"

test("diff tailwindcss", async () => {
	const ctx = createContext(resolveConfig({}))

	/** classnames */

	const tailwind = ctx
		.getClassList()
		.filter(classname => {
			// use 'grow'
			if (/flex-grow(-\d+)?$/.test(classname)) {
				return false
			}

			// use 'shrink'
			if (/flex-shrink(-\d+)?$/.test(classname)) {
				return false
			}

			// use 'bg-red-500/80'
			if (/^(text|bg|divide|border|placeholder|ring)-opacity-\d+$/.test(classname)) {
				return false
			}

			switch (classname) {
				case "overflow-ellipsis": // use 'text-ellipsis'
				case "decoration-slice": // use 'box-decoration-slice'
				case "decoration-clone": // use 'box-decoration-clone'
				case "outline-hidden": // invalid
					return false
			}

			return true
		})
		.concat([
			"fill-none",
			"stroke-none",
			"-outline-offset-0",
			"-outline-offset-1",
			"-outline-offset-2",
			"-outline-offset-4",
			"-outline-offset-8",
		])

	const s0 = new Set(context.getClassList())
	const s1 = new Set(tailwind)
	for (const s of s0) {
		expect(s1).toContain(s)
	}
	for (const s of s1) {
		expect(s0).toContain(s)
	}

	/** variants */

	const s2 = new Set(ctx.variantMap.keys())
	const s3 = new Set(context.variants.keys())
	for (const s of s2) {
		expect(s3).toContain(s)
	}
	for (const s of s3) {
		expect(s2).toContain(s)
	}
})
