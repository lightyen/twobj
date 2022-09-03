import * as parser from "./parser"
import type { CSSProperties, CSSValue, Template, ValueType } from "./types"
import { opacityToFloat, toArray } from "./util"

interface LookupResult {
	key?: string
	opacity?: string
	valueTag?: string
	value?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ValueTypeSpec<ConfigValue = any> {
	type: ValueType
	isTag(tag?: string): boolean
	handleValue(
		value: string,
		options?: {
			negative?: boolean
			unambiguous?: boolean
			opacity?: string
		},
	): string | number | undefined
	handleConfig(
		config: ConfigValue,
		options: {
			negative: boolean
			opacity?: string
		},
	): unknown
}

function lookupValues(
	input: string,
	node: parser.Classname | parser.ArbitraryClassname,
	values: Record<string, unknown>,
	config: Tailwind.ResolvedConfigJS,
	filterDefault?: boolean,
): LookupResult | undefined {
	const result: { key?: string; value?: string; valueTag?: string; opacity?: string } = {}
	if (node.type === parser.NodeType.ArbitraryClassname) {
		if (node.expr) {
			result.value = node.expr.value
			const tagRegexp = /^\s*([a-zA-Z][a-zA-Z-]+)\s*:/g
			const match = tagRegexp.exec(node.expr.value)
			if (match) {
				const [, tag] = match
				result.valueTag = tag
				result.value = node.expr.value.slice(tagRegexp.lastIndex)
			}
			result.value = parser.renderThemeFunc(config, result.value)
		} else {
			result.key = input
		}
		if (node.e) {
			if (node.e.type === parser.NodeType.WithOpacity) {
				result.opacity = node.e.opacity.value
			} else if (node.e.type === parser.NodeType.EndOpacity) {
				const opacity = opacityToFloat(node.e.value)
				if (!Number.isNaN(opacity)) {
					result.opacity = opacity.toString()
				}
			}
		}
		return result
	}

	if (node.type === parser.NodeType.ClassName) {
		const exists = Object.prototype.hasOwnProperty.call(values, input)

		const existsDefault = Object.prototype.hasOwnProperty.call(values, "DEFAULT")
		if (exists) {
			result.key = input
		} else if (existsDefault && input === "") {
			if (filterDefault) {
				return
			}
			result.key = "DEFAULT"
		} else {
			const i = input.lastIndexOf("/")
			if (i === -1) {
				return undefined
			}
			const opacity = opacityToFloat(input.slice(i + 1))
			if (!Number.isNaN(opacity)) {
				result.opacity = opacity.toString()
			}
			result.key = input.slice(0, i)
		}
	}

	return result
}

export function representAny({
	input,
	node,
	getText,
	values,
	negative,
	template,
	ambiguous,
	config,
	filterDefault,
}: {
	input: string
	node: parser.Classname | parser.ArbitraryClassname
	getText: (node: parser.BaseNode) => string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	values: Record<string, any>
	negative: boolean
	template: Template
	ambiguous: boolean
	config: Tailwind.ResolvedConfigJS
	filterDefault: boolean
}) {
	const result = lookupValues(input, node, values, config, filterDefault)
	if (!result) {
		return undefined
	}

	// lookup value
	if (result.key != undefined) {
		const exists = Object.prototype.hasOwnProperty.call(values, result.key)
		if (!exists) {
			return undefined
		}

		let value = values[result.key] ?? ""
		if (typeof value !== "string" && typeof value !== "number") {
			return undefined
		}

		value = value.toString().trim()

		if (negative) {
			const val = parser.reverseSign(value)
			if (val != undefined) {
				value = val
			}
		}
		return template(value)
	}

	// arbitrary value
	if (result.value != undefined) {
		let value = result.value.trim()

		if (!ambiguous) {
			if (negative) {
				const val = parser.reverseSign(value)
				if (val != undefined) {
					value = val
				}
			}

			return template(value)
		}

		if (result.valueTag === "any") {
			if (negative) {
				const val = parser.reverseSign(value)
				if (val != undefined) {
					value = val
				}
			}

			return template(value)
		}
	}

	return undefined
}

const number: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "number",
		isTag(tag) {
			return tag === "number"
		},
		handleConfig(config, { negative = false }) {
			config = config ?? ""
			if (typeof config === "string") {
				config = config.trim()
			}

			if (negative) {
				if (typeof config === "number") {
					config = config * -1
				} else {
					const val = parser.reverseSign(config)
					if (val != undefined) {
						config = val
					}
				}
			}

			return config
		},
		handleValue(value, { negative, unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			const num = Number(value)
			if (Number.isNaN(num)) {
				const unit = parser.getUnitFromNumberFunction(value)
				if (unit === undefined) {
					return undefined
				}
				if (unit !== null) {
					return undefined
				}
				return negative ? parser.reverseNumberFunction(value) : value
			}
			return num * (negative ? -1 : 1)
		},
	}
})()

