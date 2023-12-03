interface CorePluginFeatures {
	preflight: boolean
	accentColor: boolean
	accessibility: boolean
	alignContent: boolean
	alignItems: boolean
	alignSelf: boolean
	animation: boolean
	appearance: boolean
	aspectRatio: boolean
	backdropBlur: boolean
	backdropBrightness: boolean
	backdropContrast: boolean
	backdropFilter: boolean
	backdropGrayscale: boolean
	backdropHueRotate: boolean
	backdropInvert: boolean
	backdropOpacity: boolean
	backdropSaturate: boolean
	backdropSepia: boolean
	backgroundAttachment: boolean
	backgroundBlendMode: boolean
	backgroundClip: boolean
	backgroundColor: boolean
	backgroundImage: boolean
	backgroundGradient: boolean
	backgroundOrigin: boolean
	backgroundPosition: boolean
	backgroundRepeat: boolean
	backgroundSize: boolean
	blur: boolean
	borderCollapse: boolean
	borderColor: boolean
	borderRadius: boolean
	borderStyle: boolean
	borderSpacing: boolean
	borderWidth: boolean
	boxDecorationBreak: boolean
	boxShadow: boolean
	boxShadowColor: boolean
	boxSizing: boolean
	breakAfter: boolean
	breakBefore: boolean
	breakInside: boolean
	brightness: boolean
	captionSide: boolean
	caretColor: boolean
	clear: boolean
	columns: boolean
	container: boolean
	content: boolean
	contrast: boolean
	cursor: boolean
	display: boolean
	divideColor: boolean
	divideStyle: boolean
	divideWidth: boolean
	dropShadow: boolean
	fill: boolean
	filter: boolean
	flex: boolean
	flexBasis: boolean
	flexDirection: boolean
	flexGrow: boolean
	flexShrink: boolean
	flexWrap: boolean
	float: boolean
	fontFamily: boolean
	fontSize: boolean
	fontSmoothing: boolean
	fontStyle: boolean
	fontVariantNumeric: boolean
	fontWeight: boolean
	gap: boolean
	gradientColorStops: boolean
	grayscale: boolean
	gridAutoColumns: boolean
	gridAutoFlow: boolean
	gridAutoRows: boolean
	gridColumn: boolean
	gridColumnEnd: boolean
	gridColumnStart: boolean
	gridRow: boolean
	gridRowEnd: boolean
	gridRowStart: boolean
	gridTemplateColumns: boolean
	gridTemplateRows: boolean
	height: boolean
	hueRotate: boolean
	hyphens: boolean
	inset: boolean
	invert: boolean
	isolation: boolean
	justifyContent: boolean
	justifyItems: boolean
	justifySelf: boolean
	letterSpacing: boolean
	lineClamp: boolean
	lineHeight: boolean
	listStylePosition: boolean
	listStyleImage: boolean
	listStyleType: boolean
	margin: boolean
	maxHeight: boolean
	maxWidth: boolean
	minHeight: boolean
	minWidth: boolean
	mixBlendMode: boolean
	objectFit: boolean
	objectPosition: boolean
	opacity: boolean
	order: boolean
	outlineColor: boolean
	outlineOffset: boolean
	outlineStyle: boolean
	outlineWidth: boolean
	overflow: boolean
	overscrollBehavior: boolean
	padding: boolean
	placeContent: boolean
	placeholderColor: boolean
	placeItems: boolean
	placeSelf: boolean
	pointerEvents: boolean
	position: boolean
	resize: boolean
	ringColor: boolean
	ringOffsetColor: boolean
	ringOffsetWidth: boolean
	ringWidth: boolean
	rotate: boolean
	saturate: boolean
	scale: boolean
	scrollBehavior: boolean
	scrollMargin: boolean
	scrollPadding: boolean
	scrollSnapAlign: boolean
	scrollSnapStop: boolean
	scrollSnapType: boolean
	sepia: boolean
	skew: boolean
	space: boolean
	stroke: boolean
	strokeWidth: boolean
	tableLayout: boolean
	textAlign: boolean
	textColor: boolean
	textDecoration: boolean
	textDecorationColor: boolean
	textDecorationStyle: boolean
	textDecorationThickness: boolean
	textIndent: boolean
	textOverflow: boolean
	textTransform: boolean
	textUnderlineOffset: boolean
	touchAction: boolean
	transform: boolean
	transformOrigin: boolean
	transitionDelay: boolean
	transitionDuration: boolean
	transitionProperty: boolean
	transitionTimingFunction: boolean
	translate: boolean
	userSelect: boolean
	verticalAlign: boolean
	visibility: boolean
	whitespace: boolean
	width: boolean
	willChange: boolean
	wordBreak: boolean
	zIndex: boolean
}

/**
 *  Node Types
 *
 * - *classname*
 *    ```tw
 *    aaa
 *    aaa-bbb
 *    aaa-bbb/modifier
 *    ```
 * <br />
 * - *arbitrary-classname*
 *    ```tw
 *    aaa-[value]
 *    aaa-[value]/modifier
 *    ```
 * <br />
 * - *arbitrary-property*
 *    ```tw
 *    [aaa: value]
 *    ```
 * <br />
 * - *simple-variant*
 *    ```tw
 *    aaa-bbb:
 *    aaa-bbb/modifier:
 *    ```
 * <br />
 * - *arbitrary-variant*
 *    ```tw
 *    aaa-[value]:
 *    aaa-[value]/modifier:
 *    ```
 * <br />
 * - *arbitrary-selector*
 *    ```tw
 *    [.bbb, &:hover]:
 *    ```
 * <br />
 * - *unknown-classname*
 *    ```tw
 *    aaa[value]
 *    ```
 * <br />
 * - *unknown-variant*
 *    ```tw
 *    aaa[value]:
 *    ```
 */
declare enum NodeType {
	Program = "Program",
	Group = "Group",
	VariantSpan = "VariantSpan",
	SimpleVariant = "SimpleVariant",
	/** syntax: ```{key}/{modifier}``` */
	Classname = "Classname",
	/** syntax: ```{key}-[{value}]/{modifier}``` */
	ArbitraryClassname = "ArbitraryClassname",
	/** syntax: ```{key}-[{value}]/{modifier}{sep}``` */
	ArbitraryVariant = "ArbitraryVariant",
	/** syntax: ```({variant}{sep} {variant}{sep} ...){sep}``` */
	GroupVariant = "GroupVariant",
	ArbitraryProperty = "ArbitraryProperty",
	ArbitrarySelector = "ArbitrarySelector",
	UnknownClassname = "UnknownClassname",
	UnknownVariant = "UnknownVariant",
	Identifier = "Identifier",
	Value = "Value",
	Modifier = "Modifier",
	ThemeFunction = "ThemeFunction",
	ThemeValue = "ThemeValue",
	ThemePath = "ThemePath",
}
interface BaseNode {
	type: NodeType
	get text(): string
	source: string
	start: number
	end: number
}
interface Important {
	important: boolean
}
interface Closed {
	closed: boolean
}
interface HasValue {
	value: Value
	/** resolved value from theme function */
	resolved?: string
}
interface IModifier {
	m?: Modifier | null | undefined
}
interface Identifier extends BaseNode {
	type: NodeType.Identifier
}
interface Value extends BaseNode {
	type: NodeType.Value
}
/** Not including brackets */
interface Modifier extends BaseNode, Closed {
	type: NodeType.Modifier
	wrapped: boolean
}
/**
 * API: addUtilities()
 */
interface Classname extends BaseNode, Important, IModifier {
	type: NodeType.Classname
	key: Identifier
}
/**
 * API: addVariant()
 * NOTE: variant is always closed.
 */
interface SimpleVariant extends BaseNode, IModifier {
	type: NodeType.SimpleVariant
	/** without separator */
	key: Identifier
}
/** API: matchUtilities() */
interface ArbitraryClassname extends BaseNode, HasValue, Important, Closed, IModifier {
	type: NodeType.ArbitraryClassname
	/** without dash */
	key: Identifier
}
/**
 * API: matchVariant()
 * NOTE: variant is always closed.
 */
