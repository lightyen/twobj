import colors from "../config/defaultColors"
import { CSSProperties } from "./base"
import { UserPluginOptions } from "./core"
import { CorePluginFeatures } from "./features"

// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyThemeValue = string | bigint | number | boolean | symbol | Function | null | undefined

export type AnyThemeObject = {
	[key: string]: AnyThemeEntry
}

export type AnyThemeArray = Array<AnyThemeEntry>

export type AnyThemeEntry = AnyThemeValue | AnyThemeArray | AnyThemeObject

export type AnyTheme = {
	extend?: AnyThemeObject
	[key: string]: AnyThemeEntry
}

export type Value = unknown

export interface GetTheme {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(path: string, defaultValue?: unknown): any
}

export interface ConfigUtils {
	/** default colors */
	colors: typeof colors
}

export interface ResolveThemePath extends GetTheme, ConfigUtils {
	theme: GetTheme
}

interface OpacityOptions {
	opacityValue?: Value
}

type WithTheme<T> = T | ((theme: ResolveThemePath, utils: ConfigUtils) => T)

export type ColorMap = {
	[key: string]: Value | ColorValueFunc | ColorMap | undefined
}

export type ColorValueFunc = (options: OpacityOptions) => string

export type ColorValue = Value | ColorValueFunc | ColorMap | undefined

interface BuiltInColors<V> extends Record<string, V | undefined> {
	inherit?: V
	current?: V
	transparent?: V
	black?: V
	white?: V
	slate?: V
	gray?: V
	zinc?: V
	neutral?: V
	stone?: V
	red?: V
	orange?: V
	amber?: V
	yellow?: V
	lime?: V
	green?: V
	emerald?: V
	teal?: V
	cyan?: V
	sky?: V
	blue?: V
	indigo?: V
	violet?: V
	purple?: V
	fuchsia?: V
	pink?: V
	rose?: V
}

export type Palette = BuiltInColors<ColorValue> & ColorMap

export interface UserPluginFunction {
	(options: UserPluginOptions): void
}

export interface UserPluginObject {
	handler?: UserPluginFunction
	config?: ConfigJS
	[key: string | symbol]: unknown
}

export interface UserPluginFunctionWithOption<Options = unknown> {
	(options?: Options): UserPluginObject
	// (options?: Options): UserPluginObject & { __options?: Options }
	__isOptionsFunction: true
	__pluginFunction: (options?: Options) => UserPluginFunction
	__configFunction: (options?: Options) => ConfigJS
}

export type Plugin = UserPluginObject | UserPluginFunction
export type UserPlugin = UserPluginObject | UserPluginFunction | UserPluginFunctionWithOption

export type FontSizeValueDetail = [
	fontSize: Value,
	options: {
		lineHeight?: Value
		letterSpacing?: Value
		fontWeight?: Value
	},
]

export type FontSizeValue = Value | [fontSize: Value, lineHeight: Value] | FontSizeValueDetail

