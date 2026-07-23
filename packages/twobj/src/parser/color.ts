import { ParamFunction, isParamObject, splitCssParams, type ParamColor } from "./css"

// https://developer.mozilla.org/en-US/docs/Web/CSS/color_value

const namedColors: Record<string, string> = {
	aliceblue: "#f0f8ff",
	antiquewhite: "#faebd7",
	aqua: "#00ffff",
	aquamarine: "#7fffd4",
	azure: "#f0ffff",
	beige: "#f5f5dc",
	bisque: "#ffe4c4",
	black: "#000000",
	blanchedalmond: "#ffebcd",
	blue: "#0000ff",
	blueviolet: "#8a2be2",
	brown: "#a52a2a",
	burlywood: "#deb887",
	cadetblue: "#5f9ea0",
	chartreuse: "#7fff00",
	chocolate: "#d2691e",
	coral: "#ff7f50",
	cornflowerblue: "#6495ed",
	cornsilk: "#fff8dc",
	crimson: "#dc143c",
	cyan: "#00ffff",
	darkblue: "#00008b",
	darkcyan: "#008b8b",
	darkgoldenrod: "#b8860b",
	darkgray: "#a9a9a9",
	darkgrey: "#a9a9a9",
	darkgreen: "#006400",
	darkkhaki: "#bdb76b",
	darkmagenta: "#8b008b",
	darkolivegreen: "#556b2f",
	darkorange: "#ff8c00",
	darkorchid: "#9932cc",
	darkred: "#8b0000",
	darksalmon: "#e9967a",
	darkseagreen: "#8fbc8f",
	darkslateblue: "#483d8b",
	darkslategray: "#2f4f4f",
	darkslategrey: "#2f4f4f",
	darkturquoise: "#00ced1",
	darkviolet: "#9400d3",
	deeppink: "#ff1493",
	deepskyblue: "#00bfff",
	dimgray: "#696969",
	dimgrey: "#696969",
	dodgerblue: "#1e90ff",
	firebrick: "#b22222",
	floralwhite: "#fffaf0",
	forestgreen: "#228b22",
	fuchsia: "#ff00ff",
	gainsboro: "#dcdcdc",
	ghostwhite: "#f8f8ff",
	gold: "#ffd700",
	goldenrod: "#daa520",
	gray: "#808080",
	grey: "#808080",
	green: "#008000",
	greenyellow: "#adff2f",
	honeydew: "#f0fff0",
	hotpink: "#ff69b4",
	indianred: "#cd5c5c",
	indigo: "#4b0082",
	ivory: "#fffff0",
	khaki: "#f0e68c",
	lavender: "#e6e6fa",
	lavenderblush: "#fff0f5",
	lawngreen: "#7cfc00",
	lemonchiffon: "#fffacd",
	lightblue: "#add8e6",
	lightcoral: "#f08080",
	lightcyan: "#e0ffff",
	lightgoldenrodyellow: "#fafad2",
	lightgray: "#d3d3d3",
	lightgrey: "#d3d3d3",
	lightgreen: "#90ee90",
	lightpink: "#ffb6c1",
	lightsalmon: "#ffa07a",
	lightseagreen: "#20b2aa",
	lightskyblue: "#87cefa",
	lightslategray: "#778899",
	lightslategrey: "#778899",
	lightsteelblue: "#b0c4de",
	lightyellow: "#ffffe0",
	lime: "#00ff00",
	limegreen: "#32cd32",
	linen: "#faf0e6",
	magenta: "#ff00ff",
	maroon: "#800000",
	mediumaquamarine: "#66cdaa",
	mediumblue: "#0000cd",
	mediumorchid: "#ba55d3",
	mediumpurple: "#9370d8",
	mediumseagreen: "#3cb371",
	mediumslateblue: "#7b68ee",
	mediumspringgreen: "#00fa9a",
	mediumturquoise: "#48d1cc",
	mediumvioletred: "#c71585",
	midnightblue: "#191970",
	mintcream: "#f5fffa",
	mistyrose: "#ffe4e1",
	moccasin: "#ffe4b5",
	navajowhite: "#ffdead",
	navy: "#000080",
	oldlace: "#fdf5e6",
	olive: "#808000",
	olivedrab: "#6b8e23",
	orange: "#ffa500",
	orangered: "#ff4500",
	orchid: "#da70d6",
	palegoldenrod: "#eee8aa",
	palegreen: "#98fb98",
	paleturquoise: "#afeeee",
	palevioletred: "#d87093",
	papayawhip: "#ffefd5",
	peachpuff: "#ffdab9",
	peru: "#cd853f",
	pink: "#ffc0cb",
	plum: "#dda0dd",
	powderblue: "#b0e0e6",
	purple: "#800080",
	red: "#ff0000",
	rebeccapurple: "#663399",
	rosybrown: "#bc8f8f",
	royalblue: "#4169e1",
	saddlebrown: "#8b4513",
	salmon: "#fa8072",
	sandybrown: "#f4a460",
	seagreen: "#2e8b57",
	seashell: "#fff5ee",
	sienna: "#a0522d",
	silver: "#c0c0c0",
	skyblue: "#87ceeb",
	slateblue: "#6a5acd",
	slategray: "#708090",
	slategrey: "#708090",
	snow: "#fffafa",
	springgreen: "#00ff7f",
	steelblue: "#4682b4",
	tan: "#d2b48c",
	teal: "#008080",
	thistle: "#d8bfd8",
	tomato: "#ff6347",
	turquoise: "#40e0d0",
	violet: "#ee82ee",
	wheat: "#f5deb3",
	white: "#ffffff",
	whitesmoke: "#f5f5f5",
	yellow: "#ffff00",
	yellowgreen: "#9acd32",
}

