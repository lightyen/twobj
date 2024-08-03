import * as parser from "./parser"
import { plugin } from "./plugin"
import { preflight } from "./preflight"
import type {
	ArbitraryParameters,
	ColorValueFunc,
	ConfigEntry,
	ConfigObject,
	CorePluginFeatures,
	CSSProperties,
	CSSValue,
	MatchOption,
	PlainCSSProperties,
	Primitive,
	StrictResolvedConfigJS,
	UnnamedPlugin,
	UtilityRender,
	VariantRender,
} from "./types"
import { isCSSValue, isNotEmpty, isObject, normalizeScreens } from "./util"
import { pseudoVariants } from "./variant"

function withAlphaValue(value: Primitive | ColorValueFunc, opacityValue: string) {
	if (typeof value === "function") {
		const valueFn = value
		value = valueFn({ opacityValue })
	}
	if (typeof value === "number") {
		return String(value)
	}
	if (!opacityValue) {
		return String(value)
	}
	opacityValue = " / " + opacityValue
	const color = parser.parseColor(String(value))
	const canAlpha = color != undefined && parser.isColorFunction(color.fn)
	if (canAlpha) {
		if (color.params.every(v => typeof v === "string")) {
			return color.fn + "(" + color.params.join(" ") + opacityValue + ")"
		}
	}
	const result = parser.unwrapCssFunction(String(value))
	if (result && parser.isColorFunction(result.fn)) {
		return "rgb(" + result.params + opacityValue + ")"
	}
	return "rgb(" + String(value) + opacityValue + ")"
}

type ClassPlugins = {
	[P in keyof CorePluginFeatures]?: UnnamedPlugin
}

function spec(
	utilities: Record<
		string,
		<Value extends CSSValue = CSSValue>(...args: ArbitraryParameters<Value>) => CSSProperties
	>,
) {
	return utilities as Record<string, (...args: ArbitraryParameters) => CSSProperties>
}

const cssFilterValue = [
	"var(--tw-blur,)",
	"var(--tw-brightness,)",
	"var(--tw-contrast,)",
	"var(--tw-grayscale,)",
	"var(--tw-hue-rotate,)",
	"var(--tw-invert,)",
	"var(--tw-saturate,)",
	"var(--tw-sepia,)",
	"var(--tw-drop-shadow,)",
].join(" ")

const cssFilterReset = {
	"--tw-blur": "initial",
	"--tw-brightness": "initial",
	"--tw-contrast": "initial",
	"--tw-grayscale": "initial",
	"--tw-hue": "initial",
	"--tw-invert": "initial",
	"--tw-saturate": "initial",
	"--tw-sepia": "initial",
	"--tw-drop-shadow": "initial",
}

const cssBackdropFilterValue = [
	"var(--tw-backdrop-blur,)",
	"var(--tw-backdrop-brightness,)",
	"var(--tw-backdrop-contrast,)",
	"var(--tw-backdrop-grayscale,)",
	"var(--tw-backdrop-hue-rotate,)",
	"var(--tw-backdrop-invert,)",
	"var(--tw-backdrop-opacity,)",
	"var(--tw-backdrop-saturate,)",
	"var(--tw-backdrop-sepia,)",
].join(" ")

const cssBackdropFilterReset = {
	"--tw-backdrop-blur": "initial",
	"--tw-backdrop-brightness": "initial",
	"--tw-backdrop-contrast": "initial",
	"--tw-backdrop-grayscale": "initial",
	"--tw-backdrop-hue": "initial",
	"--tw-backdrop-invert": "initial",
	"--tw-backdrop-saturate": "initial",
	"--tw-backdrop-sepia": "initial",
	"--tw-backdrop-opacity": "initial",
}

const cssTransformValue = [
	"var(--tw-transfrom-translate, translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)))",
	"rotate(var(--tw-rotate, 0))",
	"skewX(var(--tw-skew-x, 0))",
	"skewY(var(--tw-skew-y, 0))",
	"scaleX(var(--tw-scale-x, 1))",
	"scaleY(var(--tw-scale-y, 1))",
].join(" ")

const cssTransformReset = {
	"--tw-translate-x": "initial",
	"--tw-translate-y": "initial",
	"--tw-rotate": "initial",
	"--tw-skew-x": "initial",
	"--tw-skew-y": "initial",
	"--tw-scale-x": "initial",
	"--tw-scale-y": "initial",
}

const cssFontVariantNumericValue =
	"var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)"

const cssFontVariantNumericReset = {
	"--tw-ordinal": "initial",
	"--tw-slashed-zero": "initial",
	"--tw-numeric-figure": "initial",
	"--tw-numeric-spacing": "initial",
	"--tw-numeric-fraction": "initial",
}

