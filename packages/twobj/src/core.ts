import * as parsel from "parsel-js"
import { classPlugins } from "./classPlugins"
import * as parser from "./parser"
import { camelCase } from "./parser"
import type { CorePluginOptions, UserPlugin, UserPluginOptions } from "./plugin"
import { preflight } from "./preflight"
import { CSSProperties, CSSValue, LookupSpec, PostModifier, StaticSpec, VariantSpec } from "./types"
import {
	applyCamelCase,
	applyImportant,
	applyModifier,
	flattenColorPalette,
	isCSSValue,
	merge,
	reverseSign,
	toArray,
} from "./util"
import { representAny, representTypes, ValueType } from "./values"
import { variantPlugins } from "./variantPlugins"

export function createContext(config: Tailwind.ResolvedConfigJS) {
	const separator = config.separator || ":"
	parser.setSeparator(separator)

	const globalStyles: Record<string, CSSProperties> = Object.assign(preflight, {
		"*, ::before, ::after": {},
		"::backdrop": {},
	})

	const defaults = [globalStyles["*, ::before, ::after"], globalStyles["::backdrop"]]
	const utilityMap = new Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>()
	const variantMap = new Map<string, VariantSpec>()
	const arbitraryVariantMap = new Map<string, (value: string) => VariantSpec>()
	const options = {
		addBase,
		addDefaults,
		addUtilities,
		addComponents: addUtilities,
		addVariant,
		matchUtilities,
		matchComponents: matchUtilities,
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

	for (const [, plugin] of Object.entries(classPlugins)) {
		plugin(apiContext)
		features.add(plugin.name)
	}
	for (const [, plugin] of Object.entries(variantPlugins)) {
		plugin(apiContext)
	}

	const userContext: UserPluginOptions = {
		...options,
		e(classname) {
			return classname
		},
		variants(corePlugin) {
			return []
		},
		config: legacyConfig,
		theme: resolveTheme,
		corePlugins(feature: keyof Tailwind.CorePluginFeatures): boolean {
			return features.has(feature)
		},
		prefix(value: string) {
			return value.startsWith(config.prefix) ? value.slice(config.prefix.length) : value
		},
	}

	for (let plugin of config.plugins) {
		if (typeof plugin === "function" && plugin.__isOptionsFunction) {
			plugin = (plugin as Tailwind.PluginFunctionWithOption)()
		}
		if (typeof plugin === "function") {
			const userPlugin = plugin as unknown as UserPlugin
			userPlugin(userContext)
		} else {
			if (plugin.handler) {
				const userPlugin = plugin.handler as unknown as UserPlugin
				userPlugin(userContext)
			}
		}
	}

	resolveGlobalTheme(globalStyles)

	return {
		globalStyles,
		utilities: utilityMap,
		variants: variantMap,
		arbitraryVariants: arbitraryVariantMap,
		css,
		features,
		config: legacyConfig,
		theme: resolveTheme,
		renderThemeFunc,
		prefix(value: string) {
			return value.startsWith(config.prefix) ? value.slice(config.prefix.length) : value
		},
		expandAtRules,
		addBase,
		addDefaults,
		addUtilities,
		addComponents: addUtilities,
		addVariant,
		matchUtilities,
		matchComponents: matchUtilities,
		matchVariant,
		getClassList(): string[] {
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
								.filter(val => reverseSign(String(spec.values[val])) != undefined)
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
		},
	}

	// accpet: 'colors.primary/<alpha-value>'
	function resolveTheme(value: string, defaultValue?: unknown) {
		return parser.resolveTheme(config, value, defaultValue)
	}

	// accpet: 'theme(colors.borderColor.500, <default-value>)
	function renderThemeFunc(value: string) {
		return parser.renderThemeFunc(config, value)
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

	function legacyConfig(path: string, defaultValue?: unknown) {
		const { path: nodes } = parser.parseThemeValue({
			config,
			text: path,
			useDefault: false,
		})
		return parser.resolvePath(config, nodes) ?? defaultValue
	}

	function addUtilitySpec(key: string, core: StaticSpec | LookupSpec) {
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

	function addBase(bases: CSSProperties | CSSProperties[]) {
		bases = toArray(bases).map(applyCamelCase).map(expandAtRules)
		merge(globalStyles, ...bases)
	}

	function addDefaults(pluginName: string, properties: Record<string, string | string[]>) {
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
	) {
		if (variantMap.has(variantName)) throw Error(`variant '${variantName} is duplicated.'`)
		variantDesc = toArray(variantDesc)
		variantDesc = variantDesc.map(v => v.replace(/:merge\((.*?)\)/g, "$1"))
		variantMap.set(variantName, createVariantSpec(variantDesc, options.postModifier))
	}

	function matchVariant(
		variants: Record<string, (value: string) => string | string[]>,
		options: {
			values?: Record<string, string>
			postModifier?: PostModifier
		} = {},
	) {
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
				return (css = {}) => ({ [desc]: { ...css } })
			} else {
				const rb = parser.findRightBracket({ text: desc, start: reg.lastIndex - 1, brackets: [123, 125] })
				if (rb == undefined) {
					return (css = {}) => ({ [desc]: css })
				}
				const scope = desc.slice(0, reg.lastIndex - 1).trim()
				const restDesc = desc.slice(reg.lastIndex, rb).trim()
				return (css = {}) => ({ [scope]: createVariantSpec([restDesc])(css) })
			}
		})
		return (css = {}) => {
			if (postModifier) {
				css = applyModifier(css, postModifier)
			}
			return Object.assign({}, ...fns.map(fn => fn(css)))
		}
	}

	function trimRightSeparator(value: string) {
		return value.endsWith(separator) ? value.slice(0, -separator.length) : value
	}

	function addUtilities(utilities: CSSProperties | CSSProperties[]) {
		utilities = toArray(utilities).map(applyCamelCase)
		const keyStylePairs = getKeyStylePairs(utilities)
		for (const [key, css] of keyStylePairs) {
			addUtilitySpec(key, {
				type: "static",
				css: expandAtRules(css),
				supportsNegativeValues: false,
			})
		}
		return
	}

	function findClasses(selector: string) {
		interface OtherNode {
			type: string
			list?: Node[]
			subtree?: Node
			left?: Node
			right?: Node
		}

		interface ClassNode {
			type: "class"
			content: string
			name: string
			pos: [number, number]
		}

		type Node = ClassNode & OtherNode

		const classes = new Map<string, ClassNode>()

		parser.splitAtTopLevelOnly(selector).forEach(s => walk(parsel.parse(s)))

		return classes

		function isObject(node: Node | undefined): node is Node {
			return typeof node === "object" && node !== null
		}

		function walk(node: Node) {
			if (!isObject(node)) {
				return
			}

			if (callback(node) === false) {
				return
			}

			if (Array.isArray(node.list)) {
				node.list.forEach(walk)
				return
			}

			if (isObject(node.subtree)) {
				walk(node.subtree)
				return
			}

			if (isObject(node.left)) {
				walk(node.left)
			}

			if (isObject(node.right)) {
				walk(node.right)
			}
		}

		function callback(node: Node): boolean | void {
			if (node.type === "class") {
				if (!classes.has(node.name)) {
					classes.set(node.name, node)
				}
				return false
			}
		}
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
					for (const [key] of selectors) {
						const rest = selector.replace(new RegExp(`[.]${key}(?!-)\\b`, "g"), "&")
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
		const AT_APPLY = "@apply "
		const AT_SCREEN = "@screen "

		const target: CSSProperties = {}
		for (const [key, value] of Object.entries(style)) {
			if (isCSSValue(value)) {
				target[key] = value
				continue
			}

			if (key.startsWith(AT_APPLY)) {
				const input = key.slice(AT_APPLY.length)
				merge(target, merge(css(input), expandAtRules(value)))
				continue
			}

			if (key.startsWith(AT_SCREEN)) {
				const input = key.slice(AT_SCREEN.length)
				const fn = compose(expandAtRules, variantMap.get(input))
				merge(target, fn(value))
				continue
			}

			target[key] = expandAtRules(value)
		}
		return target
	}

	function matchUtilities(
		utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>,
		{
			type = "any",
			values = {},
			supportsNegativeValues = false,
			filterDefault = false,
		}: {
			type?: (ValueType | "any") | (ValueType | "any")[]
			values?: Record<string, unknown>
			supportsNegativeValues?: boolean
			filterDefault?: boolean
		} = {},
	) {
		for (const [key, fn] of Object.entries(utilities)) {
			let represent: LookupSpec["represent"]
			const types = toArray(type)
			if (types.some(t => t === "any")) {
				represent = (input, node, getText, config, negative) => {
					if (negative && !supportsNegativeValues) return undefined
					return representAny({
						input,
						node,
						getText,
						values,
						negative,
						get ambiguous() {
							return Array.isArray(utilityMap.get(key))
						},
						template(value) {
							const css = fn(value)
							return merge({}, ...toArray(css).map(applyCamelCase))
						},
						config,
						filterDefault,
					})
				}
				addUtilitySpec(key, {
					type: "lookup",
					values: values ?? {},
					represent,
					supportsNegativeValues,
					filterDefault,
				})
				continue
			}

			// if types has 'color', always flatten the values
			if (types.some(t => t === "color")) {
				values = flattenColorPalette(values)
			}

			represent = (input, node, getText, config, negative) => {
				if (negative && !supportsNegativeValues) return undefined
				return representTypes({
					input,
					node,
					getText,
					values,
					negative,
					types: types.filter((t): t is ValueType => t !== "any"),
					filterDefault,
					get ambiguous() {
						return Array.isArray(utilityMap.get(key))
					},
					template(value) {
						const css = fn(value)
						return merge({}, ...toArray(css))
					},
					config,
				})
			}
			addUtilitySpec(key, {
				type: "lookup",
				values: values ?? {},
				represent,
				supportsNegativeValues,
				filterDefault,
			})
		}
	}

	function compose(...variants: (VariantSpec | undefined)[]): VariantSpec {
		let ret: VariantSpec = (css = {}) => css
		for (const f of variants) {
			if (f) {
				const g = ret
				ret = (css = {}) => f(g(css))
			}
		}
		return ret
	}

	///

	function css(value: string): CSSProperties {
		const rootStyle: CSSProperties = {}
		const rootFn: VariantSpec = (css = {}) => css
		const getText = (node: parser.BaseNode) => value.slice(node.range[0], node.range[1])
		const program = parser.parse(value)
		for (let i = 0; i < program.expressions.length; i++) {
			process(program.expressions[i], rootStyle, rootFn, getText, false)
		}
		return rootStyle
	}

	function process(
		node: parser.TwExpression,
		root: CSSProperties,
		variantCtx: VariantSpec,
		getText: (node: parser.BaseNode) => string,
		important: boolean,
	) {
		switch (node.type) {
			case parser.NodeType.VariantSpan: {
				switch (node.variant.type) {
					case parser.NodeType.SimpleVariant: {
						const input = getText(node.variant)
						const variant = variantMap.get(trimRightSeparator(input))
						if (node.child) {
							process(node.child, root, compose(variant, variantCtx), getText, important)
						}
						break
					}
					case parser.NodeType.ArbitraryVariant: {
						let variant: VariantSpec = (css = {}) => css
						const prefix = getText(node.variant.prefix)
						if (prefix.endsWith("-")) {
							const key = prefix.slice(0, -1)
							const spec = arbitraryVariantMap.get(key)
							if (spec) {
								const input = getText(node.variant.selector)
								variant = spec(input)
							}
						}
						if (node.child) {
							process(node.child, root, compose(variant, variantCtx), getText, important)
						}
						break
					}
					case parser.NodeType.ArbitrarySelector: {
						const input = getText(node.variant.selector)
						const variant: VariantSpec = (css = {}) => ({ [input]: css })
						if (node.child) {
							process(node.child, root, compose(variant, variantCtx), getText, important)
						}
						break
					}
				}
				break
			}
			case parser.NodeType.Group: {
				for (let i = 0; i < node.expressions.length; i++) {
					process(node.expressions[i], root, variantCtx, getText, important || node.important)
				}
				break
			}
			case parser.NodeType.ClassName:
			case parser.NodeType.ArbitraryClassname: {
				let css = classname(node, getText)
				if (css != undefined) {
					if (important || node.important) {
						css = applyImportant(css)
					}
				}
				merge(root, variantCtx(css))
				break
			}
			case parser.NodeType.ArbitraryProperty: {
				const i = node.decl.value.indexOf(":")
				if (i !== -1) {
					const prop = node.decl.value.slice(0, i).trim()
					const value = node.decl.value.slice(i + 1).trim()
					if (prop && value) {
						let css: CSSProperties = { [camelCase(prop)]: value }
						if (css != undefined && (important || node.important)) css = applyImportant(css)
						merge(root, variantCtx(css))
					}
				}
				break
			}
		}
	}

	function classname(
		node: parser.Classname | parser.ArbitraryClassname,
		getText: (node: parser.BaseNode) => string,
	): CSSProperties | undefined {
		const value = node.type === parser.NodeType.ClassName ? getText(node) : getText(node.prefix)
		const { spec, negative, restInput } = parseInput(value)
		if (!spec) return undefined

		for (const c of toArray(spec)) {
			if (c.type === "lookup") {
				const result = c.represent(restInput, node, getText, config, negative)
				if (result) return result
			} else {
				return c.css
			}
		}
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
			result.spec = utilityMap.get(key)
			if (result.spec) {
				result.restInput = input.slice(i + 1)
				return result
			}
		}

		return result
	}
}