export interface Theme {
	extend?: Omit<ConfigJS["theme"], "extend">
	accentColor?: WithTheme<Palette>
	animation?: WithTheme<Record<string, Value>>
	aspectRatio?: WithTheme<Record<string, Value>>
	backdropBlur?: WithTheme<Record<string, Value>>
	backdropBrightness?: WithTheme<Record<string, Value>>
	backdropContrast?: WithTheme<Record<string, Value>>
	backdropGrayscale?: WithTheme<Record<string, Value>>
	backdropHueRotate?: WithTheme<Record<string, Value>>
	backdropInvert?: WithTheme<Record<string, Value>>
	backdropOpacity?: WithTheme<Record<string, Value>>
	backdropSaturate?: WithTheme<Record<string, Value>>
	backdropSepia?: WithTheme<Record<string, Value>>
	backgroundColor?: WithTheme<Palette>
	backgroundImage?: WithTheme<Record<string, Value>>
	backgroundPosition?: WithTheme<Record<string, Value>>
	backgroundSize?: WithTheme<Record<string, Value>>
	blur?: WithTheme<Record<string, Value>>
	borderColor?: WithTheme<Palette & { DEFAULT?: Value }>
	borderRadius?: WithTheme<Record<string, Value>>
	borderSpacing?: WithTheme<Record<string, Value>>
	borderWidth?: WithTheme<Record<string, Value>>
	boxShadow?: WithTheme<Record<string, Value>>
	boxShadowColor?: WithTheme<Palette>
	brightness?: WithTheme<Record<string, Value>>
	caretColor?: WithTheme<Palette>
	colors?: WithTheme<Palette>
	columns?: WithTheme<Record<string, Value>>
	container?: WithTheme<{
		screens?: Record<string, unknown>
		padding?: unknown
		center?: unknown
	}>
	content?: WithTheme<Record<string, Value>>
	contrast?: WithTheme<Record<string, Value>>
	cursor?: WithTheme<Record<string, Value>>
	divideColor?: WithTheme<Palette & { DEFAULT?: Value }>
	divideWidth?: WithTheme<Record<string, Value>>
	dropShadow?: WithTheme<Record<string, Value>>
	fill?: WithTheme<Palette>
	flex?: WithTheme<Record<string, Value>>
	flexBasis?: WithTheme<Record<string, Value>>
	flexGrow?: WithTheme<Record<string, Value>>
	flexShrink?: WithTheme<Record<string, Value>>
	fontFamily?: WithTheme<Record<string, Value>>
	fontSize?: WithTheme<Record<string, FontSizeValue>>
	fontWeight?: WithTheme<Record<string, Value>>
	gap?: WithTheme<Record<string, Value>>
	gradientColorStops?: WithTheme<Palette>
	grayscale?: WithTheme<Record<string, Value>>
	gridAutoColumns?: WithTheme<Record<string, Value>>
	gridAutoRows?: WithTheme<Record<string, Value>>
	gridColumn?: WithTheme<Record<string, Value>>
	gridColumnEnd?: WithTheme<Record<string, Value>>
	gridColumnStart?: WithTheme<Record<string, Value>>
	gridRow?: WithTheme<Record<string, Value>>
	gridRowEnd?: WithTheme<Record<string, Value>>
	gridRowStart?: WithTheme<Record<string, Value>>
	gridTemplateColumns?: WithTheme<Record<string, Value>>
	gridTemplateRows?: WithTheme<Record<string, Value>>
	height?: WithTheme<Record<string, Value>>
	hueRotate?: WithTheme<Record<string, Value>>
	inset?: WithTheme<Record<string, Value>>
	invert?: WithTheme<Record<string, Value>>
	keyframes?: WithTheme<Record<string, CSSProperties>>
	letterSpacing?: WithTheme<Record<string, Value>>
	lineHeight?: WithTheme<Record<string, Value>>
	listStyleType?: WithTheme<Record<string, Value>>
	margin?: WithTheme<Record<string, Value>>
	maxHeight?: WithTheme<Record<string, Value>>
	maxWidth?: WithTheme<Record<string, Value>>
	minHeight?: WithTheme<Record<string, Value>>
	minWidth?: WithTheme<Record<string, Value>>
	objectPosition?: WithTheme<Record<string, Value>>
	opacity?: WithTheme<Record<string, Value>>
	order?: WithTheme<Record<string, Value>>
	outlineColor?: WithTheme<Palette>
	outlineOffset?: WithTheme<Record<string, Value>>
	outlineWidth?: WithTheme<Record<string, Value>>
	padding?: WithTheme<Record<string, Value>>
	placeholderColor?: WithTheme<Palette>
	ringColor?: WithTheme<Palette & { DEFAULT?: ColorValue }>
	ringOffsetColor?: WithTheme<Palette>
	ringOffsetWidth?: WithTheme<Record<string, Value>>
	ringWidth?: WithTheme<Record<string, Value>>
	rotate?: WithTheme<Record<string, Value>>
	saturate?: WithTheme<Record<string, Value>>
	scale?: WithTheme<Record<string, Value>>
	screens?: WithTheme<Record<string, unknown>>
	scrollMargin?: WithTheme<Record<string, Value>>
	scrollPadding?: WithTheme<Record<string, Value>>
	sepia?: WithTheme<Record<string, Value>>
	skew?: WithTheme<Record<string, Value>>
	space?: WithTheme<Record<string, Value>>
	spacing?: WithTheme<Record<string, Value>>
	stroke?: WithTheme<Record<string, Value>>
	strokeWidth?: WithTheme<Record<string, Value>>
	textColor?: WithTheme<Palette>
	textDecorationColor?: WithTheme<Palette>
	textDecorationThickness?: WithTheme<Record<string, Value>>
	textIndent?: WithTheme<Record<string, Value>>
	textUnderlineOffset?: WithTheme<Record<string, Value>>
	transformOrigin?: WithTheme<Record<string, Value>>
	transitionDelay?: WithTheme<Record<string, Value>>
	transitionDuration?: WithTheme<Record<string, Value>>
	transitionProperty?: WithTheme<Record<string, Value>>
	transitionTimingFunction?: WithTheme<Record<string, Value>>
	translate?: WithTheme<Record<string, Value>>
	width?: WithTheme<Record<string, Value>>
	willChange?: WithTheme<Record<string, Value>>
	zIndex?: WithTheme<Record<string, Value>>
}

