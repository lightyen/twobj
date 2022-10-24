import * as parser from "./parser"
import { plugin } from "./plugin"
import type { UnnamedPlugin, VariantRender } from "./types"
import * as util from "./util"
import { pseudoVariants } from "./variant"

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

	/**
	 * ## Breakpoints
	 *
	 * - *min-{sm,md,lg.xl,2xl}:* `@media (min-width: value)`
	 *
	 *   *min-[value]:* `@media (min-width: value)`
	 *
	 * - *max-{sm,md,lg.xl,2xl}:* `@media (max-width: value - 0.02px)`
	 *
	 *   *max-[value]:* `@media (max-width: value)`
	 *
	 * - *only-{sm,md,lg,xl,2xl}:* `@media (min-width: value0) and (max-width: value1 - 0.02px)`
	 *
	 *   *only-[value, value]:* `@media (min-width: value0) and (max-width: value1)`
	 *
	 * ### Alias:
	 *
	 *   - min   =>  `{sm,md,lg.xl,2xl}:`
	 *   - max   =>  `<{sm,md,lg.xl,2xl}:`
	 *   - only  =>  `@{sm,md,lg.xl,2xl}:`
	 */
	screenVariants: plugin("screenVariants", ({ themeObject, addVariant, matchVariant }) => {
		const screens = util.normalizeScreens(themeObject.screens)
		interface Range {
			a: number
			b?: number
		}

		const values: Record<string, Range> = {}

		for (let i = 0; i < screens.length - 1; i++) {
			const a = screens[i]
			const b = screens[i + 1]
			values[a.key] = { a: a.value, b: b.value - 0.02 }
		}
		if (screens.length > 0) {
			const { key, value } = screens[screens.length - 1]
			values[key] = { a: value }
		}

		matchVariant(
			"min",
			value => {
				if (typeof value !== "string") {
					return `@media (min-width: ${value.a}px)`
				}
				return `@media (min-width: ${value})`
			},
			{ values },
		)

		matchVariant(
			"max",
			value => {
				if (typeof value !== "string") {
					const { a } = value
					return `@media (max-width: ${a - 0.02}px)`
				}
				return `@media (max-width: ${value})`
			},
			{ values },
		)

		matchVariant(
			"only",
			value => {
				if (typeof value !== "string") {
					const { a, b } = value
					if (b != undefined) {
						return `@media (min-width: ${a}px) and (max-width: ${b}px)`
					}
					return `@media (min-width: ${a}px)`
				}
				const fields = parser.splitAtTopLevelOnly(value)
				if (fields.length !== 2) {
					return ""
				}
				return `@media (min-width: ${fields[0]}) and (max-width: ${fields[1]})`
			},
			{ values },
		)

		for (const [key, { a, b }] of Object.entries(values)) {
			addVariant(key, `@media (min-width: ${a}px)`)
			addVariant(`<${key}`, `@media (max-width: ${a - 0.02}px)`)
			if (b != undefined) {
				addVariant(`@${key}`, `@media (min-width: ${a}px) and (max-width: ${b}px)`)
			} else {
				addVariant(`@${key}`, `@media (min-width: ${a}px)`)
			}
		}
	}),

	pseudoClassVariants: plugin("pseudoClassVariants", ({ addVariant, matchVariant }) => {
		for (const [variantName, desc] of pseudoVariants) {
			addVariant(variantName, desc)
		}

		const variants: Record<string, VariantRender> = {
			group: (_, { modifier, wrapped }): [string, string] => {
				if (modifier) {
					if (wrapped) {
						return [".group\\/[" + modifier + "]", " &"]
					}
					return [".group\\/" + modifier, " &"]
				}
				return [".group", " &"]
			},
			peer: (_, { modifier, wrapped }): [string, string] => {
				if (modifier) {
					if (wrapped) {
						return [".peer\\/[" + modifier + "]", " ~ &"]
					}
					return [".peer\\/" + modifier, " ~ &"]
				}
				return [".peer", " ~ &"]
			},
		}

		for (const [variantName, render] of Object.entries(variants)) {
			matchVariant<string>(
				variantName,
				(value, options) => {
					const [a, b] = render(undefined, options)
					if (!value.includes("&")) {
						value = "&" + value
					}
					value = value.replace(/&(\S+)?/g, (_, pseudo = "") => a + pseudo + b)
					return value
				},
				{ values: Object.fromEntries(pseudoVariants) },
			)
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
			post(css = {}) {
				if (!Object.prototype.hasOwnProperty.call(css, "content")) {
					css.content = "var(--tw-content)"
				}
				return css
			},
		})
		addVariant("after", "&::after", {
			post(css = {}) {
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
	supportsVariants: plugin("supportsVariants", ({ matchVariant, theme }) => {
		matchVariant<string>(
			"supports",
			value => {
				const isRaw = /^\w*\s*\(/.test(value)

				// Chrome has a bug where `(condtion1)or(condition2)` is not valid
				// But `(condition1) or (condition2)` is supported.
				value = isRaw ? value.replace(/\b(and|or|not)\b/g, " $1 ") : value

				if (isRaw) {
					return "@supports " + value
				}

				if (!value.includes(":")) {
					value = value + ": var(--tw)"
				}

				if (!(value.startsWith("(") && value.endsWith(")"))) {
					value = "(" + value + ")"
				}

				return "@supports " + value
			},
			{ values: theme("supports") },
		)
	}),
	ariaVariants: plugin("ariaVariants", ({ matchVariant, theme }) => {
		matchVariant<string>(
			"aria",
			value => {
				return "&[aria-" + value + "]"
			},
			{ values: theme("aria") },
		)
		matchVariant<string>(
			"group-aria",
			(value, { modifier, wrapped }) => {
				if (modifier) {
					if (wrapped) {
						return `.group\\/[${modifier}][aria-${value}] &`
					}
					return `.group\\/${modifier}[aria-${value}] &`
				}
				return `.group[aria-${value}] &`
			},
			{ values: theme("aria") },
		)
		matchVariant<string>(
			"peer-aria",
			(value, { modifier, wrapped }) => {
				if (modifier) {
					if (wrapped) {
						return `.peer\\/[${modifier}][aria-${value}] ~ &`
					}
					return `.peer\\/${modifier}[aria-${value}] ~ &`
				}
				return `.peer[aria-${value}] ~ &`
			},
			{ values: theme("aria") },
		)
	}),
	dataVariants: plugin("dataVariants", ({ matchVariant, theme }) => {
		matchVariant<string>(
			"data",
			value => {
				return "&[data-" + value + "]"
			},
			{ values: theme("data") },
		)
		matchVariant<string>(
			"group-data",
			(value, { modifier, wrapped }) => {
				if (modifier) {
					if (wrapped) {
						return `.group\\/[${modifier}][data-${value}] &`
					}
					return `.group\\/${modifier}[data-${value}] &`
				}
				return `.group[data-${value}] &`
			},
			{ values: theme("data") },
		)
		matchVariant<string>(
			"peer-data",
			(value, { modifier, wrapped }) => {
				if (modifier) {
					if (wrapped) {
						return `.peer\\/[${modifier}][data-${value}] ~ &`
					}
					return `.peer\\/${modifier}[data-${value}] ~ &`
				}
				return `.peer[data-${value}] ~ &`
			},
			{ values: theme("data") },
		)
	}),
}