interface ArbitraryVariant extends BaseNode, HasValue, IModifier {
	type: NodeType.ArbitraryVariant
	/** without dash */
	key: Identifier
}
interface ArbitraryProperty extends BaseNode, Important, Closed {
	type: NodeType.ArbitraryProperty
	decl: Value
}
interface ArbitrarySelector extends BaseNode {
	type: NodeType.ArbitrarySelector
	selector: Value
}
interface UnknownClassname extends BaseNode, HasValue, Important, Closed, IModifier {
	type: NodeType.UnknownClassname
	key: Identifier
}
interface UnknownVariant extends BaseNode, HasValue, IModifier {
	type: NodeType.UnknownVariant
	key: Identifier
}
interface GroupVariant extends BaseNode {
	type: NodeType.GroupVariant
	expressions: Expression[]
}
interface Group extends BaseNode, Important, Closed {
	type: NodeType.Group
	expressions: Expression[]
}
interface Program extends BaseNode {
	type: NodeType.Program
	source: string
	expressions: Expression[]
}
type Variant$1 = SimpleVariant | ArbitrarySelector | ArbitraryVariant | GroupVariant | UnknownVariant
interface VariantSpan extends BaseNode {
	type: NodeType.VariantSpan
	variant: Variant$1
	child?: Expression | null | undefined
}
type Expression = Classname | ArbitraryClassname | ArbitraryProperty | UnknownClassname | VariantSpan | Group
type Node =
	| Program
	| Expression
	| SimpleVariant
	| ArbitrarySelector
	| ArbitraryVariant
	| UnknownVariant
	| GroupVariant
	| Value
	| Modifier

type TokenU = string
type TokenV = [string, TokenExpr?]
type TokenExpr = TokenV | TokenU | TokenExpr[]
declare function createParser(separator?: string): {
	separator: string
	validSeparator: (sep: string) => boolean
	createProgram: (
		source: string,
		[start, end, breac]?: [(number | undefined)?, (number | undefined)?, (number | undefined)?],
	) => Program
	tokenize: (source: string, [start, end]?: [(number | undefined)?, (number | undefined)?]) => TokenExpr[]
}

type CSSValue = string | number
interface CSSProperties {
	[key: string]: CSSProperties | CSSValue
}
interface PlainCSSProperties {
	[key: string]: CSSValue
}
type Primitive = string | bigint | number | boolean | symbol | null | undefined
interface Func {
	(...args: any): any
}
type ConfigValue = Func | Primitive
interface ConfigObject {
	[key: string | symbol]: ConfigEntry
}
type ConfigArray = Array<ConfigEntry>
type ConfigEntry = ConfigValue | ConfigArray | ConfigObject
interface CustomPalette {
	[key: string | symbol]: ColorValue
}
interface ColorValueFunc {
	(options: { opacityValue: string }): Primitive
}
type ColorValue = ColorValueFunc | CustomPalette | Primitive
type ArbitraryParameters<V = unknown> = [
	value: V | string,
	options: {
		modifier?: string
		wrapped?: boolean
	},
]
interface UtilityRender<V = unknown> {
	(...args: ArbitraryParameters<V>): CSSProperties
}
interface VariantRender<V = unknown> {
	(...args: ArbitraryParameters<V>): string | string[]
}
interface Variant {
	(css?: CSSProperties): CSSProperties
}
interface LookupSpec {
	type: "lookup"
	values: Record<string, unknown>
	represent(restIndex: number, node: Classname | ArbitraryClassname, negative: boolean): CSSProperties | undefined
	pluginName?: string
	isColor?: boolean
	post?: Variant
	filterDefault: boolean
	supportsNegativeValues: boolean
	respectPrefix: boolean
	respectImportant: boolean
}
interface LookupVariantSpec {
	type: "lookup"
	values: Record<string, unknown>
	represent(restIndex: number, node: SimpleVariant | ArbitraryVariant | UnknownVariant): Variant | undefined
	pluginName?: string
	post?: Variant
	filterDefault: boolean
}
interface StaticSpec {
	type: "static"
	css: CSSProperties
	pluginName?: string
	post?: Variant
	supportsNegativeValues: false
	respectPrefix: boolean
	respectImportant: boolean
}
interface VariantSpec {
	type: "static"
	variant: Variant
	pluginName?: string
	post?: Variant
}

/** User-defined theme */
interface CustomTheme {}
interface ConfigUtils {
	/** default colors */
	colors: BaseColors
}
interface ResolvePath {
	(path: string, defaultValue?: unknown): any
}
interface ResolveThemePath extends ResolvePath, ConfigUtils {
	theme: ResolvePath
}
type WithResolveThemePath<T> = T | ((theme: ResolveThemePath, configUtils: ConfigUtils) => T | void)
type WithResolvePathPalette<T extends Record<string | symbol, unknown> = {}> = WithResolveThemePath<
	{
		[key: string | symbol]: ColorValue
	} & BaseColors & {
			[P in keyof T]?: ColorValue
		}
>
type CoreThemeObject<T extends Record<string | symbol, unknown> = {}, V = ConfigEntry> = WithResolveThemePath<
	{
		[key: string | symbol]: V
	} & {
		[P in keyof T]?: V
	}
>
interface BaseColors {
	inherit?: ColorValue
	current?: ColorValue
	transparent?: ColorValue
	black?: ColorValue
	white?: ColorValue
	slate?: ColorValue
	gray?: ColorValue
	zinc?: ColorValue
	neutral?: ColorValue
	stone?: ColorValue
	red?: ColorValue
	orange?: ColorValue
	amber?: ColorValue
	yellow?: ColorValue
	lime?: ColorValue
	green?: ColorValue
	emerald?: ColorValue
	teal?: ColorValue
	cyan?: ColorValue
	sky?: ColorValue
	blue?: ColorValue
	indigo?: ColorValue
	violet?: ColorValue
	purple?: ColorValue
	fuchsia?: ColorValue
	pink?: ColorValue
	rose?: ColorValue
}
interface FontSizeValueExtension extends ConfigObject {
	/** @link https://developer.mozilla.org/en-US/docs/Web/CSS/line-height */
	lineHeight?: CSSValue
	/** @link https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing */
	letterSpacing?: CSSValue
	/** @link https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight */
	fontWeight?: CSSValue
}
type FontSizeValue =
	| CSSValue
	| [fontSize: CSSValue, lineHeight?: CSSValue]
	| [fontSize: CSSValue, options?: FontSizeValueExtension]
interface FontFamilyValueExtension extends ConfigObject {
	/** https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings */
	fontFeatureSettings?: CSSValue
	/** https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings */
	fontVariationSettings?: CSSValue
}
type FontFamilyValue = CSSValue | CSSValue[] | [value: CSSValue | CSSValue[], options?: FontFamilyValueExtension]
type ScreenValue =
	| CSSValue
	| {
			raw: string
	  }