export interface CustomTheme {
	[key: string | symbol]: unknown
}

export interface ConfigJS extends StrictConfigJS {
	[key: string | symbol]: unknown
}

export interface PresetFunction {
	(): ConfigJS
}

export interface StrictConfigJS {
	presets?: (ConfigJS | PresetFunction)[]
	theme?: Theme & CustomTheme
	plugins?: Plugin[]
	darkMode?: boolean | "media" | "class" | ["class", string]
	corePlugins?: Partial<CorePluginFeatures> | Array<keyof CorePluginFeatures>
	separator?: string
	prefix?: string
	important?: boolean | string
}

export interface ResolvedConfigJS extends StrictResolvedConfigJS {
	[key: string | symbol]: unknown
}

type SpacingConfig = {
	0: unknown
	1: unknown
	2: unknown
	3: unknown
	4: unknown
	5: unknown
	6: unknown
	7: unknown
	8: unknown
	9: unknown
	10: unknown
	11: unknown
	12: unknown
	14: unknown
	16: unknown
	20: unknown
	24: unknown
	28: unknown
	32: unknown
	36: unknown
	40: unknown
	44: unknown
	48: unknown
	52: unknown
	56: unknown
	60: unknown
	64: unknown
	72: unknown
	80: unknown
	96: unknown
	px: unknown
	0.5: unknown
	1.5: unknown
	2.5: unknown
	3.5: unknown
}

interface OpacityConfig {
	0: string
	5: string
	10: string
	20: string
	25: string
	30: string
	40: string
	50: string
	60: string
	70: string
	75: string
	80: string
	90: string
	95: string
	100: string
}

type ResolvedResult<T, V = unknown> = Partial<T> & Record<string, V>

