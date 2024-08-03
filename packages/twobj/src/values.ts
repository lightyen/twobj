import * as parser from "./parser"
import type { ColorValueFunc, ConfigValue, CSSProperties, UtilityRender, ValueType } from "./types"
import { isCSSValue, isNotEmpty, opacityToFloat, toArray } from "./util"

interface HandleOptions {
	negative?: boolean
	valueTag?: string
	modifier?: string
	opacity?: string
	wrapped?: boolean
	unambiguous?: boolean
	values?: ReturnType<typeof parser.splitAtTopLevelOnly>
}

interface ValueTypeSpec<T> {
	type: ValueType
	isTag(tag?: string): boolean
	handleValue(value: string, options?: HandleOptions): string | number | undefined
	handleConfig(config: T, options: HandleOptions): unknown
}

interface LookupResult {
	key?: string
	value?: string
	valueTag?: string
	modifier?: string
	wrapped?: boolean
}

function lookupConfigValues(
	restIndex: number,
	node: parser.Classname | parser.ArbitraryClassname,
	values: Record<string, unknown>,
	filterDefault?: boolean,
): LookupResult {
	const ret: LookupResult = {}

	if (node.m) {
		if (node.m.closed === false) {
			return ret
		}
		ret.modifier = node.m.text
		ret.wrapped = node.m.wrapped
	}

	if (node.type === parser.NodeType.Classname) {
		const has = (key: string): boolean => Object.prototype.hasOwnProperty.call(values, key)
		const valuesKey = node.source.slice(restIndex, node.end)

		if (has(valuesKey)) {
			ret.key = valuesKey
			return ret
		}

		if (valuesKey === "" && has("DEFAULT")) {
			if (filterDefault) {
				return ret
			}
			ret.key = "DEFAULT"
			return ret
		}

		// classname: 'vvv/foo', '1/4/foo', '/foo'
		// key: 'vvv', '1/4', ''
		// modifier: foo
		const i = valuesKey.lastIndexOf("/")
		if (i === -1) {
			return ret
		}

		const key = valuesKey.slice(0, i)
		if (key === "") {
			if (has("DEFAULT")) {
				if (filterDefault) return ret
				ret.key = "DEFAULT"
			}
		} else if (has(key)) {
			ret.key = key
		} else {
			return ret
		}

		// text-black/100
		if (ret.modifier == undefined) {
			ret.wrapped = false
			ret.modifier = valuesKey.slice(i + 1)
		}

		return ret
	}

	if (node.type === parser.NodeType.ArbitraryClassname) {
		const value = node.resolved ?? node.value.text.trim()
		ret.value = value
		const tagRegexp = /^\s*([a-zA-Z][a-zA-Z-]+)\s*:/g
		const match = tagRegexp.exec(value)
		if (match) {
			const [, tag] = match
			ret.value = value.slice(tagRegexp.lastIndex)
			ret.valueTag = tag
		}
	}

	return ret
}

