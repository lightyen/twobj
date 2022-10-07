import * as parser from "./parser"
import { plugin } from "./plugin"
import { preflight } from "./preflight"
import type {
	ConfigEntry,
	ConfigObject,
	CorePluginFeatures,
	MatchOption,
	StrictResolvedConfigJS,
	UnnamedPlugin,
} from "./types"
import { CSSProperties, CSSValue, Template } from "./types"
import { isCSSEntry, isCSSValue, isNotEmpty, isObject, normalizeScreens } from "./util"
import { withAlphaValue } from "./values"

type ClassPlugins = {
	[P in keyof CorePluginFeatures]?: UnnamedPlugin
}

const emptyCssValue: CSSValue = "var(--tw-empty,/**/ /**/)"

function createUtilityPlugin(
	pluginName: string,
	mappings: Array<[key: string, propOrTemplate: string | Template]>,
	getOptions: (theme: StrictResolvedConfigJS["theme"]) => MatchOption,
) {
	return plugin(pluginName, ({ matchUtilities, themeObject }) => {
		matchUtilities(
			Object.assign(
				{},
				...mappings.map(([key, prop]) => {
					if (typeof prop === "string") {
						return {
							[key](value: string) {
								return { [prop]: value }
							},
						}
					}
					return {
						[key]: prop,
					}
				}),
			),
			getOptions?.(themeObject),
		)
	})
}

function createColorPlugin(
	pluginName: string,
	mappings: Array<[key: string, propOrTemplate: string | Template]>,
	getValues: (theme: StrictResolvedConfigJS["theme"]) => ConfigEntry,
) {
	return createUtilityPlugin(pluginName, mappings, themeObject => ({
		type: "color",
		values: getValues(themeObject) as ConfigObject,
	}))
}

const cssTransformValue = [
	"var(--tw-transfrom-translate, var(--tw-transfrom-translate-default))",
	"rotate(var(--tw-rotate, 0))",
	"skewX(var(--tw-skew-x, 0))",
	"skewY(var(--tw-skew-y, 0))",
	"scaleX(var(--tw-scale-x, 1))",
	"scaleY(var(--tw-scale-y, 1))",
].join(" ")