const length: ValueTypeSpec<string | number | null | undefined> = (function () {
	const units = ["px", "rem", "em", "vw", "vh", "vmin", "vmax", "ex", "cm", "mm", "in", "pt", "pc", "ch", "Q", "lh"]
	return {
		type: "length",
		isTag(tag) {
			return tag === "length"
		},
		handleConfig(config, options) {
			return number.handleConfig(config, options)
		},
		handleValue(value, { negative = false, unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			const unit = units.find(u => value.endsWith(u))
			if (!unit) {
				if (Number(value) == 0) {
					return 0
				}
				const unit = parser.getUnitFromNumberFunction(value)
				if (units.some(u => u === unit)) {
					return negative ? parser.reverseNumberFunction(value) : value
				}
				return unambiguous ? "" : undefined
			}
			value = value.slice(0, -unit.length)
			const num = number.handleValue(value, { negative })
			if (num === undefined) {
				return undefined
			}
			if (num === 0) {
				return 0
			}
			return num + unit
		},
	}
})()

const percentage: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "percentage",
		isTag(tag) {
			return tag === "percentage"
		},
		handleConfig(config, options) {
			return number.handleConfig(config, options)
		},
		handleValue(value, { negative = false, unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (!value.endsWith("%")) {
				if (Number(value) == 0) {
					return 0
				}
				const unit = parser.getUnitFromNumberFunction(value)
				if (unit === "%") {
					return negative ? parser.reverseNumberFunction(value) : value
				}
				return unambiguous ? "" : undefined
			}
			value = value.slice(0, -1)

			const num = Number(value)
			if (Number.isNaN(num)) {
				return undefined
			}

			return num * (negative ? -1 : 1) + "%"
		},
	}
})()

