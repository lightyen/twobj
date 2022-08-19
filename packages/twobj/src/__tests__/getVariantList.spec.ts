import context from "./defaultContext"

const source = [
	"sm",
	"md",
	"lg",
	"xl",
	"2xl",
	"dark",
	"placeholder",
	"first-letter",
	"first-line",
	"marker",
	"selection",
	"file",
	"backdrop",
	"before",
	"after",
	"first",
	"last",
	"only",
	"odd",
	"even",
	"first-of-type",
	"last-of-type",
	"only-of-type",
	"visited",
	"target",
	"open",
	"default",
	"checked",
	"indeterminate",
	"placeholder-shown",
	"autofill",
	"optional",
	"required",
	"valid",
	"invalid",
	"in-range",
	"out-of-range",
	"read-only",
	"empty",
	"focus-within",
	"hover",
	"focus",
	"focus-visible",
	"active",
	"enabled",
	"disabled",
	"group-first",
	"group-last",
	"group-only",
	"group-odd",
	"group-even",
	"group-first-of-type",
	"group-last-of-type",
	"group-only-of-type",
	"group-visited",
	"group-target",
	"group-open",
	"group-default",
	"group-checked",
	"group-indeterminate",
	"group-placeholder-shown",
	"group-autofill",
	"group-optional",
	"group-required",
	"group-valid",
	"group-invalid",
	"group-in-range",
	"group-out-of-range",
	"group-read-only",
	"group-empty",
	"group-focus-within",
	"group-hover",
	"group-focus",
	"group-focus-visible",
	"group-active",
	"group-enabled",
	"group-disabled",
	"peer-first",
	"peer-last",
	"peer-only",
	"peer-odd",
	"peer-even",
	"peer-first-of-type",
	"peer-last-of-type",
	"peer-only-of-type",
	"peer-visited",
	"peer-target",
	"peer-open",
	"peer-default",
	"peer-checked",
	"peer-indeterminate",
	"peer-placeholder-shown",
	"peer-autofill",
	"peer-optional",
	"peer-required",
	"peer-valid",
	"peer-invalid",
	"peer-in-range",
	"peer-out-of-range",
	"peer-read-only",
	"peer-empty",
	"peer-focus-within",
	"peer-hover",
	"peer-focus",
	"peer-focus-visible",
	"peer-active",
	"peer-enabled",
	"peer-disabled",
	"ltr",
	"rtl",
	"motion-safe",
	"motion-reduce",
	"contrast-more",
	"contrast-less",
	"print",
	"portrait",
	"landscape",
]

it("variantList", () => {
	const variantListSet = new Set<string>(context.variants.keys())
	const originSet = new Set<string>(source)

	const errSet = new Set<string>()

	for (const c of variantListSet) {
		if (!originSet.has(c)) {
			errSet.add(c)
		}
	}

	for (const c of originSet) {
		if (!variantListSet.has(c)) {
			errSet.add(c)
		}
	}

	expect(errSet.size).toEqual(0)
})