export function representAny({
	restIndex,
	node,
	values,
	negative,
	render,
	ambiguous,
	filterDefault,
}: {
	restIndex: number
	node: parser.Classname | parser.ArbitraryClassname
	values: Record<string, unknown>
	negative: boolean
	render: UtilityRender
	ambiguous: boolean
	filterDefault: boolean
}) {
	const { key, value, valueTag, modifier, wrapped } = lookupConfigValues(restIndex, node, values, filterDefault)

	if (key != undefined) {
		const config = values[key]
		if (!isCSSValue(config)) {
			return render(config, { modifier, wrapped })
		}
		const value = config.toString().trim()
		if (negative) {
			const val = parser.reverseSign(value)
			if (val != undefined) return render(val, { modifier, wrapped })
		}
		return render(value, { modifier, wrapped })
	}

	if (value != undefined) {
		if (!ambiguous) {
			if (negative) {
				const val = parser.reverseSign(value)
				if (val != undefined) return render(val, { modifier, wrapped })
			}
			return render(value, { modifier, wrapped })
		}

		if (valueTag === "any") {
			if (negative) {
				const val = parser.reverseSign(value)
				if (val != undefined) return render(val, { modifier, wrapped })
			}
			return render(value, { modifier, wrapped })
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
				return parser.parseNumberFunction(value, negative)
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
				return parser.parseNumberFunction(value, negative)
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
				return parser.parseNumberFunction(value, negative)
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
				return parser.parseNumberFunction(value, negative)
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
		handleConfig(config, { negative, opacity, unambiguous = false }) {
			if (negative) {
				return ""
			}

			config = config ?? ""

			if (typeof config === "function") {
				return config({ opacityValue: opacity ?? "1" }).toString()
			}

			if (!isCSSValue(config)) {
				return ""
			}

			const value = config.toString().trim()

			if (value.includes("<alpha-value>")) {
				return value.replace("<alpha-value>", opacity ?? "1")
			}

			return parseColorValue(value, unambiguous, opacity) || value
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
		const color = parser.parseColor(value)
		const canAlpha = color != undefined && parser.isColorFunction(color.fn)
		if (opacity == undefined) {
			if (color?.kind === "color") {
				opacity = color.opacity
			}
		}
		if (opacity == undefined) {
			if (canAlpha) {
				return value
			}
			if (unambiguous) {
				return value
			}
			if (parser.isColorKeyword(value)) {
				return value
			}
			return undefined
		}

		const opacityValue = " / " + opacity

		if (!canAlpha) {
			if (unambiguous) {
				return forceRGB(value, opacityValue)
			}
			return undefined
		}

		if (color.params.every(v => typeof v === "string")) {
			if (color.fn === "color") {
				return color.fn + "(" + color.params.join(" ") + opacityValue + ")"
			}
			return color.fn + "(" + color.params.join(" ") + opacityValue + ")"
		}

		if (color.params.length === 1 && parser.isParamObject(color.params[0]) && color.params[0].fn === "var") {
			return color.fn + "(" + color.params[0].getText() + opacityValue + ")"
		}

		return forceRGB(value, opacityValue)

		function forceRGB(value: string, opacityValue?: string) {
			const result = parser.unwrapCssFunction(value)
			if (result && parser.isColorFunction(result.fn)) {
				return "rgb(" + result.params + opacityValue + ")"
			}
			if (opacityValue == undefined) {
				return "rgb(" + value + ")"
			}
			return "rgb(" + value + opacityValue + ")"
		}
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? value : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => keywords.findIndex(u => value.endsWith(u)) !== -1) ? value : undefined
		},
	}
})()

