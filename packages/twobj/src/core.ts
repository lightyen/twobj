import { classPlugins } from "./classPlugins"
import { camelCase, createParser, findRightBracket } from "./parser"
import {
	ArbitraryClassname,
	ArbitrarySelector,
	ArbitraryVariant,
	Classname,
	Expression,
	NodeType,
	SimpleVariant,
	Variant,
} from "./parser/nodes"
import * as theme from "./parser/theme"
import { isPluginWithOptions } from "./plugin"
import { escapeCss, findClasses } from "./postcss"
import type {
	ConfigObject,
	Context,
	CorePluginFeatures,
	CorePluginOptions,
	CSSProperties,
	CSSValue,
	LookupSpec,
	Palette,
	PostModifier,
	ResolvedConfigJS,
	StaticSpec,
	UserPluginOptions,
	ValueType,
	VariantSpec,
} from "./types"
import {
	applyCamelCase,
	applyImportant,
	applyModifier,
	flattenColorPalette,
	getAmbiguousFrom,
	getClassListFrom,
	getColorClassesFrom,
	isCSSValue,
	isFunction,
	isNotEmpty,
	isObject,
	isString,
	merge,
	toArray,
} from "./util"
import { representAny, representTypes } from "./values"
import { variantPlugins } from "./variantPlugins"