interface ContainerConfig {
	center?: boolean
	padding?:
		| CSSValue
		| {
				[key: string]: CSSValue
		  }
	screens?: {
		[key: string]: ScreenValue
	}
}
interface Theme {
	/** Extend your theme.
	 *
	 * {@link https://tailwindcss.com/docs/configuration Reference}
	 */
	extend?: Omit<Theme, "extend"> & CustomTheme & ConfigObject
	/** Using responsive utility variants to build adaptive user interfaces.
	 *
	 * {@link https://tailwindcss.com/docs/responsive-design Reference}
	 */
	screens?: CoreThemeObject<{
		sm: CSSValue
		md: CSSValue
		lg: CSSValue
		xl: CSSValue
		"2xl": CSSValue
	}>
	/** A component for fixing an element's width to the current breakpoint.
	 *
	 * {@link https://tailwindcss.com/docs/container Reference}
	 */
	container?: ContainerConfig
	/** Customizing the default color palette for your project.
	 *
	 * {@link https://tailwindcss.com/docs/customizing-colors Reference}
	 */
	colors?: WithResolvePathPalette
	/** Utilities for controlling the accented color of a form control.
	 *
	 * {@link https://tailwindcss.com/docs/accent-color Reference}
	 */
	accentColor?: WithResolvePathPalette<{
		auto: "auto"
	}>
	/** Utilities for animating elements with CSS animations.
	 *
	 * {@link https://tailwindcss.com/docs/animation Reference}
	 */
	animation?: CoreThemeObject<{
		none: "none"
		spin: "spin 1s linear infinite"
		ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
		pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
		bounce: "bounce 1s infinite"
	}>
	/** Utilities for controlling the aspect ratio of an element.
	 *
	 * {@link https://tailwindcss.com/docs/aspect-ratio Reference}
	 */
	aspectRatio?: CoreThemeObject<{
		auto: "auto"
		square: "1 / 1"
		video: "16 / 9"
	}>
	/** Utilities for applying backdrop blur filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-blur Reference}
	 */
	backdropBlur?: Theme["blur"]
	/** Utilities for applying backdrop brightness filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-brightness Reference}
	 */
	backdropBrightness?: Theme["brightness"]
	/** Utilities for applying backdrop contrast filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-contrast Reference}
	 */
	backdropContrast?: Theme["contrast"]
	/** Utilities for applying backdrop grayscale filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-grayscale Reference}
	 */
	backdropGrayscale?: Theme["grayscale"]
	/** Utilities for applying backdrop hue-rotate filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-hue-rotate Reference}
	 */
	backdropHueRotate?: Theme["hueRotate"]
	/** Utilities for applying backdrop invert filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-invert Reference}
	 */
	backdropInvert?: Theme["invert"]
	/** Utilities for applying backdrop opacity filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-opacity Reference}
	 */
	backdropOpacity?: Theme["opacity"]
	/** Utilities for applying backdrop saturation filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-saturate Reference}
	 */
	backdropSaturate?: Theme["saturate"]
	/** Utilities for applying backdrop sepia filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/backdrop-sepia Reference}
	 */
	backdropSepia?: Theme["sepia"]
	/** Utilities for controlling an element's background color.
	 *
	 * {@link https://tailwindcss.com/docs/background-color Reference}
	 */
	backgroundColor?: WithResolvePathPalette
	/** Utilities for controlling an element's background image.
	 *
	 * {@link https://tailwindcss.com/docs/background-image Reference}
	 */
	backgroundImage?: CoreThemeObject<{
		none: "none"
	}>
	/** Utilities for controlling an element's background image.
	 *
	 * {@link https://tailwindcss.com/docs/background-image Reference}
	 */
	backgroundPosition?: CoreThemeObject<{
		bottom: "bottom"
		center: "center"
		left: "left"
		"left-bottom": "left bottom"
		"left-top": "left top"
		right: "right"
		"right-bottom": "right bottom"
		"right-top": "right top"
		top: "top"
	}>
	/** Utilities for controlling the background size of an element's background image.
	 *
	 * {@link https://tailwindcss.com/docs/background-size Reference}
	 */
	backgroundSize?: CoreThemeObject<{
		auto: "auto"
		cover: "cover"
		contain: "contain"
	}>
	/** Utilities for applying blur filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/blur Reference}
	 */
	blur?: CoreThemeObject<{
		0: "0"
		none: "0"
		sm: "4px"
		DEFAULT: "8px"
		md: "12px"
		lg: "16px"
		xl: "24px"
		"2xl": "40px"
		"3xl": "64px"
	}>
	/** Utilities for controlling the color of an element's borders.
	 *
	 * {@link https://tailwindcss.com/docs/border-color Reference}
	 */
	borderColor?: WithResolvePathPalette<{
		DEFAULT: unknown
	}>
	/** Utilities for controlling the border radius of an element.
	 *
	 * {@link https://tailwindcss.com/docs/border-radius Reference}
	 */
	borderRadius?: CoreThemeObject<{
		DEFAULT: "0.25rem"
		none: "0px"
		sm: "0.125rem"
		md: "0.375rem"
		lg: "0.5rem"
		xl: "0.75rem"
		"2xl": "1rem"
		"3xl": "1.5rem"
		full: "9999px"
	}>
	borderSpacing?: Theme["spacing"]
	/** Utilities for controlling the width of an element's borders.
	 *
	 * {@link https://tailwindcss.com/docs/border-width Reference}
	 */
	borderWidth?: CoreThemeObject<{
		DEFAULT: "1px"
		0: "0px"
		2: "2px"
		4: "4px"
		8: "8px"
	}>
	/** Utilities for controlling the box shadow of an element.
	 *
	 * {@link https://tailwindcss.com/docs/box-shadow Reference}
	 */
	boxShadow?: CoreThemeObject<
		{
			sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
			DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
			md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
			lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
			xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
			"2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)"
			inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
			none: "none"
		},
		string | string[]
	>
	/** Utilities for controlling the color of a box shadow.
	 *
	 * {@link https://tailwindcss.com/docs/box-shadow-color Reference}
	 */
	boxShadowColor?: WithResolvePathPalette
	/** Utilities for applying brightness filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/brightness Reference}
	 */
	brightness?: CoreThemeObject<{
		0: "0"
		50: ".5"
		75: ".75"
		90: ".9"
		95: ".95"
		100: "1"
		105: "1.05"
		110: "1.1"
		125: "1.25"
		150: "1.5"
		200: "2"
	}>
	/** Utilities for controlling the color of the text input cursor.
	 *
	 * {@link https://tailwindcss.com/docs/caret-color Reference}
	 */
	caretColor?: WithResolvePathPalette
	/** Utilities for controlling the number of columns within an element.
	 *
	 * {@link https://tailwindcss.com/docs/columns Reference}
	 */
	columns?: CoreThemeObject<{
		auto: "auto"
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
		7: "7"
		8: "8"
		9: "9"
		10: "10"
		11: "11"
		12: "12"
		"3xs": "16rem"
		"2xs": "18rem"
		xs: "20rem"
		sm: "24rem"
		md: "28rem"
		lg: "32rem"
		xl: "36rem"
		"2xl": "42rem"
		"3xl": "48rem"
		"4xl": "56rem"
		"5xl": "64rem"
		"6xl": "72rem"
		"7xl": "80rem"
	}>
	/** Utilities for controlling the content of the before and after pseudo-elements.
	 *
	 * {@link https://tailwindcss.com/docs/content Reference}
	 */
	content?: CoreThemeObject<{
		none: "none"
	}>
	/** Utilities for applying contrast filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/contrast Reference}
	 */
	contrast?: CoreThemeObject<{
		0: "0"
		50: ".5"
		75: ".75"
		100: "1"
		125: "1.25"
		150: "1.5"
		200: "2"
	}>
	/** Utilities for controlling the cursor style when hovering over an element.
	 *
	 * {@link https://tailwindcss.com/docs/cursor Reference}
	 */
	cursor?: CoreThemeObject<{
		auto: "auto"
		default: "default"
		pointer: "pointer"
		wait: "wait"
		text: "text"
		move: "move"
		help: "help"
		"not-allowed": "not-allowed"
		none: "none"
		"context-menu": "context-menu"
		progress: "progress"
		cell: "cell"
		crosshair: "crosshair"
		"vertical-text": "vertical-text"
		alias: "alias"
		copy: "copy"
		"no-drop": "no-drop"
		grab: "grab"
		grabbing: "grabbing"
		"all-scroll": "all-scroll"
		"col-resize": "col-resize"
		"row-resize": "row-resize"
		"n-resize": "n-resize"
		"e-resize": "e-resize"
		"s-resize": "s-resize"
		"w-resize": "w-resize"
		"ne-resize": "ne-resize"
		"nw-resize": "nw-resize"
		"se-resize": "se-resize"
		"sw-resize": "sw-resize"
		"ew-resize": "ew-resize"
		"ns-resize": "ns-resize"
		"nesw-resize": "nesw-resize"
		"nwse-resize": "nwse-resize"
		"zoom-in": "zoom-in"
		"zoom-out": "zoom-out"
	}>
	/** Utilities for controlling the border color between elements.
	 *
	 * {@link https://tailwindcss.com/docs/divide-color Reference}
	 */
	divideColor?: WithResolvePathPalette
	/** Utilities for controlling the border width between elements.
	 *
	 * {@link https://tailwindcss.com/docs/divide-width Reference}
	 */
	divideWidth?: Theme["borderWidth"]
	/** Utilities for applying drop-shadow filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/drop-shadow Reference}
	 */
	dropShadow?: CoreThemeObject<{
		sm: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))"
		DEFAULT: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))"
		md: "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))"
		lg: "drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))"
		xl: "drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))"
		"2xl": "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))"
		none: "drop-shadow(0 0 #0000)"
	}>
	/** Utilities for styling the fill of SVG elements.
	 *
	 * {@link https://tailwindcss.com/docs/fill Reference}
	 */
	fill?: WithResolvePathPalette<{
		none: "none"
	}>
	/** Utilities for controlling how flex items both grow and shrink.
	 *
	 * {@link https://tailwindcss.com/docs/flex Reference}
	 */
	flex?: CoreThemeObject<{
		1: "1 1 0%"
		auto: "1 1 auto"
		initial: "0 1 auto"
		none: "none"
	}>
	/** Utilities for controlling the initial size of flex items.
	 *
	 * {@link https://tailwindcss.com/docs/flex-basis Reference}
	 */
	flexBasis?: Theme["spacing"] &
		CoreThemeObject<{
			auto: "auto"
			"1/2": "50%"
			"1/3": "33.333333%"
			"2/3": "66.666667%"
			"1/4": "25%"
			"2/4": "50%"
			"3/4": "75%"
			"1/5": "20%"
			"2/5": "40%"
			"3/5": "60%"
			"4/5": "80%"
			"1/6": "16.666667%"
			"2/6": "33.333333%"
			"3/6": "50%"
			"4/6": "66.666667%"
			"5/6": "83.333333%"
			"1/12": "8.333333%"
			"2/12": "16.666667%"
			"3/12": "25%"
			"4/12": "33.333333%"
			"5/12": "41.666667%"
			"6/12": "50%"
			"7/12": "58.333333%"
			"8/12": "66.666667%"
			"9/12": "75%"
			"10/12": "83.333333%"
			"11/12": "91.666667%"
			full: "100%"
		}>
	/** Utilities for controlling how flex items grow.
	 *
	 * {@link https://tailwindcss.com/docs/flex-grow Reference}
	 */
	flexGrow?: CoreThemeObject<{
		DEFAULT: "1"
		0: "0"
	}>
	/** Utilities for controlling how flex items shrink.
	 *
	 * {@link https://tailwindcss.com/docs/flex-shrink Reference}
	 */
	flexShrink?: CoreThemeObject<{
		DEFAULT: "1"
		0: "0"
	}>
	/** Utilities for controlling the font family of an element.
	 *
	 * {@link https://tailwindcss.com/docs/font-family Reference}
	 */
	fontFamily?: CoreThemeObject<
		{
			sans: FontFamilyValue
			serif: FontFamilyValue
			mono: FontFamilyValue
		},
		FontFamilyValue
	>
	/** Utilities for controlling the font size of an element.
	 *
	 * {@link https://tailwindcss.com/docs/font-size Reference}
	 */
	fontSize?: CoreThemeObject<
		{
			xs: FontSizeValue
			sm: FontSizeValue
			base: FontSizeValue
			lg: FontSizeValue
			xl: FontSizeValue
			"2xl": FontSizeValue
			"3xl": FontSizeValue
			"4xl": FontSizeValue
			"5xl": FontSizeValue
			"6xl": FontSizeValue
			"7xl": FontSizeValue
			"8xl": FontSizeValue
			"9xl": FontSizeValue
		},
		FontSizeValue
	>
	/** Utilities for controlling the font weight of an element.
	 *
	 * {@link https://tailwindcss.com/docs/font-weight Reference}
	 */
	fontWeight?: CoreThemeObject<{
		thin: "100"
		extralight: "200"
		light: "300"
		normal: "400"
		medium: "500"
		semibold: "600"
		bold: "700"
		extrabold: "800"
		black: "900"
	}>
	/** Utilities for controlling gutters between grid and flexbox items.
	 *
	 * {@link https://tailwindcss.com/docs/gap Reference}
	 */
	gap?: Theme["spacing"]
	/** Utilities for controlling the color stops in background gradients.
	 *
	 * {@link https://tailwindcss.com/docs/gradient-color-stops Reference}
	 */
	gradientColorStops?: WithResolvePathPalette
	/** Utilities for controlling the color stops in background gradients.
	 *
	 * {@link https://tailwindcss.com/docs/gradient-color-stops Reference}
	 */
	gradientColorStopPositions?: CoreThemeObject<{
		"0%": "0%"
		"5%": "5%"
		"10%": "10%"
		"15%": "15%"
		"20%": "20%"
		"25%": "25%"
		"30%": "30%"
		"35%": "35%"
		"40%": "40%"
		"45%": "45%"
		"50%": "50%"
		"55%": "55%"
		"60%": "60%"
		"65%": "65%"
		"70%": "70%"
		"75%": "75%"
		"80%": "80%"
		"85%": "85%"
		"90%": "90%"
		"95%": "95%"
		"100%": "100%"
	}>
	/** Utilities for applying grayscale filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/grayscale Reference}
	 */
	grayscale?: CoreThemeObject<{
		DEFAULT: "100%"
		0: "0"
	}>
	/** Utilities for applying hue-rotate filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/hue-rotate Reference}
	 */
	hueRotate?: CoreThemeObject<{
		0: "0deg"
		15: "15deg"
		30: "30deg"
		60: "60deg"
		90: "90deg"
		180: "180deg"
	}>
	/** Utilities for controlling the size of implicitly-created grid columns.
	 *
	 * {@link https://tailwindcss.com/docs/grid-auto-columns Reference}
	 */
	gridAutoColumns?: CoreThemeObject<{
		auto: "auto"
		min: "min-content"
		max: "max-content"
		fr: "minmax(0, 1fr)"
	}>
	/** Utilities for controlling the size of implicitly-created grid rows.
	 *
	 * {@link https://tailwindcss.com/docs/grid-auto-rows Reference}
	 */
	gridAutoRows?: CoreThemeObject<{
		auto: "auto"
		min: "min-content"
		max: "max-content"
		fr: "minmax(0, 1fr)"
	}>
	/** Utilities for controlling how elements are sized and placed across grid columns.
	 *
	 * {@link https://tailwindcss.com/docs/grid-column Reference}
	 */
	gridColumn?: CoreThemeObject<{
		auto: "auto"
		"span-1": "span 1 / span 1"
		"span-2": "span 2 / span 2"
		"span-3": "span 3 / span 3"
		"span-4": "span 4 / span 4"
		"span-5": "span 5 / span 5"
		"span-6": "span 6 / span 6"
		"span-7": "span 7 / span 7"
		"span-8": "span 8 / span 8"
		"span-9": "span 9 / span 9"
		"span-10": "span 10 / span 10"
		"span-11": "span 11 / span 11"
		"span-12": "span 12 / span 12"
		"span-full": "1 / -1"
	}>
	/** Utilities for controlling how elements are sized and placed across grid columns.
	 *
	 * {@link https://tailwindcss.com/docs/grid-column Reference}
	 */
	gridColumnStart?: CoreThemeObject<{
		auto: "auto"
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
		7: "7"
		8: "8"
		9: "9"
		10: "10"
		11: "11"
		12: "12"
		13: "13"
	}>
	/** Utilities for controlling how elements are sized and placed across grid columns.
	 *
	 * {@link https://tailwindcss.com/docs/grid-column Reference}
	 */
	gridColumnEnd?: CoreThemeObject<{
		auto: "auto"
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
		7: "7"
		8: "8"
		9: "9"
		10: "10"
		11: "11"
		12: "12"
		13: "13"
	}>
	/** Utilities for controlling how elements are sized and placed across grid rows.
	 *
	 * {@link https://tailwindcss.com/docs/grid-row Reference}
	 */
	gridRow?: CoreThemeObject<{
		auto: "auto"
		"span-1": "span 1 / span 1"
		"span-2": "span 2 / span 2"
		"span-3": "span 3 / span 3"
		"span-4": "span 4 / span 4"
		"span-5": "span 5 / span 5"
		"span-6": "span 6 / span 6"
		"span-full": "1 / -1"
	}>
	/** Utilities for controlling how elements are sized and placed across grid rows.
	 *
	 * {@link https://tailwindcss.com/docs/grid-row Reference}
	 */
	gridRowStart?: CoreThemeObject<{
		auto: "auto"
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
		7: "7"
	}>
	/** Utilities for controlling how elements are sized and placed across grid rows.
	 *
	 * {@link https://tailwindcss.com/docs/grid-row Reference}
	 */
	gridRowEnd?: CoreThemeObject<{
		auto: "auto"
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
		7: "7"
	}>
	/** Utilities for specifying the columns in a grid layout.
	 *
	 * {@link https://tailwindcss.com/docs/grid-template-columns Reference}
	 */
	gridTemplateColumns?: CoreThemeObject<{
		none: "none"
		1: "repeat(1, minmax(0, 1fr))"
		2: "repeat(2, minmax(0, 1fr))"
		3: "repeat(3, minmax(0, 1fr))"
		4: "repeat(4, minmax(0, 1fr))"
		5: "repeat(5, minmax(0, 1fr))"
		6: "repeat(6, minmax(0, 1fr))"
		7: "repeat(7, minmax(0, 1fr))"
		8: "repeat(8, minmax(0, 1fr))"
		9: "repeat(9, minmax(0, 1fr))"
		10: "repeat(10, minmax(0, 1fr))"
		11: "repeat(11, minmax(0, 1fr))"
		12: "repeat(12, minmax(0, 1fr))"
	}>
	/** Utilities for specifying the rows in a grid layout.
	 *
	 * {@link https://tailwindcss.com/docs/grid-template-rows Reference}
	 */
	gridTemplateRows?: CoreThemeObject<{
		none: "none"
		1: "repeat(1, minmax(0, 1fr))"
		2: "repeat(2, minmax(0, 1fr))"
		3: "repeat(3, minmax(0, 1fr))"
		4: "repeat(4, minmax(0, 1fr))"
		5: "repeat(5, minmax(0, 1fr))"
		6: "repeat(6, minmax(0, 1fr))"
	}>
	/** Utilities for setting the height of an element.
	 *
	 * {@link https://tailwindcss.com/docs/height Reference}
	 */
	height?: Theme["spacing"] &
		CoreThemeObject<{
			auto: "auto"
			"1/2": "50%"
			"1/3": "33.333333%"
			"2/3": "66.666667%"
			"1/4": "25%"
			"2/4": "50%"
			"3/4": "75%"
			"1/5": "20%"
			"2/5": "40%"
			"3/5": "60%"
			"4/5": "80%"
			"1/6": "16.666667%"
			"2/6": "33.333333%"
			"3/6": "50%"
			"4/6": "66.666667%"
			"5/6": "83.333333%"
			full: "100%"
			screen: "100vh"
			min: "min-content"
			max: "max-content"
			fit: "fit-content"
		}>
	/** Utilities for controlling the placement of positioned elements.
	 *
	 * {@link https://tailwindcss.com/docs/top-right-bottom-left Reference}
	 */
	inset?: Theme["spacing"] &
		CoreThemeObject<{
			auto: "auto"
			"1/2": "50%"
			"1/3": "33.333333%"
			"2/3": "66.666667%"
			"1/4": "25%"
			"2/4": "50%"
			"3/4": "75%"
			full: "100%"
		}>
	/** Utilities for applying invert filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/invert Reference}
	 */
	invert?: CoreThemeObject<{
		DEFAULT: "100%"
		0: "0"
	}>
	/** Utilities for applying saturation filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/saturate Reference}
	 */
	saturate?: CoreThemeObject<{
		0: "0"
		50: ".5"
		100: "1"
		150: "1.5"
		200: "2"
	}>
	/** Utilities for applying sepia filters to an element.
	 *
	 * {@link https://tailwindcss.com/docs/sepia Reference}
	 */
	sepia?: CoreThemeObject<{
		DEFAULT: "100%"
		0: "0"
	}>
	/** Utilities for animating elements with CSS animations.
	 *
	 * {@link https://tailwindcss.com/docs/animation Reference}
	 */
	keyframes?: CoreThemeObject<{
		spin: CSSProperties
		ping: CSSProperties
		pulse: CSSProperties
		bounce: CSSProperties
	}>
	/** Utilities for controlling the tracking (letter spacing) of an element.
	 *
	 * {@link https://tailwindcss.com/docs/letter-spacing Reference}
	 */
	letterSpacing?: CoreThemeObject<{
		tighter: "-0.05em"
		tight: "-0.025em"
		normal: "0em"
		wide: "0.025em"
		wider: "0.05em"
		widest: "0.1em"
	}>
	/** Utilities for clamping text to a specific number of lines.
	 *
	 * {@link https://tailwindcss.com/docs/line-clamp Reference}
	 */
	lineClamp?: CoreThemeObject<{
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
	}>
	/** Utilities for controlling the leading (line height) of an element.
	 *
	 * {@link https://tailwindcss.com/docs/line-height Reference}
	 */
	lineHeight?: CoreThemeObject<{
		none: "1"
		tight: "1.25"
		snug: "1.375"
		normal: "1.5"
		relaxed: "1.625"
		loose: "2"
		3: ".75rem"
		4: "1rem"
		5: "1.25rem"
		6: "1.5rem"
		7: "1.75rem"
		8: "2rem"
		9: "2.25rem"
		10: "2.5rem"
	}>
	/** Utilities for controlling the marker images for list items.
	 *
	 * {@link https://tailwindcss.com/docs/list-style-image Reference}
	 */
	listStyleImage?: CoreThemeObject<{
		none: "none"
	}>
	/** Utilities for controlling the bullet/number style of a list.
	 *
	 * {@link https://tailwindcss.com/docs/list-style-type Reference}
	 */
	listStyleType?: CoreThemeObject<{
		none: "none"
		disc: "disc"
		decimal: "decimal"
	}>
	/** Utilities for controlling an element's margin.
	 *
	 * {@link https://tailwindcss.com/docs/margin Reference}
	 */
	margin?: Theme["spacing"] &
		CoreThemeObject<{
			auto: "auto"
		}>
	/** Utilities for setting the maximum height of an element.
	 *
	 * {@link https://tailwindcss.com/docs/max-height Reference}
	 */
	maxHeight?: Theme["spacing"] &
		CoreThemeObject<{
			full: "100%"
			screen: "100vh"
			min: "min-content"
			max: "max-content"
			fit: "fit-content"
		}>
	/** Utilities for setting the maximum width of an element.
	 *
	 * {@link https://tailwindcss.com/docs/max-width Reference}
	 */
	maxWidth?: CoreThemeObject<{
		none: "none"
		0: "0rem"
		xs: "20rem"
		sm: "24rem"
		md: "28rem"
		lg: "32rem"
		xl: "36rem"
		"2xl": "42rem"
		"3xl": "48rem"
		"4xl": "56rem"
		"5xl": "64rem"
		"6xl": "72rem"
		"7xl": "80rem"
		full: "100%"
		min: "min-content"
		max: "max-content"
		fit: "fit-content"
		prose: "65ch"
	}>
	/** Utilities for setting the minimum height of an element.
	 *
	 * {@link https://tailwindcss.com/docs/min-height Reference}
	 */
	minHeight?: CoreThemeObject<{
		0: "0px"
		full: "100%"
		screen: "100vh"
		min: "min-content"
		max: "max-content"
		fit: "fit-content"
	}>
	/** Utilities for setting the minimum width of an element.
	 *
	 * {@link https://tailwindcss.com/docs/min-width Reference}
	 */
	minWidth?: CoreThemeObject<{
		0: "0px"
		full: "100%"
		min: "min-content"
		max: "max-content"
		fit: "fit-content"
	}>
	/** Utilities for controlling how a replaced element's content should be positioned within its container.
	 *
	 * {@link https://tailwindcss.com/docs/object-position Reference}
	 */
	objectPosition?: CoreThemeObject<{
		bottom: "bottom"
		center: "center"
		left: "left"
		"left-bottom": "left bottom"
		"left-top": "left top"
		right: "right"
		"right-bottom": "right bottom"
		"right-top": "right top"
		top: "top"
	}>
	/** Utilities for controlling the opacity of an element.
	 *
	 * {@link https://tailwindcss.com/docs/opacity Reference}
	 */
	opacity?: CoreThemeObject<{
		0: "0"
		5: "0.05"
		10: "0.1"
		20: "0.2"
		25: "0.25"
		30: "0.3"
		40: "0.4"
		50: "0.5"
		60: "0.6"
		70: "0.7"
		75: "0.75"
		80: "0.8"
		90: "0.9"
		95: "0.95"
		100: "1"
	}>
	/** Utilities for controlling the order of flex and grid items.
	 *
	 * {@link https://tailwindcss.com/docs/order Reference}
	 */
	order?: CoreThemeObject<{
		first: "-9999"
		last: "9999"
		none: "0"
		1: "1"
		2: "2"
		3: "3"
		4: "4"
		5: "5"
		6: "6"
		7: "7"
		8: "8"
		9: "9"
		10: "10"
		11: "11"
		12: "12"
	}>
	/** Utilities for controlling the color of an element's outline.
	 *
	 * {@link https://tailwindcss.com/docs/outline-color Reference}
	 */
	outlineColor?: WithResolvePathPalette
	/** Utilities for controlling the offset of an element's outline.
	 *
	 * {@link https://tailwindcss.com/docs/outline-offset Reference}
	 */
	outlineOffset?: CoreThemeObject<{
		0: "0px"
		1: "1px"
		2: "2px"
		4: "4px"
		8: "8px"
	}>
	/** Utilities for controlling the width of an element's outline.
	 *
	 * {@link https://tailwindcss.com/docs/outline-width Reference}
	 */
	outlineWidth?: CoreThemeObject<{
		0: "0px"
		1: "1px"
		2: "2px"
		4: "4px"
		8: "8px"
	}>
	/** Utilities for controlling an element's padding.
	 *
	 * {@link https://tailwindcss.com/docs/padding Reference}
	 */
	padding?: Theme["spacing"]
	placeholderColor?: WithResolvePathPalette
	/** Utilities for setting the color of outline rings.
	 *
	 * {@link https://tailwindcss.com/docs/ring-color Reference}
	 */
	ringColor?: WithResolvePathPalette<{
		DEFAULT: string
	}>
	/** Utilities for setting the color of outline ring offsets.
	 *
	 * {@link https://tailwindcss.com/docs/ring-offset-color Reference}
	 */
	ringOffsetColor?: WithResolvePathPalette
	/** Utilities for simulating an offset when adding outline rings.
	 *
	 * {@link https://tailwindcss.com/docs/ring-offset-width Reference}
	 */
	ringOffsetWidth?: CoreThemeObject<{
		0: "0px"
		1: "1px"
		2: "2px"
		4: "4px"
		8: "8px"
	}>
	/** Utilities for creating outline rings with box-shadows.
	 *
	 * {@link https://tailwindcss.com/docs/ring-width Reference}
	 */
	ringWidth?: CoreThemeObject<{
		DEFAULT: "3px"
		0: "0px"
		1: "1px"
		2: "2px"
		4: "4px"
		8: "8px"
	}>
	/** Utilities for controlling the scroll offset around items in a snap container.
	 *
	 * {@link https://tailwindcss.com/docs/scroll-margin Reference}
	 */
	scrollMargin?: Theme["spacing"]
	/** Utilities for controlling an element's scroll offset within a snap container.
	 *
	 * {@link https://tailwindcss.com/docs/scroll-padding Reference}
	 */
	scrollPadding?: Theme["spacing"]
	/** Utilities for rotating elements with transform.
	 *
	 * {@link https://tailwindcss.com/docs/rotate Reference}
	 */
	rotate?: CoreThemeObject<{
		0: "0deg"
		1: "1deg"
		2: "2deg"
		3: "3deg"
		6: "6deg"
		12: "12deg"
		45: "45deg"
		90: "90deg"
		180: "180deg"
	}>
	/** Utilities for scaling elements with transform.
	 *
	 * {@link https://tailwindcss.com/docs/scale Reference}
	 */
	scale?: CoreThemeObject<{
		0: "0"
		50: ".5"
		75: ".75"
		90: ".9"
		95: ".95"
		100: "1"
		105: "1.05"
		110: "1.1"
		125: "1.25"
		150: "1.5"
	}>
	/** Utilities for skewing elements with transform.
	 *
	 * {@link https://tailwindcss.com/docs/skew Reference}
	 */
	skew?: CoreThemeObject<{
		0: "0deg"
		1: "1deg"
		2: "2deg"
		3: "3deg"
		6: "6deg"
		12: "12deg"
	}>
	/** Utilities for controlling the space between child elements.
	 *
	 * {@link https://tailwindcss.com/docs/space Reference}
	 */
	space?: Theme["spacing"]
	/** Customizing the default spacing and sizing scale for your project.
	 *
	 * {@link https://tailwindcss.com/docs/customizing-spacing Reference}
	 */
	spacing?: CoreThemeObject<{
		px: "1px"
		0: "0px"
		0.5: "0.125rem"
		1: "0.25rem"
		1.5: "0.375rem"
		2: "0.5rem"
		2.5: "0.625rem"
		3: "0.75rem"
		3.5: "0.875rem"
		4: "1rem"
		5: "1.25rem"
		6: "1.5rem"
		7: "1.75rem"
		8: "2rem"
		9: "2.25rem"
		10: "2.5rem"
		11: "2.75rem"
		12: "3rem"
		14: "3.5rem"
		16: "4rem"
		20: "5rem"
		24: "6rem"
		28: "7rem"
		32: "8rem"
		36: "9rem"
		40: "10rem"
		44: "11rem"
		48: "12rem"
		52: "13rem"
		56: "14rem"
		60: "15rem"
		64: "16rem"
		72: "18rem"
		80: "20rem"
		96: "24rem"
	}>
	/** Utilities for styling the stroke of SVG elements.
	 *
	 * {@link https://tailwindcss.com/docs/stroke Reference}
	 */
	stroke?: WithResolvePathPalette<{
		none: "none"
	}>
	/** Utilities for styling the stroke width of SVG elements.
	 *
	 * {@link https://tailwindcss.com/docs/stroke-width Reference}
	 */
	strokeWidth?: CoreThemeObject<{
		0: "0"
		1: "1"
		2: "2"
	}>
	/** Utilities for controlling the text color of an element.
	 *
	 * {@link https://tailwindcss.com/docs/text-color Reference}
	 */
	textColor?: WithResolvePathPalette
	/** Utilities for controlling the color of text decorations.
	 *
	 * {@link https://tailwindcss.com/docs/text-decoration-color Reference}
	 */
	textDecorationColor?: WithResolvePathPalette
	/** Utilities for controlling the thickness of text decorations.
	 *
	 * {@link https://tailwindcss.com/docs/text-decoration-thickness Reference}
	 */
	textDecorationThickness?: CoreThemeObject<{
		auto: "auto"
		"from-font": "from-font"
		0: "0px"
		1: "1px"
		2: "2px"
		4: "4px"
		8: "8px"
	}>
	/** Utilities for controlling the offset of a text underline.
	 *
	 * {@link https://tailwindcss.com/docs/text-underline-offset Reference}
	 */
	textUnderlineOffset?: CoreThemeObject<{
		center: "center"
		top: "top"
		"top-right": "top right"
		right: "right"
		"bottom-right": "bottom right"
		bottom: "bottom"
		"bottom-left": "bottom left"
		left: "left"
		"top-left": "top left"
	}>
	/** Utilities for controlling the amount of empty space shown before text in a block.
	 *
	 * {@link https://tailwindcss.com/docs/text-indent Reference}
	 */
	textIndent?: Theme["spacing"]
	/** Utilities for specifying the origin for an element's transformations.
	 *
	 * {@link https://tailwindcss.com/docs/transform-origin Reference}
	 */
	transformOrigin?: CoreThemeObject<{
		center: "center"
		top: "top"
		"top-right": "top right"
		right: "right"
		"bottom-right": "bottom right"
		bottom: "bottom"
		"bottom-left": "bottom left"
		left: "left"
		"top-left": "top left"
	}>
	/** Utilities for controlling the delay of CSS transitions.
	 *
	 * {@link https://tailwindcss.com/docs/transition-delay Reference}
	 */
	transitionDelay?: CoreThemeObject<{
		75: "75ms"
		100: "100ms"
		150: "150ms"
		200: "200ms"
		300: "300ms"
		500: "500ms"
		700: "700ms"
		1000: "1000ms"
	}>
	/** Utilities for controlling the duration of CSS transitions.
	 *
	 * {@link https://tailwindcss.com/docs/transition-duration Reference}
	 */
	transitionDuration?: CoreThemeObject<{
		DEFAULT: "150ms"
		75: "75ms"
		100: "100ms"
		150: "150ms"
		200: "200ms"
		300: "300ms"
		500: "500ms"
		700: "700ms"
		1000: "1000ms"
	}>
	/** Utilities for controlling which CSS properties transition.
	 *
	 * {@link https://tailwindcss.com/docs/transition-property Reference}
	 */
	transitionProperty?: CoreThemeObject<{
		none: "none"
		all: "all"
		DEFAULT: "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter"
		colors: "color, background-color, border-color, text-decoration-color, fill, stroke"
		opacity: "opacity"
		shadow: "box-shadow"
		transform: "transform"
	}>
	/** Utilities for controlling the easing of CSS transitions.
	 *
	 * {@link https://tailwindcss.com/docs/transition-timing-function Reference}
	 */
	transitionTimingFunction?: CoreThemeObject<{
		DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)"
		linear: "linear"
		in: "cubic-bezier(0.4, 0, 1, 1)"
		out: "cubic-bezier(0, 0, 0.2, 1)"
		"in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
	}>
	/** Utilities for translating elements with transform.
	 *
	 * {@link https://tailwindcss.com/docs/translate Reference}
	 */
	translate?: Theme["spacing"] &
		CoreThemeObject<{
			"1/2": "50%"
			"1/3": "33.333333%"
			"2/3": "66.666667%"
			"1/4": "25%"
			"2/4": "50%"
			"3/4": "75%"
			full: "100%"
		}>
	/** Utilities for setting the width of an element.
	 *
	 * {@link https://tailwindcss.com/docs/width Reference}
	 */
	width?: Theme["spacing"] &
		CoreThemeObject<{
			auto: "auto"
			"1/2": "50%"
			"1/3": "33.333333%"
			"2/3": "66.666667%"
			"1/4": "25%"
			"2/4": "50%"
			"3/4": "75%"
			"1/5": "20%"
			"2/5": "40%"
			"3/5": "60%"
			"4/5": "80%"
			"1/6": "16.666667%"
			"2/6": "33.333333%"
			"3/6": "50%"
			"4/6": "66.666667%"
			"5/6": "83.333333%"
			"1/12": "8.333333%"
			"2/12": "16.666667%"
			"3/12": "25%"
			"4/12": "33.333333%"
			"5/12": "41.666667%"
			"6/12": "50%"
			"7/12": "58.333333%"
			"8/12": "66.666667%"
			"9/12": "75%"
			"10/12": "83.333333%"
			"11/12": "91.666667%"
			full: "100%"
			screen: "100vw"
			min: "min-content"
			max: "max-content"
			fit: "fit-content"
		}>
	/** Utilities for optimizing upcoming animations of elements that are expected to change.
	 *
	 * {@link https://tailwindcss.com/docs/will-change Reference}
	 */
	willChange?: CoreThemeObject<{
		auto: "auto"
		scroll: "scroll-position"
		contents: "contents"
		transform: "transform"
	}>
	/** Utilities for controlling the stack order of an element.
	 *
	 * {@link https://tailwindcss.com/docs/z-index Reference}
	 */
	zIndex?: CoreThemeObject<{
		auto: "auto"
		0: "0"
		10: "10"
		20: "20"
		30: "30"
		40: "40"
		50: "50"
	}>
	supports?: CoreThemeObject<{}>
	data?: CoreThemeObject<{}>
}
type Palette<T extends Record<string | symbol, unknown> = {}> = {
	[key: string | symbol]: ColorValue
} & BaseColors & {
		[P in keyof T]?: ColorValue
	}
