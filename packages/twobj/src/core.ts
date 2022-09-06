import { classPlugins } from "./classPlugins"
import * as parser from "./parser"
import { escapeCss, findClasses } from "./postcss"
import { preflight } from "./preflight"
import type {
	Context,
	CorePluginFeatures,
	CorePluginOptions,
	CSSProperties,
	CSSValue,
	LookupSpec,
	Plugin,
	PostModifier,
	ResolvedConfigJS,
	StaticSpec,
	UserPluginFunctionWithOption,
	UserPluginOptions,
	ValueType,
	VariantSpec,
} from "./types"
import { applyCamelCase, applyImportant, applyModifier, flattenColorPalette, isCSSValue, merge, toArray } from "./util"
import { representAny, representTypes } from "./values"
import { variantPlugins } from "./variantPlugins"

export const colorProps = new Set<string>([
	"color",
	"outline-color",
	"border-color",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"background-color",
	"text-decoration-color",
	"accent-color",
	"caret-color",
	"fill",
	"stroke",
	"stop-color",
	"column-rule-color",
	"--tw-ring-color",
	"--tw-ring-offset-color",
	"--tw-gradient-from",
	"--tw-gradient-to",
	"--tw-gradient-stops",
	"--tw-shadow-color",
])

export function createContext(config: ResolvedConfigJS): Context {
	if (typeof config.separator !== "string" || !config.separator) {
		config.separator = ":"
	}
	parser.setSeparator(config.separator)

	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}

	const importantAll = config.important === true

	const preflightDisabled =
		(config.corePlugins && (config.corePlugins as unknown as Record<string, unknown>)["preflight"]) === false

	const globalStyles: Record<string, CSSProperties> = Object.assign(preflightDisabled ? {} : preflight, {
		"*, ::before, ::after": {},
		"::backdrop": {},
	})

	const defaults = [globalStyles["*, ::before, ::after"], globalStyles["::backdrop"]]
	const utilityMap = new Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>()
	const variantMap = new Map<string, VariantSpec>()
	const arbitraryVariantMap = new Map<string, (value: string) => VariantSpec>()
	const arbitraryUtilityMap = new Map<string, Set<ValueType | "any">>()

	const options = {
		addBase,
		addDefaults,
		addUtilities,
		addComponents,
		addVariant,
		matchUtilities,
		matchComponents,
		matchVariant,
	}

	// resolvePlugins

	const apiContext: CorePluginOptions = {
		...options,
		config,
		theme: config.theme,
		resolveTheme,
	}

	const features = new Set<string>()
	let currentPluginName: string | undefined

	for (const [, plugin] of Object.entries(classPlugins)) {
		currentPluginName = plugin.name
		features.add(currentPluginName)
		plugin(apiContext)
		currentPluginName = undefined
	}

	for (const [, plugin] of Object.entries(variantPlugins)) {
		plugin(apiContext)
	}

	const userContext: UserPluginOptions = {
		...options,
		e(value) {
			return escapeCss(value)
		},
		variants(corePlugin) {
			return []
		},
		config: legacyConfig,
		theme: resolveTheme,
		corePlugins(feature: keyof CorePluginFeatures): boolean {
			return features.has(feature)
		},
		prefix(value) {
			return value
		},
	}

	for (let i = 0; i < config.plugins.length; i++) {
		let _plugin = config.plugins[i]
		if (typeof _plugin === "function" && (_plugin as UserPluginFunctionWithOption).__isOptionsFunction) {
			_plugin = (_plugin as UserPluginFunctionWithOption)()
		}

		const plugin: Plugin = _plugin
		const pluginName = plugin["name"]
		if (typeof pluginName === "string" && pluginName) {
			currentPluginName = pluginName
			features.add(currentPluginName)
		} else {
			currentPluginName = `plugin${i}`
			features.add(currentPluginName)
		}
		if (typeof plugin === "function") {
			plugin(userContext)
		} else if (plugin.handler) {
			plugin.handler(userContext)
		}
		currentPluginName = undefined
	}

	resolveGlobalTheme(globalStyles)

	return {
		globalStyles,
		utilities: utilityMap,
		variants: variantMap,
		arbitraryVariants: arbitraryVariantMap,
		arbitraryUtilities: arbitraryUtilityMap,
		css,
		getPluginName,
		features,
		config: legacyConfig,
		theme: resolveTheme,
		renderTheme,
		renderThemeFunc,
		getClassList,
		getColorClasses,
		getAmbiguous,
		getThemeValueCompletion,
		cssVariant,
		addBase,
		addDefaults,
		addUtilities,
		addComponents,
		addVariant,
		matchUtilities,
		matchComponents,
		matchVariant,
	}

	function renderThemeFunc(value: string): string {
		return parser.renderThemeFunc(config, value)
	}

	function renderTheme(value: string): string {
		return parser.renderTheme(config, value)
	}

	function resolveTheme(value: string, defaultValue?: unknown): unknown {
		return parser.resolveThemeNoDefault(config, value, defaultValue)
	}

	function resolveGlobalTheme(g: CSSProperties): void {
		if (typeof g !== "object") return
		Object.entries(g).map(([key, child]) => {
			if (typeof child !== "object") {
				if (typeof child === "string") {
					g[key] = parser.renderThemeFunc(config, child)
				}
				return
			}
			resolveGlobalTheme(child)
		})
	}

	function legacyConfig(path: string, defaultValue?: unknown): unknown {
		const node = parser.parse_theme_val({ text: path })
		const target = parser.resolvePath(config, node.path, true)
		return target === undefined ? defaultValue : target
	}

	function addUtilitySpec(key: string, core: StaticSpec | LookupSpec): void {
		const obj = utilityMap.get(key)
		if (obj == null) {
			utilityMap.set(key, core)
			return
		}
		if (Array.isArray(obj)) {
			obj.push(core)
			return
		}
		utilityMap.set(key, [obj, core])
	}

	function addBase(bases: CSSProperties | CSSProperties[]): void {
		bases = toArray(bases).map(applyCamelCase).map(expandAtRules)
		merge(globalStyles, ...bases)
	}

	function addDefaults(pluginName: string, properties: Record<string, string | string[]>): void {
		properties = Object.fromEntries(
			Object.entries(properties).map(([key, value]) => [parser.camelCase(key), value]),
		)
		for (let i = 0; i < defaults.length; i++) {
			merge(defaults[i], properties)
		}
	}

	function addVariant(
		variantName: string,
		variantDesc: string | string[],
		options: {
			postModifier?: PostModifier
		} = {},
	): void {
		if (variantMap.has(variantName)) throw Error(`variant '${variantName} is duplicated.'`)
		variantDesc = toArray(variantDesc)
		if (variantDesc.some(value => typeof value !== "string"))
			throw Error(`variant description type should be string or string[].`)
		variantDesc = variantDesc.map(v => v.replace(/:merge\((.*?)\)/g, "$1"))
		variantMap.set(variantName, createVariantSpec(variantDesc, options.postModifier))
	}

	function matchVariant(
		variants: Record<string, (value: string) => string | string[]>,
		options: {
			values?: Record<string, string>
			postModifier?: PostModifier
		} = {},
	): void {
		for (const key in variants) {
			for (const [k, v] of Object.entries(options.values ?? {})) {
				addVariant(`${key}-${k}`, variants[key](v), { postModifier: options.postModifier })
			}
			arbitraryVariantMap.set(key, value =>
				createVariantSpec(toArray(variants[key](value)), options.postModifier),
			)
		}
	}

	function createVariantSpec(variantDesc: string[], postModifier?: PostModifier): VariantSpec {
		const fns = variantDesc.map<VariantSpec>(desc => {
			const reg = /{/gs
			const match = reg.exec(desc)
			if (!match) {
				return (css = {}) => ({ [desc]: typeof css === "object" ? { ...css } : css })
			} else {
				const rb = parser.findRightBracket({ text: desc, start: reg.lastIndex - 1, brackets: [123, 125] })
				if (rb == undefined) {
					return (css = {}) => ({ [desc]: css })
				}
				const scope = desc
					.slice(0, reg.lastIndex - 1)
					.trim()
					.replace(/\s{2,}/g, " ")
				const restDesc = desc.slice(reg.lastIndex, rb).trim()
				if (scope) {
					return (css = {}) => ({ [scope]: createVariantSpec([restDesc])(css) })
				} else {
					return (css = {}) => createVariantSpec([restDesc])(css)
				}
			}
		})
		return (css = {}) => {
			if (postModifier) {
				css = applyModifier(css, postModifier)
			}
			return Object.assign({}, ...fns.map(fn => fn(css)))
		}
	}

	function addComponents(
		components: CSSProperties | CSSProperties[],
		{
			respectPrefix = true,
			respectImportant = false,
		}: { respectPrefix?: boolean; respectImportant?: boolean } = {},
	): void {
		addUtilities(components, { respectPrefix, respectImportant })
	}

	function addUtilities(
		utilities: CSSProperties | CSSProperties[],
		{ respectPrefix = true, respectImportant = true }: { respectPrefix?: boolean; respectImportant?: boolean } = {},
	): void {
		utilities = toArray(utilities).map(applyCamelCase)
		const keyStylePairs = getKeyStylePairs(utilities)
		for (const [_key, css] of keyStylePairs) {
			const key = respectPrefix ? config.prefix + _key : _key
			addUtilitySpec(key, {
				type: "static",
				css: expandAtRules(css),
				supportsNegativeValues: false,
				pluginName: currentPluginName,
				respectPrefix,
				respectImportant,
			})
		}
		return
	}

	function getKeyStylePairs(styles: CSSProperties[]): Map<string, CSSProperties> {
		const ret = new Map<string, CSSProperties>()
		const result = styles.flatMap(s => traverse(s)).filter((v): v is [string, CSSProperties] => v != undefined)
		for (const [key, css] of result) {
			if (ret.has(key)) {
				ret.set(key, merge(ret.get(key), css))
			} else {
				ret.set(key, css)
			}
		}

		return ret

		function traverse(css: CSSProperties[string]): Array<[string, CSSProperties]> | undefined {
			if (typeof css !== "object" || css === null) {
				return undefined
			}
			const ret: Array<[string, CSSProperties]> = []

			for (const selector in css) {
				const selectors = findClasses(selector)
				if (selectors.size === 0) {
					const result = traverse(css[selector])
					if (result != undefined) {
						result.map(([key, css]) => {
							ret.push([key, { [selector]: css }])
						})
					}
				} else {
					const value = css[selector]
					for (const [key, rest] of selectors) {
						if (rest !== "&") {
							ret.push([key, { [rest]: value }])
						} else if (!isCSSValue(value)) {
							ret.push([key, value])
						}
					}
				}
			}
			return ret
		}
	}

	function expandAtRules(style: CSSProperties | undefined = {}) {
		// { "& > :not([hidden]) ~ :not([hidden])": { borderColor: "black" } }
		// { "@apply text-white bg-black": { borderColor: "black" } }
		// { "@media (min-width: 1024px)": { ".container": { padding: "10px" } } }
		// { "@media (min-width: 1024px)": { "&": { padding: "10px" } } }
		// { "@screen md": { borderColor: "black" } }
		// { "@screen md": { "@apply text-white bg-black": { borderColor: "black" } } }
		const AT_APPLY = /^@apply\s+/
		const AT_SCREEN = /^@screen\s+/

		const target: CSSProperties = {}
		for (const [key, value] of Object.entries(style)) {
			if (isCSSValue(value)) {
				target[key] = value
				continue
			}

			if (AT_APPLY.test(key)) {
				const input = key.replace(AT_APPLY, "")
				merge(target, merge(css(input), expandAtRules(value)))
				continue
			}

			if (AT_SCREEN.test(key)) {
				const input = key.replace(AT_SCREEN, "")
				const fn = compose(variantMap.get(input), expandAtRules)
				merge(target, fn(value))
				continue
			}

			target[key] = expandAtRules(value)
		}
		return target
	}

	function matchComponents(
		components: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		{
			type = "any",
			values = {},
			supportsNegativeValues = false,
			filterDefault = false,
			respectPrefix = true,
			respectImportant = false,
		}: {
			type?: (ValueType | "any") | (ValueType | "any")[]
			values?: Record<string, unknown>
			supportsNegativeValues?: boolean
			filterDefault?: boolean
			respectPrefix?: boolean
			respectImportant?: boolean
		} = {},
	): void {
		matchUtilities(components, {
			type,
			values,
			supportsNegativeValues,
			filterDefault,
			respectPrefix,
			respectImportant,
		})
	}

	function matchUtilities(
		utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		{
			type = "any",
			values = {},
			supportsNegativeValues = false,
			filterDefault = false,
			respectPrefix = true,
			respectImportant = true,
		}: {
			type?: (ValueType | "any") | (ValueType | "any")[]
			values?: Record<string, unknown>
			supportsNegativeValues?: boolean
			filterDefault?: boolean
			respectPrefix?: boolean
			respectImportant?: boolean
		} = {},
	): void {
		for (const [_key, fn] of Object.entries(utilities)) {
			const key = respectPrefix ? config.prefix + _key : _key
			let represent: LookupSpec["represent"]
			const types = toArray(type)
			if (types.some(t => t === "any")) {
				let ambiguous = false
				let spec = utilityMap.get(key)
				if (spec) {
					spec = toArray(spec).filter((s): s is LookupSpec => s.type === "lookup")
					ambiguous = spec.length > 1
				}

				represent = (input, node, getText, negative) => {
					if (negative && !supportsNegativeValues) return undefined
					return representAny({
						input,
						node,
						getText,
						values,
						negative,
						ambiguous,
						template(value) {
							const css = fn(value)
							return merge({}, ...toArray(css).map(applyCamelCase))
						},
						filterDefault,
					})
				}
				addUtilitySpec(key, {
					type: "lookup",
					values: values ?? {},
					represent,
					supportsNegativeValues,
					filterDefault,
					pluginName: currentPluginName,
					respectPrefix,
					respectImportant,
				})
				const valueTypes = arbitraryUtilityMap.get(key)
				if (valueTypes) {
					valueTypes.add("any")
				} else {
					arbitraryUtilityMap.set(key, new Set(["any"]))
				}
				continue
			}

			// if types has 'color', always flatten the values
			let isColor = false
			if (types.some(t => t === "color")) {
				values = flattenColorPalette(values)
				isColor = true
			}

			const noAnyTypes = types.filter((t): t is ValueType => t !== "any")
			represent = (input, node, getText, negative) => {
				if (negative && !supportsNegativeValues) return undefined

				let ambiguous = false
				let spec = utilityMap.get(key)
				if (spec) {
					spec = toArray(spec).filter((s): s is LookupSpec => s.type === "lookup")
					ambiguous = spec.length > 1
				}

				return representTypes({
					input,
					node,
					getText,
					values,
					negative,
					types: noAnyTypes,
					filterDefault,
					ambiguous,
					template(value) {
						const css = fn(value)
						return merge({}, ...toArray(css))
					},
				})
			}
			addUtilitySpec(key, {
				type: "lookup",
				values: values ?? {},
				represent,
				supportsNegativeValues,
				filterDefault,
				isColor,
				pluginName: currentPluginName,
				respectPrefix,
				respectImportant,
			})
			const valueTypes = arbitraryUtilityMap.get(key)
			if (valueTypes) {
				noAnyTypes.forEach(type => {
					valueTypes.add(type)
				})
			} else {
				arbitraryUtilityMap.set(key, new Set(noAnyTypes))
			}
		}
	}

	function compose(...variants: (VariantSpec | undefined)[]): VariantSpec {
		let wrap: VariantSpec = (css = {}) => css
		for (const f of variants.reverse()) {
			if (f) {
				const g = wrap
				wrap = (css = {}) => f(g(css))
			}
		}
		return wrap
	}

	function getClassList() {
		return Array.from(utilityMap.entries()).flatMap(([key, specs]) => {
			specs = toArray(specs)
			return specs.flatMap(spec => {
				if (spec.type === "static") {
					return [key]
				}

				const values = Object.keys(spec.values)
				const results = values
					.map(value => {
						if (value === "DEFAULT") {
							if (spec.filterDefault) return null
							return key
						}
						return key + "-" + value
					})
					.filter((v): v is string => typeof v === "string")
				if (spec.supportsNegativeValues) {
					return results.concat(
						values
							.filter(val => parser.reverseSign(String(spec.values[val])) != undefined)
							.map(value => {
								if (value === "DEFAULT") {
									if (spec.filterDefault) return null
									return key
								}
								return "-" + key + "-" + value
							})
							.filter((v): v is string => typeof v === "string"),
					)
				}
				return results
			})
		})
	}

	function getThemeValueCompletion({
		position,
		text,
		start = 0,
		end = text.length,
	}: {
		position: number
		text: string
		start?: number
		end?: number
	}): {
		range: parser.Range
		candidates: Array<[string, string]>
	} {
		const node = parser.parse_theme_val({ text, start, end })
		const result = parser.resolvePath(config.theme, node.path, true)

		if (result === undefined) {
			const ret = parser.tryOpacityValue(node.path)
			if (ret.opacityValue) {
				node.path = ret.path
			}
		}

		if (node.path.length === 0) {
			return {
				range: node.range,
				candidates: format(config.theme),
			}
		}

		const i = node.path.findIndex(p => position >= p.range[0] && position <= p.range[1])
		const obj = parser.resolvePath(config.theme, node.path.slice(0, i))
		return {
			range: node.path[i].range,
			candidates: format(obj),
		}

		function format(obj: unknown): Array<[string, string]> {
			if (typeof obj !== "object") {
				return []
			}
			return Object.entries(Object.assign({}, obj)).map(([key, value]) => {
				return [key, parser.renderThemeValue({ value })]
			})
		}
	}

	function getColorClasses() {
		const collection = new Map<string, string[]>()

		for (const entry of utilityMap.entries()) {
			const key = entry[0]
			let specs = entry[1]
			specs = toArray(specs)
			for (const s of specs) {
				if (s.type === "lookup" && s.isColor) {
					for (const [k, value] of Object.entries(s.values)) {
						collection.set(key + "-" + k, [toColorValue(value)])
					}
				} else if (s.type === "static") {
					const colors = extractColors(s.css)
					if (colors.length > 0) {
						collection.set(key, colors)
					}
				}
			}
		}

		return collection

		function toColorValue(value: unknown): string {
			if (typeof value === "string") {
				return value.replace("<alpha-value>", "1")
			}
			if (typeof value === "function") {
				return String(value({ opacityValue: "1" }))
			}
			return String(value)
		}

		function extractColors(style: CSSProperties): string[] {
			const colors: string[] = []
			for (const [prop, value] of Object.entries(style)) {
				if (isCSSValue(value)) {
					if (typeof value === "string") {
						const color = parser.parseColor(value)
						if (color && parser.isOpacityFunction(color.fn)) {
							colors.push(value)
						} else if (colorProps.has(prop)) {
							colors.push(value)
						}
					}
				} else {
					colors.push(...extractColors(value))
				}
			}
			return colors
		}
	}

	function getPluginName(value: string): string | undefined {
		const program = parser.parse(value)
		if (program.expressions.length !== 1) {
			return undefined
		}

		const node = program.expressions[0]
		if (node.type !== parser.NodeType.ClassName && node.type !== parser.NodeType.ArbitraryClassname) {
			return undefined
		}

		const getText = (node: parser.BaseNode) => value.slice(node.range[0], node.range[1])
		const [, spec] = classname(node, getText)
		return spec?.pluginName
	}

	function getAmbiguous() {
		const ret = new Map<string, LookupSpec[]>()
		for (const [key, u] of utilityMap) {
			const spec = (Array.isArray(u) ? u : [u]).filter((s): s is LookupSpec => s.type === "lookup")
			if (spec.length > 1) {
				ret.set(key, spec)
			}
		}
		return ret
	}

	function css(strings: string): CSSProperties
	function css(strings: TemplateStringsArray): CSSProperties
	function css(strings: string | TemplateStringsArray): CSSProperties {
		let value = ""
		if (typeof strings !== "string") {
			value = strings[0] as string
		} else {
			value = strings
		}
		const rootStyle: CSSProperties = {}
		let importantRootStyle: CSSProperties | undefined

		const importantSelector: string = typeof config.important === "string" ? config.important : ""
		if (importantSelector) {
			importantRootStyle = {}
			rootStyle[`${importantSelector} &`] = importantRootStyle
		}

		const rootFn: VariantSpec = (css = {}) => css
		const getText = (node: parser.BaseNode) => value.slice(node.range[0], node.range[1])
		const program = parser.parse(value)
		for (let i = 0; i < program.expressions.length; i++) {
			process(program.expressions[i], rootStyle, importantRootStyle, rootFn, getText, false)
		}
		return rootStyle
	}

	function process(
		node: parser.TwExpression,
		root: CSSProperties,
		importantRoot: CSSProperties | undefined,
		variantCtx: VariantSpec,
		getText: (node: parser.BaseNode) => string,
		important: boolean,
	) {
		switch (node.type) {
			case parser.NodeType.VariantSpan: {
				switch (node.variant.type) {
					case parser.NodeType.SimpleVariant: {
						const variant = simpleVariant(node.variant)
						if (node.child) {
							process(node.child, root, importantRoot, compose(variantCtx, variant), getText, important)
						}
						break
					}
					case parser.NodeType.ArbitraryVariant: {
						const variant = arbitraryVariant(node.variant)
						if (node.child) {
							process(node.child, root, importantRoot, compose(variantCtx, variant), getText, important)
						}
						break
					}
					case parser.NodeType.ArbitrarySelector: {
						const variant = arbitrarySelector(node.variant)
						if (node.child) {
							process(node.child, root, importantRoot, compose(variantCtx, variant), getText, important)
						}
						break
					}
				}
				break
			}
			case parser.NodeType.Group: {
				for (let i = 0; i < node.expressions.length; i++) {
					process(node.expressions[i], root, importantRoot, variantCtx, getText, important || node.important)
				}
				break
			}
			case parser.NodeType.ClassName:
			case parser.NodeType.ArbitraryClassname: {
				const [result, spec] = classname(node, getText)
				let css = result
				if (css != undefined) {
					if (important || node.important || (spec?.respectImportant && importantAll)) {
						css = applyImportant(css)
					}
				}
				if (spec?.respectImportant && importantRoot) {
					merge(importantRoot, variantCtx(css))
				} else {
					merge(root, variantCtx(css))
				}
				break
			}
			case parser.NodeType.ArbitraryProperty: {
				const i = node.decl.value.indexOf(":")
				if (i !== -1) {
					const prop = node.decl.value.slice(0, i).trim()
					const value = node.decl.value.slice(i + 1).trim()
					if (prop && value) {
						let css: CSSProperties = { [parser.camelCase(prop)]: value }

						if (css != undefined) {
							if (important || node.important || importantAll) {
								css = applyImportant(css)
							}
						}
						if (importantRoot) {
							merge(importantRoot, variantCtx(css))
						} else {
							merge(root, variantCtx(css))
						}
					}
				}
				break
			}
			case parser.NodeType.ShortCss: {
				// do nothing
				break
			}
		}
	}

	function simpleVariant(node: parser.SimpleVariant) {
		return variantMap.get(node.id.value)
	}

	function arbitraryVariant(node: parser.ArbitraryVariant) {
		let variant: VariantSpec | undefined
		const prefix = node.prefix.value
		if (prefix.endsWith("-")) {
			const key = prefix.slice(0, -1)
			const spec = arbitraryVariantMap.get(key)
			if (spec) {
				const input = node.selector.value
				variant = spec(input)
			}
		}
		return variant
	}

	function arbitrarySelector(node: parser.ArbitrarySelector) {
		const value = node.selector.value.trim().replace(/\s{2,}/g, " ")
		if (value) {
			const variant: VariantSpec = (css = {}) => ({ [value]: css })
			return variant
		}
		return undefined
	}

	function classname(
		node: parser.Classname | parser.ArbitraryClassname,
		getText: (node: parser.BaseNode) => string,
	): [css?: CSSProperties, spec?: LookupSpec | StaticSpec] {
		let value: string
		if (node.type === parser.NodeType.ClassName) {
			value = getText(node)
			if (value === "$e") {
				return [Math.E as unknown as CSSProperties]
			}
		} else {
			value = getText(node.prefix)
			if (node.expr) {
				node.expr.value = renderThemeFunc(node.expr.value)
			}
		}
		const { spec, negative, restInput } = parseInput(value)

		if (spec) {
			for (const c of toArray(spec)) {
				if (c.type === "lookup") {
					const css = c.represent(restInput, node, getText, negative)
					if (css) {
						return [css, c]
					}
				} else {
					return [c.css, c]
				}
			}
		}
		return []
	}

	function parseInput(input: string) {
		const spec = utilityMap.get(input)
		const result = { spec, negative: false, restInput: "" }

		if (spec) {
			return result
		}

		if (input[0] === "-") {
			result.negative = true
			input = input.slice(1)
			const spec = utilityMap.get(input)
			if (spec) {
				result.spec = spec
				result.restInput = input
				return result
			}
		}

		let i = input.length
		while (i > 0) {
			i = input.lastIndexOf("-", i - 1)
			if (i === -1) {
				break
			}

			const key = input.slice(0, i)
			const spec = utilityMap.get(key)
			if (!spec) {
				continue
			}

			const lookupSpec = toArray(spec).filter((s): s is LookupSpec => s.type === "lookup")
			if (lookupSpec.length === 0) {
				continue
			}

			result.spec = lookupSpec
			result.restInput = input.slice(i + 1)
			return result
		}

		return result
	}

	function cssVariant(...variants: Array<parser.Variant | string>) {
		return compose(
			...variants.map(value => {
				if (typeof value === "string") {
					const variant = variantMap.get(value)
					if (variant) {
						return variant
					}

					const program = parser.parse(value + config.separator)
					if (program.expressions.length !== 1) {
						return undefined
					}

					const node = program.expressions[0]
					if (
						node.type !== parser.NodeType.VariantSpan ||
						node.variant.type === parser.NodeType.SimpleVariant
					) {
						return undefined
					}

					if (node.variant.type === parser.NodeType.ArbitrarySelector) {
						return arbitrarySelector(node.variant)
					}

					return arbitraryVariant(node.variant)
				}

				const node = value
				if (node.type === parser.NodeType.SimpleVariant) {
					return variantMap.get(node.id.value)
				}

				if (node.type === parser.NodeType.ArbitrarySelector) {
					return arbitrarySelector(node)
				}

				return arbitraryVariant(node)
			}),
		)
	}
}
