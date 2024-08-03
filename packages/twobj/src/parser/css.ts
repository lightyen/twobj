import { isColorFunction, normalizeParamColor } from "./color"
import { findRightBracket, isCharSpace, matchValue, splitAtTopLevelOnly } from "./util"

export interface ParamFunction {
	range: [number, number]
	getText(): string
	kind: "function"
	fn: string
	params: Param[]
}

export interface ParamColor {
	range: [number, number]
	getText(): string
	kind: "color"
	fn: string
	params: Param[]
	opacity?: string
	normalized?: boolean
}

export type Param = string | ParamFunction | ParamColor

export type ParamObject = ParamFunction | ParamColor

export function isParamObject(param: Param | null | undefined): param is ParamObject {
	if (param == null) {
		return false
	}
	return typeof param !== "string"
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

export function splitCssParams(s: string, [start = 0, end = s.length] = []): Param[] {
	const regexp = /(?:\s*([\w-]+)\()|(\s*,?\s*([^\s,]+))/g

	const tokens: Param[] = []

	s = s.slice(0, end)
	regexp.lastIndex = start

	let comma = false
	for (let match = regexp.exec(s); match != null; match = regexp.exec(s)) {
		const [, fn, w, token] = match
		if (fn) {
			while (isCharSpace(s.charCodeAt(match.index))) {
				match.index++
			}
			let p: ParamColor | ParamFunction | undefined
			const rb = findRightBracket({ text: s, start: regexp.lastIndex - 1, comments: fn !== "url" })
			if (rb == undefined) {
				const params = splitCssParams(s, [regexp.lastIndex, end])
				if (isColorFunction(fn)) {
					const v: ParamColor = {
						kind: "color",
						range: [match.index, end],
						getText() {
							return s.slice(this.range[0], this.range[1])
						},
						fn,
						params,
					}
					const ok = normalizeParamColor(v)
					if (ok) {
						p = v
					}
				}

				if (p == undefined) {
					p = {
						kind: "function",
						range: [match.index, end],
						getText() {
							return s.slice(this.range[0], this.range[1])
						},
						fn,
						params,
					}
				}

				tokens.push(p)

				return tokens
			}

			const params = splitCssParams(s, [regexp.lastIndex, rb])
			if (isColorFunction(fn)) {
				const v: ParamColor = {
					kind: "color",
					range: [match.index, rb + 1],
					getText() {
						return s.slice(this.range[0], this.range[1])
					},
					fn,
					params,
				}
				const ok = normalizeParamColor(v)
				if (ok) {
					p = v
				}
			}

			if (p == undefined) {
				p = {
					kind: "function",
					range: [match.index, rb + 1],
					getText() {
						return s.slice(this.range[0], this.range[1])
					},
					fn,
					params,
				}
			}

			tokens.push(p)

			regexp.lastIndex = rb + 1
		} else if (token) {
			const mm = w.indexOf(",") !== -1
			if (!comma || mm) {
				tokens.push(token)
			} else {
				// syntax error
			}

			comma = comma || mm
		}
	}

	return tokens
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