export const classPlugins: ClassPlugins = {
	preflight: plugin("preflight", ({ addBase }) => {
		addBase(preflight)
	}),
	textColor: createColorPlugin("textColor", [["text", "color"]], theme => theme.textColor),
	backgroundColor: createColorPlugin("backgroundColor", [["bg", "backgroundColor"]], theme => theme.backgroundColor),
	caretColor: createColorPlugin("caretColor", [["caret", "caretColor"]], theme => theme.caretColor),
	accentColor: createColorPlugin("accentColor", [["accent", "accentColor"]], theme => theme.accentColor),
	stroke: createUtilityPlugin("stroke", [["stroke", "stroke"]], theme => ({
		type: ["color", "url"],
		values: theme.stroke,
	})),
	fill: createUtilityPlugin("fill", [["fill", "fill"]], theme => ({
		type: ["color", "url"],
		values: theme.fill,
	})),
	borderColor: createUtilityPlugin(
		"borderColor",
		[
			["border", "borderColor"],
			["border-t", "borderTopColor"],
			["border-r", "borderRightColor"],
			["border-b", "borderBottomColor"],
			["border-l", "borderLeftColor"],
			["border-x", value => ({ borderLeftColor: value, borderRightColor: value })],
			["border-y", value => ({ borderTopColor: value, borderBottomColor: value })],
		],
		theme => ({
			type: "color",
			filterDefault: true,
			values: theme.borderColor,
		}),
	),
	outlineColor: createUtilityPlugin("outlineColor", [["outline", "outlineColor"]], theme => ({
		type: "color",
		values: theme.outlineColor,
	})),
	textDecorationColor: createUtilityPlugin("textDecorationColor", [["decoration", "textDecorationColor"]], theme => ({
		type: "color",
		values: theme.textDecorationColor,
	})),
	divideColor: createUtilityPlugin(
		"divideColor",
		[
			[
				"divide",
				value => ({
					"& > :not([hidden]) ~ :not([hidden])": {
						borderColor: value,
					},
				}),
			],
		],
		theme => ({
			type: "color",
			filterDefault: true,
			values: theme.divideColor,
		}),
	),
	placeholderColor: createColorPlugin(
		"placeholderColor",
		[
			[
				"placeholder",
				value => ({
					"&::placeholder": {
						color: value,
					},
				}),
			],
		],
		theme => theme.placeholderColor,
	),
	inset: createUtilityPlugin(
		"inset",
		[
			[
				"inset",
				value => ({
					top: value,
					right: value,
					bottom: value,
					left: value,
				}),
			],
			[
				"inset-x",
				value => ({
					left: value,
					right: value,
				}),
			],
			[
				"inset-y",
				value => ({
					top: value,
					bottom: value,
				}),
			],
			["top", "top"],
			["right", "right"],
			["bottom", "bottom"],
			["left", "left"],
		],
		theme => ({ values: theme.inset, supportsNegativeValues: true }),
	),
	zIndex: createUtilityPlugin("zIndex", [["z", "zIndex"]], theme => ({
		values: theme.zIndex,
		supportsNegativeValues: true,
	})),
	order: createUtilityPlugin("order", [["order", "order"]], theme => ({
		values: theme.order,
		supportsNegativeValues: true,
	})),
	gridColumn: createUtilityPlugin("gridColumn", [["col", "gridColumn"]], theme => ({ values: theme.gridColumn })),
	gridColumnStart: createUtilityPlugin("gridColumnStart", [["col-start", "gridColumnStart"]], theme => ({
		values: theme.gridColumnStart,
	})),
	gridColumnEnd: createUtilityPlugin("gridColumnEnd", [["col-end", "gridColumnEnd"]], theme => ({
		values: theme.gridColumnEnd,
	})),
	gridRow: createUtilityPlugin("gridRow", [["row", "gridRow"]], theme => ({ values: theme.gridRow })),
	gridRowStart: createUtilityPlugin("gridRowStart", [["row-start", "gridRowStart"]], theme => ({
		values: theme.gridRowStart,
	})),
	gridRowEnd: createUtilityPlugin("gridRowEnd", [["row-end", "gridRowEnd"]], theme => ({
		values: theme.gridRowEnd,
	})),
	margin: createUtilityPlugin(
		"margin",
		[
			["m", "margin"],
			[
				"mx",
				value => ({
					marginLeft: value,
					marginRight: value,
				}),
			],
			[
				"my",
				value => ({
					marginTop: value,
					marginBottom: value,
				}),
			],
			["mt", "marginTop"],
			["mr", "marginRight"],
			["mb", "marginBottom"],
			["ml", "marginLeft"],
		],
		theme => ({ values: theme.margin, supportsNegativeValues: true }),
	),
	aspectRatio: createUtilityPlugin("aspectRatio", [["aspect", "aspectRatio"]], theme => ({
		values: theme.aspectRatio,
	})),
	height: createUtilityPlugin("height", [["h", "height"]], theme => ({ values: theme.height })),
	maxHeight: createUtilityPlugin("maxHeight", [["max-h", "maxHeight"]], theme => ({ values: theme.maxHeight })),
	minHeight: createUtilityPlugin("minHeight", [["min-h", "minHeight"]], theme => ({ values: theme.minHeight })),
	width: createUtilityPlugin("width", [["w", "width"]], theme => ({ values: theme.width })),
	maxWidth: plugin("maxWidth", ({ themeObject, matchUtilities }) => {
		const screens = Object.entries(normalizeScreens(themeObject.screens)).reduce(
			(breakpoints, [key, { raw, min, max }]) => {
				let value = max ?? min
				if (typeof value === "number") value = value + "px"
				if (value) {
					return Object.assign(breakpoints, { [`screen-${key}`]: value })
				}
				return breakpoints
			},
			{},
		)

		const values = Object.assign({}, themeObject.maxWidth, screens)
		matchUtilities(
			{
				"max-w"(value) {
					return {
						maxWidth: value,
					}
				},
			},
			{ values },
		)
	}),
	minWidth: createUtilityPlugin("minWidth", [["min-w", "minWidth"]], theme => ({ values: theme.minWidth })),
	flex: createUtilityPlugin("flex", [["flex", "flex"]], theme => ({ values: theme.flex })),
	flexShrink: createUtilityPlugin("flexShrink", [["shrink", "flexShrink"]], theme => ({ values: theme.flexShrink })),
	flexGrow: createUtilityPlugin("flexGrow", [["grow", "flexGrow"]], theme => ({ values: theme.flexGrow })),
	flexBasis: createUtilityPlugin("flexBasis", [["basis", "flexBasis"]], theme => ({ values: theme.flexBasis })),
	transform: plugin("transform", ({ addDefaults, addUtilities }) => {
		addDefaults("transform", {
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		})
		addUtilities({
			".transform": {
				transform: cssTransformValue,
			},
			".transform-cpu": {
				"--tw-transfrom-translate": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
				transform: cssTransformValue,
			},
			".transform-gpu": {
				"--tw-transfrom-translate": "translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), 0)",
				transform: cssTransformValue,
			},
			".transform-none": { transform: "none" },
		})
	}),
	transformOrigin: createUtilityPlugin("transformOrigin", [["origin", "transformOrigin"]], theme => ({
		values: theme.transformOrigin,
	})),
	translate: plugin("translate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"translate-x"(value) {
					return {
						"--tw-translate-x": value,
						transform: cssTransformValue,
					}
				},
				"translate-y"(value) {
					return {
						"--tw-translate-y": value,
						transform: cssTransformValue,
					}
				},
			},
			{ values: themeObject.translate, supportsNegativeValues: true },
		)
	}),
	rotate: plugin("rotate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				rotate(value) {
					return {
						"--tw-rotate": value,
						transform: cssTransformValue,
					}
				},
			},
			{ values: themeObject.rotate, supportsNegativeValues: true },
		)
	}),
	skew: plugin("skew", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"skew-x"(value) {
					return {
						"--tw-skew-x": value,
						transform: cssTransformValue,
					}
				},
				"skew-y"(value) {
					return {
						"--tw-skew-y": value,
						transform: cssTransformValue,
					}
				},
			},
			{ values: themeObject.skew, supportsNegativeValues: true },
		)
	}),
	scale: plugin("scale", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				scale(value) {
					return {
						"--tw-scale-x": value,
						"--tw-scale-y": value,
						transform: cssTransformValue,
					}
				},
				"scale-x"(value) {
					return {
						"--tw-scale-x": value,
						transform: cssTransformValue,
					}
				},
				"scale-y"(value) {
					return {
						"--tw-scale-y": value,
						transform: cssTransformValue,
					}
				},
			},
			{ values: themeObject.scale, supportsNegativeValues: true },
		)
	}),
	cursor: createUtilityPlugin("cursor", [["cursor", "cursor"]], theme => ({
		values: theme.cursor,
	})),
	scrollMargin: createUtilityPlugin(
		"scrollMargin",
		[
			["scroll-m", "scrollMargin"],
			[
				"scroll-mx",
				value => ({
					scrollMarginLeft: value,
					scrollMarginRight: value,
				}),
			],
			[
				"scroll-my",
				value => ({
					scrollMarginTop: value,
					scrollMarginBottom: value,
				}),
			],
			["scroll-mt", "scrollMarginTop"],
			["scroll-mr", "scrollMarginRight"],
			["scroll-mb", "scrollMarginBottom"],
			["scroll-ml", "scrollMarginLeft"],
		],
		theme => ({
			values: theme.scrollMargin,
			supportsNegativeValues: true,
		}),
	),
	scrollPadding: createUtilityPlugin(
		"scrollPadding",
		[
			["scroll-p", "scrollPadding"],
			[
				"scroll-px",
				value => ({
					scrollPaddingLeft: value,
					scrollPaddingRight: value,
				}),
			],
			[
				"scroll-py",
				value => ({
					scrollPaddingTop: value,
					scrollPaddingBottom: value,
				}),
			],
			["scroll-pt", "scrollPaddingTop"],
			["scroll-pr", "scrollPaddingRight"],
			["scroll-pb", "scrollPaddingBottom"],
			["scroll-pl", "scrollPaddingLeft"],
		],
		theme => ({
			values: theme.scrollPadding,
		}),
	),
	listStyleType: createUtilityPlugin("listStyleType", [["list", "listStyleType"]], theme => ({
		values: theme.listStyleType,
	})),
	columns: createUtilityPlugin("columns", [["columns", "columns"]], theme => ({
		values: theme.columns,
	})),
	gridAutoColumns: createUtilityPlugin("gridAutoColumns", [["auto-cols", "gridAutoColumns"]], theme => ({
		values: theme.gridAutoColumns,
	})),
	gridAutoRows: createUtilityPlugin("gridAutoRows", [["auto-rows", "gridAutoRows"]], theme => ({
		values: theme.gridAutoRows,
	})),
	gridTemplateColumns: createUtilityPlugin("gridTemplateColumns", [["grid-cols", "gridTemplateColumns"]], theme => ({
		values: theme.gridTemplateColumns,
	})),
	gridTemplateRows: createUtilityPlugin("gridTemplateRows", [["grid-rows", "gridTemplateRows"]], theme => ({
		values: theme.gridTemplateRows,
	})),
	gap: createUtilityPlugin(
		"gap",
		[
			["gap", "gap"],
			["gap-x", "columnGap"],
			["gap-y", "rowGap"],
		],
		theme => ({ values: theme.gap }),
	),
	borderRadius: createUtilityPlugin(
		"borderRadius",
		[
			["rounded", "borderRadius"],
			["rounded-t", value => ({ "border-top-left-radius": value, "border-top-right-radius": value })],
			["rounded-r", value => ({ "border-top-right-radius": value, "border-bottom-right-radius": value })],
			["rounded-b", value => ({ "border-bottom-right-radius": value, "border-bottom-left-radius": value })],
			["rounded-l", value => ({ "border-top-left-radius": value, "border-bottom-left-radius": value })],
			["rounded-tl", "border-top-left-radius"],
			["rounded-tr", "border-top-right-radius"],
			["rounded-br", "border-bottom-right-radius"],
			["rounded-bl", "border-bottom-left-radius"],
		],
		theme => ({ values: theme.borderRadius }),
	),
	borderWidth: createUtilityPlugin(
		"borderWidth",
		[
			["border", "borderWidth"],
			["border-t", "borderTopWidth"],
			["border-r", "borderRightWidth"],
			["border-b", "borderBottomWidth"],
			["border-l", "borderLeftWidth"],
			["border-x", value => ({ borderLeftWidth: value, borderRightWidth: value })],
			["border-y", value => ({ borderTopWidth: value, borderBottomWidth: value })],
		],
		theme => ({ type: ["line-width", "length"], values: theme.borderWidth }),
	),
	borderSpacing: plugin("borderSpacing", ({ addDefaults, matchUtilities, themeObject }) => {
		addDefaults("border-spacing", {
			"--tw-border-spacing-x": "0",
			"--tw-border-spacing-y": "0",
		})
		matchUtilities(
			{
				"border-spacing": value => {
					return {
						"--tw-border-spacing-x": value,
						"--tw-border-spacing-y": value,
						borderSpacing: "var(--tw-border-spacing-x) var(--tw-border-spacing-y)",
					}
				},
				"border-spacing-x": value => {
					return {
						"--tw-border-spacing-x": value,
						borderSpacing: "var(--tw-border-spacing-x) var(--tw-border-spacing-y)",
					}
				},
				"border-spacing-y": value => {
					return {
						"--tw-border-spacing-y": value,
						borderSpacing: "var(--tw-border-spacing-x) var(--tw-border-spacing-y)",
					}
				},
			},
			{ values: themeObject.borderSpacing },
		)
	}),
	backgroundImage: createUtilityPlugin("backgroundImage", [["bg", "backgroundImage"]], theme => ({
		type: ["url", "image"],
		values: theme.backgroundImage,
	})),
	backgroundSize: createUtilityPlugin("backgroundSize", [["bg", "backgroundSize"]], theme => ({
		type: "background-size",
		values: theme.backgroundSize,
	})),
	backgroundPosition: createUtilityPlugin("backgroundPosition", [["bg", "backgroundPosition"]], theme => ({
		type: "background-position",
		values: theme.backgroundPosition,
	})),
	strokeWidth: createUtilityPlugin("strokeWidth", [["stroke", "strokeWidth"]], theme => ({
		type: ["length", "number", "percentage"],
		values: theme.strokeWidth,
	})),
	outlineWidth: createUtilityPlugin("outlineWidth", [["outline", "outlineWidth"]], theme => ({
		type: ["length", "number", "percentage"],
		values: theme.outlineWidth,
	})),

	outlineOffset: createUtilityPlugin("outlineOffset", [["outline-offset", "outlineOffset"]], theme => ({
		type: ["length", "number", "percentage"],
		values: theme.outlineOffset,
		supportsNegativeValues: true,
	})),
	objectPosition: createUtilityPlugin("objectPosition", [["object", "object-position"]], theme => ({
		values: theme.objectPosition,
	})),
	padding: createUtilityPlugin(
		"padding",
		[
			["p", "padding"],
			[
				"px",
				value => ({
					paddingLeft: value,
					paddingRight: value,
				}),
			],
			[
				"py",
				value => ({
					paddingTop: value,
					paddingBottom: value,
				}),
			],
			["pt", "paddingTop"],
			["pr", "paddingRight"],
			["pb", "paddingBottom"],
			["pl", "paddingLeft"],
		],
		theme => ({ values: theme.padding }),
	),
	textIndent: createUtilityPlugin("textIndent", [["indent", "textIndent"]], theme => ({
		values: theme.textIndent,
		supportsNegativeValues: true,
	})),
	fontFamily: plugin("fontFamily", ({ matchUtilities, themeObject }) => {
		interface Template {
			fontFeatureSettings?: CSSValue
		}
		const table = Object.fromEntries(
			Object.entries(themeObject.fontFamily)
				.map(([key, ffValue]) => {
					const valueArray = Array.isArray(ffValue) ? ffValue : [ffValue]
					const [fontFamily, options = {}] = valueArray
					if (!isCSSEntry(fontFamily)) {
						return undefined
					}

					if (isCSSValue(options)) {
						return [key, { fontFamily: valueArray.join(", ") }] as [string, CSSProperties]
					}

					const tmp: Template = options

					return [
						key,
						{
							fontFamily: Array.isArray(fontFamily) ? fontFamily.join(", ") : fontFamily,
							...tmp,
						},
					] as [string, CSSProperties]
				})
				.filter((t): t is [string, CSSProperties] => !!t),
		)
		matchUtilities(
			{
				font(value) {
					const css = table[value]
					if (css) return css
					return { fontFamily: value }
				},
			},
			{
				type: ["generic-name", "family-name"],
				values: themeObject.fontFamily,
			},
		)
	}),
	fontWeight: createUtilityPlugin("fontWeight", [["font", "fontWeight"]], theme => ({
		type: "number",
		values: theme.fontWeight,
	})),
	lineHeight: createUtilityPlugin("lineHeight", [["leading", "lineHeight"]], theme => ({
		values: theme.lineHeight,
	})),
	letterSpacing: createUtilityPlugin("letterSpacing", [["tracking", "letterSpacing"]], theme => ({
		values: theme.letterSpacing,
		supportsNegativeValues: true,
	})),
	textDecorationThickness: createUtilityPlugin(
		"textDecorationThickness",
		[["decoration", "textDecorationThickness"]],
		theme => ({ type: ["length", "percentage"], values: theme.textDecorationThickness }),
	),
	textUnderlineOffset: createUtilityPlugin(
		"textUnderlineOffset",
		[["underline-offset", "textUnderlineOffset"]],
		theme => ({ type: ["length", "percentage"], values: theme.textUnderlineOffset }),
	),
	opacity: createUtilityPlugin("opacity", [["opacity", "opacity"]], theme => ({ values: theme.opacity })),
	willChange: createUtilityPlugin("willChange", [["will-change", "willChange"]], theme => ({
		values: theme.willChange,
	})),
	content: createUtilityPlugin(
		"content",
		[["content", value => ({ content: "var(--tw-content)", "--tw-content": value })]],
		theme => ({
			values: theme.content,
		}),
	),

	fontSize: plugin("fontSize", ({ matchUtilities, themeObject }) => {
		interface Template {
			fontSize?: CSSValue
			lineHeight?: CSSValue
			letterSpacing?: CSSValue
			fontWeight?: CSSValue
		}
		const values = Object.fromEntries(
			Object.entries(themeObject.fontSize)
				.map(([key, value]) => {
					const [fontSize, options = {}] = Array.isArray(value) ? value : [value]
					if (!isCSSEntry(fontSize)) {
						return undefined
					}
					if (!isCSSEntry(options) && !isObject(options)) {
						return undefined
					}
					const tmp: Template = isCSSEntry(options) ? { lineHeight: options } : options
					if (Object.values(tmp).some(v => !isCSSEntry(v))) {
						return undefined
					}

					return [
						key,
						{
							fontSize: fontSize,
							...tmp,
						},
					] as [string, CSSProperties]
				})
				.filter((t): t is [string, CSSProperties] => !!t),
		)
		matchUtilities(
			{
				text(value) {
					const css = values[value]
					if (css) return css
					return { fontSize: value }
				},
			},
			{
				values: themeObject.fontSize,
				type: ["length", "percentage", "absolute-size", "relative-size"],
			},
		)
	}),
	transitionProperty: plugin("transitionProperty", ({ matchUtilities, theme, themeObject }) => {
		const defaultTimingFunction = theme("transitionTimingFunction.DEFAULT") as string
		const defaultDuration = theme("transitionDuration.DEFAULT") as string
		matchUtilities(
			{
				transition(value): CSSProperties {
					if (value === "none") {
						return { transitionProperty: value }
					}
					return {
						transitionProperty: value,
						transitionTimingFunction: defaultTimingFunction,
						transitionDuration: defaultDuration,
					}
				},
			},
			{ values: themeObject.transitionProperty },
		)
	}),
	transitionDelay: createUtilityPlugin("transitionDelay", [["delay", "transitionDelay"]], theme => ({
		values: theme.transitionDelay,
	})),
	transitionDuration: createUtilityPlugin("transitionDuration", [["duration", "transitionDuration"]], theme => ({
		values: theme.transitionDuration,
		filterDefault: true,
	})),
	transitionTimingFunction: createUtilityPlugin(
		"transitionTimingFunction",
		[["ease", "transitionTimingFunction"]],
		theme => ({
			values: theme.transitionTimingFunction,
			filterDefault: true,
		}),
	),
	boxShadow: plugin("boxShadow", ({ addDefaults, matchUtilities, themeObject }) => {
		matchUtilities(
			{
				shadow(value): CSSProperties {
					if (typeof value !== "string") {
						return {
							boxShadow:
								"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
						}
					}
					if (value === "none") {
						return {
							"--tw-shadow": "0 0 #0000",
							boxShadow: `var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)`,
						}
					}

					// NOTE: DEFAULT shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)

					const _color: parser.Param[] = []
					let index = 0

					const shadowColored = parser
						.parseBoxShadowValues(value)
						.map(val => {
							if (typeof val === "string") {
								return val
							}
							const { color, value } = val
							if (color) {
								_color.push(color)
								return value.replace(
									"--tw-shadow-default-color",
									"--tw-shadow-default-color-" + index++,
								)
							}
							return value
						})
						.join(", ")

					return {
						..._color.reduce((current, color, index) => {
							if (typeof color !== "string") {
								current["--tw-shadow-default-color-" + index] = value.slice(...color.range)
							} else {
								current["--tw-shadow-default-color-" + index] = color
							}
							return current
						}, {}),
						"--tw-shadow-colored": shadowColored,
						"--tw-shadow": "var(--tw-shadow-colored)",
						boxShadow: `var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)`,
					}
				},
			},
			{ type: "shadow", values: themeObject.boxShadow },
		)

		return
	}),
	boxShadowColor: createUtilityPlugin("boxShadowColor", [["shadow", "--tw-shadow-color"]], theme => ({
		type: "color",
		filterDefault: true, // 'shadow' already exists
		values: theme.boxShadowColor,
	})),
	ringWidth: plugin("ringWidth", ({ matchUtilities, addDefaults, addUtilities, themeObject, theme }) => {
		const ringColorDefault = withAlphaValue(theme("ringColor.DEFAULT", "rgb(147 197 253)") as string, "0.5")
		addDefaults("ring-width", {
			"--tw-ring-inset": emptyCssValue,
			"--tw-ring-offset-width": (theme("ringOffsetWidth.DEFAULT", "0px") as CSSValue).toString(),
			"--tw-ring-offset-color": (theme("ringOffsetColor.DEFAULT", "#fff") as CSSValue).toString(),
			"--tw-ring-color": ringColorDefault.toString(),
			"--tw-ring-offset-shadow": "0 0 #0000",
			"--tw-ring-shadow": "0 0 #0000",
		})
		addUtilities({
			".ring-inset": { "--tw-ring-inset": "inset" },
		})
		matchUtilities(
			{
				ring(value) {
					return {
						"--tw-ring-offset-shadow":
							"var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
						"--tw-ring-shadow": `var(--tw-ring-inset) 0 0 0 calc(${value} + var(--tw-ring-offset-width)) var(--tw-ring-color)`,
						boxShadow: "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
					}
				},
			},
			{ type: "length", values: themeObject.ringWidth },
		)
	}),
	ringColor: createUtilityPlugin("ringColor", [["ring", "--tw-ring-color"]], theme => ({
		type: "color",
		filterDefault: true,
		values: theme.ringColor,
	})),
	ringOffsetWidth: createUtilityPlugin("ringOffsetWidth", [["ring-offset", "--tw-ring-offset-width"]], theme => ({
		type: "length",
		values: theme.ringOffsetWidth,
	})),
	ringOffsetColor: createUtilityPlugin("ringOffsetColor", [["ring-offset", "--tw-ring-offset-color"]], theme => ({
		type: "color",
		values: theme.ringOffsetColor,
	})),
	divideWidth: plugin("divideWidth", ({ addUtilities, matchUtilities, themeObject }) => {
		addUtilities({
			".divide-y-reverse > :not([hidden]) ~ :not([hidden])": {
				"--tw-divide-y-reverse": "1",
			},
			".divide-x-reverse > :not([hidden]) ~ :not([hidden])": {
				"--tw-divide-x-reverse": "1",
			},
		})
		matchUtilities(
			{
				"divide-x"(value) {
					value = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							"--tw-divide-x-reverse": "0",
							borderRightWidth: `calc(${value} * var(--tw-divide-x-reverse))`,
							borderLeftWidth: `calc(${value} * calc(1 - var(--tw-divide-x-reverse)))`,
						},
					}
				},
				"divide-y"(value) {
					value = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							"--tw-divide-y-reverse": "0",
							borderTopWidth: `calc(${value} * calc(1 - var(--tw-divide-y-reverse)))`,
							borderBottomWidth: `calc(${value} * var(--tw-divide-y-reverse))`,
						},
					}
				},
			},
			{ type: ["line-width", "length"], values: themeObject.divideWidth },
		)
	}),
	space: plugin("space", ({ addUtilities, matchUtilities, themeObject }) => {
		addUtilities({
			".space-y-reverse > :not([hidden]) ~ :not([hidden])": { "--tw-space-y-reverse": "1" },
			".space-x-reverse > :not([hidden]) ~ :not([hidden])": { "--tw-space-x-reverse": "1" },
		})
		matchUtilities(
			{
				"space-x"(value) {
					value = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							"--tw-space-x-reverse": "0",
							marginRight: `calc(${value} * var(--tw-space-x-reverse))`,
							marginLeft: `calc(${value} * calc(1 - var(--tw-space-x-reverse)))`,
						},
					}
				},
				"space-y"(value) {
					value = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							"--tw-space-y-reverse": "0",
							marginTop: `calc(${value} * calc(1 - var(--tw-space-y-reverse)))`,
							marginBottom: `calc(${value} * var(--tw-space-y-reverse))`,
						},
					}
				},
			},
			{ values: themeObject.space, supportsNegativeValues: true },
		)
	}),
	gradientColorStops: plugin("gradientColorStops", ({ matchUtilities, themeObject }) => {
		function transparentTo(color: string) {
			return withAlphaValue(color, "0")
		}

		matchUtilities(
			{
				from(value) {
					return {
						"--tw-gradient-from": value,
						"--tw-gradient-to": transparentTo(value.toString()),
						"--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to)`,
					}
				},
				via(value) {
					return {
						"--tw-gradient-to": transparentTo(value.toString()),
						"--tw-gradient-stops": `var(--tw-gradient-from), ${value}, var(--tw-gradient-to)`,
					}
				},
				to(value) {
					return { "--tw-gradient-to": value }
				},
			},
			{
				type: "color",
				values: themeObject.gradientColorStops,
			},
		)
	}),
	verticalAlign: plugin("verticalAlign", ({ addUtilities, matchUtilities }) => {
		addUtilities({
			".align-baseline": { verticalAlign: "baseline" },
			".align-top": { verticalAlign: "top" },
			".align-middle": { verticalAlign: "middle" },
			".align-bottom": { verticalAlign: "bottom" },
			".align-text-top": { verticalAlign: "text-top" },
			".align-text-bottom": { verticalAlign: "text-bottom" },
			".align-sub": { verticalAlign: "sub" },
			".align-super": { verticalAlign: "super" },
		})

		matchUtilities({
			align(value) {
				return { verticalAlign: value }
			},
		})
	}),
	container: plugin("container", ({ addComponents, themeObject, theme }) => {
		const screens = normalizeScreens(theme("container.screens", themeObject.screens))
		const container = themeObject.container
		const center = container.center ?? false
		const padding = (container.padding as Record<string, string> | string | undefined) ?? {}

		const generatePaddingFor = (key: string): CSSProperties => {
			let value: CSSValue = ""

			if (isCSSEntry(padding)) {
				value = padding
			} else if (typeof padding === "object") {
				const p = padding[key]
				if (isCSSEntry(p)) {
					value = p
				} else {
					return {}
				}
			}

			return {
				paddingLeft: value,
				paddingRight: value,
			}
		}

		const others = Object.entries(screens).map<CSSProperties>(([key, { raw, min, max }]) => {
			if (raw) {
				return {}
			}

			if (typeof min === "number") min = min + "px"
			if (typeof max === "number") max = max + "px"
			let mediaQuery = ""
			if (min != undefined && max != undefined) {
				mediaQuery = `@media (min-width: ${min}) and (max-width: ${max})`
			} else if (min != undefined) {
				mediaQuery = `@media (min-width: ${min})`
			} else if (max != undefined) {
				mediaQuery = `@media (max-width: ${max})`
			}

			return {
				[mediaQuery]: {
					".container": {
						maxWidth: min,
						...generatePaddingFor(key),
					} as CSSProperties,
				},
			}
		})

		addComponents([
			{
				".container": Object.assign(
					{ width: "100%" },
					center ? { marginRight: "auto", marginLeft: "auto" } : {},
					generatePaddingFor("DEFAULT"),
				) as CSSProperties,
			},
			...others,
		])
	}),
	animation: plugin("animation", ({ matchUtilities, themeObject }) => {
		const keyframes = Object.fromEntries(
			Object.entries(themeObject.keyframes).map(([key, value]) => {
				return [key, { [`@keyframes ${key}`]: value }]
			}),
		)
		matchUtilities(
			{
				animate(value) {
					const names = parser.parseAnimations(typeof value === "string" ? value : "")
					return {
						...Object.assign({}, ...names.map(name => keyframes[name]).filter(isNotEmpty)),
						animation: value,
					}
				},
			},
			{ values: themeObject.animation },
		)
	}),
	filter: plugin("filter", ({ addDefaults, addUtilities }) => {
		addDefaults("filter", {
			"--tw-blur": emptyCssValue,
			"--tw-brightness": emptyCssValue,
			"--tw-contrast": emptyCssValue,
			"--tw-grayscale": emptyCssValue,
			"--tw-hue-rotate": emptyCssValue,
			"--tw-invert": emptyCssValue,
			"--tw-saturate": emptyCssValue,
			"--tw-sepia": emptyCssValue,
			"--tw-drop-shadow": emptyCssValue,
		})
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		addUtilities({
			".filter": { filter: cssFilterValue },
			".filter-none": { filter: "none" },
		})
	}),
	blur: plugin("blur", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				blur(value) {
					return {
						"--tw-blur": `blur(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ values: themeObject.blur },
		)
	}),
	brightness: plugin("brightness", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				brightness(value) {
					return {
						"--tw-brightness": `brightness(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.brightness },
		)
	}),
	contrast: plugin("contrast", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				contrast(value) {
					return {
						"--tw-contrast": `contrast(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.contrast },
		)
	}),
	grayscale: plugin("grayscale", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				grayscale(value) {
					return {
						"--tw-grayscale": `grayscale(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.grayscale },
		)
	}),
	hueRotate: plugin("hueRotate", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				"hue-rotate"(value) {
					return {
						"--tw-hue-rotate": `hue-rotate(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ values: themeObject.hueRotate, supportsNegativeValues: true },
		)
	}),
	invert: plugin("invert", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				invert(value) {
					return {
						"--tw-invert": `invert(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.invert },
		)
	}),
	saturate: plugin("saturate", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				saturate(value) {
					return {
						"--tw-saturate": `saturate(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.saturate },
		)
	}),
	sepia: plugin("sepia", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				sepia(value) {
					return {
						"--tw-sepia": `sepia(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.sepia },
		)
	}),
	dropShadow: plugin("dropShadow", ({ matchUtilities, themeObject }) => {
		const cssFilterValue = [
			"var(--tw-blur)",
			"var(--tw-brightness)",
			"var(--tw-contrast)",
			"var(--tw-grayscale)",
			"var(--tw-hue-rotate)",
			"var(--tw-invert)",
			"var(--tw-saturate)",
			"var(--tw-sepia)",
			"var(--tw-drop-shadow)",
		].join(" ")
		matchUtilities(
			{
				"drop-shadow"(value) {
					return {
						"--tw-drop-shadow": value,
						filter: cssFilterValue,
					}
				},
			},
			{ values: themeObject.dropShadow },
		)
	}),
	backdropFilter: plugin("backdropFilter", ({ addDefaults, addUtilities }) => {
		addDefaults("backdrop-filter", {
			"--tw-backdrop-blur": emptyCssValue,
			"--tw-backdrop-brightness": emptyCssValue,
			"--tw-backdrop-contrast": emptyCssValue,
			"--tw-backdrop-grayscale": emptyCssValue,
			"--tw-backdrop-hue-rotate": emptyCssValue,
			"--tw-backdrop-invert": emptyCssValue,
			"--tw-backdrop-opacity": emptyCssValue,
			"--tw-backdrop-saturate": emptyCssValue,
			"--tw-backdrop-sepia": emptyCssValue,
		})
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		addUtilities({
			".backdrop-filter": { backdropFilter: cssBackdropFilterValue },
			".backdrop-filter-none": { backdropFilter: "none" },
		})
	}),
	backdropBlur: plugin("backdropBlur", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-blur"(value) {
					return {
						"--tw-backdrop-blur": `blur(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ values: themeObject.backdropBlur },
		)
	}),
	backdropBrightness: plugin("backdropBrightness", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-brightness"(value) {
					return {
						"--tw-backdrop-brightness": `brightness(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropBrightness },
		)
	}),
	backdropContrast: plugin("backdropContrast", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-contrast"(value) {
					return {
						"--tw-backdrop-contrast": `contrast(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropContrast },
		)
	}),
	backdropGrayscale: plugin("backdropGrayscale", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-grayscale"(value) {
					return {
						"--tw-backdrop-grayscale": `grayscale(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropGrayscale },
		)
	}),
	backdropHueRotate: plugin("backdropHueRotate", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-hue-rotate"(value) {
					return {
						"--tw-backdrop-hue-rotate": `hue-rotate(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ values: themeObject.backdropHueRotate, supportsNegativeValues: true },
		)
	}),
	backdropInvert: plugin("backdropInvert", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-invert"(value) {
					return {
						"--tw-backdrop-invert": `invert(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropInvert },
		)
	}),
	backdropSaturate: plugin("backdropSaturate", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-saturate"(value) {
					return {
						"--tw-backdrop-saturate": `saturate(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropSaturate },
		)
	}),
	backdropSepia: plugin("backdropSepia", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-sepia"(value) {
					return {
						"--tw-backdrop-sepia": `sepia(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropSepia },
		)
	}),
	backdropOpacity: plugin("backdropOpacity", ({ matchUtilities, themeObject }) => {
		const cssBackdropFilterValue = [
			"var(--tw-backdrop-blur)",
			"var(--tw-backdrop-brightness)",
			"var(--tw-backdrop-contrast)",
			"var(--tw-backdrop-grayscale)",
			"var(--tw-backdrop-hue-rotate)",
			"var(--tw-backdrop-invert)",
			"var(--tw-backdrop-opacity)",
			"var(--tw-backdrop-saturate)",
			"var(--tw-backdrop-sepia)",
		].join(" ")
		matchUtilities(
			{
				"backdrop-opacity"(value) {
					return {
						"--tw-backdrop-opacity": `opacity(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{ type: ["number", "percentage"], values: themeObject.backdropOpacity },
		)
	}),
	fontVariantNumeric: plugin("fontVariantNumeric", ({ addDefaults, addUtilities }) => {
		const cssFontVariantNumericValue =
			"var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)"
		addDefaults("font-variant-numeric", {
			"--tw-ordinal": emptyCssValue,
			"--tw-slashed-zero": emptyCssValue,
			"--tw-numeric-figure": emptyCssValue,
			"--tw-numeric-spacing": emptyCssValue,
			"--tw-numeric-fraction": emptyCssValue,
		})
		addUtilities({
			".normal-nums": { fontVariantNumeric: "normal" },
			".ordinal": {
				"--tw-ordinal": "ordinal",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".slashed-zero": {
				"--tw-slashed-zero": "slashed-zero",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".lining-nums": {
				"--tw-numeric-figure": "lining-nums",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".oldstyle-nums": {
				"--tw-numeric-figure": "oldstyle-nums",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".proportional-nums": {
				"--tw-numeric-spacing": "proportional-nums",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".tabular-nums": {
				"--tw-numeric-spacing": "tabular-nums",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".diagonal-fractions": {
				"--tw-numeric-fraction": "diagonal-fractions",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
			".stacked-fractions": {
				"--tw-numeric-fraction": "stacked-fractions",
				fontVariantNumeric: cssFontVariantNumericValue,
			},
		})
	}),
	scrollSnapType: plugin("scrollSnapType", ({ addDefaults, addUtilities }) => {
		addDefaults("scroll-snap-type", {
			"--tw-scroll-snap-strictness": "proximity",
		})

		addUtilities({
			".snap-none": { scrollSnapType: "none" },
			".snap-x": {
				scrollSnapType: "x var(--tw-scroll-snap-strictness)",
			},
			".snap-y": {
				scrollSnapType: "y var(--tw-scroll-snap-strictness)",
			},
			".snap-both": {
				scrollSnapType: "both var(--tw-scroll-snap-strictness)",
			},
			".snap-mandatory": { "--tw-scroll-snap-strictness": "mandatory" },
			".snap-proximity": { "--tw-scroll-snap-strictness": "proximity" },
		})
	}),
	touchAction: plugin("touchAction", ({ addDefaults, addUtilities }) => {
		addDefaults("touch-action", {
			"--tw-pan-x": emptyCssValue,
			"--tw-pan-y": emptyCssValue,
			"--tw-pinch-zoom": emptyCssValue,
		})
		const cssTouchActionValue = "var(--tw-pan-x) var(--tw-pan-y) var(--tw-pinch-zoom)"
		addUtilities({
			".touch-auto": { touchAction: "auto" },
			".touch-none": { touchAction: "none" },
			".touch-pan-x": {
				"--tw-pan-x": "pan-x",
				touchAction: cssTouchActionValue,
			},
			".touch-pan-left": {
				"--tw-pan-x": "pan-left",
				touchAction: cssTouchActionValue,
			},
			".touch-pan-right": {
				"--tw-pan-x": "pan-right",
				touchAction: cssTouchActionValue,
			},
			".touch-pan-y": {
				"--tw-pan-y": "pan-y",
				touchAction: cssTouchActionValue,
			},
			".touch-pan-up": {
				"--tw-pan-y": "pan-up",
				touchAction: cssTouchActionValue,
			},
			".touch-pan-down": {
				"--tw-pan-y": "pan-down",
				touchAction: cssTouchActionValue,
			},
			".touch-pinch-zoom": {
				"--tw-pinch-zoom": "pinch-zoom",
				touchAction: cssTouchActionValue,
			},
			".touch-manipulation": { touchAction: "manipulation" },
		})
	}),
	appearance: plugin("appearance", ({ addUtilities }) => {
		addUtilities({
			".appearance-none": { appearance: "none" },
		})
	}),
	display: plugin("display", ({ addUtilities }) => {
		addUtilities({
			".block": { display: "block" },
			".inline-block": { display: "inline-block" },
			".inline": { display: "inline" },
			".flex": { display: "flex" },
			".inline-flex": { display: "inline-flex" },
			".table": { display: "table" },
			".inline-table": { display: "inline-table" },
			".table-caption": { display: "table-caption" },
			".table-cell": { display: "table-cell" },
			".table-column": { display: "table-column" },
			".table-column-group": { display: "table-column-group" },
			".table-footer-group": { display: "table-footer-group" },
			".table-header-group": { display: "table-header-group" },
			".table-row-group": { display: "table-row-group" },
			".table-row": { display: "table-row" },
			".flow-root": { display: "flow-root" },
			".grid": { display: "grid" },
			".inline-grid": { display: "inline-grid" },
			".contents": { display: "contents" },
			".list-item": { display: "list-item" },
			".hidden": { display: "none" },
		})
	}),
	accessibility: plugin("accessibility", ({ addUtilities }) => {
		addUtilities({
			".sr-only": {
				position: "absolute",
				width: "1px",
				height: "1px",
				padding: "0",
				margin: "-1px",
				overflow: "hidden",
				clip: "rect(0, 0, 0, 0)",
				whiteSpace: "nowrap",
				borderWidth: "0",
			},
			".not-sr-only": {
				position: "static",
				width: "auto",
				height: "auto",
				padding: "0",
				margin: "0",
				overflow: "visible",
				clip: "auto",
				whiteSpace: "normal",
			},
		})
	}),
	alignContent: plugin("alignContent", ({ addUtilities }) => {
		addUtilities({
			".content-center": { alignContent: "center" },
			".content-start": { alignContent: "flex-start" },
			".content-end": { alignContent: "flex-end" },
			".content-between": { alignContent: "space-between" },
			".content-around": { alignContent: "space-around" },
			".content-evenly": { alignContent: "space-evenly" },
		})
	}),
	alignItems: plugin("alignItems", ({ addUtilities }) => {
		addUtilities({
			".items-start": { alignItems: "flex-start" },
			".items-end": { alignItems: "flex-end" },
			".items-center": { alignItems: "center" },
			".items-baseline": { alignItems: "baseline" },
			".items-stretch": { alignItems: "stretch" },
		})
	}),
	alignSelf: plugin("alignSelf", ({ addUtilities }) => {
		addUtilities({
			".self-auto": { alignSelf: "auto" },
			".self-start": { alignSelf: "flex-start" },
			".self-end": { alignSelf: "flex-end" },
			".self-center": { alignSelf: "center" },
			".self-stretch": { alignSelf: "stretch" },
			".self-baseline": { alignSelf: "baseline" },
		})
	}),
	backgroundAttachment: plugin("backgroundAttachment", ({ addUtilities }) => {
		addUtilities({
			".bg-fixed": { backgroundAttachment: "fixed" },
			".bg-local": { backgroundAttachment: "local" },
			".bg-scroll": { backgroundAttachment: "scroll" },
		})
	}),
	backgroundBlendMode: plugin("backgroundBlendMode", ({ addUtilities }) => {
		addUtilities({
			".bg-blend-normal": { backgroundBlendMode: "normal" },
			".bg-blend-multiply": { backgroundBlendMode: "multiply" },
			".bg-blend-screen": { backgroundBlendMode: "screen" },
			".bg-blend-overlay": { backgroundBlendMode: "overlay" },
			".bg-blend-darken": { backgroundBlendMode: "darken" },
			".bg-blend-lighten": { backgroundBlendMode: "lighten" },
			".bg-blend-color-dodge": { backgroundBlendMode: "color-dodge" },
			".bg-blend-color-burn": { backgroundBlendMode: "color-burn" },
			".bg-blend-hard-light": { backgroundBlendMode: "hard-light" },
			".bg-blend-soft-light": { backgroundBlendMode: "soft-light" },
			".bg-blend-difference": { backgroundBlendMode: "difference" },
			".bg-blend-exclusion": { backgroundBlendMode: "exclusion" },
			".bg-blend-hue": { backgroundBlendMode: "hue" },
			".bg-blend-saturation": { backgroundBlendMode: "saturation" },
			".bg-blend-color": { backgroundBlendMode: "color" },
			".bg-blend-luminosity": { backgroundBlendMode: "luminosity" },
		})
	}),
	backgroundClip: plugin("backgroundClip", ({ addUtilities }) => {
		addUtilities({
			".bg-clip-border": { backgroundClip: "border-box" },
			".bg-clip-padding": { backgroundClip: "padding-box" },
			".bg-clip-content": { backgroundClip: "content-box" },
			".bg-clip-text": { backgroundClip: "text" },
		})
	}),
	backgroundOrigin: plugin("backgroundOrigin", ({ addUtilities }) => {
		addUtilities({
			".bg-origin-border": { backgroundOrigin: "border-box" },
			".bg-origin-padding": { backgroundOrigin: "padding-box" },
			".bg-origin-content": { backgroundOrigin: "content-box" },
		})
	}),
	backgroundRepeat: plugin("backgroundRepeat", ({ addUtilities }) => {
		addUtilities({
			".bg-repeat": { backgroundRepeat: "repeat" },
			".bg-no-repeat": { backgroundRepeat: "no-repeat" },
			".bg-repeat-x": { backgroundRepeat: "repeat-x" },
			".bg-repeat-y": { backgroundRepeat: "repeat-y" },
			".bg-repeat-round": { backgroundRepeat: "round" },
			".bg-repeat-space": { backgroundRepeat: "space" },
		})
	}),
	borderCollapse: plugin("borderCollapse", ({ addUtilities }) => {
		addUtilities({
			".border-collapse": { borderCollapse: "collapse" },
			".border-separate": { borderCollapse: "separate" },
		})
	}),
	borderStyle: plugin("borderStyle", ({ addUtilities }) => {
		addUtilities({
			".border-solid": { borderStyle: "solid" },
			".border-dashed": { borderStyle: "dashed" },
			".border-dotted": { borderStyle: "dotted" },
			".border-double": { borderStyle: "double" },
			".border-hidden": { borderStyle: "hidden" },
			".border-none": { borderStyle: "none" },
		})
	}),
	boxDecorationBreak: plugin("boxDecorationBreak", ({ addUtilities }) => {
		addUtilities({
			".box-decoration-slice": { boxDecorationBreak: "slice" },
			".box-decoration-clone": { boxDecorationBreak: "clone" },
		})
	}),
	boxSizing: plugin("boxSizing", ({ addUtilities }) => {
		addUtilities({
			".box-border": { boxSizing: "border-box" },
			".box-content": { boxSizing: "content-box" },
		})
	}),
	breakAfter: plugin("breakAfter", ({ addUtilities }) => {
		addUtilities({
			".break-after-auto": { breakAfter: "auto" },
			".break-after-avoid": { breakAfter: "avoid" },
			".break-after-all": { breakAfter: "all" },
			".break-after-avoid-page": { breakAfter: "avoid-page" },
			".break-after-page": { breakAfter: "page" },
			".break-after-left": { breakAfter: "left" },
			".break-after-right": { breakAfter: "right" },
			".break-after-column": { breakAfter: "column" },
		})
	}),
	breakBefore: plugin("breakBefore", ({ addUtilities }) => {
		addUtilities({
			".break-before-auto": { breakBefore: "auto" },
			".break-before-avoid": { breakBefore: "avoid" },
			".break-before-all": { breakBefore: "all" },
			".break-before-avoid-page": { breakBefore: "avoid-page" },
			".break-before-page": { breakBefore: "page" },
			".break-before-left": { breakBefore: "left" },
			".break-before-right": { breakBefore: "right" },
			".break-before-column": { breakBefore: "column" },
		})
	}),
	breakInside: plugin("breakInside", ({ addUtilities }) => {
		addUtilities({
			".break-inside-auto": { breakInside: "auto" },
			".break-inside-avoid": { breakInside: "avoid" },
			".break-inside-avoid-page": { breakInside: "avoid-page" },
			".break-inside-avoid-column": { breakInside: "avoid-column" },
		})
	}),
	clear: plugin("clear", ({ addUtilities }) => {
		addUtilities({
			".clear-left": { clear: "left" },
			".clear-right": { clear: "right" },
			".clear-both": { clear: "both" },
			".clear-none": { clear: "none" },
		})
	}),
	divideStyle: plugin("divideStyle", ({ addUtilities }) => {
		addUtilities({
			".divide-solid > :not([hidden]) ~ :not([hidden])": { borderStyle: "solid" },
			".divide-dashed > :not([hidden]) ~ :not([hidden])": { borderStyle: "dashed" },
			".divide-dotted > :not([hidden]) ~ :not([hidden])": { borderStyle: "dotted" },
			".divide-double > :not([hidden]) ~ :not([hidden])": { borderStyle: "double" },
			".divide-none > :not([hidden]) ~ :not([hidden])": { borderStyle: "none" },
		})
	}),
	flexDirection: plugin("flexDirection", ({ addUtilities }) => {
		addUtilities({
			".flex-row": { flexDirection: "row" },
			".flex-row-reverse": { flexDirection: "row-reverse" },
			".flex-col": { flexDirection: "column" },
			".flex-col-reverse": { flexDirection: "column-reverse" },
		})
	}),
	flexWrap: plugin("flexWrap", ({ addUtilities }) => {
		addUtilities({
			".flex-wrap": { flexWrap: "wrap" },
			".flex-wrap-reverse": { flexWrap: "wrap-reverse" },
			".flex-nowrap": { flexWrap: "nowrap" },
		})
	}),
	float: plugin("float", ({ addUtilities }) => {
		addUtilities({
			".float-right": { float: "right" },
			".float-left": { float: "left" },
			".float-none": { float: "none" },
		})
	}),
	fontSmoothing: plugin("fontSmoothing", ({ addUtilities }) => {
		addUtilities({
			".antialiased": {
				"-webkit-font-smoothing": "antialiased",
				"-moz-osx-font-smoothing": "grayscale",
			},
			".subpixel-antialiased": {
				"-webkit-font-smoothing": "auto",
				"-moz-osx-font-smoothing": "auto",
			},
		})
	}),
	fontStyle: plugin("fontStyle", ({ addUtilities }) => {
		addUtilities({
			".italic": { fontStyle: "italic" },
			".not-italic": { fontStyle: "normal" },
		})
	}),
	gridAutoFlow: plugin("gridAutoFlow", ({ addUtilities }) => {
		addUtilities({
			".grid-flow-row": { gridAutoFlow: "row" },
			".grid-flow-col": { gridAutoFlow: "column" },
			".grid-flow-dense": { gridAutoFlow: "dense" },
			".grid-flow-row-dense": { gridAutoFlow: "row dense" },
			".grid-flow-col-dense": { gridAutoFlow: "column dense" },
		})
	}),
	isolation: plugin("isolation", ({ addUtilities }) => {
		addUtilities({
			".isolate": { isolation: "isolate" },
			".isolation-auto": { isolation: "auto" },
		})
	}),
	justifyContent: plugin("justifyContent", ({ addUtilities }) => {
		addUtilities({
			".justify-start": { justifyContent: "flex-start" },
			".justify-end": { justifyContent: "flex-end" },
			".justify-center": { justifyContent: "center" },
			".justify-between": { justifyContent: "space-between" },
			".justify-around": { justifyContent: "space-around" },
			".justify-evenly": { justifyContent: "space-evenly" },
		})
	}),
	justifyItems: plugin("justifyItems", ({ addUtilities }) => {
		addUtilities({
			".justify-items-start": { justifyItems: "start" },
			".justify-items-end": { justifyItems: "end" },
			".justify-items-center": { justifyItems: "center" },
			".justify-items-stretch": { justifyItems: "stretch" },
		})
	}),
	justifySelf: plugin("justifySelf", ({ addUtilities }) => {
		addUtilities({
			".justify-self-auto": { justifySelf: "auto" },
			".justify-self-start": { justifySelf: "start" },
			".justify-self-end": { justifySelf: "end" },
			".justify-self-center": { justifySelf: "center" },
			".justify-self-stretch": { justifySelf: "stretch" },
		})
	}),
	listStylePosition: plugin("listStylePosition", ({ addUtilities }) => {
		addUtilities({
			".list-inside": { listStylePosition: "inside" },
			".list-outside": { listStylePosition: "outside" },
		})
	}),
	mixBlendMode: plugin("mixBlendMode", ({ addUtilities }) => {
		addUtilities({
			".mix-blend-normal": { mixBlendMode: "normal" },
			".mix-blend-multiply": { mixBlendMode: "multiply" },
			".mix-blend-screen": { mixBlendMode: "screen" },
			".mix-blend-overlay": { mixBlendMode: "overlay" },
			".mix-blend-darken": { mixBlendMode: "darken" },
			".mix-blend-lighten": { mixBlendMode: "lighten" },
			".mix-blend-color-dodge": { mixBlendMode: "color-dodge" },
			".mix-blend-color-burn": { mixBlendMode: "color-burn" },
			".mix-blend-hard-light": { mixBlendMode: "hard-light" },
			".mix-blend-soft-light": { mixBlendMode: "soft-light" },
			".mix-blend-difference": { mixBlendMode: "difference" },
			".mix-blend-exclusion": { mixBlendMode: "exclusion" },
			".mix-blend-hue": { mixBlendMode: "hue" },
			".mix-blend-saturation": { mixBlendMode: "saturation" },
			".mix-blend-color": { mixBlendMode: "color" },
			".mix-blend-luminosity": { mixBlendMode: "luminosity" },
			".mix-blend-plus-lighter": { mixBlendMode: "plus-lighter" },
		})
	}),
	objectFit: plugin("objectFit", ({ addUtilities }) => {
		addUtilities({
			".object-contain": { objectFit: "contain" },
			".object-cover": { objectFit: "cover" },
			".object-fill": { objectFit: "fill" },
			".object-none": { objectFit: "none" },
			".object-scale-down": { objectFit: "scale-down" },
		})
	}),
	outlineStyle: plugin("outlineStyle", ({ addUtilities }) => {
		addUtilities({
			".outline-none": {
				outline: "2px solid transparent",
				"outline-offset": "2px",
			},
			".outline": { outlineStyle: "solid" },
			".outline-dashed": { outlineStyle: "dashed" },
			".outline-dotted": { outlineStyle: "dotted" },
			".outline-double": { outlineStyle: "double" },
		})
	}),
	overflow: plugin("overflow", ({ addUtilities }) => {
		addUtilities({
			".overflow-auto": { overflow: "auto" },
			".overflow-hidden": { overflow: "hidden" },
			".overflow-clip": { overflow: "clip" },
			".overflow-visible": { overflow: "visible" },
			".overflow-scroll": { overflow: "scroll" },
			".overflow-x-auto": { overflowX: "auto" },
			".overflow-y-auto": { overflowY: "auto" },
			".overflow-x-hidden": { overflowX: "hidden" },
			".overflow-y-hidden": { overflowY: "hidden" },
			".overflow-x-clip": { overflowX: "clip" },
			".overflow-y-clip": { overflowY: "clip" },
			".overflow-x-visible": { overflowX: "visible" },
			".overflow-y-visible": { overflowY: "visible" },
			".overflow-x-scroll": { overflowX: "scroll" },
			".overflow-y-scroll": { overflowY: "scroll" },
		})
	}),
	overscrollBehavior: plugin("overscrollBehavior", ({ addUtilities }) => {
		addUtilities({
			".overscroll-auto": { overscrollBehavior: "auto" },
			".overscroll-contain": { overscrollBehavior: "contain" },
			".overscroll-none": { overscrollBehavior: "none" },
			".overscroll-y-auto": { overscrollBehaviorY: "auto" },
			".overscroll-y-contain": { overscrollBehaviorY: "contain" },
			".overscroll-y-none": { overscrollBehaviorY: "none" },
			".overscroll-x-auto": { overscrollBehaviorX: "auto" },
			".overscroll-x-contain": { overscrollBehaviorX: "contain" },
			".overscroll-x-none": { overscrollBehaviorX: "none" },
		})
	}),
	placeContent: plugin("placeContent", ({ addUtilities }) => {
		addUtilities({
			".place-content-center": { placeContent: "center" },
			".place-content-start": { placeContent: "start" },
			".place-content-end": { placeContent: "end" },
			".place-content-between": { placeContent: "space-between" },
			".place-content-around": { placeContent: "space-around" },
			".place-content-evenly": { placeContent: "space-evenly" },
			".place-content-stretch": { placeContent: "stretch" },
		})
	}),
	placeItems: plugin("placeItems", ({ addUtilities }) => {
		addUtilities({
			".place-items-start": { placeItems: "start" },
			".place-items-end": { placeItems: "end" },
			".place-items-center": { placeItems: "center" },
			".place-items-stretch": { placeItems: "stretch" },
		})
	}),
	placeSelf: plugin("placeSelf", ({ addUtilities }) => {
		addUtilities({
			".place-self-auto": { placeSelf: "auto" },
			".place-self-start": { placeSelf: "start" },
			".place-self-end": { placeSelf: "end" },
			".place-self-center": { placeSelf: "center" },
			".place-self-stretch": { placeSelf: "stretch" },
		})
	}),
	pointerEvents: plugin("pointerEvents", ({ addUtilities }) => {
		addUtilities({
			".pointer-events-none": { pointerEvents: "none" },
			".pointer-events-auto": { pointerEvents: "auto" },
		})
	}),
	position: plugin("position", ({ addUtilities }) => {
		addUtilities({
			".static": { position: "static" },
			".fixed": { position: "fixed" },
			".absolute": { position: "absolute" },
			".relative": { position: "relative" },
			".sticky": { position: "sticky" },
		})
	}),
	resize: plugin("resize", ({ addUtilities }) => {
		addUtilities({
			".resize-none": { resize: "none" },
			".resize-y": { resize: "vertical" },
			".resize-x": { resize: "horizontal" },
			".resize": { resize: "both" },
		})
	}),
	scrollBehavior: plugin("scrollBehavior", ({ addUtilities }) => {
		addUtilities({
			".scroll-auto": { scrollBehavior: "auto" },
			".scroll-smooth": { scrollBehavior: "smooth" },
		})
	}),
	scrollSnapAlign: plugin("scrollSnapAlign", ({ addUtilities }) => {
		addUtilities({
			".snap-start": { scrollSnapAlign: "start" },
			".snap-end": { scrollSnapAlign: "end" },
			".snap-center": { scrollSnapAlign: "center" },
			".snap-align-none": { scrollSnapAlign: "none" },
		})
	}),
	scrollSnapStop: plugin("scrollSnapStop", ({ addUtilities }) => {
		addUtilities({
			".snap-normal": { scrollSnapStop: "normal" },
			".snap-always": { scrollSnapStop: "always" },
		})
	}),
	tableLayout: plugin("tableLayout", ({ addUtilities }) => {
		addUtilities({
			".table-auto": { tableLayout: "auto" },
			".table-fixed": { tableLayout: "fixed" },
		})
	}),
	textAlign: plugin("textAlign", ({ addUtilities }) => {
		addUtilities({
			".text-left": { textAlign: "left" },
			".text-center": { textAlign: "center" },
			".text-right": { textAlign: "right" },
			".text-justify": { textAlign: "justify" },
			".text-start": { textAlign: "start" },
			".text-end": { textAlign: "end" },
		})
	}),
	textDecoration: plugin("textDecoration", ({ addUtilities }) => {
		addUtilities({
			".underline": { textDecorationLine: "underline" },
			".overline": { textDecorationLine: "overline" },
			".line-through": { textDecorationLine: "line-through" },
			".no-underline": { textDecorationLine: "none" },
		})
	}),
	textDecorationStyle: plugin("textDecorationStyle", ({ addUtilities }) => {
		addUtilities({
			".decoration-solid": { textDecorationStyle: "solid" },
			".decoration-double": { textDecorationStyle: "double" },
			".decoration-dotted": { textDecorationStyle: "dotted" },
			".decoration-dashed": { textDecorationStyle: "dashed" },
			".decoration-wavy": { textDecorationStyle: "wavy" },
		})
	}),
	textOverflow: plugin("textOverflow", ({ addUtilities }) => {
		addUtilities({
			".truncate": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
			".text-ellipsis": { textOverflow: "ellipsis" },
			".text-clip": { textOverflow: "clip" },
		})
	}),
	textTransform: plugin("textTransform", ({ addUtilities }) => {
		addUtilities({
			".uppercase": { textTransform: "uppercase" },
			".lowercase": { textTransform: "lowercase" },
			".capitalize": { textTransform: "capitalize" },
			".normal-case": { textTransform: "none" },
		})
	}),
	userSelect: plugin("userSelect", ({ addUtilities }) => {
		addUtilities({
			".select-none": { userSelect: "none" },
			".select-text": { userSelect: "text" },
			".select-all": { userSelect: "all" },
			".select-auto": { userSelect: "auto" },
		})
	}),
	visibility: plugin("visibility", ({ addUtilities }) => {
		addUtilities({
			".visible": { visibility: "visible" },
			".invisible": { visibility: "hidden" },
			".collapse": { visibility: "collapse" },
		})
	}),
	whitespace: plugin("whitespace", ({ addUtilities }) => {
		addUtilities({
			".whitespace-normal": { whiteSpace: "normal" },
			".whitespace-nowrap": { whiteSpace: "nowrap" },
			".whitespace-pre": { whiteSpace: "pre" },
			".whitespace-pre-line": { whiteSpace: "pre-line" },
			".whitespace-pre-wrap": { whiteSpace: "pre-wrap" },
		})
	}),
	wordBreak: plugin("wordBreak", ({ addUtilities }) => {
		addUtilities({
			".break-normal": { overflowWrap: "normal", wordBreak: "normal" },
			".break-words": { overflowWrap: "break-word" },
			".break-all": { wordBreak: "break-all" },
			".break-keep": { wordBreak: "keep-all" },
		})
	}),
}
