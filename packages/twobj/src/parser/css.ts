import { findRightBracket, matchValue, splitAtTopLevelOnly } from "./util"

export type Param = ParamObject | string

export interface ParamObject {
	fn: string
	params: Param[]
	range: [number, number]
	getText(): string
}

export function isParamObject(param: Param | null | undefined): param is ParamObject {
	if (param == null) {
		return false
	}
	return typeof param !== "string"
}

export function parseColor(css: string) {
	let color = parseHex(css)
	if (color) {
		return color
	}
	color = parseColorKeyword(css)
	if (color) {
		return color
	}
	return parseColorFunc(css)
}

function parseColorFunc(cssValue: string): ParamObject | undefined {
	const params = splitCssParams(cssValue)
	if (params.length !== 1) {
		return undefined
	}
	const param = params[0]
	if (typeof param === "string") {
		return undefined
	}
	return param
}

const opacityFunc = new Set(["rgb", "rgba", "hsl", "hsla", "hwb", "lch", "lab"])
export function isOpacityFunction(fnName: string) {
	return opacityFunc.has(fnName)
}

const hexRegexp = /(?:^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$)|(?:^#([A-Fa-f0-9]{3})([A-Fa-f0-9])?$)/
function parseHex(css: string): ParamObject | undefined {
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
		const color: ParamObject = {
			fn: "rgb",
			params: [r.toString(), g.toString(), b.toString()],
			range: [match.index, match.index + text.length],
			getText() {
				return css.slice(this.range[0], this.range[1])
			},
		}
		if (a) {
			color.params.push((parseInt(a) / 255).toString())
		}
		return color
	}

	if (RGB) {
		const value = parseInt(RGB.slice(0, 1).repeat(2) + RGB.slice(1, 2).repeat(2) + RGB.slice(2, 3).repeat(2), 16)
		const r = (value >> 16) & 0xff
		const g = (value >> 8) & 0xff
		const b = value & 0xff
		const color: ParamObject = {
			fn: "rgb",
			params: [r.toString(), g.toString(), b.toString()],
			range: [match.index, match.index + text.length],
			getText() {
				return css.slice(this.range[0], this.range[1])
			},
		}
		if (A) {
			color.params.push((parseInt(A + A) / 255).toString())
		}
		return color
	}
	return undefined
}

function parseColorKeyword(value: string): ParamObject | undefined {
	const hex = colors[value]
	if (!hex) return undefined
	const param = parseHex(hex)
	if (param) {
		param.range = [0, value.length]
	}
	return param
}

