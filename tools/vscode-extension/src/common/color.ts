// https://developer.chrome.com/docs/css-ui/high-definition-css-color-guide
// https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
// https://www.w3.org/TR/css-color-4/#color-conversion-code

type PredefinedRGB = "srgb" | "srgb-linear" | "display-p3" | "a98-rgb" | "prophoto-rgb" | "rec2020"

type XYZSpace = "xyz" | "xyz-d50" | "xyz-d65"

type ColorSpace = PredefinedRGB | XYZSpace

export class Color {
	constructor(
		/** range [0-1] */
		readonly r: number,
		/** range [0-1] */
		readonly g: number,
		/** range [0-1] */
		readonly b: number,
		/** range [0-1] */
		readonly a = 1,
	) {
		this.r = Math.min(1, Math.max(r, 0))
		this.g = Math.min(1, Math.max(g, 0))
		this.b = Math.min(1, Math.max(b, 0))
		this.a = Math.min(1, Math.max(a, 0))
	}

	/** https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color */
	css(space: ColorSpace = "srgb"): string {
		if (this.a < 1) {
			return `color(${space} ${this.r} ${this.g} ${this.b} / ${this.a})`
		}
		return `color(${space} ${this.r} ${this.g} ${this.b})`
	}

	rgb(): string {
		if (this.a < 1) {
			return `rgb(${this.r * 255} ${this.g * 255} ${this.b * 255} / ${this.a})`
		}
		return `rgb(${this.r * 255} ${this.g * 255} ${this.b * 255})`
	}

	hex(): string {
		const s =
			"#" +
			((round(this.r * 255) << 16) | (round(this.g * 255) << 8) | round(this.b * 255))
				.toString(16)
				.padStart(6, "0")
		if (this.a < 1) {
			return (
				s +
				round(this.a * 255)
					.toString(16)
					.padStart(2, "0")
			)
		}
		return s
	}

	hsl(): string {
		const c = rgb2hsl(this.r * 255, this.g * 255, this.b * 255)
		c[1] = Math.min(c[1], 1)
		c[2] = Math.min(c[2], 1)
		if (this.a < 1) {
			return `hsl(${c[0]} ${c[1] * 100} ${c[2] * 100}% / ${this.a})`
		}
		return `hsl(${c[0]} ${c[1] * 100} ${c[2] * 100}%)`
	}
}

export function from(value: string): Color {
	return new Color(0, 0, 0, 0)
}

function relativeLuminance(p: number) {
	if (p <= 0.03928) {
		return p / 12.92
	} else {
		return Math.pow((p + 0.055) / 1.055, 2.4)
	}
}