const angle: ValueTypeSpec<string | number | null | undefined> = (function () {
	const units = ["deg", "rad", "grad", "turn"]
	return {
		type: "angle",
		isTag(tag) {
			return tag === "angle"
		},
		handleConfig(config, options) {
			return number.handleConfig(config, options)
		},
		handleValue(value, { negative = false, unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			const unit = units.find(u => value.endsWith(u))
			if (!unit) {
				if (Number(value) == 0) {
					return 0
				}
				const unit = parser.getUnitFromNumberFunction(value)
				if (units.some(u => u === unit)) {
					return negative ? parser.reverseNumberFunction(value) : value
				}
				return undefined
			}
			value = value.slice(0, -unit.length)
			const num = number.handleValue(value, { negative })
			if (num === undefined) {
				return undefined
			}
			if (num === 0) {
				return 0
			}
			return num + unit
		},
	}
})()

const color: ValueTypeSpec<Tailwind.Value | Tailwind.ColorValueFunc | null | undefined> = (function () {
	return {
		type: "color",
		isTag(tag) {
			return tag === "color"
		},
		handleConfig(config, options) {
			if (options.negative) {
				return ""
			}

			config = config ?? ""

			if (typeof config === "function") {
				return config({ opacityValue: options.opacity }).toString()
			}

			if (typeof config !== "string" && typeof config !== "number") {
				return ""
			}

			const value = config.toString().trim()

			if (value.includes("<alpha-value>")) {
				return value.replace("<alpha-value>", options.opacity ?? "1")
			}

			return parseColorValue(value, false, options.opacity) || value
		},
		handleValue(value, { negative, opacity, unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (negative) {
				return undefined
			}
			return parseColorValue(value, unambiguous, opacity)
		},
	}

	function parseColorValue(value: string, unambiguous: boolean | undefined, opacity?: string): string | undefined {
		if (unambiguous) {
			// like: fill, stroke, ...
			if (opacity == undefined) {
				return value
			}
			const opacityValue = " / " + opacity
			const result = parser.unwrapCssFunction(value)
			if (result) {
				const { fn, params } = result
				if (parser.isOpacityFunction(fn)) {
					return fn + "(" + params + opacityValue + ")"
				}
				// prefer rgb()
				return "rgb(" + value + opacityValue + ")"
			}
			return value
		}

		const color = parser.parseColor(value)
		if (!color) {
			return undefined
		}

		if (!parser.isOpacityFunction(color.fn)) {
			if (opacity == undefined) {
				return undefined
			}
			if (!unambiguous) {
				return undefined
			}
			const opacityValue = " / " + opacity
			// prefer rgb()
			return "rgb(" + value + opacityValue + ")"
		}

		if (opacity == undefined) {
			return value
		}

		const opacityValue = " / " + opacity
		const { fn, params } = color
		if (params.every(p => typeof p === "string")) {
			return fn + "(" + params.slice(0, 3).join(" ") + opacityValue + ")"
		}

		const result = parser.unwrapCssFunction(value)
		if (result) {
			const { fn, params } = result
			if (parser.isOpacityFunction(fn)) {
				return fn + "(" + params + opacityValue + ")"
			}
			return "rgb(" + params + opacityValue + ")"
		}
		return undefined
	}
})()

const lineWidth: ValueTypeSpec<string | number | null | undefined> = (function () {
	const keywords = ["thin", "medium", "thick"]
	return {
		type: "line-width",
		isTag(tag) {
			return tag === "line-width"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value) {
			const keyword = keywords.find(u => value.endsWith(u))
			if (!keyword) {
				return undefined
			}
			return value
		},
	}
})()

const absoluteSize: ValueTypeSpec<string | number | null | undefined> = (function () {
	const keywords = ["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large"]
	return {
		type: "absolute-size",
		isTag(tag) {
			return tag === "absolute-size"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value) {
			const keyword = keywords.find(u => value.endsWith(u))
			if (!keyword) {
				return undefined
			}
			return value
		},
	}
})()

const genericName: ValueTypeSpec<string | number | null | undefined> = (function () {
	const keywords = [
		"serif",
		"sans-serif",
		"monospace",
		"cursive",
		"fantasy",
		"system-ui",
		"ui-serif",
		"ui-sans-serif",
		"ui-monospace",
		"ui-rounded",
		"math",
		"emoji",
		"fangsong",
	]
	return {
		type: "generic-name",
		isTag(tag) {
			return tag === "generic-name"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? value : undefined
			}
			const keyword = keywords.find(u => value.endsWith(u))
			if (!keyword) {
				return undefined
			}
			return value
		},
	}
})()

const familyName: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "family-name",
		isTag(tag) {
			return tag === "family-name"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? value : undefined
			}
			const fields = parser.splitAtTopLevelOnly(value)
			if (fields.length == 0) {
				return undefined
			}
			if (fields.length > 1) {
				return value
			}

			if (!Number.isNaN(Number(fields[0]))) {
				return undefined
			}

			return value
		},
	}
})()

const relativeSize: ValueTypeSpec<string | number | null | undefined> = (function () {
	const keywords = ["larger", "smaller"]
	return {
		type: "relative-size",
		isTag(tag) {
			return tag === "relative-size"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value) {
			const keyword = keywords.find(u => value.endsWith(u))
			if (!keyword) {
				return undefined
			}
			return value
		},
	}
})()

const url: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "url",
		isTag(tag) {
			return tag === "url"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			const params = parser.splitCssParams(value)
			if (
				params.some(p => {
					if (typeof p === "string") {
						return true
					}
					if (p.fn !== "url") {
						return true
					}
					return p.params.some(v => typeof v !== "string")
				})
			) {
				return undefined
			}
			return value
		},
	}
})()