const cssBoxShadowValue =
	"var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)"

const cssBoxShadowReset = {
	"--tw-ring-offset-color": "initial",
	"--tw-ring-offset-width": "initial",
	"--tw-ring-color": "initial",
	"--tw-ring-inset": "initial",
	"--tw-ring-offset-shadow": "initial",
	"--tw-ring-shadow": "initial",
	"--tw-shadow": "initial",
}

const cssTouchActionValue = "var(--tw-pan-x,) var(--tw-pan-y,) var(--tw-pinch-zoom,)"

const cssTouchActionReset = {
	"--tw-pan-x": "initial",
	"--tw-pan-y": "initial",
	"--tw-pinch-zoom": "initial",
}

const cssBorderSpacingValue = "var(--tw-border-spacing-x, 0) var(--tw-border-spacing-y, 0)"

function createUtilityPlugin<Value = unknown>(
	pluginName: string,
	mappings: Array<[key: string, propOrTemplate: string | Array<string> | UtilityRender<Value>]>,
	getOptions: (theme: StrictResolvedConfigJS["theme"]) => MatchOption,
) {
	return plugin(pluginName, ({ matchUtilities, themeObject }) => {
		matchUtilities(
			Object.assign(
				{},
				...mappings.map(([key, prop]) => {
					const render: UtilityRender<Value> = (value, options) => {
						if (typeof prop === "function") {
							return prop(value, options)
						}

						if (typeof value === "string") {
							if (typeof prop === "string") {
								return { [prop]: value }
							}
							if (Array.isArray(prop)) {
								return Object.fromEntries(prop.map(p => [p, value]))
							}
						}
						return {}
					}
					return {
						[key]: render,
					}
				}),
			),
			getOptions?.(themeObject),
		)
	})
}