interface ResolvedThemeObject<V = ConfigEntry> {
	[key: string | symbol]: V
}
/** User-defined resolved theme */
interface ResolvedCustomTheme {}
interface ResolvedTheme extends ResolvedCustomTheme {
	screens: ResolvedThemeObject<ScreenValue>
	container: ContainerConfig
	colors: Palette
	borderColor: Palette
	boxShadowColor: Palette
	caretColor: Palette
	accentColor: Palette
	divideColor: Palette
	fill: Palette
	gradientColorStops: Palette
	outlineColor: Palette
	placeholderColor: Palette
	ringColor: Palette
	ringOffsetColor: Palette
	stroke: Palette
	textColor: Palette
	textDecorationColor: Palette
	spacing: ResolvedThemeObject
	animation: ResolvedThemeObject
	backdropBlur: ResolvedThemeObject
	backdropBrightness: ResolvedThemeObject
	backdropContrast: ResolvedThemeObject
	backdropGrayscale: ResolvedThemeObject
	backdropHueRotate: ResolvedThemeObject
	backdropInvert: ResolvedThemeObject
	backdropOpacity: ResolvedThemeObject
	backdropSaturate: ResolvedThemeObject
	backdropSepia: ResolvedThemeObject
	backgroundImage: ResolvedThemeObject
	backgroundPosition: ResolvedThemeObject
	backgroundSize: ResolvedThemeObject
	blur: ResolvedThemeObject
	brightness: ResolvedThemeObject
	borderRadius: ResolvedThemeObject
	borderSpacing: ResolvedThemeObject
	borderWidth: ResolvedThemeObject
	boxShadow: ResolvedThemeObject<string | string[]>
	contrast: ResolvedThemeObject
	content: ResolvedThemeObject
	cursor: ResolvedThemeObject
	divideWidth: ResolvedThemeObject
	dropShadow: ResolvedThemeObject
	grayscale: ResolvedThemeObject
	hueRotate: ResolvedThemeObject
	invert: ResolvedThemeObject
	flex: ResolvedThemeObject
	flexBasis: ResolvedThemeObject
	flexGrow: ResolvedThemeObject
	flexShrink: ResolvedThemeObject
	fontFamily: ResolvedThemeObject<FontFamilyValue>
	fontSize: ResolvedThemeObject<FontSizeValue>
	fontWeight: ResolvedThemeObject
	gap: ResolvedThemeObject
	gradientColorStopPositions: ResolvedThemeObject
	gridAutoColumns: ResolvedThemeObject
	gridAutoRows: ResolvedThemeObject
	gridColumn: ResolvedThemeObject
	gridColumnEnd: ResolvedThemeObject
	gridColumnStart: ResolvedThemeObject
	gridRow: ResolvedThemeObject
	gridRowStart: ResolvedThemeObject
	gridRowEnd: ResolvedThemeObject
	gridTemplateColumns: ResolvedThemeObject
	gridTemplateRows: ResolvedThemeObject
	height: ResolvedThemeObject
	inset: ResolvedThemeObject
	keyframes: ResolvedThemeObject<CSSProperties> & ConfigObject
	letterSpacing: ResolvedThemeObject
	lineClamp: ResolvedThemeObject
	lineHeight: ResolvedThemeObject
	listStyleImage: ResolvedThemeObject
	listStyleType: ResolvedThemeObject
	margin: ResolvedThemeObject
	maxHeight: ResolvedThemeObject
	maxWidth: ResolvedThemeObject
	minHeight: ResolvedThemeObject
	minWidth: ResolvedThemeObject
	objectPosition: ResolvedThemeObject
	opacity: ResolvedThemeObject
	order: ResolvedThemeObject
	outlineOffset: ResolvedThemeObject
	outlineWidth: ResolvedThemeObject
	padding: ResolvedThemeObject
	ringOffsetWidth: ResolvedThemeObject
	ringWidth: ResolvedThemeObject
	rotate: ResolvedThemeObject
	saturate: ResolvedThemeObject
	scale: ResolvedThemeObject
	sepia: ResolvedThemeObject
	skew: ResolvedThemeObject
	space: ResolvedThemeObject
	strokeWidth: ResolvedThemeObject
	textDecorationThickness: ResolvedThemeObject
	textUnderlineOffset: ResolvedThemeObject
	textIndent: ResolvedThemeObject
	transformOrigin: ResolvedThemeObject
	transitionDelay: ResolvedThemeObject
	transitionDuration: ResolvedThemeObject
	transitionProperty: ResolvedThemeObject
	transitionTimingFunction: ResolvedThemeObject
	translate: ResolvedThemeObject
	width: ResolvedThemeObject
	zIndex: ResolvedThemeObject
	aspectRatio: ResolvedThemeObject
	columns: ResolvedThemeObject
	scrollMargin: ResolvedThemeObject
	scrollPadding: ResolvedThemeObject
	willChange: ResolvedThemeObject
	aria: ResolvedThemeObject
	supports: ResolvedThemeObject
	data: ResolvedThemeObject
}