const shadow: ValueTypeSpec<string | number | null | undefined> & {
	formatBoxShadow(shadow: string): { color: parser.Param | undefined; value: string } | undefined
} = (function () {
	const keywords = ["inset", "inherit", "initial", "revert", "revert-layer", "unset"]
	return {
		type: "shadow",
		isTag(tag) {
			return tag === "shadow"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (!parser.splitAtTopLevelOnly(value).every(isShadow)) {
				return undefined
			}
			return value
		},
		formatBoxShadow(shadow: string) {
			const params = parser.splitCssParams(shadow)

			if (params.length === 0) {
				return undefined
			}

			let keyword = ""
			let x = ""
			let y = ""
			let blur = ""
			let spread = ""
			let color: parser.Param | undefined

			for (const part of params) {
				if (typeof part === "string") {
					if (!keyword && keywords.find(v => v === part)) {
						keyword = part
						continue
					}

					if (length.handleValue(part, { negative: false }) != undefined || /[+-]?0/.test(part)) {
						if (!x) {
							x = part
						} else if (!y) {
							y = part
						} else if (!blur) {
							blur = part
						} else if (!spread) {
							spread = part
						}
						continue
					}
				}

				if (!color) {
					color = part
				} else {
					// error
					return undefined
				}
			}

			return {
				color,
				value: [keyword, x, y, blur, spread, "var(--tw-shadow-color, var(--tw-shadow-default-color))"]
					.filter(Boolean)
					.join(" "),
			}
		},
	}

	function isShadow(shadow: string): boolean {
		const params = parser.splitCssParams(shadow)
		if (params.length === 0) {
			return false
		}

		let keyword = ""
		let x = ""
		let y = ""
		let blur = ""
		let spread = ""
		let color: parser.Param | undefined

		for (const part of params) {
			if (typeof part === "string") {
				if (!keyword && keywords.find(v => v === part)) {
					keyword = part
					continue
				}

				if (length.handleValue(part, { negative: false }) != undefined || /[+-]?0/.test(part)) {
					if (!x) {
						x = part
					} else if (!y) {
						y = part
					} else if (!blur) {
						blur = part
					} else if (!spread) {
						spread = part
					}
					continue
				}
			}

			if (color == undefined) {
				color = part
			} else {
				return false
			}
		}

		if (!x || !y) {
			return false
		}

		return true
	}
})()

/**
 * @returns <...params> var(--tw-shadow-color, var(--tw-shadow-default-color))
 */
export function formatBoxShadowValues(values: string) {
	return parser.splitAtTopLevelOnly(values).map(value => {
		const ans = shadow.formatBoxShadow(value)
		if (!ans) return value
		return ans
	})
}

const position: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "position",
		isTag(tag) {
			return tag === "position"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			const arr = parser.splitAtTopLevelOnly(value)

			if (
				!arr.every(value => {
					const params = parser.splitCssParams(value)
					const parameters = params.filter((p: string): p is string => typeof p === "string")
					if (params.length !== parameters.length) {
						return false
					}
					switch (parameters.length) {
						case 1:
							return one(parameters[0])
						case 2:
							return two(parameters[0], parameters[1])
						case 3:
							return three(parameters[0], parameters[1], parameters[2])
						case 4:
							return four(parameters[0], parameters[1], parameters[2], parameters[3])
						default:
							return false
					}
				})
			) {
				return undefined
			}
			return value
		},
	}

	function isX(value: string) {
		return value === "left" || value === "right"
	}

	function isY(value: string) {
		return value === "top" || value === "bottom"
	}

	function isCenter(value: string) {
		return value === "center"
	}

	function isValue(value: string) {
		return length.handleValue(value) != undefined || percentage.handleValue(value) != undefined
	}

	function type(value: string): "x" | "y" | "center" | "value" | "unknown" {
		if (isX(value)) {
			return "x"
		}
		if (isY(value)) {
			return "y"
		}
		if (isCenter(value)) {
			return "center"
		}
		if (isValue(value)) {
			return "value"
		}
		return "unknown"
	}

	function one(value: string): boolean {
		return type(value) !== "unknown"
	}

	function two(a: string, b: string): boolean {
		const [first, second] = [type(a), type(b)]
		if (first === "unknown" || second === "unknown") {
			return false
		}

		if (first === "x" && second === "x") {
			return false
		}
		if (first === "y" && second === "y") {
			return false
		}
		if (first === "value" && second === "x") {
			return false
		}
		if (first === "y" && second === "value") {
			return false
		}
		return true
	}

	function three(a: string, b: string, c: string): boolean {
		const [first, second, third] = [type(a), type(b), type(c)]
		if (first === "unknown" || second === "unknown" || third === "unknown") {
			return false
		}

		if (first === "value") {
			return false
		}

		if (second === third) {
			return false
		}

		if (second === "value") {
			if (first === third) {
				return false
			}
			if (first === "center") {
				return false
			}
		}

		if (third === "value") {
			if (first === second) {
				return false
			}
			if (second === "center") {
				return false
			}
		}

		return true
	}

	function four(a: string, b: string, c: string, d: string): boolean {
		const [first, second, third, fourth] = [type(a), type(b), type(c), type(d)]
		if (first === "unknown" || second === "unknown" || third === "unknown" || fourth === "unknown") {
			return false
		}

		if (first === "x" && third === "y") {
			if (second === "value" && fourth === "value") {
				return true
			}
		}
		if (first === "y" && third === "x") {
			if (second === "value" && fourth === "value") {
				return true
			}
		}

		return false
	}
})()

