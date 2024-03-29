import { context } from "./context"

const source = [
	"min-sm",
	"min-md",
	"min-lg",
	"min-xl",
	"min-2xl",
	"max-sm",
	"max-md",
	"max-lg",
	"max-xl",
	"max-2xl",
	"only-sm",
	"only-md",
	"only-lg",
	"only-xl",
	"only-2xl",
	"sm",
	"md",
	"lg",
	"xl",
	"2xl",
	"<sm",
	"<md",
	"<lg",
	"<xl",
	"<2xl",
	"@sm",
	"@md",
	"@lg",
	"@xl",
	"@2xl",
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
	"aria-busy",
	"aria-checked",
	"aria-disabled",
	"aria-expanded",
	"aria-hidden",
	"aria-pressed",
	"aria-readonly",
	"aria-required",
	"aria-selected",
	"group-aria-busy",
	"group-aria-checked",
	"group-aria-disabled",
	"group-aria-expanded",
	"group-aria-hidden",
	"group-aria-pressed",
	"group-aria-readonly",
	"group-aria-required",
	"group-aria-selected",
	"peer-aria-busy",
	"peer-aria-checked",
	"peer-aria-disabled",
	"peer-aria-expanded",
	"peer-aria-hidden",
	"peer-aria-pressed",
	"peer-aria-readonly",
	"peer-aria-required",
	"peer-aria-selected",
]

test("variantList", async () => {
	const variantListSet = context.getVariants()
	const originSet = new Set<string>(source)

	for (const s of variantListSet) {
		expect(originSet).toContain(s)
	}

	for (const s of originSet) {
		expect(variantListSet).toContain(s)
	}
})