type ValueType =
	| "number"
	| "percentage"
	| "length"
	| "angle"
	| "color"
	| "url"
	| "image"
	| "line-width"
	| "absolute-size"
	| "relative-size"
	| "shadow"
	| "generic-name"
	| "family-name"
	| "background-position"
	| "background-size"
interface AddOption {
	respectPrefix?: boolean
	respectImportant?: boolean
	post?: Variant
}
interface MatchOption<Value = any> {
	values?: Record<string, Value>
	type?: ValueType | ValueType[]
	supportsNegativeValues?: boolean
	/** Exclude 'DEFAULT' value. */
	filterDefault?: boolean
	respectPrefix?: boolean
	respectImportant?: boolean
	post?: Variant
}
interface MatchVariantOption<Value = any> {
	values?: Record<string, Value>
	post?: Variant
}
interface UserPluginOptions {
	/** Add global css. */
	addBase(bases: CSSProperties | CSSProperties[]): void
	/** Add global css variables. */
	addDefaults(pluginName: string, properties: Record<string, string | string[]>): void
	/** Register new utilities. */
	addUtilities(utilities: CSSProperties | CSSProperties[], options?: AddOption): void
	/** Register new components. */
	addComponents(components: CSSProperties | CSSProperties[], options?: AddOption): void
	/** Register new utilities. */
	matchUtilities<Value = any>(
		utilities: Record<string, (...args: ArbitraryParameters<Value>) => CSSProperties | CSSProperties[]>,
		options?: MatchOption<Value>,
	): void
	/** Register new components. */
	matchComponents<Value = any>(
		components: Record<string, (...args: ArbitraryParameters<Value>) => CSSProperties | CSSProperties[]>,
		options?: MatchOption<Value>,
	): void
	/** Register a custom variant. */
	addVariant(
		name: string,
		spec: string | (() => string | string[]) | Array<string | (() => string | string[])>,
		options?: {
			post?: Variant
		},
	): void
	/** Register an arbitrary variant */
	matchVariant<Value = any>(
		name: string,
		spec: (...args: ArbitraryParameters<Value>) => string | string[],
		options?: MatchVariantOption<Value>,
	): void
	/** Look up values in the user's theme configuration. */
	theme: ResolvePath
	/** Look up values in the user's Tailwind configuration. */
	config: ResolvePath
	/** Escape css. */
	e(classname: string): string
	/**
	 * Do nothing.
	 * @deprecated
	 */
	prefix(classname: string): string
	/**
	 * Do nothing.
	 * @deprecated
	 */
	variants(corePlugin: string): string[]
	/** Test a feature exists whether or not. */
	corePlugins(feature: keyof CorePluginFeatures): boolean
}
interface CorePluginOptions extends UserPluginOptions {
	configObject: ResolvedConfigJS
	themeObject: ResolvedConfigJS["theme"]
}
interface UnnamedPlugin {
	(api: CorePluginOptions): void
}
interface CorePlugin {
	(api: CorePluginOptions): void
	readonly name: string
}
interface UserPluginFunction {
	(options: UserPluginOptions): void
}
interface UserPluginObject extends ConfigObject {
	handler?: UserPluginFunction
	config?: ConfigJS
	name?: string
}
interface UserPluginFunctionWithOption<Options = unknown> {
	(options?: Options): UserPluginObject
}
type Plugin = UserPluginObject | UserPluginFunction
interface PluginFunction<Options> {
	(options: Options): UnnamedPlugin
}
interface ConfigFunction<Options> {
	(options: Options): ConfigJS
}
interface CreatePlugin {
	(handler: UnnamedPlugin): CorePlugin
	(pluginName: string, handler: UnnamedPlugin): CorePlugin
	(handler: UnnamedPlugin, config: ConfigJS): CorePlugin
	/** Create a tailwind plugin with options. */
	withOptions: CreatePluginWithOptions
}
interface CreatePluginWithOptions {
	/** Create a tailwind plugin with options. */
	<Options = unknown>(
		pluginFunction: PluginFunction<Options>,
		configFunction?: ConfigFunction<Options>,
	): UserPluginFunctionWithOption<Options>
	/** Create a tailwind plugin with options. */
	<Options = unknown>(
		pluginName: string,
		pluginFunction: PluginFunction<Options>,
		configFunction?: ConfigFunction<Options>,
	): UserPluginFunctionWithOption<Options>
}