const image: ValueTypeSpec<string | number | null | undefined> = (function () {
	const imageFunctions = [
		"image",
		"-webkit-image-set",
		"image-set",
		"-moz-element",
		"element",
		"cross-fade",
		"-webkit-gradient",
		"-webkit-linear-gradient",
		"-moz-linear-gradient",
		"-o-linear-gradient",
		"linear-gradient",
		"-webkit-repeating-linear-gradient",
		"-moz-repeating-linear-gradient",
		"-o-repeating-linear-gradient",
		"repeating-linear-gradient",
		"-webkit-radial-gradient",
		"-moz-radial-gradient",
		"radial-gradient",
		"-webkit-repeating-radial-gradient",
		"-moz-repeating-radial-gradient",
		"repeating-radial-gradient",
	]
	return {
		type: "image",
		isTag(tag) {
			return tag === "image"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			const params = parser.splitCssParams(value)
			if (
				!params.every(p => {
					if (typeof p === "string") {
						return false
					}
					if (imageFunctions.findIndex(fn => fn === p.fn) === -1) {
						return false
					}
					return true
				})
			) {
				return undefined
			}
			return value
		},
	}
})()

type Types = {
	[P in Exclude<ValueType, "any">]: ValueTypeSpec
}
export const __types: Types = {
	number,
	length,
	percentage,
	angle,
	// <time>
	// <frequency>
	color,
	"line-width": lineWidth,
	"absolute-size": absoluteSize,
	"relative-size": relativeSize,
	url,
	image,
	shadow,
	"generic-name": genericName,
	"family-name": familyName,
	position,
}

export function representTypes({
	input,
	node,
	getText,
	values,
	negative,
	template,
	ambiguous,
	config,
	filterDefault,
	types,
}: {
	input: string
	node: parser.Classname | parser.ArbitraryClassname
	getText: (node: parser.BaseNode) => string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	values: Record<string, any>
	negative: boolean
	template: Template
	ambiguous: boolean
	config: Tailwind.ResolvedConfigJS
	filterDefault: boolean
	types: ValueType[]
}): CSSProperties | undefined {
	const result = lookupValues(input, node, values, config, filterDefault)

	if (!result) {
		return undefined
	}

	const options = {
		negative,
		unambiguous: !ambiguous,
		opacity: result.opacity,
	}

	const _types = toArray(types)
		.map(t => __types[t])
		.filter(Boolean)

	// lookup value
	if (result.key != undefined) {
		const exists = Object.prototype.hasOwnProperty.call(values, result.key)
		if (!exists) {
			return undefined
		}

		const config = values[result.key]

		for (const h of _types) {
			const value = h.handleConfig(config, options)
			if (typeof value === "string" || typeof value === "number") {
				return template(value)
			} else {
				return template(result.key)
			}
		}
	}

	// arbitrary value
	if (result.value != undefined) {
		result.value = result.value.trim()

		for (const h of _types) {
			if (h.isTag(result.valueTag)) {
				options.unambiguous = true
			}
			const value = h.handleValue(result.value, options)
			if (result.valueTag) {
				if (h.isTag(result.valueTag)) {
					return template(value || result.value)
				}
				continue
			}
			if (!ambiguous && value != undefined) {
				return template(value || result.value)
			}
			if (value != undefined) {
				return template(value)
			}
		}
	}
	return undefined
}

export function withAlphaValue(
	color: CSSValue | ((options: { opacityValue?: string }) => CSSValue),
	opacityValue?: string,
) {
	if (typeof color === "function") {
		return color({ opacityValue })
	}
	if (typeof color === "number") {
		return color
	}
	if (!opacityValue) {
		return color
	}
	const result = parser.parseColor(color)
	if (!result) {
		return color
	}
	if (result.params.length > 3) {
		return color
	}
	if (!parser.isOpacityFunction(result.fn)) {
		return color
	}
	opacityValue = " / " + opacityValue
	return result.fn + "(" + result.params.slice(0, 3).join(" ") + opacityValue + ")"
}