export interface StrictResolvedConfigJS {
	presets: ConfigJS[]
	separator: string
	prefix: string
	important: boolean
	darkMode: boolean | "media" | "class" | ["class", string]
	plugins: UserPlugin[]
	theme: {
		[key: string | symbol]: unknown
		screens: ResolvedResult<{
			sm: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
		}>
		colors: Palette
		spacing: ResolvedResult<SpacingConfig>
		animation: ResolvedResult<{
			none: unknown
			spin: unknown
			ping: unknown
			pulse: unknown
			bounce: unknown
		}>
		backdropBlur: ResolvedResult<{
			0: unknown
			none: unknown
			sm: unknown
			DEFAULT: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			"3xl": unknown
		}>
		backdropBrightness: ResolvedResult<{
			0: unknown
			50: unknown
			75: unknown
			90: unknown
			95: unknown
			100: unknown
			105: unknown
			110: unknown
			125: unknown
			150: unknown
			200: unknown
		}>
		backdropContrast: ResolvedResult<{
			0: unknown
			50: unknown
			75: unknown
			100: unknown
			125: unknown
			150: unknown
			200: unknown
		}>
		backdropGrayscale: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		backdropHueRotate: ResolvedResult<{
			0: unknown
			15: unknown
			30: unknown
			60: unknown
			90: unknown
			180: unknown
			"-180": unknown
			"-90": unknown
			"-60": unknown
			"-30": unknown
			"-15": unknown
		}>
		backdropInvert: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		backdropOpacity: ResolvedResult<OpacityConfig>
		backdropSaturate: ResolvedResult<{
			0: unknown
			50: unknown
			100: unknown
			150: unknown
			200: unknown
		}>
		backdropSepia: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		backgroundColor: Palette
		backgroundImage: ResolvedResult<{
			none: unknown
			"gradient-to-t": unknown
			"gradient-to-tr": unknown
			"gradient-to-r": unknown
			"gradient-to-br": unknown
			"gradient-to-b": unknown
			"gradient-to-bl": unknown
			"gradient-to-l": unknown
			"gradient-to-tl": unknown
		}>
		backgroundPosition: ResolvedResult<{
			bottom: unknown
			center: unknown
			left: unknown
			"left-bottom": unknown
			"left-top": unknown
			right: unknown
			"right-bottom": unknown
			"right-top": unknown
			top: unknown
		}>
		backgroundSize: ResolvedResult<{
			auto: unknown
			cover: unknown
			contain: unknown
		}>
		blur: ResolvedResult<{
			0: unknown
			none: unknown
			sm: unknown
			DEFAULT: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			"3xl": unknown
		}>
		brightness: ResolvedResult<{
			0: unknown
			50: unknown
			75: unknown
			90: unknown
			95: unknown
			100: unknown
			105: unknown
			110: unknown
			125: unknown
			150: unknown
			200: unknown
		}>
		borderColor: Palette &
			ResolvedResult<{
				DEFAULT: unknown
			}>
		borderRadius: ResolvedResult<{
			none: unknown
			sm: unknown
			DEFAULT: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			"3xl": unknown
			full: unknown
		}>
		borderSpacing: ResolvedResult<SpacingConfig>
		borderWidth: ResolvedResult<{
			0: unknown
			2: unknown
			4: unknown
			8: unknown
			DEFAULT: unknown
		}>
		boxShadow: ResolvedResult<{
			sm: unknown
			DEFAULT: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			inner: unknown
			none: unknown
		}>
		boxShadowColor: Palette
		caretColor: Palette
		accentColor: Palette & { auto: unknown }
		contrast: ResolvedResult<{
			0: unknown
			50: unknown
			75: unknown
			100: unknown
			125: unknown
			150: unknown
			200: unknown
		}>
		container: ResolvedResult<{
			screens: Record<string, unknown>
			padding: unknown
			center: unknown
		}>
		content: ResolvedResult<{
			none: unknown
		}>
		cursor: ResolvedResult<{
			auto: unknown
			default: unknown
			pointer: unknown
			wait: unknown
			text: unknown
			move: unknown
			help: unknown
			"not-allowed": unknown
		}>
		divideColor: Palette &
			ResolvedResult<{
				DEFAULT: unknown
			}>
		divideWidth: ResolvedResult<{
			0: unknown
			2: unknown
			4: unknown
			8: unknown
			DEFAULT: unknown
		}>
		dropShadow: ResolvedResult<{
			DEFAULT: unknown
			sm: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			none: unknown
		}>
		fill: Palette &
			ResolvedResult<{
				current: unknown
			}>
		grayscale: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		hueRotate: ResolvedResult<{
			0: unknown
			15: unknown
			30: unknown
			60: unknown
			90: unknown
			180: unknown
		}>
		invert: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		flex: ResolvedResult<{
			1: unknown
			auto: unknown
			initial: unknown
			none: unknown
		}>
		flexBasis: ResolvedResult<
			SpacingConfig & {
				auto: unknown
				"1/2": unknown
				"1/3": unknown
				"2/3": unknown
				"1/4": unknown
				"2/4": unknown
				"3/4": unknown
				"1/5": unknown
				"2/5": unknown
				"3/5": unknown
				"4/5": unknown
				"1/6": unknown
				"2/6": unknown
				"3/6": unknown
				"4/6": unknown
				"5/6": unknown
				"1/12": unknown
				"2/12": unknown
				"3/12": unknown
				"4/12": unknown
				"5/12": unknown
				"6/12": unknown
				"7/12": unknown
				"8/12": unknown
				"9/12": unknown
				"10/12": unknown
				"11/12": unknown
				full: unknown
			}
		>
		flexGrow: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		flexShrink: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		fontFamily: ResolvedResult<{
			sans: unknown
			serif: unknown
			mono: unknown
		}>
		fontSize: ResolvedResult<{
			xs: unknown
			sm: unknown
			base: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			"3xl": unknown
			"4xl": unknown
			"5xl": unknown
			"6xl": unknown
			"7xl": unknown
			"8xl": unknown
			"9xl": unknown
		}>
		fontWeight: ResolvedResult<{
			thin: unknown
			extralight: unknown
			light: unknown
			normal: unknown
			medium: unknown
			semibold: unknown
			bold: unknown
			extrabold: unknown
			black: unknown
		}>
		gap: ResolvedResult<SpacingConfig>
		gradientColorStops: Palette
		gridAutoColumns: ResolvedResult<{
			auto: unknown
			min: unknown
			max: unknown
			fr: unknown
		}>
		gridAutoRows: ResolvedResult<{
			auto: unknown
			min: unknown
			max: unknown
			fr: unknown
		}>
		gridColumn: ResolvedResult<{
			auto: unknown
			"span-1": unknown
			"span-2": unknown
			"span-3": unknown
			"span-4": unknown
			"span-5": unknown
			"span-6": unknown
			"span-7": unknown
			"span-8": unknown
			"span-9": unknown
			"span-10": unknown
			"span-11": unknown
			"span-12": unknown
			"span-full": unknown
		}>
		gridColumnEnd: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			8: unknown
			9: unknown
			10: unknown
			11: unknown
			12: unknown
			13: unknown
			auto: unknown
		}>
		gridColumnStart: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			8: unknown
			9: unknown
			10: unknown
			11: unknown
			12: unknown
			13: unknown
			auto: unknown
		}>
		gridRow: ResolvedResult<{
			auto: unknown
			"span-1": unknown
			"span-2": unknown
			"span-3": unknown
			"span-4": unknown
			"span-5": unknown
			"span-6": unknown
			"span-full": unknown
		}>
		gridRowStart: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			auto: unknown
		}>
		gridRowEnd: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			auto: unknown
		}>
		gridTemplateColumns: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			8: unknown
			9: unknown
			10: unknown
			11: unknown
			12: unknown
			none: unknown
		}>
		gridTemplateRows: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			none: unknown
		}>
		height: ResolvedResult<
			SpacingConfig & {
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
			}
		>
		inset: ResolvedResult<
			SpacingConfig &
				SpacingConfig & {
					auto: unknown
					"1/2": unknown
					"1/3": unknown
					"2/3": unknown
					"1/4": unknown
					"2/4": unknown
					"3/4": unknown
					full: unknown
				}
		>
		keyframes: ResolvedResult<
			{
				spin: CSSProperties
				ping: CSSProperties
				pulse: CSSProperties
				bounce: CSSProperties
			},
			CSSProperties
		>
		letterSpacing: ResolvedResult<{
			tighter: unknown
			tight: unknown
			normal: unknown
			wide: unknown
			wider: unknown
			widest: unknown
		}>
		lineHeight: ResolvedResult<{
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			8: unknown
			9: unknown
			10: unknown
			none: unknown
			tight: unknown
			snug: unknown
			normal: unknown
			relaxed: unknown
			loose: unknown
		}>
		listStyleType: ResolvedResult<{
			none: unknown
			disc: unknown
			decimal: unknown
		}>
		margin: ResolvedResult<
			SpacingConfig &
				SpacingConfig & {
					auto: unknown
				}
		>
		maxHeight: ResolvedResult<
			SpacingConfig & {
				full: unknown
				screen: unknown
			}
		>
		maxWidth: ResolvedResult<{
			0: unknown
			none: unknown
			xs: unknown
			sm: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			"3xl": unknown
			"4xl": unknown
			"5xl": unknown
			"6xl": unknown
			"7xl": unknown
			full: unknown
			min: unknown
			max: unknown
			prose: unknown
			"screen-sm": unknown
			"screen-md": unknown
			"screen-lg": unknown
			"screen-xl": unknown
			"screen-2xl": unknown
		}>
		minHeight: ResolvedResult<{
			0: unknown
			full: unknown
			screen: unknown
		}>
		minWidth: ResolvedResult<{
			0: unknown
			full: unknown
			min: unknown
			max: unknown
		}>
		objectPosition: ResolvedResult<{
			bottom: unknown
			center: unknown
			left: unknown
			"left-bottom": unknown
			"left-top": unknown
			right: unknown
			"right-bottom": unknown
			"right-top": unknown
			top: unknown
		}>
		opacity: ResolvedResult<OpacityConfig>
		order: ResolvedResult<{
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			8: unknown
			9: unknown
			10: unknown
			11: unknown
			12: unknown
			first: unknown
			last: unknown
			none: unknown
		}>
		outlineOffset: ResolvedResult<{
			0: "0px"
			1: "1px"
			2: "2px"
			4: "4px"
			8: "8px"
		}>
		outlineWidth: ResolvedResult<{
			0: "0px"
			1: "1px"
			2: "2px"
			4: "4px"
			8: "8px"
		}>
		outlineColor: Palette
		padding: ResolvedResult<SpacingConfig>
		placeholderColor: Palette
		ringColor: Palette &
			ResolvedResult<{
				DEFAULT: unknown
			}>
		ringOffsetColor: Palette
		ringOffsetWidth: ResolvedResult<{
			0: unknown
			1: unknown
			2: unknown
			4: unknown
			8: unknown
		}>
		ringWidth: ResolvedResult<{
			0: unknown
			1: unknown
			2: unknown
			4: unknown
			8: unknown
			DEFAULT: unknown
		}>
		rotate: ResolvedResult<{
			0: unknown
			1: unknown
			2: unknown
			3: unknown
			6: unknown
			12: unknown
			45: unknown
			90: unknown
			180: unknown
		}>
		saturate: ResolvedResult<{
			0: unknown
			50: unknown
			100: unknown
			150: unknown
			200: unknown
		}>
		scale: ResolvedResult<{
			0: unknown
			50: unknown
			75: unknown
			90: unknown
			95: unknown
			100: unknown
			105: unknown
			110: unknown
			125: unknown
			150: unknown
		}>
		sepia: ResolvedResult<{
			0: unknown
			DEFAULT: unknown
		}>
		skew: ResolvedResult<{
			0: unknown
			1: unknown
			2: unknown
			3: unknown
			6: unknown
			12: unknown
		}>
		space: ResolvedResult<SpacingConfig>
		stroke: Palette &
			ResolvedResult<{
				current: unknown
			}>
		strokeWidth: ResolvedResult<{
			0: unknown
			1: unknown
			2: unknown
		}>
		textColor: Palette
		textDecorationColor: Palette
		textDecorationThickness: ResolvedResult<{
			auto: unknown
			"from-font": unknown
			0: unknown
			1: unknown
			2: unknown
			4: unknown
			8: unknown
		}>
		textUnderlineOffset: ResolvedResult<{
			auto: unknown
			0: unknown
			1: unknown
			2: unknown
			4: unknown
			8: unknown
		}>
		textIndent: ResolvedResult<SpacingConfig>
		transformOrigin: ResolvedResult<{
			center: unknown
			top: unknown
			"top-right": unknown
			right: unknown
			"bottom-right": unknown
			bottom: unknown
			"bottom-left": unknown
			left: unknown
			"top-left": unknown
		}>
		transitionDelay: ResolvedResult<{
			75: unknown
			100: unknown
			150: unknown
			200: unknown
			300: unknown
			500: unknown
			700: unknown
			1000: unknown
		}>
		transitionDuration: ResolvedResult<{
			75: unknown
			100: unknown
			150: unknown
			200: unknown
			300: unknown
			500: unknown
			700: unknown
			1000: unknown
		}>
		transitionProperty: ResolvedResult<{
			none: unknown
			all: unknown
			DEFAULT: unknown
			colors: unknown
			opacity: unknown
			shadow: unknown
			transform: unknown
		}>
		transitionTimingFunction: ResolvedResult<{
			linear: unknown
			in: unknown
			out: unknown
			"in-out": unknown
		}>
		translate: ResolvedResult<
			SpacingConfig & {
				"1/2": unknown
				"1/3": unknown
				"2/3": unknown
				"1/4": unknown
				"2/4": unknown
				"3/4": unknown
				full: unknown
			}
		>
		width: ResolvedResult<
			SpacingConfig & {
				auto: unknown
				"1/2": unknown
				"1/3": unknown
				"2/3": unknown
				"1/4": unknown
				"2/4": unknown
				"3/4": unknown
				"1/5": unknown
				"2/5": unknown
				"3/5": unknown
				"4/5": unknown
				"1/6": unknown
				"2/6": unknown
				"3/6": unknown
				"4/6": unknown
				"5/6": unknown
				"1/12": unknown
				"2/12": unknown
				"3/12": unknown
				"4/12": unknown
				"5/12": unknown
				"6/12": unknown
				"7/12": unknown
				"8/12": unknown
				"9/12": unknown
				"10/12": unknown
				"11/12": unknown
				full: unknown
				screen: unknown
				min: unknown
				max: unknown
			}
		>
		zIndex: ResolvedResult<{
			0: unknown
			10: unknown
			20: unknown
			30: unknown
			40: unknown
			50: unknown
			auto: unknown
		}>
		aspectRatio: ResolvedResult<{
			auto: unknown
			square: unknown
			video: unknown
		}>
		columns: ResolvedResult<{
			auto: unknown
			1: unknown
			2: unknown
			3: unknown
			4: unknown
			5: unknown
			6: unknown
			7: unknown
			8: unknown
			9: unknown
			10: unknown
			11: unknown
			12: unknown
			"3xs": unknown
			"2xs": unknown
			xs: unknown
			sm: unknown
			md: unknown
			lg: unknown
			xl: unknown
			"2xl": unknown
			"3xl": unknown
			"4xl": unknown
			"5xl": unknown
			"6xl": unknown
			"7xl": unknown
		}>
		scrollMargin: ResolvedResult<
			SpacingConfig & {
				auto: unknown
			}
		>
		scrollPadding: ResolvedResult<SpacingConfig>
		willChange: ResolvedResult<{
			auto: unknown
			scroll: unknown
			contents: unknown
			transform: unknown
		}>
	}
}