interface ConfigJS extends StrictConfigJS, ConfigObject {}
interface PresetFunction {
	(): ConfigJS
}
interface StrictConfigJS {
	presets?: (ConfigJS | PresetFunction)[]
	theme?: Theme & CustomTheme & ConfigObject
	plugins?: Plugin[]
	darkMode?: "media" | "class" | ["class", string]
	corePlugins?: Partial<CorePluginFeatures> | Array<keyof CorePluginFeatures> | boolean
	separator?: string
	prefix?: string
	important?: boolean | string
}
interface ResolvedConfigJS extends StrictResolvedConfigJS, ConfigObject {}
interface StrictResolvedConfigJS {
	presets: ConfigJS[]
	separator: string
	prefix: string
	important: boolean
	darkMode: "media" | "class" | ["class", string]
	plugins: (UserPluginObject | UserPluginFunction | UserPluginFunctionWithOption)[]
	theme: ResolvedTheme & ConfigObject
}

interface CreateContextOptions {
	/**
	 * Throw an error if any variant or utility is not found.
	 * @default false
	 */
	throwError?: boolean
}
interface Context extends UserPluginOptions {
	/** core parser */
	parser: ReturnType<typeof createParser>
	/** globalStyles */
	globalStyles: Record<string, CSSProperties>
	utilities: Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>
	variantMap: Map<string, VariantSpec | LookupVariantSpec | Array<VariantSpec | LookupVariantSpec>>
	arbitraryVariants: Set<string>
	arbitraryUtilities: Map<string, Set<ValueType | "any">>
	features: Set<string>
	/** Transfrom tailwind declarations to css object. */
	css(strings: string): CSSProperties
	css(strings: TemplateStringsArray): CSSProperties
	css(strings: string | TemplateStringsArray): CSSProperties
	/** Get one variant spec form strings or nodes. */
	wrap(variants: string): Variant
	wrap(variants: TemplateStringsArray): Variant
	wrap(...variants: Variant$1[]): Variant
	wrap(variants: string | TemplateStringsArray | Variant$1, ...args: Variant$1[]): Variant
	/** Reverse utility mapping. */
	resolveUtility(value: string): [style?: CSSProperties | undefined, spec?: LookupSpec | StaticSpec | undefined]
	/** Reverse variant mapping. */
	resolveVariant(value: string): [variant?: Variant | undefined, spec?: LookupVariantSpec | VariantSpec | undefined]
	/** Signature: `theme(colors.red.500, <default-value>)` */
	renderThemeFunc(value: string): string
	/** Signature: `colors.red.500` */
	renderTheme(value: string): string
	/** List all utilities. */
	getUtilities(): Set<string>
	/** List all variants. */
	getVariants(): Set<string>
	/** List all color utilities. */
	getColorUtilities(): Map<string, string[]>
	/** List all ambiguous utilities. */
	getAmbiguous(): Map<string, LookupSpec[]>
	set throwError(e: boolean)
	get throwError(): boolean
}