function createColorPlugin(
	pluginName: string,
	mappings: Array<[key: string, propOrTemplate: string | UtilityRender<string>]>,
	getValues: (theme: StrictResolvedConfigJS["theme"]) => ConfigEntry,
) {
	return createUtilityPlugin(pluginName, mappings, themeObject => ({
		type: "color",
		values: getValues(themeObject) as ConfigObject,
	}))
}

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
			["border-x", ["borderLeftColor", "borderRightColor"]],
			["border-y", ["borderTopColor", "borderBottomColor"]],
			["border-s", "borderInlineStartColor"],
			["border-e", "borderInlineEndColor"],
			["border-t", "borderTopColor"],
			["border-r", "borderRightColor"],
			["border-b", "borderBottomColor"],
			["border-l", "borderLeftColor"],
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
	divideColor: createUtilityPlugin<string>(
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
			["inset", "inset"],
			["inset-x", ["left", "right"]],
			["inset-y", ["top", "bottom"]],
			["start", "insetInlineStart"],
			["end", "insetInlineEnd"],
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
			["mx", ["marginLeft", "marginRight"]],
			["my", ["marginTop", "marginBottom"]],
			["ms", "marginInlineStart"],
			["me", "marginInlineEnd"],
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
	size: createUtilityPlugin("size", [["size", ["width", "height"]]], theme => ({ values: theme.size })),
	height: createUtilityPlugin("height", [["h", "height"]], theme => ({ values: theme.height })),
	maxHeight: createUtilityPlugin("maxHeight", [["max-h", "maxHeight"]], theme => ({ values: theme.maxHeight })),
	minHeight: createUtilityPlugin("minHeight", [["min-h", "minHeight"]], theme => ({ values: theme.minHeight })),
	width: createUtilityPlugin("width", [["w", "width"]], theme => ({ values: theme.width })),
	maxWidth: plugin("maxWidth", ({ themeObject, matchUtilities }) => {
		const normalized = normalizeScreens(themeObject.screens).reduce((breakpoints, { key, value }) => {
			if (value > 0) {
				return Object.assign(breakpoints, { [`screen-${key}`]: value + "px" })
			}
			return breakpoints
		}, {})

		const values = Object.assign({}, themeObject.maxWidth, normalized)
		matchUtilities(
			spec({
				"max-w"(value) {
					return {
						maxWidth: value,
					}
				},
			}),
			{ values },
		)
	}),
	minWidth: createUtilityPlugin("minWidth", [["min-w", "minWidth"]], theme => ({ values: theme.minWidth })),
	flex: createUtilityPlugin("flex", [["flex", "flex"]], theme => ({ values: theme.flex })),
	flexShrink: createUtilityPlugin("flexShrink", [["shrink", "flexShrink"]], theme => ({ values: theme.flexShrink })),
	flexGrow: createUtilityPlugin("flexGrow", [["grow", "flexGrow"]], theme => ({ values: theme.flexGrow })),
	flexBasis: createUtilityPlugin("flexBasis", [["basis", "flexBasis"]], theme => ({ values: theme.flexBasis })),
	transform: plugin("transform", ({ addUtilities }) => {
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
			spec({
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
			}),
			{
				values: themeObject.translate,
				supportsNegativeValues: true,
				post(css = {}) {
					return { ...cssTransformReset, ...css }
				},
			},
		)
	}),
	rotate: plugin("rotate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			spec({
				rotate(value) {
					return {
						"--tw-rotate": value,
						transform: cssTransformValue,
					}
				},
			}),
			{
				values: themeObject.rotate,
				supportsNegativeValues: true,
				post(css = {}) {
					return { ...cssTransformReset, ...css }
				},
			},
		)
	}),
	skew: plugin("skew", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			spec({
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
			}),
			{
				values: themeObject.skew,
				supportsNegativeValues: true,
				post(css = {}) {
					return { ...cssTransformReset, ...css }
				},
			},
		)
	}),
	scale: plugin("scale", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			spec({
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
			}),
			{
				values: themeObject.scale,
				supportsNegativeValues: true,
				post(css = {}) {
					return { ...cssTransformReset, ...css }
				},
			},
		)
	}),
	cursor: createUtilityPlugin("cursor", [["cursor", "cursor"]], theme => ({
		values: theme.cursor,
	})),
	scrollMargin: createUtilityPlugin(
		"scrollMargin",
		[
			["scroll-m", "scrollMargin"],
			["scroll-mx", ["scrollMarginLeft", "scrollMarginRight"]],
			["scroll-my", ["scrollMarginTop", "scrollMarginBottom"]],
			["scroll-ms", "scrollMarginInlineStart"],
			["scroll-me", "scrollMarginInlineEnd"],
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
			["scroll-px", ["scrollPaddingLeft", "scrollPaddingRight"]],
			["scroll-py", ["scrollPaddingTop", "scrollPaddingBottom"]],
			["scroll-ps", "scrollPaddingInlineStart"],
			["scroll-pe", "scrollPaddingInlineEnd"],
			["scroll-pt", "scrollPaddingTop"],
			["scroll-pr", "scrollPaddingRight"],
			["scroll-pb", "scrollPaddingBottom"],
			["scroll-pl", "scrollPaddingLeft"],
		],
		theme => ({
			values: theme.scrollPadding,
		}),
	),
	listStyleImage: createUtilityPlugin("listStyleImage", [["list-image", "listStyleImage"]], theme => ({
		values: theme.listStyleImage,
	})),
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
			["rounded-s", ["border-start-start-radius", "border-end-start-radius"]],
			["rounded-e", ["border-start-end-radius", "border-end-end-radius"]],
			["rounded-t", ["border-top-left-radius", "border-top-right-radius"]],
			["rounded-r", ["border-top-right-radius", "border-bottom-right-radius"]],
			["rounded-b", ["border-bottom-right-radius", "border-bottom-left-radius"]],
			["rounded-l", ["border-top-left-radius", "border-bottom-left-radius"]],
			["rounded-ss", "border-start-start-radius"],
			["rounded-se", "border-start-end-radius"],
			["rounded-ee", "border-end-end-radius"],
			["rounded-es", "border-end-start-radius"],
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
			["border-x", ["borderLeftWidth", "borderRightWidth"]],
			["border-y", ["borderTopWidth", "borderBottomWidth"]],
			["border-s", "borderInlineStartWidth"],
			["border-e", "borderInlineEndWidth"],
			["border-t", "borderTopWidth"],
			["border-r", "borderRightWidth"],
			["border-b", "borderBottomWidth"],
			["border-l", "borderLeftWidth"],
		],
		theme => ({ type: ["line-width", "length"], values: theme.borderWidth }),
	),
	borderSpacing: plugin("borderSpacing", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			spec({
				"border-spacing": value => {
					return {
						"--tw-border-spacing-x": value,
						"--tw-border-spacing-y": value,
						borderSpacing: cssBorderSpacingValue,
					}
				},
				"border-spacing-x": value => {
					return {
						"--tw-border-spacing-x": value,
						borderSpacing: cssBorderSpacingValue,
					}
				},
				"border-spacing-y": value => {
					return {
						"--tw-border-spacing-y": value,
						borderSpacing: cssBorderSpacingValue,
					}
				},
			}),
			{
				values: themeObject.borderSpacing,
				post(css = {}) {
					return {
						"--tw-border-spacing-x": "initial",
						"--tw-border-spacing-y": "initial",
						...css,
					}
				},
			},
		)
	}),
	backgroundImage: createUtilityPlugin("backgroundImage", [["bg", "backgroundImage"]], theme => ({
		type: ["url", "image"],
		values: theme.backgroundImage,
	})),
	backgroundGradient: plugin("backgroundGradient", ({ addUtilities }) => {
		addUtilities(
			{
				".bg-gradient-to-t": {
					backgroundImage:
						"linear-gradient(to top, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-tr": {
					backgroundImage:
						"linear-gradient(to top right, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-r": {
					backgroundImage:
						"linear-gradient(to right, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-br": {
					backgroundImage:
						"linear-gradient(to bottom right, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-b": {
					backgroundImage:
						"linear-gradient(to bottom, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-bl": {
					backgroundImage:
						"linear-gradient(to bottom left, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-l": {
					backgroundImage:
						"linear-gradient(to left, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
				".bg-gradient-to-tl": {
					backgroundImage:
						"linear-gradient(to top left, var(--tw-gradient-from,) var(--tw-gradient-via,), var(--tw-gradient-to,))",
				},
			},
			{
				post(css = {}) {
					return {
						"--tw-gradient-from-position": "initial",
						"--tw-gradient-via-position": "initial",
						"--tw-gradient-to-position": "initial",
						"--tw-gradient-from": "initial",
						"--tw-gradient-via": "initial",
						"--tw-gradient-to": "initial",
						...css,
					}
				},
			},
		)
	}),

	gradientColorStops: plugin("gradientColorStops", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			spec({
				from(value) {
					return {
						"--tw-gradient-from": value + " var(--tw-gradient-from-position,)",
					}
				},
				via(value) {
					return {
						"--tw-gradient-via": ", " + value + " var(--tw-gradient-via-position,)",
					}
				},
				to(value) {
					return {
						"--tw-gradient-to": value + " var(--tw-gradient-to-position,)",
					}
				},
			}),
			{
				type: "color",
				values: themeObject.gradientColorStops,
			},
		)
		matchUtilities(
			spec({
				from(value) {
					return {
						"--tw-gradient-from-position": value,
					}
				},
				via(value) {
					return {
						"--tw-gradient-via-position": value,
					}
				},
				to(value) {
					return {
						"--tw-gradient-to-position": value,
					}
				},
			}),
			{
				type: ["length", "percentage"],
				values: themeObject.gradientColorStopPositions,
			},
		)
	}),
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
		type: ["length", "line-width"],
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
			["px", ["paddingLeft", "paddingRight"]],
			["py", ["paddingTop", "paddingBottom"]],
			["ps", "paddingInlineStart"],
			["pe", "paddingInlineEnd"],
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
		const values = Object.fromEntries(
			Object.entries(themeObject.fontFamily)
				.map(([key, value]) => {
					const valueArray = Array.isArray(value) ? value : [value]
					const [fontFamily, options = {}] = valueArray
					if (!isCSSValue(fontFamily) && !(Array.isArray(fontFamily) && fontFamily.every(isCSSValue))) {
						return undefined
					}
					if (isCSSValue(options)) {
						return [key, { fontFamily: valueArray.join(", ") }] as [string, CSSProperties]
					}
					return [
						key,
						{
							fontFamily: Array.isArray(fontFamily) ? fontFamily.join(", ") : fontFamily,
							...options,
						},
					] as [string, CSSProperties]
				})
				.filter((t): t is [string, CSSProperties] => !!t),
		)
		matchUtilities(
			{
				font(value) {
					if (typeof value === "string") {
						return { fontFamily: value }
					}
					return value
				},
			},
			{
				type: ["generic-name", "family-name"],
				values,
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
	content: createUtilityPlugin<string>(
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
					if (!isCSSValue(fontSize)) {
						return undefined
					}
					if (!isCSSValue(options) && !isObject(options)) {
						return undefined
					}
					const tmp: Template = isCSSValue(options) ? { lineHeight: options } : options
					if (Object.values(tmp).some(v => !isCSSValue(v))) {
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
				text(value, { modifier, wrapped }) {
					const lineHeight = modifier ? (wrapped ? modifier : themeObject.lineHeight[modifier]) : ""
					if (typeof value === "string") {
						return (lineHeight ? { fontSize: value, lineHeight } : { fontSize: value }) as CSSProperties
					}
					return (lineHeight ? { ...value, lineHeight } : value) as CSSProperties
				},
			},
			{
				values,
				type: ["length", "percentage", "absolute-size", "relative-size"],
			},
		)
	}),
	transitionProperty: plugin("transitionProperty", ({ matchUtilities, theme, themeObject }) => {
		const defaultTimingFunction = theme("transitionTimingFunction.DEFAULT") as string
		const defaultDuration = theme("transitionDuration.DEFAULT") as string
		matchUtilities(
			{
				transition(value) {
					if (value === "none") {
						return {
							transitionProperty: "none",
						} as CSSProperties
					}
					return {
						transitionProperty: value,
						transitionTimingFunction: defaultTimingFunction,
						transitionDuration: defaultDuration,
					} as CSSProperties
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
	boxShadow: plugin("boxShadow", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				shadow(value): CSSProperties {
					if (typeof value !== "string") {
						return {
							boxShadow: cssBoxShadowValue,
						}
					}
					if (value === "none") {
						return {
							"--tw-shadow": "0 0 #0000",
							boxShadow: cssBoxShadowValue,
						}
					}

					// NOTE: DEFAULT shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)

					const shadowColored = parser
						.parseBoxShadowValues(value)
						.map(val => {
							if (typeof val === "string") {
								return val
							}
							const { value } = val
							return value
						})
						.join(", ")

					return {
						"--tw-shadow-colored": shadowColored,
						"--tw-shadow": "var(--tw-shadow-colored)",
						boxShadow: cssBoxShadowValue,
					}
				},
			},
			{
				type: "shadow",
				values: themeObject.boxShadow,
				post(css = {}) {
					return {
						...cssBoxShadowReset,
						...css,
					}
				},
			},
		)

		return
	}),
	boxShadowColor: createUtilityPlugin("boxShadowColor", [["shadow", "--tw-shadow-color"]], theme => ({
		type: "color",
		filterDefault: true, // 'shadow' already exists
		values: theme.boxShadowColor,
	})),
	ringWidth: plugin("ringWidth", ({ matchUtilities, addUtilities, themeObject, theme }) => {
		const defaultRingOffsetWidth = (theme("ringOffsetWidth.DEFAULT", "0px") as CSSValue).toString()
		const defaultRingOffsetColor = (theme("ringOffsetWidth.DEFAULT", "#fff") as CSSValue).toString()
		const defaultRingColor = withAlphaValue(theme("ringColor.DEFAULT", "#3b82f6"), "0.5").toString()

		addUtilities({
			".ring-inset": { "--tw-ring-inset": "inset" },
		})

		const ringOffsetShadowValue = `var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, ${defaultRingOffsetWidth}) var(--tw-ring-offset-color, ${defaultRingOffsetColor})`
		const ringShadowValue = (value: CSSValue) =>
			`var(--tw-ring-inset,) 0 0 0 calc(${value} + var(--tw-ring-offset-width, ${defaultRingOffsetWidth})) var(--tw-ring-color, ${defaultRingColor})`

		matchUtilities(
			{
				ring(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-ring-offset-shadow": ringOffsetShadowValue,
						"--tw-ring-shadow": ringShadowValue(value),
						boxShadow: cssBoxShadowValue,
					}
				},
			},
			{
				type: "length",
				values: themeObject.ringWidth,
				post(css = {}) {
					return {
						...cssBoxShadowReset,
						...css,
					}
				},
			},
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
			spec({
				"divide-x"(value) {
					const val = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							borderRightWidth: `calc(${val} * var(--tw-divide-x-reverse, 0))`,
							borderLeftWidth: `calc(${val} * calc(1 - var(--tw-divide-x-reverse, 0)))`,
						},
					}
				},
				"divide-y"(value) {
					const val = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							borderTopWidth: `calc(${val} * calc(1 - var(--tw-divide-y-reverse, 0)))`,
							borderBottomWidth: `calc(${val} * var(--tw-divide-y-reverse, 0))`,
						},
					}
				},
			}),
			{
				values: themeObject.divideWidth,
				post(css = {}) {
					return {
						"--tw-divide-x-reverse": "initial",
						"--tw-divide-y-reverse": "initial",
						...css,
					}
				},
			},
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
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					const val = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							marginRight: `calc(${val} * var(--tw-space-x-reverse, 0))`,
							marginLeft: `calc(${val} * calc(1 - var(--tw-space-x-reverse, 0)))`,
						},
					}
				},
				"space-y"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					const val = value == "0" ? "0px" : value
					return {
						"& > :not([hidden]) ~ :not([hidden])": {
							marginTop: `calc(${val} * calc(1 - var(--tw-space-y-reverse, 0)))`,
							marginBottom: `calc(${val} * var(--tw-space-y-reverse, 0))`,
						},
					}
				},
			},
			{
				values: themeObject.space,
				supportsNegativeValues: true,
				post(css = {}) {
					return {
						"--tw-space-x-reverse": "initial",
						"--tw-space-y-reverse": "initial",
						...css,
					}
				},
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

		matchUtilities(
			spec({
				align(value) {
					return { verticalAlign: value }
				},
			}),
		)
	}),
	container: plugin("container", ({ addComponents, themeObject, theme }) => {
		const screens = normalizeScreens(theme("container.screens", themeObject.screens) ?? {})
		const container = themeObject.container
		const center = container.center ?? false
		const padding = (container.padding as Record<string, string> | string | undefined) ?? {}

		const generatePaddingFor = (key: string): CSSProperties => {
			let value: CSSValue = ""

			if (isCSSValue(padding)) {
				value = padding
			} else if (typeof padding === "object") {
				const p = padding[key]
				if (isCSSValue(p)) {
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

		const others = screens
			.filter(e => e.value > 0)
			.map<CSSProperties>(({ key, value }) => {
				const width = value + "px"
				return {
					[`@media (min-width: ${width})`]: {
						".container": {
							maxWidth: width,
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
	filter: plugin("filter", ({ addUtilities }) => {
		addUtilities({
			".filter": { filter: cssFilterValue },
			".filter-none": { filter: "none" },
		})
	}),
	blur: plugin("blur", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				blur(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-blur": `blur(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				values: themeObject.blur,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	brightness: plugin("brightness", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				brightness(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-brightness": `brightness(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.brightness,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	contrast: plugin("contrast", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				contrast(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-contrast": `contrast(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.contrast,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	grayscale: plugin("grayscale", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				grayscale(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-grayscale": `grayscale(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.grayscale,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	hueRotate: plugin("hueRotate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"hue-rotate"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-hue-rotate": `hue-rotate(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				values: themeObject.hueRotate,
				supportsNegativeValues: true,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	invert: plugin("invert", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				invert(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-invert": `invert(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.invert,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	saturate: plugin("saturate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				saturate(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-saturate": `saturate(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.saturate,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	sepia: plugin("sepia", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				sepia(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-sepia": `sepia(${value})`,
						filter: cssFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.sepia,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	dropShadow: plugin("dropShadow", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			spec({
				"drop-shadow"(value) {
					return {
						"--tw-drop-shadow": value,
						filter: cssFilterValue,
					}
				},
			}),
			{
				values: themeObject.dropShadow,
				post(css = {}) {
					return {
						...cssFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropFilter: plugin("backdropFilter", ({ addUtilities }) => {
		addUtilities({
			".backdrop-filter": { backdropFilter: cssBackdropFilterValue },
			".backdrop-filter-none": { backdropFilter: "none" },
		})
	}),
	backdropBlur: plugin("backdropBlur", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-blur"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-blur": `blur(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				values: themeObject.backdropBlur,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropBrightness: plugin("backdropBrightness", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-brightness"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-brightness": `brightness(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropBrightness,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropContrast: plugin("backdropContrast", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-contrast"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-contrast": `contrast(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropContrast,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropGrayscale: plugin("backdropGrayscale", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-grayscale"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-grayscale": `grayscale(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropGrayscale,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropHueRotate: plugin("backdropHueRotate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-hue-rotate"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-hue-rotate": `hue-rotate(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				values: themeObject.backdropHueRotate,
				supportsNegativeValues: true,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropInvert: plugin("backdropInvert", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-invert"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-invert": `invert(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropInvert,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropSaturate: plugin("backdropSaturate", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-saturate"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-saturate": `saturate(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropSaturate,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropSepia: plugin("backdropSepia", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-sepia"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-sepia": `sepia(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropSepia,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	backdropOpacity: plugin("backdropOpacity", ({ matchUtilities, themeObject }) => {
		matchUtilities(
			{
				"backdrop-opacity"(value) {
					if (!isCSSValue(value)) return {} as PlainCSSProperties
					return {
						"--tw-backdrop-opacity": `opacity(${value})`,
						backdropFilter: cssBackdropFilterValue,
					}
				},
			},
			{
				type: ["number", "percentage"],
				values: themeObject.backdropOpacity,
				post(css = {}) {
					return {
						...cssBackdropFilterReset,
						...css,
					}
				},
			},
		)
	}),
	fontVariantNumeric: plugin("fontVariantNumeric", ({ addUtilities }) => {
		addUtilities(
			{
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
			},
			{
				post(css = {}) {
					return {
						...cssFontVariantNumericReset,
						...css,
					}
				},
			},
		)
	}),
	scrollSnapType: plugin("scrollSnapType", ({ addUtilities }) => {
		addUtilities(
			{
				".snap-none": { scrollSnapType: "none" },
				".snap-x": {
					scrollSnapType: "x var(--tw-scroll-snap-strictness, proximity)",
				},
				".snap-y": {
					scrollSnapType: "y var(--tw-scroll-snap-strictness, proximity)",
				},
				".snap-both": {
					scrollSnapType: "both var(--tw-scroll-snap-strictness, proximity)",
				},
				".snap-mandatory": { "--tw-scroll-snap-strictness": "mandatory" },
				".snap-proximity": { "--tw-scroll-snap-strictness": "proximity" },
			},
			{
				post(css = {}) {
					return { "--tw-scroll-snap-strictness": "initial", ...css }
				},
			},
		)
	}),
	touchAction: plugin("touchAction", ({ addUtilities }) => {
		addUtilities(
			{
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
			},
			{
				post(css = {}) {
					return { ...cssTouchActionReset, ...css }
				},
			},
		)
	}),
	appearance: plugin("appearance", ({ addUtilities }) => {
		addUtilities({
			".appearance-none": { appearance: "none" },
			".appearance-auto": { appearance: "auto" },
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
			".content-normal": { alignContent: "normal" },
			".content-center": { alignContent: "center" },
			".content-start": { alignContent: "flex-start" },
			".content-end": { alignContent: "flex-end" },
			".content-between": { alignContent: "space-between" },
			".content-around": { alignContent: "space-around" },
			".content-evenly": { alignContent: "space-evenly" },
			".content-baseline": { alignContent: "baseline" },
			".content-stretch": { alignContent: "stretch" },
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
			".float-start": { float: "inline-start" },
			".float-end": { float: "inline-end" },
			".float-right": { float: "right" },
			".float-left": { float: "left" },
			".float-none": { float: "none" },
		})
	}),
	clear: plugin("clear", ({ addUtilities }) => {
		addUtilities({
			".clear-start": { clear: "inline-start" },
			".clear-end": { clear: "inline-end" },
			".clear-left": { clear: "left" },
			".clear-right": { clear: "right" },
			".clear-both": { clear: "both" },
			".clear-none": { clear: "none" },
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
			".justify-normal": { justifyContent: "normal" },
			".justify-start": { justifyContent: "flex-start" },
			".justify-end": { justifyContent: "flex-end" },
			".justify-center": { justifyContent: "center" },
			".justify-between": { justifyContent: "space-between" },
			".justify-around": { justifyContent: "space-around" },
			".justify-evenly": { justifyContent: "space-evenly" },
			".justify-stretch": { justifyContent: "stretch" },
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
	lineClamp: plugin("lineClamp", ({ matchUtilities, addUtilities, themeObject }) => {
		matchUtilities(
			spec({
				"line-clamp"(value) {
					return {
						overflow: "hidden",
						display: "-webkit-box",
						"-webkit-box-orient": "vertical",
						"-webkit-line-clamp": `${value}`,
					}
				},
			}),
			{ values: themeObject.lineClamp },
		)
		addUtilities({
			".line-clamp-none": {
				overflow: "visible",
				display: "block",
				"-webkit-box-orient": "horizontal",
				"-webkit-line-clamp": "none",
			},
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
			".place-content-baseline": { placeContent: "baseline" },
		})
	}),
	placeItems: plugin("placeItems", ({ addUtilities }) => {
		addUtilities({
			".place-items-start": { placeItems: "start" },
			".place-items-end": { placeItems: "end" },
			".place-items-center": { placeItems: "center" },
			".place-items-stretch": { placeItems: "stretch" },
			".place-items-baseline": { placeItems: "baseline" },
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
	captionSide: plugin("captionSide", ({ addUtilities }) => {
		addUtilities({
			".caption-top": { captionSide: "top" },
			".caption-bottom": { captionSide: "bottom" },
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
	hyphens: plugin("hyphens", ({ addUtilities }) => {
		addUtilities({
			".hyphens-none": { hyphens: "none" },
			".hyphens-manual": { hyphens: "manual" },
			".hyphens-auto": { hyphens: "auto" },
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
			".whitespace-break-spaces": { whiteSpace: "break-spaces" },
		})
	}),
	textWrap: plugin("textWrap", ({ addUtilities }) => {
		addUtilities({
			".text-wrap": { "text-wrap": "wrap" },
			".text-nowrap": { "text-wrap": "nowrap" },
			".text-balance": { "text-wrap": "balance" },
			".text-pretty": { "text-wrap": "pretty" },
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
	forcedColorAdjust: plugin("forcedColorAdjust", ({ addUtilities }) => {
		addUtilities({
			".forced-color-adjust-auto": { "forced-color-adjust": "auto" },
			".forced-color-adjust-none": { "forced-color-adjust": "none" },
		})
	}),
}

type VariantPlugins = {
	[P in string]: UnnamedPlugin
}

export const variantPlugins: VariantPlugins = {
	darkVariants: plugin("darkVariants", ({ configObject, addVariant }) => {
		if (configObject.darkMode === "class") {
			addVariant("dark", ":is(.dark &)")
			return
		}

		if (Array.isArray(configObject.darkMode)) {
			const [mode, className = ".dark"] = configObject.darkMode
			if (mode === "class") {
				addVariant("dark", `:is(${className} &)`)
				return
			}
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
		interface ScreenRange {
			a: number
			b?: number
		}

		const normalized = normalizeScreens(themeObject.screens)
		const screens = normalized.filter(e => e.value > 0)
		const rawMediaQueries = normalized.filter(
			(e): e is { key: string; value: number; raw: string } => e.value == 0 && typeof e.raw === "string",
		)

		const values: Record<string, ScreenRange> = {}

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

		for (const { key, raw } of rawMediaQueries) {
			addVariant(key, "@media " + raw)
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
			matchVariant(
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
				return { "--tw-content": "''", content: "var(--tw-content)", ...css }
			},
		})
		addVariant("after", "&::after", {
			post(css = {}) {
				return { "--tw-content": "''", content: "var(--tw-content)", ...css }
			},
		})
	}),

	directionVariants: plugin("directionVariants", ({ addVariant }) => {
		addVariant("ltr", ':is([dir="ltr"] &)')
		addVariant("rtl", ':is([dir="rtl"] &)')
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
	forcedColorsVariants: plugin("forcedColorsVariants", ({ addVariant }) => {
		addVariant("forced-colors", "@media (forced-colors: active)")
	}),
	supportsVariants: plugin("supportsVariants", ({ matchVariant, themeObject }) => {
		matchVariant(
			"supports",
			(value, _) => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
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
			{ values: themeObject.supports },
		)
	}),
	ariaVariants: plugin("ariaVariants", ({ matchVariant, themeObject }) => {
		matchVariant(
			"aria",
			value => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
				return "&[aria-" + value + "]"
			},
			{ values: themeObject.aria },
		)
		matchVariant(
			"group-aria",
			(value, { modifier, wrapped }) => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
				if (modifier) {
					if (wrapped) {
						return `.group\\/[${modifier}][aria-${value}] &`
					}
					return `.group\\/${modifier}[aria-${value}] &`
				}
				return `.group[aria-${value}] &`
			},
			{ values: themeObject.aria },
		)
		matchVariant(
			"peer-aria",
			(value, { modifier, wrapped }) => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
				if (modifier) {
					if (wrapped) {
						return `.peer\\/[${modifier}][aria-${value}] ~ &`
					}
					return `.peer\\/${modifier}[aria-${value}] ~ &`
				}
				return `.peer[aria-${value}] ~ &`
			},
			{ values: themeObject.aria },
		)
	}),
	hasVariants: plugin("hasVariants", ({ matchVariant }) => {
		matchVariant("has", value => {
			// string only
			if (typeof value !== "string") {
				value = ""
			}
			return `&:has(${value})`
		})
		matchVariant("group-has", (value, { modifier, wrapped }) => {
			// string only
			if (typeof value !== "string") {
				value = ""
			}
			if (modifier) {
				if (wrapped) {
					return `.group\\/[${modifier}]:has(${value}) &`
				}
				return `.group\\/${modifier}:has(${value}) &`
			}
			return `.group:has(${value}) &`
		})
		matchVariant("peer-has", (value, { modifier, wrapped }) => {
			// string only
			if (typeof value !== "string") {
				value = ""
			}
			if (modifier) {
				if (wrapped) {
					return `.peer\\/[${modifier}]:has(${value}) ~ &`
				}
				return `.peer\\/${modifier}:has(${value}) ~ &`
			}
			return `.peer:has(${value}) ~ &`
		})
	}),
	dataVariants: plugin("dataVariants", ({ matchVariant, themeObject }) => {
		matchVariant(
			"data",
			value => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
				return "&[data-" + value + "]"
			},
			{ values: themeObject.data },
		)
		matchVariant(
			"group-data",
			(value, { modifier, wrapped }) => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
				if (modifier) {
					if (wrapped) {
						return `.group\\/[${modifier}][data-${value}] &`
					}
					return `.group\\/${modifier}[data-${value}] &`
				}
				return `.group[data-${value}] &`
			},
			{ values: themeObject.data },
		)
		matchVariant(
			"peer-data",
			(value, { modifier, wrapped }) => {
				// string only
				if (typeof value !== "string") {
					value = ""
				}
				if (modifier) {
					if (wrapped) {
						return `.peer\\/[${modifier}][data-${value}] ~ &`
					}
					return `.peer\\/${modifier}[data-${value}] ~ &`
				}
				return `.peer[data-${value}] ~ &`
			},
			{ values: themeObject.data },
		)
	}),
}