export type PredefinedRGB = "srgb" | "srgb-linear" | "display-p3" | "a98-rgb" | "prophoto-rgb" | "rec2020"
export type XYZSpace = "xyz" | "xyz-d50" | "xyz-d65"
export type HDRColorSpace = PredefinedRGB | XYZSpace | "oklch" | "oklab" | "lch" | "lab" | "hwb"

export class Color {
	readonly channels: readonly number[]
	readonly alpha: number
	readonly colorSpace: HDRColorSpace

	constructor(
		channels: readonly number[],
		alpha = 1,
		colorSpace: HDRColorSpace = "srgb",
	) {
		if (colorSpace === "srgb") {
			this.channels = channels.map(c => Math.min(1, Math.max(c, 0)))
			this.alpha = Math.min(1, Math.max(alpha, 0))
		} else {
			this.channels = channels
			this.alpha = alpha
		}
		this.colorSpace = colorSpace
	}

	get r(): number {
		return this.channels[0] ?? 0
	}
	get g(): number {
		return this.channels[1] ?? 0
	}
	get b(): number {
		return this.channels[2] ?? 0
	}
	get a(): number {
		return this.alpha
	}

	static rgb(r: number, g: number, b: number, a = 1): Color {
		return new Color(
			[Math.min(1, Math.max(r, 0)), Math.min(1, Math.max(g, 0)), Math.min(1, Math.max(b, 0))],
			Math.min(1, Math.max(a, 0)),
			"srgb",
		)
	}

	static oklch(l: number, c: number, h: number, a = 1): Color {
		return new Color([l, c, h], a, "oklch")
	}

	static oklab(l: number, a: number, b: number, alpha = 1): Color {
		return new Color([l, a, b], alpha, "oklab")
	}

	/** https://developer.mozilla.org/en-US/docs/Web/CSS/color_value */
	css(): string {
		switch (this.colorSpace) {
			case "oklch":
			case "oklab":
			case "lch":
			case "lab":
			case "hwb": {
				const ch = this.channels.join(" ")
				if (this.alpha < 1) {
					return `${this.colorSpace}(${ch} / ${this.alpha})`
				}
				return `${this.colorSpace}(${ch})`
			}
			default: {
				const ch = this.channels.join(" ")
				if (this.alpha < 1) {
					return `color(${this.colorSpace} ${ch} / ${this.alpha})`
				}
				return `color(${this.colorSpace} ${ch})`
			}
		}
	}
}

export type ColorFunction = "rgb" | "rgba" | "hsl" | "hsla" | "hwb" | "lch" | "lab" | "oklab" | "oklch" | "color"

const colorFunctions = new Set(["rgb", "rgba", "hsl", "hsla", "hwb", "lch", "lab", "oklab", "oklch", "color"])

const hdrColorFunctions = new Set(["oklch", "oklab", "lch", "lab", "hwb", "color"])

export function isHDRColorFunction(fn: string): boolean {
	return hdrColorFunctions.has(fn.toLowerCase())
}

const srgbColorFunctions = new Set(["rgb", "rgba", "hsl", "hsla"])

function isSRGBColorFunction(fn: string): boolean {
	return srgbColorFunctions.has(fn.toLowerCase())
}

/** Tailwind v4 style: apply opacity via color-mix() */
export function colorMix(color: string, opacity: string): string {
	let num = parseFloat(opacity)
	if (Number.isNaN(num)) return color
	if (opacity.includes("%")) {
		num /= 100
	}
	const pct = Math.round(Math.min(1, Math.max(0, num)) * 100)
	const trimmed = color.trim()
	const isSRGB = /^#/.test(trimmed) || isSRGBColorFunction(trimmed.split("(")[0])
	const space = isSRGB ? "srgb" : "oklab"
	return `color-mix(in ${space}, ${trimmed} ${pct}%, transparent)`
}

