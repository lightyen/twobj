import * as parser from "./parser"
import type {
	ColorValueFunc,
	ConfigEntry,
	ConfigObject,
	ConfigValue,
	CSSProperties,
	Template,
	ValueType,
} from "./types"
import { isCSSValue, isNotEmpty, opacityToFloat, toArray } from "./util"

interface LookupResult {
	key?: string
	opacity?: string
	valueTag?: string
	value?: string
}

interface ValueTypeSpec<T> {
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
		config: T,
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
		} else {
			result.key = input
		}
		if (node.e) {
			if (node.e.type === parser.NodeType.WithOpacity) {
				result.opacity = node.e.opacity.getText()
			} else if (node.e.type === parser.NodeType.EndOpacity) {
				const opacity = opacityToFloat(node.e.getText())
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
			const suffix = input.slice(i + 1)
			const opacity = opacityToFloat(suffix)
			if (!Number.isNaN(opacity)) {
				result.opacity = String(opacity)
				result.key = input.slice(0, i)
			}
		}
	}

	return result
}

export function representAny({
	input,
	node,
	values,
	negative,
	template,
	ambiguous,
	filterDefault,
}: {
	input: string
	node: parser.Classname | parser.ArbitraryClassname
	values: ConfigObject
	negative: boolean
	template: Template
	ambiguous: boolean
	filterDefault: boolean
}) {
	const result = lookupValues(input, node, values, filterDefault)
	if (!result) {
		return undefined
	}

	// lookup value
	if (result.key != undefined) {
		const exists = Object.prototype.hasOwnProperty.call(values, result.key)
		if (!exists) {
			return undefined
		}

		if (result.opacity) {
			// color types should be handled with representTypes()
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
		handleValue(value, { negative, unambiguous = false } = {}) {
			if (!parser.isValidNumber(value)) {
				return unambiguous ? "" : undefined
			}
			let num = Number(value)
			if (Number.isNaN(num)) {
				return negative ? parser.reverseNumberFunction(value) : value
			}

			num = num * (negative ? -1 : 1)

			if (Object.is(num, -0)) {
				return "-0"
			}

			return String(num)
		},
	}
})()

const length: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "length",
		isTag(tag) {
			return tag === "length"
		},
		handleConfig(config, options) {
			return number.handleConfig(config, options)
		},
		handleValue(value, { negative = false, unambiguous = false } = {}) {
			const result = parser.isValidLength(value)
			if (!result) {
				return unambiguous ? "" : undefined
			}

			let num = Number(result.num)
			if (Number.isNaN(num)) {
				return negative ? parser.reverseNumberFunction(value) : value
			}

			num = num * (negative ? -1 : 1)
			if (num === 0) {
				if (Object.is(num, -0)) {
					return "-0" + result.unit
				}
				return "0" + result.unit
			}

			return num + result.unit
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
		handleValue(value, { negative = false, unambiguous = false } = {}) {
			const result = parser.isValidPercentage(value)
			if (!result) {
				return unambiguous ? "" : undefined
			}

			let num = Number(result.num)
			if (Number.isNaN(num)) {
				return negative ? parser.reverseNumberFunction(value) : value
			}

			num = num * (negative ? -1 : 1)
			if (num === 0) {
				if (Object.is(num, -0)) {
					return "-0" + result.unit
				}
				return "0" + result.unit
			}

			return num + result.unit
		},
	}
})()

const angle: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "angle",
		isTag(tag) {
			return tag === "angle"
		},
		handleConfig(config, options) {
			return number.handleConfig(config, options)
		},
		handleValue(value, { negative = false, unambiguous = false } = {}) {
			const result = parser.isValidAngle(value)
			if (!result) {
				return unambiguous ? "" : undefined
			}

			let num = Number(result.num)
			if (Number.isNaN(num)) {
				return negative ? parser.reverseNumberFunction(value) : value
			}

			num = num * (negative ? -1 : 1)
			if (num === 0) {
				if (Object.is(num, -0)) {
					return "-0" + result.unit
				}
				return "0" + result.unit
			}

			return num + result.unit
		},
	}
})()

