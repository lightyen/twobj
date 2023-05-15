import * as parser from "./parser"
import { CSSProperties, Variant, VariantRender } from "./types"
import { applyPost, isCSSValue, isExists, toArray } from "./util"

export const pseudoVariants: Array<[variantName: string, desc: string]> = [
	// Positional
	["first", "&:first-child"],
	["last", "&:last-child"],
	["only", "&:only-child"],
	["odd", "&:nth-child(odd)"],
	["even", "&:nth-child(even)"],
	"first-of-type",
	"last-of-type",
	"only-of-type",

	// State
	"visited",
	"target",
	["open", "&[open]"],

	// Forms
	"default",
	"checked",
	"indeterminate",
	"placeholder-shown",
	"autofill",
	"optional",
	"required",
	"valid",
	"invalid",
	"in-range",
	"out-of-range",
	"read-only",

	// Content
	"empty",

	// Interactive
	"focus-within",
	["hover", "@media (hover: hover) and (pointer: fine) { &:hover }"],
	"focus",
	"focus-visible",
	"active",
	"enabled",
	"disabled",
].map<[string, string]>((variant: string | [string, string]) =>
	Array.isArray(variant) ? variant : [variant, `&:${variant}`],
)

interface LookupResult {
	key?: string
	value?: string
	modifier?: string
	wrapped?: boolean
}

export function lookupVariantValues(
	restIndex: number,
	node: parser.SimpleVariant | parser.ArbitraryVariant | parser.UnknownVariant,
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

	if (node.type === parser.NodeType.SimpleVariant) {
		const has = (key: string): boolean => Object.prototype.hasOwnProperty.call(values, key)
		const valuesKey = node.source.slice(restIndex, node.key.end)

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

	const value = node.resolved ?? node.value.text.trim()
	ret.value = value
	return ret
}

export function representVariant({
	restIndex,
	node,
	values,
	render,
	filterDefault,
	post,
}: {
	restIndex: number
	node: parser.SimpleVariant | parser.ArbitraryVariant | parser.UnknownVariant
	values: Record<string, unknown>
	render: VariantRender
	filterDefault: boolean
	post?: Variant | undefined
}) {
	const { key, value, modifier, wrapped } = lookupVariantValues(restIndex, node, values, filterDefault)

	if (key != undefined) {
		const value = values[key]
		return createVariant(render(value, { modifier, wrapped }), post)
	}
	if (value != undefined) {
		return createVariant(render(value, { modifier, wrapped }), post)
	}

	return undefined
}

export function mergeVariants(...variants: Array<Variant | undefined>): Variant {
	const _variants = variants.filter(isExists)
	if (_variants.length === 0) {
		return (css = {}) => css
	}

	const AtRule = /^\s*@\w/
	const SPECIAL = ""
	const anchor = { [SPECIAL]: SPECIAL }
	const context = combineAndReplace(Object.assign({}, ..._variants.map(variant => variant(anchor))), anchor)
	return (css = {}) => {
		return combineAndReplace(context, css)
	}

	function combineAndReplace(source: CSSProperties, replaceValue: CSSProperties): CSSProperties {
		const combined = new Set<string>()
		const deep = new Map<string, CSSProperties>()
		const order = new Map<string, CSSProperties[string]>()

		const result: CSSProperties = {}

		for (const key in source) {
			const value = source[key]
			if (isCSSValue(value)) {
				order.set(key, value)
				continue
			}

			if (value[SPECIAL] !== SPECIAL) {
				order.set(key, value)
				deep.set(key, value)
				continue
			}

			if (Object.keys(value).length !== 1) {
				const rest = { ...value }
				delete rest[SPECIAL]
				order.set(key, { ...replaceValue, ...rest })
				continue
			}

			if (AtRule.test(key)) {
				order.set(key, replaceValue)
				continue
			}

			order.set(key, replaceValue)
			combined.add(key)
		}

		if (combined.size <= 1) {
			for (const [key, value] of order) {
				const d = deep.get(key)
				if (d !== undefined) {
					result[key] = combineAndReplace(d, replaceValue)
				} else {
					result[key] = value
				}
			}
		} else {
			for (const [key, value] of order) {
				const d = deep.get(key)
				if (d !== undefined) {
					result[key] = combineAndReplace(d, replaceValue)
				} else if (!combined.has(key)) {
					result[key] = value
				}
			}
			Object.assign(result, { [Array.from(combined).join(", ")]: replaceValue })
		}

		return result
	}
}

export function createVariant(variantDesc: string | string[], post?: Variant): Variant {
	variantDesc = toArray(variantDesc)
	const variants = variantDesc.map<Variant>(desc => {
		const reg = /{/gs
		desc = desc.trim().replace(/\s{2,}/g, " ")
		const match = reg.exec(desc)
		if (!match) {
			return (css = {}) => ({ [parser.normalizeSelector(desc)]: css })
		} else {
			const rb = parser.findRightBracket({ text: desc, start: reg.lastIndex - 1, brackets: [123, 125] })
			if (rb == undefined) {
				return (css = {}) => ({ [desc]: css })
			}
			const scope = desc.slice(0, reg.lastIndex - 1).trim()
			const restDesc = desc.slice(reg.lastIndex, rb).trim()
			if (scope) {
				return (css = {}) => ({ [parser.normalizeSelector(scope)]: createVariant([restDesc])(css) })
			} else {
				return (css = {}) => createVariant([restDesc])(css)
			}
		}
	})
	return (css = {}) => {
		if (post) {
			css = applyPost(css, post)
		}
		return mergeVariants(...variants)(css)
	}
}