export function unwrapCssFunction(value: string): { fn: string; params: string } | undefined {
	const regexp = /(?:([\w-]+)\()/g
	const match = regexp.exec(value)
	if (!match) {
		return undefined
	}

	const [, fn] = match
	if (!fn) {
		return undefined
	}

	const rb = findRightBracket({ text: value, start: regexp.lastIndex - 1, comments: fn !== "url" })
	if (rb == undefined) {
		return { fn, params: value.slice(regexp.lastIndex) }
	}
	return { fn, params: value.slice(regexp.lastIndex, rb) }
}

export function splitCssParams(source: string, [start = 0, end = source.length] = []): Param[] {
	const result: Param[] = []
	const regexp = /(?:([\w-]+)\()|([^\s,]+)/g
	regexp.lastIndex = start
	source = source.slice(0, end)

	for (let match = regexp.exec(source); match != null; match = regexp.exec(source)) {
		const [, fn, word] = match
		if (fn) {
			const rb = findRightBracket({ text: source, start: regexp.lastIndex - 1, comments: fn !== "url" })
			if (rb == undefined) {
				const params = splitCssParams(source, [regexp.lastIndex])
				if (isOpacityFunction(fn) && params[3] === "/") {
					params.splice(3, 1)
				}
				result.push({
					fn,
					params,
					range: [match.index, end],
					getText() {
						return source.slice(this.range[0], this.range[1])
					},
				} as ParamObject)
				return result
			}
			const params = splitCssParams(source, [regexp.lastIndex, rb])
			if (isOpacityFunction(fn) && params[3] === "/") {
				params.splice(3, 1)
			}
			result.push({
				fn,
				params,
				range: [match.index, rb + 1],
				getText() {
					return source.slice(this.range[0], this.range[1])
				},
			} as ParamObject)
			regexp.lastIndex = rb + 1
		} else if (word) {
			result.push(word)
		}
	}
	return result
}

const colors: Record<string, string> = {
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

export function parseAnimations(value: string): string[] {
	return splitAtTopLevelOnly(value).map(v => {
		let timingFunction: Param | undefined
		let duration: Param | undefined
		let direction: Param | undefined
		let playState: Param | undefined
		let fillMode: Param | undefined
		let iteration: Param | undefined
		let delay: Param | undefined
		let name = ""

		for (const param of splitCssParams(v.value)) {
			if (!timingFunction && isTimingFunction(param)) {
				timingFunction = param
			} else if (!duration && isTime(param)) {
				duration = param
			} else if (!delay && isTime(param)) {
				delay = param
			} else if (!direction && isDirection(param)) {
				direction = param
			} else if (!playState && isPlayState(param)) {
				playState = param
			} else if (!fillMode && isFillMode(param)) {
				fillMode = param
			} else if (!iteration && isIteration(param)) {
				iteration = param
			} else if (!name && typeof param === "string") {
				name = param
			}
		}

		return name
	})

	function isDirection(value: Param) {
		switch (value) {
			case "normal":
			case "reverse":
			case "alternate":
			case "alternate-reverse":
				return true
			default:
				return false
		}
	}

	function isPlayState(value: Param) {
		switch (value) {
			case "paused":
			case "running":
				return true
			default:
				return false
		}
	}

	function isFillMode(value: Param) {
		switch (value) {
			case "none":
			case "forwards":
			case "backwards":
			case "both":
				return true
			default:
				return false
		}
	}
	function isIteration(value: Param) {
		if (typeof value !== "string") {
			return false
		}

		if (value === "infinite") {
			return true
		}
		const match = matchValue(value)
		if (match == null) {
			return false
		}

		const { num, unit } = match
		return Number(num) >= 0 && !unit
	}

	function isTime(value: Param) {
		if (typeof value !== "string") {
			return false
		}

		const match = matchValue(value)
		if (match == null) {
			return false
		}
		const { unit } = match
		return unit && /^m?s$/i.test(unit)
	}

	function isTimingFunction(value: Param) {
		switch (value) {
			case "linear":
			case "ease":
			case "ease-in":
			case "ease-out":
			case "ease-in-out":
			case "step-start":
			case "step-end":
				return true
		}

		if (typeof value === "string") {
			return false
		}

		switch (value.fn) {
			case "cubic-bezier":
			case "steps":
				return true
			default:
				return false
		}
	}
}

export function reverseSign(value: string): string | undefined {
	const match = matchValue(value)
	if (match == null) {
		return parseNumberFunction(value, true)
	}

	const { num, unit } = match

	if (num.startsWith("-")) {
		return num.slice(1) + (unit ?? "")
	}

	if (num.startsWith("+")) {
		return "-" + num.slice(1) + (unit ?? "")
	}

	return "-" + num + (unit ?? "")
}

const numberFn = ["var", "min", "max", "clamp", "calc"]

export function parseNumberFunction(value: string, negative?: boolean): string | undefined {
	const params = splitCssParams(value)
	if (params.length !== 1) {
		return undefined
	}
	if (typeof params[0] === "string") {
		return undefined
	}

	const { fn } = params[0]
	if (!numberFn.includes(fn)) {
		return undefined
	}

	if (negative) {
		return `calc(${value} * -1)`
	}

	return value
}

export function getUnitFromNumberFunction(value: string): string | null | undefined {
	const ret = splitCssParams(value)
	if (ret.length !== 1) return undefined
	if (typeof ret[0] === "string") return undefined

	const { fn, params } = ret[0]
	if (["var", "min", "max", "clamp", "calc"].some(v => v === fn)) {
		return parseNumberFn(params)
	}

	return null

	function parseNumberFn(values: Param[]): string | null {
		let ans: string | null = null
		for (const val of values) {
			if (typeof val === "string") {
				const result = matchValue(val)
				if (result?.unit) {
					ans = result.unit
					if (ans !== "%") {
						return ans
					}
				}
			} else {
				for (const v of val.params) {
					const unit = parseNumberFn([v])
					if (unit) return unit
				}
			}
		}
		return ans
	}
}