const color: ValueTypeSpec<ConfigValue | ColorValueFunc | null | undefined> = (function () {
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

			if (!isCSSValue(config)) {
				return ""
			}

			const value = config.toString().trim()

			if (value.includes("<alpha-value>")) {
				return value.replace("<alpha-value>", options.opacity ?? "1")
			}

			return parseColorValue(value, false, options.opacity) || value
		},
		handleValue(value, { negative, opacity, unambiguous = false } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (negative) {
				return undefined
			}
			return parseColorValue(value, unambiguous, opacity)
		},
	}

	function parseColorValue(value: string, unambiguous: boolean, opacity?: string): string | undefined {
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
			if (fields.length === 0) {
				return undefined
			}
			if (fields.length > 1) {
				return value
			}

			if (!Number.isNaN(Number(fields[0].value))) {
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

const shadow: ValueTypeSpec<string | string[] | number | null | undefined> = (function () {
	return {
		type: "shadow",
		isTag(tag) {
			return tag === "shadow"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			if (Array.isArray(config)) {
				return config.join(", ")
			}
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (!parser.splitAtTopLevelOnly(value).every(v => parser.isValidShadow(v.value))) {
				return undefined
			}
			return value
		},
	}
})()

const backgroundPosition: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "background-position",
		isTag(tag) {
			return tag === "position" || tag === "background-position"
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
				arr.every(v => {
					const params = parser.splitCssParams(v.value)
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
				return value
			}
			return undefined
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

const backgroundSize: ValueTypeSpec<string | number | null | undefined> = (function () {
	return {
		type: "background-size",
		isTag(tag) {
			return tag === "size" || tag === "background-size"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous } = {}) {
			if (value === "") {
				return undefined
			}
			const arr = parser.splitAtTopLevelOnly(value)
			if (arr.length === 0) {
				return undefined
			}

			if (
				arr.every(v => {
					const params = parser.splitCssParams(v.value)
					const parameters = params.filter((p: string): p is string => typeof p === "string")
					if (params.length !== parameters.length) {
						return false
					}
					switch (parameters.length) {
						case 1:
							return one(parameters[0])
						case 2:
							return two(parameters[0], parameters[1])
						default:
							return false
					}
				})
			) {
				return value
			}
			return undefined
		},
	}

	function isAuto(value: string) {
		return value === "auto"
	}

	function isKeyword(value: string) {
		return value === "contain" || value === "cover"
	}

	function isValue(value: string) {
		return length.handleValue(value) != undefined || percentage.handleValue(value) != undefined
	}

	function type(value: string): "auto" | "keyword" | "value" | "unknown" {
		if (isAuto(value)) {
			return "auto"
		}
		if (isKeyword(value)) {
			return "keyword"
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
		if (first === "keyword" || second === "keyword") {
			return false
		}
		return true
	}
})()

const imageFunction: ValueTypeSpec<string | number | null | undefined> = (function () {
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
	[P in Exclude<ValueType, "any">]: ValueTypeSpec<ConfigEntry>
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
	image: imageFunction,
	shadow,
	"generic-name": genericName,
	"family-name": familyName,
	"background-position": backgroundPosition,
	"background-size": backgroundSize,
}

export function representTypes({
	input,
	node,
	values,
	negative,
	template,
	ambiguous,
	filterDefault,
	types,
}: {
	input: string
	node: parser.Classname | parser.ArbitraryClassname
	values: ConfigObject
	negative: boolean
	template: Template
	ambiguous: boolean
	filterDefault: boolean
	types: ValueType[]
}): CSSProperties | undefined {
	const result = lookupValues(input, node, values, filterDefault)

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
		.filter(isNotEmpty)

	// lookup value
	if (result.key != undefined) {
		const exists = Object.prototype.hasOwnProperty.call(values, result.key)
		if (!exists) {
			return undefined
		}

		const config = values[result.key]

		for (const h of _types) {
			if (h !== color && result.opacity) {
				continue
			}
			const value = h.handleConfig(config, options)
			if (isCSSValue(value)) {
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

export function withAlphaValue(color: string | ((options: { opacityValue?: string }) => string), opacity?: string) {
	if (typeof color === "function") {
		return color({ opacityValue: opacity })
	}
	if (typeof color === "number") {
		return color
	}
	if (!opacity) {
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
	const opacityValue = " / " + opacity
	return result.fn + "(" + result.params.slice(0, 3).join(" ") + opacityValue + ")"
}