/** Create a tailwind context. */
export function createContext(config: ResolvedConfigJS): Context {
	if (typeof config.separator !== "string" || !config.separator) {
		config.separator = ":"
	}

	const parser = createParser()
	parser.separator = config.separator

	if (typeof config.prefix !== "string") {
		config.prefix = ""
	}

	const importantAll = config.important === true

	const corePlugins = new Set(
		(() => {
			const { corePlugins } = config
			if (Array.isArray(corePlugins)) {
				return corePlugins
			}
			if (isObject(corePlugins)) {
				return Object.values(classPlugins)
					.map(p => p.name)
					.filter(Boolean)
					.filter(k => corePlugins[k] !== false)
			}
			if (typeof corePlugins === "boolean" && corePlugins === false) {
				return []
			}
			return Object.values(classPlugins).map(p => p.name)
		})(),
	)

	const globalStyles: Record<string, CSSProperties> = {
		"*, ::before, ::after": {},
		"::backdrop": {},
	}

	const defaults = [globalStyles["*, ::before, ::after"], globalStyles["::backdrop"]]
	const utilityMap = new Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>()
	const variantMap = new Map<string, VariantSpec>()
	const arbitraryVariantMap = new Map<string, (value: string) => VariantSpec>()
	const arbitraryUtilityMap = new Map<string, Set<ValueType | "any">>()

	const options: UserPluginOptions = {
		addBase,
		addDefaults,
		addUtilities,
		addComponents,
		addVariant,
		matchUtilities,
		matchComponents,
		matchVariant,
		config: legacyConfig,
		theme: resolveTheme,
		e(value) {
			return escapeCss(value)
		},
		variants(corePlugin) {
			return []
		},
		corePlugins(feature: keyof CorePluginFeatures): boolean {
			return corePlugins.has(feature)
		},
		prefix(value) {
			return value
		},
	}

	// resolvePlugins

	const apiContext: CorePluginOptions = {
		...options,
		configObject: config,
		themeObject: config.theme,
	}

	const features = new Set<string>()
	let currentPluginName: string | undefined

	for (const [, plugin] of Object.entries(classPlugins)) {
		currentPluginName = plugin.name
		if (corePlugins.has(currentPluginName)) {
			features.add(currentPluginName)
			plugin(apiContext)
		}
		currentPluginName = undefined
	}

	for (const [, plugin] of Object.entries(variantPlugins)) {
		plugin(apiContext)
	}

	for (let i = 0; i < config.plugins.length; i++) {
		let plugin = config.plugins[i]
		if (isPluginWithOptions(plugin)) {
			plugin = plugin()
		}

		const pluginName = plugin["name"]
		if (isString(pluginName) && isNotEmpty(pluginName)) {
			currentPluginName = pluginName
		} else {
			currentPluginName = `userPlugin-${i}`
		}
		features.add(currentPluginName)

		if (isFunction(plugin)) {
			plugin(options)
		} else if (plugin.handler) {
			plugin.handler(options)
		}

		currentPluginName = undefined
	}

	resolveGlobalTheme(globalStyles)

	return {
		parser,
		globalStyles,
		utilities: utilityMap,
		variantMap,
		arbitraryVariants: arbitraryVariantMap,
		arbitraryUtilities: arbitraryUtilityMap,
		css,
		getPluginName,
		features,
		renderTheme(value) {
			return theme.renderTheme(config, value)
		},
		renderThemeFunc,
		getClassList() {
			return getClassListFrom(utilityMap)
		},
		getColorClasses() {
			return getColorClassesFrom(utilityMap)
		},
		getAmbiguous() {
			return getAmbiguousFrom(utilityMap)
		},
		cssVariant,
		...options,
	}

	function renderThemeFunc(value: string): string {
		return theme.renderThemeFunc(config, value)
	}
	function resolveTheme(value: string, defaultValue?: unknown): unknown {
		return theme.resolveThemeNoDefault(config, value, defaultValue)
	}

	function resolveGlobalTheme(g: CSSProperties): void {
		if (typeof g !== "object") return
		Object.entries(g).map(([key, child]) => {
			if (typeof child !== "object") {
				if (typeof child === "string") {
					g[key] = theme.renderThemeFunc(config, child)
				}
				return
			}
			resolveGlobalTheme(child)
		})
	}

	function legacyConfig(path: string, defaultValue?: unknown): unknown {
		const node = theme.parse_theme_val(path)
		const useDefault = true
		const target = theme.resolve(config, node.path, useDefault)
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
		properties = Object.fromEntries(Object.entries(properties).map(([key, value]) => [camelCase(key), value]))
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
				const rb = findRightBracket({ text: desc, start: reg.lastIndex - 1, brackets: [123, 125] })
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
			values?: ConfigObject
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
			values?: ConfigObject
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

				represent = (input, node, negative) => {
					if (negative && !supportsNegativeValues) return undefined
					return representAny({
						input,
						node,
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
				values = flattenColorPalette(values as Palette)
				isColor = true
			}

			const noAnyTypes = types.filter((t): t is ValueType => t !== "any")
			represent = (input, node, negative) => {
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

	function getPluginName(value: string): string | undefined {
		const program = parser.parse(value)
		if (program.expressions.length !== 1) {
			return undefined
		}

		const node = program.expressions[0]
		if (node.type !== NodeType.ClassName && node.type !== NodeType.ArbitraryClassname) {
			return undefined
		}

		const [, spec] = classname(node)
		return spec?.pluginName
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
		const program = parser.parse(value)
		for (let i = 0; i < program.expressions.length; i++) {
			process(program.expressions[i], rootStyle, importantRootStyle, rootFn, false)
		}
		return rootStyle
	}

	function process(
		node: Expression,
		root: CSSProperties,
		importantRoot: CSSProperties | undefined,
		variantCtx: VariantSpec,
		important: boolean,
	) {
		switch (node.type) {
			case NodeType.VariantSpan: {
				switch (node.variant.type) {
					case NodeType.SimpleVariant: {
						const variant = simpleVariant(node.variant)
						if (node.child) {
							process(node.child, root, importantRoot, compose(variantCtx, variant), important)
						}
						break
					}
					case NodeType.ArbitraryVariant: {
						const variant = arbitraryVariant(node.variant)
						if (node.child) {
							process(node.child, root, importantRoot, compose(variantCtx, variant), important)
						}
						break
					}
					case NodeType.ArbitrarySelector: {
						const variant = arbitrarySelector(node.variant)
						if (node.child) {
							process(node.child, root, importantRoot, compose(variantCtx, variant), important)
						}
						break
					}
				}
				break
			}
			case NodeType.Group: {
				for (let i = 0; i < node.expressions.length; i++) {
					process(node.expressions[i], root, importantRoot, variantCtx, important || node.important)
				}
				break
			}
			case NodeType.ClassName:
			case NodeType.ArbitraryClassname: {
				const [result, spec] = classname(node)
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
			case NodeType.ArbitraryProperty: {
				const i = node.decl.getText().indexOf(":")
				if (i !== -1) {
					const prop = node.decl.getText().slice(0, i).trim()
					const value = renderThemeFunc(node.decl.getText().slice(i + 1)).trim()
					if (prop && value) {
						let css: CSSProperties = { [camelCase(prop)]: value }

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
			case NodeType.ShortCss: {
				// do nothing
				break
			}
		}
	}

	function simpleVariant(node: SimpleVariant) {
		return variantMap.get(node.id.getText())
	}

	function arbitraryVariant(node: ArbitraryVariant) {
		let variant: VariantSpec | undefined
		const prefix = node.prefix.getText()
		if (prefix.endsWith("-")) {
			const key = prefix.slice(0, -1)
			const spec = arbitraryVariantMap.get(key)
			if (spec) {
				const input = node.selector.getText()
				variant = spec(input)
			}
		}
		return variant
	}

	function arbitrarySelector(node: ArbitrarySelector) {
		const value = node.selector
			.getText()
			.trim()
			.replace(/\s{2,}/g, " ")
		if (value) {
			const variant: VariantSpec = (css = {}) => ({ [value]: css })
			return variant
		}
		return undefined
	}

	function classname(node: Classname | ArbitraryClassname): [css?: CSSProperties, spec?: LookupSpec | StaticSpec] {
		let value: string
		if (node.type === NodeType.ClassName) {
			value = node.getText()
			if (value === "$e") {
				return [Math.E as unknown as CSSProperties]
			}
		} else {
			value = node.prefix.getText()
			if (node.expr) {
				node.expr.value = renderThemeFunc(node.expr.value)
			}
		}
		const { spec, negative, restInput } = parseInput(value)

		if (spec) {
			const arr = toArray(spec)
			if (arr.length === 1) {
				const c = arr[0]
				if (c.type === "lookup") {
					const css = c.represent(restInput, node, negative)
					if (css) {
						return [css, c]
					}
				} else {
					return [c.css, c]
				}
			} else if (arr.filter(c => c.type === "lookup").length > 1) {
				const lookup = arr.filter((c): c is LookupSpec => c.type === "lookup")
				const result = lookup
					.map(c => {
						const css = c.represent(restInput, node, negative)
						if (css) {
							return [css, c]
						}
						return undefined
					})
					.filter((t): t is [CSSProperties, LookupSpec] => !!t)
				if (result.length > 1) {
					return []
				} else if (result.length === 1) {
					return result[0]
				}

				const statik = arr.filter((c): c is StaticSpec => c.type === "static")
				if (statik.length > 0) {
					const c = statik[0]
					return [c.css, c]
				}
			} else {
				for (const c of arr) {
					if (c.type === "lookup") {
						const css = c.represent(restInput, node, negative)
						if (css) {
							return [css, c]
						}
					} else {
						return [c.css, c]
					}
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

	function cssVariant(...variants: Array<Variant | string>) {
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
					if (node.type !== NodeType.VariantSpan || node.variant.type === NodeType.SimpleVariant) {
						return undefined
					}

					if (node.variant.type === NodeType.ArbitrarySelector) {
						return arbitrarySelector(node.variant)
					}

					return arbitraryVariant(node.variant)
				}

				const node = value
				if (node.type === NodeType.SimpleVariant) {
					return variantMap.get(node.id.getText())
				}

				if (node.type === NodeType.ArbitrarySelector) {
					return arbitrarySelector(node)
				}

				return arbitraryVariant(node)
			}),
		)
	}
}
