import { ColorValue, ConfigEntry, ConfigObject, CSSProperties, CSSValue } from "./specification"

/** User-defined theme */
export interface CustomTheme {}

export interface ConfigUtils {
	/** default colors */
	colors: BaseColors
}
export interface ResolvePath {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(path: string, defaultValue?: unknown): any
}

export interface ResolveThemePath extends ResolvePath, ConfigUtils {
	theme: ResolvePath
}

export type WithResolveThemePath<T> = T | ((theme: ResolveThemePath, configUtils: ConfigUtils) => T | void)

export type WithResolvePathPalette<T extends Record<string | symbol, unknown> = {}> = WithResolveThemePath<
	{
		[key: string | symbol]: ColorValue
	} & BaseColors & { [P in keyof T]?: ColorValue }
>

export type CoreThemeObject<T extends Record<string | symbol, unknown> = {}, V = ConfigEntry> = WithResolveThemePath<
	{
		[key: string | symbol]: V
	} & {
		[P in keyof T]?: V
	}
>

export interface BaseColors {
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

export interface FontSizeValueExtension extends ConfigObject {
	/** @link https://developer.mozilla.org/en-US/docs/Web/CSS/line-height */
	lineHeight?: CSSValue
	/** @link https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing */
	letterSpacing?: CSSValue
	/** @link https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight */
	fontWeight?: CSSValue
}

export type FontSizeValue =
	| CSSValue
	| [fontSize: CSSValue, lineHeight: CSSValue]
	| [fontSize: CSSValue, options: FontSizeValueExtension]

export interface FontFamilyValueExtension extends ConfigObject {
	/** https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings */
	fontFeatureSettings?: CSSValue
}

export type FontFamilyValue = CSSValue | CSSValue[] | [value: CSSValue | CSSValue[], options: FontFamilyValueExtension]

export interface ContainerConfig {
	center?: boolean
	padding?: CSSValue | { [key: string]: CSSValue }
	screens?: { [key: string]: CSSValue }
}

export interface Theme {
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
	accentColor?: WithResolvePathPalette<{ auto: "auto" }>

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
		"gradient-to-t": "linear-gradient(to top, var(--tw-gradient-stops))"
		"gradient-to-tr": "linear-gradient(to top right, var(--tw-gradient-stops))"
		"gradient-to-r": "linear-gradient(to right, var(--tw-gradient-stops))"
		"gradient-to-br": "linear-gradient(to bottom right, var(--tw-gradient-stops))"
		"gradient-to-b": "linear-gradient(to bottom, var(--tw-gradient-stops))"
		"gradient-to-bl": "linear-gradient(to bottom left, var(--tw-gradient-stops))"
		"gradient-to-l": "linear-gradient(to left, var(--tw-gradient-stops))"
		"gradient-to-tl": "linear-gradient(to top left, var(--tw-gradient-stops))"
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
	borderColor?: WithResolvePathPalette<{ DEFAULT: unknown }>

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
	fill?: WithResolvePathPalette<{ none: "none" }>

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
	margin?: Theme["spacing"] & CoreThemeObject<{ auto: "auto" }>

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
	ringColor?: WithResolvePathPalette<{ DEFAULT: string }>

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
	stroke?: WithResolvePathPalette<{ none: "none" }>

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

export type Palette<T extends Record<string | symbol, unknown> = {}> = {
	[key: string | symbol]: ColorValue
} & BaseColors & { [P in keyof T]?: ColorValue }

export interface ResolvedThemeObject<V = ConfigEntry> {
	[key: string | symbol]: V
}

/** User-defined resolved theme */
export interface ResolvedCustomTheme {}

export interface ResolvedTheme extends ResolvedCustomTheme {
	screens: ResolvedThemeObject<CSSValue>
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
	lineHeight: ResolvedThemeObject
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