export function isColorFunction(fn: string) {
	return colorFunctions.has(fn.toLowerCase())
}

export function isColorKeyword(value: string) {
	return value === "transparent" || value === "currentColor" || value === "none"
}

export function parseColor(css: string) {
	let color = parseHexColor(css)
	if (color) {
		return color
	}
	color = parseNamedColor(css)
	if (color) {
		return color
	}
	return parseColorFunction(css)
}

export function parseColorFunction(s: string): ParamColor | ParamFunction | undefined {
	const params = splitCssParams(s)
	if (params.length !== 1) {
		return undefined
	}
	const param = params[0]
	if (typeof param === "string") {
		return undefined
	}

	if (!isColorFunction(param.fn)) {
		return param.fn !== "var" ? param : undefined
	}

	const p = param as ParamColor
	p.kind = "color"
	const ok = normalizeParamColor(p)
	p.normalized = ok
	return p
}

export function normalizeParamColor(p: ParamColor): boolean {
	if (p.fn === "color") {
		if (p.params.length < 4 || p.params.length > 6) {
			return false
		}
	} else if (p.fn === "var") {
		return true
	} else {
		if (p.params.length < 3 || p.params.length > 5) {
			return false
		}
	}

	const last = p.params[p.params.length - 1]
	const before = p.params[p.params.length - 2]

	if (typeof last !== "string" || typeof before !== "string") {
		return false
	}

	// ex: / 0.5
	if (before === "/") {
		p.opacity = last
		p.params = p.params.slice(0, p.params.length - 2)
		return p.params.length >= 3
	}

	// ex: 3 /0.5
	if (last[0] === "/") {
		p.opacity = last.slice(1)
		p.params = p.params.slice(0, p.params.length - 1)
		return p.params.length >= 3
	}

	// ex: 3/ 0.5
	if (before[before.length - 1] === "/") {
		p.opacity = last
		p.params[p.params.length - 2] = before.slice(0, -1)
		p.params = p.params.slice(0, p.params.length - 1)
		return p.params.length >= 3
	}

	// ex: 2 3/0.5
	const i = last.indexOf("/")
	if (i !== -1) {
		p.opacity = last.slice(i + 1)
		p.params[p.params.length - 1] = last.slice(0, i)
		return p.params.length >= 3
	}

	if (p.fn !== "color") {
		// support legacy syntax
		const slash = p.params.some(v => {
			if (isParamObject(v)) {
				return v.getText().indexOf("/") !== -1
			}
			return v.indexOf("/") !== -1
		})
		if (slash) {
			return false
		}
		if (p.params.length > 3) {
			const v = p.params[3]
			p.opacity = isParamObject(v) ? v.getText() : v
			p.params = p.params.slice(0, 3)
		}
	}

	return p.params.length >= 3
}

const hexRegexp = /(?:^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$)|(?:^#([A-Fa-f0-9]{3})([A-Fa-f0-9])?$)/

export function parseHexColor(css: string): ParamColor | undefined {
	const match = hexRegexp.exec(css)
	if (!match) {
		return undefined
	}
	const [text, rgb, a, RGB, A] = match
	if (rgb) {
		const value = parseInt(rgb, 16)
		const r = (value >> 16) & 0xff
		const g = (value >> 8) & 0xff
		const b = value & 0xff
		const color: ParamColor = {
			kind: "color",
			fn: "rgb",
			hex: true,
			params: [r.toString(), g.toString(), b.toString()],
			range: [match.index, match.index + text.length],
			getText() {
				return css.slice(this.range[0], this.range[1])
			},
		}
		if (a) {
			color.opacity = String(parseInt(a, 16) / 255)
		}
		return color
	}

	if (RGB) {
		const value = parseInt(RGB.slice(0, 1).repeat(2) + RGB.slice(1, 2).repeat(2) + RGB.slice(2, 3).repeat(2), 16)
		const r = (value >> 16) & 0xff
		const g = (value >> 8) & 0xff
		const b = value & 0xff
		const color: ParamColor = {
			kind: "color",
			fn: "rgb",
			hex: true,
			params: [r.toString(), g.toString(), b.toString()],
			range: [match.index, match.index + text.length],
			getText() {
				return css.slice(this.range[0], this.range[1])
			},
		}
		if (A) {
			color.opacity = String(parseInt(A + A, 16) / 255)
		}
		return color
	}
	return undefined
}

export function parseNamedColor(value: string): ParamColor | undefined {
	const hex = namedColors[value]
	if (!hex) return undefined
	const param = parseHexColor(hex)
	if (param) {
		param.range = [0, value.length]
	}
	return param
}