interface ParseError extends Error {
	node: Node
}
declare function createParseError(node: Node, message?: string): ParseError

/** Create a tailwind context. */
declare function createContext(config: ResolvedConfigJS, { throwError }?: CreateContextOptions): Context

declare const defaultColors: BaseColors

declare const defaultTheme: ConfigJS["theme"]
declare const defaultConfig: ConfigJS

/** Create a tailwind plugin. */
declare const plugin: CreatePlugin

/** Resolve all tailwind configurations. */
declare function resolveConfig(...args: Array<ConfigJS | null | undefined>): ResolvedConfigJS

declare const pseudoVariants: Array<[variantName: string, desc: string]>

export {
	type AddOption,
	type ArbitraryParameters,
	type BaseColors,
	type CSSProperties,
	type CSSValue,
	type ColorValue,
	type ColorValueFunc,
	type ConfigArray,
	type ConfigEntry,
	type ConfigFunction,
	type ConfigJS,
	type ConfigObject,
	type ConfigUtils,
	type ConfigValue,
	type ContainerConfig,
	type Context,
	type CorePlugin,
	type CorePluginFeatures,
	type CorePluginOptions,
	type CoreThemeObject,
	type CreateContextOptions,
	type CreatePlugin,
	type CreatePluginWithOptions,
	type CustomPalette,
	type CustomTheme,
	type FontFamilyValue,
	type FontFamilyValueExtension,
	type FontSizeValue,
	type FontSizeValueExtension,
	type Func,
	type LookupSpec,
	type LookupVariantSpec,
	type MatchOption,
	type MatchVariantOption,
	type Palette,
	type ParseError,
	type PlainCSSProperties,
	type Plugin,
	type PluginFunction,
	type PresetFunction,
	type Primitive,
	type ResolvePath,
	type ResolveThemePath,
	type ResolvedConfigJS,
	type ResolvedCustomTheme,
	type ResolvedTheme,
	type ResolvedThemeObject,
	type ScreenValue,
	type StaticSpec,
	type StrictConfigJS,
	type StrictResolvedConfigJS,
	type Theme,
	type UnnamedPlugin,
	type UserPluginFunction,
	type UserPluginFunctionWithOption,
	type UserPluginObject,
	type UserPluginOptions,
	type UtilityRender,
	type ValueType,
	type Variant,
	type VariantRender,
	type VariantSpec,
	type WithResolvePathPalette,
	type WithResolveThemePath,
	createContext,
	createParseError,
	defaultColors,
	defaultConfig,
	defaultTheme,
	plugin,
	pseudoVariants,
	resolveConfig,
}