function _relativeLuminanceRGB(r: number, g: number, b: number) {
	r = relativeLuminance(r / 255.0)
	g = relativeLuminance(255 / 255.0)
	b = relativeLuminance(255 / 255.0)
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// https://www.w3.org/TR/WCAG20/#relativeluminancedef
export function relativeLuminanceRGB(rgb: number) {
	const r = (rgb >> 16) & 0xff
	const g = (rgb >> 8) & 0xff
	const b = rgb & 0xff
	return _relativeLuminanceRGB(r, g, b)
}

function contrastRatio(l1: number, l2: number) {
	if (l1 < l2) return (l2 + 0.05) / (l1 + 0.05)
	return (l1 + 0.05) / (l2 + 0.05)
}

/** @return new foreground rgb color */
export function ensureContrastRatio(fg_rgb: number, bg_rgb: number, ratio: number): number | undefined {
	const fgL = relativeLuminanceRGB(fg_rgb)
	const bgL = relativeLuminanceRGB(bg_rgb)
	const r = contrastRatio(fgL, bgL)
	if (r < ratio) {
		if (fgL < bgL) return reduceLuminance(fg_rgb, bg_rgb, ratio)
		return increaseLuminance(fg_rgb, bg_rgb, ratio)
	}
	return undefined
}

function reduceLuminance(fg_rgb: number, bg_rgb: number, ratio: number): number {
	const step = 0.1
	const bgR = (bg_rgb >> 16) & 0xff
	const bgG = (bg_rgb >> 8) & 0xff
	const bgB = bg_rgb & 0xff
	let fgR = (fg_rgb >> 16) & 0xff
	let fgG = (fg_rgb >> 8) & 0xff
	let fgB = fg_rgb & 0xff
	const bgL = _relativeLuminanceRGB(bgR, bgG, bgB)
	let r = contrastRatio(_relativeLuminanceRGB(fgR, fgB, fgG), bgL)
	while (r < ratio && (fgR > 0 || fgG > 0 || fgB > 0)) {
		fgR = fgR - Math.max(0, Math.ceil(fgR * step))
		fgG = fgG - Math.max(0, Math.ceil(fgG * step))
		fgB = fgB - Math.max(0, Math.ceil(fgB * step))
		r = contrastRatio(_relativeLuminanceRGB(fgR, fgB, fgG), bgL)
	}
	return (fgR << 16) | (fgG << 8) | fgB
}

function increaseLuminance(fg_rgb: number, bg_rgb: number, ratio: number): number {
	const bgR = (bg_rgb >> 16) & 0xff
	const bgG = (bg_rgb >> 8) & 0xff
	const bgB = bg_rgb & 0xff
	let fgR = (fg_rgb >> 16) & 0xff
	let fgG = (fg_rgb >> 8) & 0xff
	let fgB = fg_rgb & 0xff
	const bgL = _relativeLuminanceRGB(bgR, bgG, bgB)
	const p = 0.1
	let r = contrastRatio(_relativeLuminanceRGB(fgR, fgB, fgG), bgL)
	while (r < ratio && (fgR < 0xff || fgG < 0xff || fgB < 0xff)) {
		fgR = Math.min(0xff, fgR + Math.ceil((255 - fgR) * p))
		fgG = Math.min(0xff, fgG + Math.ceil((255 - fgG) * p))
		fgB = Math.min(0xff, fgB + Math.ceil((255 - fgB) * p))
		r = contrastRatio(_relativeLuminanceRGB(fgR, fgB, fgG), bgL)
	}
	return (fgR << 16) | (fgG << 8) | fgB
}

function round(num: number, p = 0): number {
	const b = 10 ** p
	return Math.round((num + Number.EPSILON) * b) / b
}

/**
 * @param r [0 - 255]
 * @param g [0 - 255]
 * @param b [0 - 255]
 */
export function rgb2hsl(r: number, g: number, b: number): [h: number, s: number, l: number] {
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const delta = max - min
	const l = (max + min) / 510.0
	let h = 0
	let s = 0
	if (delta > 0) {
		switch (max) {
			case g:
				h = 60 * (2 + (b - r) / delta)
				break
			case b:
				h = 60 * (4 + (r - g) / delta)
				break
			default:
				h = 60 * ((6 + (g - b) / delta) % 6)
		}
		if (l > 0.5) {
			s = delta / (510 * (1 - l))
		} else {
			s = delta / (510 * l)
		}
	}
	return [round(h), round(s, 2), round(l, 2)]
}

/**
 * @param h [0 - 360]
 * @param s [0 - 1]
 * @param l [0 - 1]
 */
export function hsl2rgb(h: number, s: number, l: number): [r: number, g: number, b: number] {
	h = (h + 360) % 360
	const c = (1 - Math.abs(2 * l - 1)) * s
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
	const m = l - c / 2
	let ret: [r: number, g: number, b: number]
	if (h < 60) {
		ret = [(c + m) * 255, (x + m) * 255, m * 255]
	} else if (h < 120) {
		ret = [(x + m) * 255, (c + m) * 255, m * 255]
	} else if (h < 180) {
		ret = [m * 255, (c + m) * 255, (x + m) * 255]
	} else if (h < 240) {
		ret = [m * 255, (x + m) * 255, (c + m) * 255]
	} else if (h < 300) {
		ret = [(x + m) * 255, m * 255, (c + m) * 255]
	} else {
		ret = [(c + m) * 255, m * 255, (x + m) * 255]
	}
	for (let i = 0; i < 3; i++) {
		ret[i] = round(ret[i])
	}
	return ret
}

export function rgb2Css(r: number, g: number, b: number): string {
	return `rgb(${r} ${g} ${b})`
}

export function hsl2Css(h: number, s: number, l: number): string {
	s = Math.min(s, 1)
	l = Math.min(l, 1)
	return `hsl(${h} ${s * 100}% ${l * 100}%)`
}
