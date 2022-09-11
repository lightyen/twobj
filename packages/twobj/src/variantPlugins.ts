import { plugin } from "./plugin"
import type { UnnamedPlugin } from "./types"
import { normalizeScreens } from "./util"

type VariantPlugins = {
	[P in string]: UnnamedPlugin
}

export const variantPlugins: VariantPlugins = {
	darkVariants: plugin("darkVariants", ({ configObject, addVariant }) => {
		if (Array.isArray(configObject.darkMode)) {
			const [mode, className = ".dark"] = configObject.darkMode
			if (mode === "class") {
				addVariant("dark", `${className} &`)
				return
			}
		}

		if (configObject.darkMode === "class") {
			addVariant("dark", `.dark &`)
			return
		}

		addVariant("dark", "@media (prefers-color-scheme: dark)")
	}),

	screenVariants: plugin("screenVariants", ({ themeObject, addVariant }) => {
		const screens = normalizeScreens(themeObject.screens)
		for (const [key, value] of screens) {
			let { min, max } = value
			if (typeof min === "number") min = min + "px"
			if (typeof max === "number") max = max + "px"
			if (min != undefined && max != undefined) {
				addVariant(key, `@media (min-width: ${min}) and (max-width: ${max})`)
			} else if (min != undefined) {
				addVariant(key, `@media (min-width: ${min})`)
			} else if (max != undefined) {
				addVariant(key, `@media (max-width: ${max})`)
			}
		}
	}),

	pseudoClassVariants: plugin("pseudoClassVariants", ({ addVariant }) => {
		const pseudoVariants: Array<[variantName: string, desc: string]> = [
			// Positional
			["first", "&:first-child"],
			["last", "&:last-child"],
			["only", "&:only-child"],
			["odd", "&:nth-child(odd)"],
			["even", "&:nth-child(even)"],
			"first-of-type",
			"last-of-type",
			"only-of-type",

			// State
			["visited", "&:visited"],
			"target",
			["open", "&[open]"],

			// Forms
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

			// Content
			"empty",

			// Interactive
			"focus-within",
			["hover", "@media (hover: hover) and (pointer: fine) { &:hover }"],
			"focus",
			"focus-visible",
			"active",
			"enabled",
			"disabled",
		].map<[string, string]>((variant: string | [string, string]) =>
			Array.isArray(variant) ? variant : [variant, `&:${variant}`],
		)

		for (const [variantName, desc] of pseudoVariants) {
			addVariant(variantName, desc)
		}

		for (const [variantName, desc] of pseudoVariants) {
			addVariant(`group-${variantName}`, desc.replace(/&(\S+)/, ".group$1 &"))
		}

		for (const [variantName, desc] of pseudoVariants) {
			addVariant(`peer-${variantName}`, desc.replace(/&(\S+)/, ".peer$1 ~ &"))
		}
	}),

	pseudoElementVariants: plugin("pseudoElementVariants", ({ addVariant }) => {
		addVariant("first-letter", "&::first-letter")
		addVariant("first-line", "&::first-line")
		addVariant("marker", ["& *::marker", "&::marker"])
		addVariant("selection", ["& *::selection", "&::selection"])
		addVariant("file", "&::file-selector-button")
		addVariant("placeholder", "&::placeholder")
		addVariant("backdrop", "&::backdrop")
		addVariant("before", "&::before", {
			postModifier(css = {}) {
				if (!Object.prototype.hasOwnProperty.call(css, "content")) {
					css.content = "var(--tw-content)"
				}
				return css
			},
		})
		addVariant("after", "&::after", {
			postModifier(css = {}) {
				if (!Object.prototype.hasOwnProperty.call(css, "content")) {
					css.content = "var(--tw-content)"
				}
				return css
			},
		})
	}),

	directionVariants: plugin("directionVariants", ({ addVariant }) => {
		addVariant("ltr", '[dir="ltr"] &')
		addVariant("rtl", '[dir="rtl"] &')
	}),

	reducedMotionVariants: plugin("reducedMotionVariants", ({ addVariant }) => {
		addVariant("motion-safe", "@media (prefers-reduced-motion: no-preference)")
		addVariant("motion-reduce", "@media (prefers-reduced-motion: reduce)")
	}),

	printVariant: plugin("printVariant", ({ addVariant }) => {
		addVariant("print", "@media print")
	}),

	orientationVariants: plugin("orientationVariants", ({ addVariant }) => {
		addVariant("portrait", "@media (orientation: portrait)")
		addVariant("landscape", "@media (orientation: landscape)")
	}),

	prefersContrastVariants: plugin("prefersContrastVariants", ({ addVariant }) => {
		addVariant("contrast-more", "@media (prefers-contrast: more)")
		addVariant("contrast-less", "@media (prefers-contrast: less)")
	}),
}