const absoluteSize: ValueTypeSpec<string | number | null | undefined> = (function () {
	const keywords = ["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"]
	return {
		type: "absolute-size",
		isTag(tag) {
			return tag === "absolute-size"
		},
		handleConfig(config, { negative }) {
			if (negative) return ""
			return config ?? ""
		},
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? value : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => keywords.findIndex(u => value.endsWith(u)) !== -1) ? value : undefined
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? value : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => keywords.findIndex(u => value.endsWith(u)) !== -1) ? value : undefined
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? value : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			if (values.length > 1) {
				return value
			}
			return Number.isNaN(Number(values[0].value)) ? value : undefined
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => keywords.findIndex(u => value.endsWith(u)) !== -1) ? value : undefined
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => {
				const params = parser.splitCssParams(v.value)
				if (!parser.isParamObject(params[0])) {
					return false
				}
				return params[0].fn === "url"
			})
				? value
				: undefined
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => parser.isValidShadow(v.value)) ? value : undefined
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => {
				const params = parser.splitCssParams(v.value)
				switch (params.length) {
					case 1:
						return one(params[0])
					case 2:
						return two(params[0], params[1])
					case 3:
						return three(params[0], params[1], params[2])
					case 4:
						return four(params[0], params[1], params[2], params[3])
					default:
						return false
				}
			})
				? value
				: undefined
		},
	}

	function isX(value: parser.Param) {
		return value === "left" || value === "right"
	}

	function isY(value: parser.Param) {
		return value === "top" || value === "bottom"
	}

	function isCenter(value: parser.Param) {
		return value === "center"
	}

	function isValue(value: parser.Param) {
		if (typeof value !== "string") {
			value = value.getText()
		}
		return length.handleValue(value) != undefined || percentage.handleValue(value) != undefined
	}

	function type(value: parser.Param): "x" | "y" | "center" | "value" | "unknown" {
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

	function one(value: parser.Param): boolean {
		return type(value) !== "unknown"
	}

	function two(a: parser.Param, b: parser.Param): boolean {
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

	function three(a: parser.Param, b: parser.Param, c: parser.Param): boolean {
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

	function four(a: parser.Param, b: parser.Param, c: parser.Param, d: parser.Param): boolean {
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => {
				const params = parser.splitCssParams(v.value)
				switch (params.length) {
					case 1:
						return one(params[0])
					case 2:
						return two(params[0], params[1])
					default:
						return false
				}
			})
				? value
				: undefined
		},
	}

	function isAuto(value: parser.Param) {
		return value === "auto"
	}

	function isKeyword(value: parser.Param) {
		return value === "contain" || value === "cover"
	}

	function isValue(value: parser.Param) {
		if (typeof value !== "string") {
			value = value.getText()
		}
		return length.handleValue(value) != undefined || percentage.handleValue(value) != undefined
	}

	function type(value: parser.Param): "auto" | "keyword" | "value" | "unknown" {
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

	function one(value: parser.Param): boolean {
		return type(value) !== "unknown"
	}

	function two(a: parser.Param, b: parser.Param): boolean {
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
		"cross-fade",
		"conic-gradient",
		"repeating-conic-gradient",
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
		handleValue(value, { unambiguous, values } = {}) {
			if (value === "") {
				return unambiguous ? "" : undefined
			}
			if (values == undefined) {
				values = parser.splitAtTopLevelOnly(value)
			}
			if (values.length === 0) {
				return unambiguous ? "" : undefined
			}
			return values.every(v => {
				const params = parser.splitCssParams(v.value)
				if (typeof params[0] === "string") {
					return false
				}
				const fn = params[0].fn
				if (imageFunctions.findIndex(v => v === fn) === -1) {
					return false
				}
				return true
			})
				? value
				: undefined
		},
	}
})()

type Types = {
	[P in Exclude<ValueType, "any">]: ValueTypeSpec<unknown>
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
	restIndex,
	node,
	values,
	negative,
	render,
	ambiguous,
	filterDefault,
	types,
}: {
	restIndex: number
	node: parser.Classname | parser.ArbitraryClassname
	values: Record<string, unknown>
	negative: boolean
	render: UtilityRender
	ambiguous: boolean
	filterDefault: boolean
	types: ValueType[]
}): CSSProperties | undefined {
	const { key, value, valueTag, modifier, wrapped } = lookupConfigValues(restIndex, node, values, filterDefault)

	let opacity: string | undefined
	if (modifier) {
		if (wrapped) {
			opacity = modifier
		} else {
			const v = opacityToFloat(modifier)
			if (!Number.isNaN(v)) {
				opacity = String(v)
			}
		}
	}

	const options: HandleOptions = {
		valueTag,
		negative,
		unambiguous: !ambiguous,
		modifier,
		opacity,
		wrapped,
	}

	const _types = toArray(types)
		.map(t => __types[t])
		.filter(isNotEmpty)

	if (key != undefined) {
		let config = values[key]
		if (isCSSValue(config)) config = config.toString().trim()
		for (const h of _types) {
			const output = h.handleConfig(config, options)
			return render(output, options)
		}
	}

	if (value != undefined) {
		if (hasMulti(types)) {
			options.values = parser.splitAtTopLevelOnly(value)
		}

		for (const h of _types) {
			if (h.isTag(valueTag)) {
				options.unambiguous = true
			}

			const output = h.handleValue(value, options)

			if (valueTag) {
				if (h.isTag(valueTag)) {
					return render(output || value, options)
				}
				continue
			}

			if (output != undefined) {
				return render(output, options)
			}
		}
	}

	return undefined

	function hasMulti(types: ValueType[]): boolean {
		return types.some(v => {
			switch (v) {
				case "color":
				case "number":
				case "percentage":
				case "length":
				case "angle":
					return false
				default:
					return true
			}
		})
	}
}
