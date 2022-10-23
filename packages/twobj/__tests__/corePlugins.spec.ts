import { createContext, resolveConfig } from "../src"

test("preflight", async () => {
	expect(
		createContext(
			resolveConfig({
				corePlugins: {
					preflight: false,
				},
			}),
		).globalStyles,
	).toEqual({
		"*, ::before, ::after": {
			"--tw-backdrop-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-opacity": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-border-spacing-x": "0",
			"--tw-border-spacing-y": "0",
			"--tw-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-drop-shadow": "var(--tw-empty,/**/ /**/)",
			"--tw-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-figure": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-fraction": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-spacing": "var(--tw-empty,/**/ /**/)",
			"--tw-ordinal": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-x": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-y": "var(--tw-empty,/**/ /**/)",
			"--tw-pinch-zoom": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-color": "rgb(59 130 246 / 0.5)",
			"--tw-ring-inset": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-offset-color": "#fff",
			"--tw-ring-offset-shadow": "0 0 #0000",
			"--tw-ring-offset-width": "0px",
			"--tw-ring-shadow": "0 0 #0000",
			"--tw-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-scroll-snap-strictness": "proximity",
			"--tw-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-slashed-zero": "var(--tw-empty,/**/ /**/)",
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		},
		"::backdrop": {
			"--tw-backdrop-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-opacity": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-border-spacing-x": "0",
			"--tw-border-spacing-y": "0",
			"--tw-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-drop-shadow": "var(--tw-empty,/**/ /**/)",
			"--tw-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-figure": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-fraction": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-spacing": "var(--tw-empty,/**/ /**/)",
			"--tw-ordinal": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-x": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-y": "var(--tw-empty,/**/ /**/)",
			"--tw-pinch-zoom": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-color": "rgb(59 130 246 / 0.5)",
			"--tw-ring-inset": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-offset-color": "#fff",
			"--tw-ring-offset-shadow": "0 0 #0000",
			"--tw-ring-offset-width": "0px",
			"--tw-ring-shadow": "0 0 #0000",
			"--tw-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-scroll-snap-strictness": "proximity",
			"--tw-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-slashed-zero": "var(--tw-empty,/**/ /**/)",
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		},
	})

	expect(createContext(resolveConfig({})).globalStyles).toMatchSnapshot()

	expect(createContext(resolveConfig({})).globalStyles).toMatchObject({
		"*, ::before, ::after": {
			"--tw-backdrop-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-opacity": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-border-spacing-x": "0",
			"--tw-border-spacing-y": "0",
			"--tw-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-drop-shadow": "var(--tw-empty,/**/ /**/)",
			"--tw-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-figure": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-fraction": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-spacing": "var(--tw-empty,/**/ /**/)",
			"--tw-ordinal": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-x": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-y": "var(--tw-empty,/**/ /**/)",
			"--tw-pinch-zoom": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-color": "rgb(59 130 246 / 0.5)",
			"--tw-ring-inset": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-offset-color": "#fff",
			"--tw-ring-offset-shadow": "0 0 #0000",
			"--tw-ring-offset-width": "0px",
			"--tw-ring-shadow": "0 0 #0000",
			"--tw-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-scroll-snap-strictness": "proximity",
			"--tw-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-slashed-zero": "var(--tw-empty,/**/ /**/)",
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		},
		"::backdrop": {
			"--tw-backdrop-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-opacity": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-backdrop-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-blur": "var(--tw-empty,/**/ /**/)",
			"--tw-border-spacing-x": "0",
			"--tw-border-spacing-y": "0",
			"--tw-brightness": "var(--tw-empty,/**/ /**/)",
			"--tw-contrast": "var(--tw-empty,/**/ /**/)",
			"--tw-drop-shadow": "var(--tw-empty,/**/ /**/)",
			"--tw-grayscale": "var(--tw-empty,/**/ /**/)",
			"--tw-hue-rotate": "var(--tw-empty,/**/ /**/)",
			"--tw-invert": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-figure": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-fraction": "var(--tw-empty,/**/ /**/)",
			"--tw-numeric-spacing": "var(--tw-empty,/**/ /**/)",
			"--tw-ordinal": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-x": "var(--tw-empty,/**/ /**/)",
			"--tw-pan-y": "var(--tw-empty,/**/ /**/)",
			"--tw-pinch-zoom": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-color": "rgb(59 130 246 / 0.5)",
			"--tw-ring-inset": "var(--tw-empty,/**/ /**/)",
			"--tw-ring-offset-color": "#fff",
			"--tw-ring-offset-shadow": "0 0 #0000",
			"--tw-ring-offset-width": "0px",
			"--tw-ring-shadow": "0 0 #0000",
			"--tw-saturate": "var(--tw-empty,/**/ /**/)",
			"--tw-scroll-snap-strictness": "proximity",
			"--tw-sepia": "var(--tw-empty,/**/ /**/)",
			"--tw-slashed-zero": "var(--tw-empty,/**/ /**/)",
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		},
	})
})

test("disable corePlugins", async () => {
	const ctx = createContext(
		resolveConfig({
			corePlugins: {
				backgroundColor: false,
			},
		}),
	)
	expect(ctx.css("bg-black")).toEqual({})
	expect(ctx.css("bg-auto")).toEqual({ backgroundSize: "auto" })
})

test("disable all corePlugins", async () => {
	let ctx = createContext(
		resolveConfig({
			corePlugins: [],
		}),
	)
	expect(ctx.css("bg-black")).toEqual({})
	expect(ctx.css("bg-auto")).toEqual({})

	ctx = createContext(
		resolveConfig({
			corePlugins: false,
		}),
	)
	expect(ctx.css("bg-black")).toEqual({})
	expect(ctx.css("bg-auto")).toEqual({})
})

test("addVariant", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				({ addVariant }) => {
					addVariant("prose-headings", ":where(&) :is(h1, h2, h3, h4)")
				},
			],
		}),
	)

	expect(ctx.css("prose-headings:text-black")).toEqual({
		":where(&) :is(h1, h2, h3, h4)": {
			color: "#000",
		},
	})
})

test("matchVariant", async () => {
	const ctx = createContext(
		resolveConfig({
			plugins: [
				({ matchVariant, e }) => {
					matchVariant("tab", value => {
						if (!value) return "& > *"
						return `&.${e(value)} > *`
					})
				},
			],
		}),
	)

	expect(ctx.css("tab-[]:text-black")).toEqual({
		"& > *": {
			color: "#000",
		},
	})

	expect(ctx.css("tab-[test]:text-black")).toEqual({
		"&.test > *": {
			color: "#000",
		},
	})
})
