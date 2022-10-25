import { classPlugins } from "./classPlugins"
import { camelCase, createParser } from "./parser"
import * as nodes from "./parser/nodes"
import * as theme from "./parser/theme"
import { isPluginWithOptions } from "./plugin"
import { escapeCss, findClasses } from "./postcss"
import type {
	Context,
	CorePluginFeatures,
	CorePluginOptions,
	CreateContextOptions,
	CSSProperties,
	LookupSpec,
	LookupVariantSpec,
	Palette,
	Post,
	ResolvedConfigJS,
	StaticSpec,
	UserPluginOptions,
	ValueType,
	Variant,
	VariantSpec,
} from "./types"
import { createParseError } from "./types/errors"
import {
	applyCamelCase,
	applyImportant,
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
import { createVariant, mergeVariants, representVariant } from "./variant"
import { variantPlugins } from "./variantPlugins"

/** Create a tailwind context. */
export function createContext(config: ResolvedConfigJS, { throwError = false }: CreateContextOptions = {}): Context {
	let validate = throwError

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
	const utilitySpecCollection = new Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>()
	const variantSpecCollection = new Map<
		string,
		VariantSpec | LookupVariantSpec | Array<VariantSpec | LookupVariantSpec>
	>()

	const arbitraryVariantCollection = new Set<string>()
	const arbitraryUtilityCollection = new Map<string, Set<ValueType | "any">>()

	const __utilities = new Set<string>()
	const __variants = new Set<string>()

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
		currentPluginName = plugin.name
		plugin(apiContext)
		currentPluginName = undefined
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

	__utilities.clear()
	__variants.clear()

	return {
		parser,
		globalStyles,
		utilities: utilitySpecCollection,
		variantMap: variantSpecCollection,
		arbitraryVariants: arbitraryVariantCollection,
		arbitraryUtilities: arbitraryUtilityCollection,
		css,
		wrap,
		resolveUtility,
		resolveVariant,
		features,
		renderTheme(value) {
			return theme.renderTheme(config, value)
		},
		renderThemeFunc,
		getUtilities() {
			return getClassListFrom(utilitySpecCollection)
		},
		getVariants() {
			const c = new Set<string>()
			for (const [variantName, spec] of variantSpecCollection) {
				if (Array.isArray(spec)) {
					for (const s of spec) {
						if (s.type === "static") {
							c.add(variantName)
						} else if (s.type === "lookup") {
							for (const val of Object.keys(s.values)) {
								c.add(variantName + "-" + val)
							}
						}
					}
				} else if (spec.type === "static") {
					c.add(variantName)
				} else if (spec.type === "lookup") {
					for (const val of Object.keys(spec.values)) {
						c.add(variantName + "-" + val)
					}
				}
			}
			return c
		},
		getColorUtilities() {
			return getColorClassesFrom(utilitySpecCollection)
		},
		getAmbiguous() {
			return getAmbiguousFrom(utilitySpecCollection)
		},
		set throwError(e: boolean) {
			validate = e
		},
		get throwError(): boolean {
			return validate
		},
		...options,
	}

	function renderThemeFunc(value: string): string {
		return theme.renderThemeFunc(config, value)
	}

	function resolveTheme(value: string, defaultValue?: unknown): unknown {
		return theme.resolveThemeNoDefault(config, value, defaultValue)
	}

	function resolveGlobalTheme(g: CSSProperties[string]): void {
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

	function addVariantSpec(key: string, core: VariantSpec | LookupVariantSpec): void {
		if (validate) {
			if (core.type === "static") {
				if (__variants.has(key)) {
					throw Error("Duplcate variant: " + key)
				}
				__variants.add(key)
			} else if (core.type === "lookup") {
				for (const k in core.values) {
					if (__variants.has(key + "-" + k)) {
						throw Error("Duplcate variant: " + key + "-" + k)
					}
				}
			}
		}

		core.pluginName = currentPluginName

		const obj = variantSpecCollection.get(key)
		if (obj == null) {
			variantSpecCollection.set(key, core)
			return
		}
		if (Array.isArray(obj)) {
			obj.push(core)
			return
		}
		variantSpecCollection.set(key, [obj, core])
	}

	function addUtilitySpec(key: string, core: StaticSpec | LookupSpec): void {
		if (validate) {
			if (core.type === "static") {
				if (__utilities.has(key)) {
					throw Error("Duplcate utility: " + key)
				}
				__utilities.add(key)
			} else if (core.type === "lookup") {
				for (const k in core.values) {
					if (__utilities.has(key + "-" + k)) {
						throw Error("Duplcate utility: " + key + "-" + k)
					}
				}
			}
		}

		core.pluginName = currentPluginName

		const obj = utilitySpecCollection.get(key)
		if (obj == null) {
			utilitySpecCollection.set(key, core)
			return
		}
		if (Array.isArray(obj)) {
			obj.push(core)
			return
		}
		utilitySpecCollection.set(key, [obj, core])
	}

	function addBase(bases: CSSProperties | CSSProperties[]): void {
		bases = toArray(bases).map(applyCamelCase).map(expandAtRules)
		merge(globalStyles, ...bases)
	}

	function addDefaults(pluginName: string, properties: Record<string, string | string[]>): void {
		const decls: Record<string, string>[] = Object.entries(properties)
			.map(([key, value]) => {
				if (typeof value === "string") {
					return { [camelCase(key)]: value }
				}
				return value.map(value => ({ [camelCase(key)]: value }))
			})
			.flat()
		for (let i = 0; i < defaults.length; i++) {
			merge(defaults[i], ...decls)
		}
	}

	function addVariant(
		variantName: string,
		variantDesc: string | (() => string) | Array<string | (() => string | string[])>,
		{
			post,
		}: {
			post?: Post
		} = {},
	): void {
		variantDesc = toArray(variantDesc)
		const desc: string[] = []
		for (const d of variantDesc) {
			if (typeof d === "function") {
				const ans = d()
				if (Array.isArray(ans)) {
					desc.push(...ans)
				} else {
					desc.push(ans)
				}
			} else {
				desc.push(d)
			}
		}
		for (let i = 0; i < desc.length; i++) {
			desc[i] = desc[i].replace(/:merge\((.*?)\)/g, "$1")
		}
		addVariantSpec(variantName, {
			type: "static",
			variant: createVariant(desc, post),
			post,
		})
	}

	function matchVariant<T>(
		variantName: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		render: (value: T, options: { modifier?: string; wrapped?: boolean }) => string | string[],
		{
			values = {},
			filterDefault = false,
			post,
		}: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			values?: Record<string, any>
			post?: Post
			filterDefault?: boolean
		} = {},
	): void {
		addVariantSpec(variantName, {
			type: "lookup",
			values,
			post,
			filterDefault,
			represent(restIndex, node) {
				return representVariant({ restIndex, node, filterDefault, values, render, post })
			},
		})
		arbitraryVariantCollection.add(variantName)
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
				respectPrefix,
				respectImportant,
			})
		}
		return
	}

	function getKeyStylePairs(styles: CSSProperties[]): Map<string, CSSProperties> {
		const ret = new Map<string, CSSProperties>()
		const result: [string, CSSProperties][] = []
		for (const s of styles) {
			const t = traverse(s)
			if (t) result.push(...t)
		}
		for (const [key, css] of result) {
			const value = ret.get(key)
			if (value != undefined) {
				ret.set(key, merge(value, css))
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
				const spec = variantSpecCollection.get(input) ?? []
				const specs = toArray(spec)
					.filter((s): s is VariantSpec => s.type === "static")
					.map(v => v.variant)
				const fn = composeVariants(...specs, expandAtRules)
				merge(target, fn(value))
				continue
			}

			target[key] = expandAtRules(value)
		}
		return target
	}

	function matchComponents(
		components: Record<string, (value: unknown) => CSSProperties | CSSProperties[]>,
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
		utilities: Record<
			string,
			(value: unknown, options: { modifier?: string; wrapped?: boolean }) => CSSProperties | CSSProperties[]
		>,
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
				let spec = utilitySpecCollection.get(key)
				if (spec) {
					spec = toArray(spec).filter((s): s is LookupSpec => s.type === "lookup")
					ambiguous = spec.length > 1
				}

				represent = (restIndex, node, negative) => {
					if (negative && !supportsNegativeValues) return undefined
					return representAny({
						restIndex,
						node,
						values,
						negative,
						ambiguous,
						render(...args) {
							const css = fn(...args)
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
					respectPrefix,
					respectImportant,
				})
				const valueTypes = arbitraryUtilityCollection.get(key)
				if (valueTypes) {
					valueTypes.add("any")
				} else {
					arbitraryUtilityCollection.set(key, new Set(["any"]))
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
			represent = (restIndex, node, negative) => {
				if (negative && !supportsNegativeValues) return undefined

				let ambiguous = false
				let spec = utilitySpecCollection.get(key)
				if (spec) {
					spec = toArray(spec).filter((s): s is LookupSpec => s.type === "lookup")
					ambiguous = spec.length > 1
				}

				return representTypes({
					restIndex,
					node,
					values,
					negative,
					types: noAnyTypes,
					filterDefault,
					ambiguous,
					render(...args) {
						const css = fn(...args)
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
				respectPrefix,
				respectImportant,
			})
			const valueTypes = arbitraryUtilityCollection.get(key)
			if (valueTypes) {
				noAnyTypes.forEach(type => {
					valueTypes.add(type)
				})
			} else {
				arbitraryUtilityCollection.set(key, new Set(noAnyTypes))
			}
		}
	}

	function composeVariants(...variants: (Variant | undefined)[]): Variant {
		let spec: Variant = (css = {}) => css
		for (const f of variants.reverse()) {
			if (f) {
				const g = spec
				spec = (css = {}) => f(g(css))
			}
		}
		return spec
	}

	function resolveVariant(
		value: string,
	): [variant?: Variant | undefined, spec?: LookupVariantSpec | VariantSpec | undefined] {
		const program = parser.createProgram(value)
		if (program.expressions.length !== 1) {
			return []
		}

		const node = program.expressions[0]
		if (node.type !== nodes.NodeType.VariantSpan) {
			return []
		}
		if (
			node.variant.type !== nodes.NodeType.SimpleVariant &&
			node.variant.type !== nodes.NodeType.ArbitraryVariant
		) {
			return []
		}

		return variant(node.variant)
	}

	function resolveUtility(
		value: string,
	): [style?: CSSProperties | undefined, spec?: LookupSpec | StaticSpec | undefined] {
		const program = parser.createProgram(value)
		if (program.expressions.length !== 1) {
			return []
		}

		const node = program.expressions[0]
		if (node.type !== nodes.NodeType.Classname && node.type !== nodes.NodeType.ArbitraryClassname) {
			return []
		}

		return classname(node)
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

		const rootFn: Variant = (css = {}) => css
		const program = parser.createProgram(value)
		for (let i = 0; i < program.expressions.length; i++) {
			process(program.expressions[i], rootStyle, importantRootStyle, rootFn, false)
		}
		return rootStyle
	}

	function process(
		node: nodes.Expression,
		root: CSSProperties,
		importantRoot: CSSProperties | undefined,
		variantCtx: Variant,
		important: boolean,
	) {
		switch (node.type) {
			case nodes.NodeType.VariantSpan: {
				let variant: Variant | undefined
				switch (node.variant.type) {
					case nodes.NodeType.SimpleVariant:
						variant = simpleVariant(node.variant)
						break
					case nodes.NodeType.ArbitraryVariant:
						variant = arbitraryVariant(node.variant)
						break
					case nodes.NodeType.ArbitrarySelector:
						variant = arbitrarySelector(node.variant)
						break
					case nodes.NodeType.UnknownVariant:
						variant = unknownVariant(node.variant)
						break
					case nodes.NodeType.GroupVariant:
						variant = wrapGroupVariant(node.variant)
						break
				}
				if (node.child) {
					process(node.child, root, importantRoot, composeVariants(variantCtx, variant), important)
				}
				break
			}
			case nodes.NodeType.Group: {
				if (validate) {
					if (!node.closed) {
						throw createParseError(node, "Bracket is not closed.")
					}
				}
				for (let i = 0; i < node.expressions.length; i++) {
					process(node.expressions[i], root, importantRoot, variantCtx, important || node.important)
				}
				break
			}
			case nodes.NodeType.Classname:
				if (node.m?.closed === false) {
					throw createParseError(node, "Bracket is not closed.")
				}
			// eslint-disable-next-line no-fallthrough
			case nodes.NodeType.ArbitraryClassname: {
				if (validate && node.type === nodes.NodeType.ArbitraryClassname) {
					if (!node.closed) {
						throw createParseError(node, "Bracket is not closed.")
					}
					if (node.m?.closed === false) {
						throw createParseError(node.m, "Bracket is not closed.")
					}
				}
				const [result, spec] = classname(node)
				let css = result
				if (css == undefined) {
					if (validate) {
						throw createParseError(node, "Utility is not found.")
					}
				} else if (important || node.important || (spec?.respectImportant && importantAll)) {
					css = applyImportant(css)
				}
				if (spec?.respectImportant && importantRoot) {
					merge(importantRoot, variantCtx(css))
				} else {
					merge(root, variantCtx(css))
				}
				break
			}
			case nodes.NodeType.ArbitraryProperty: {
				if (validate) {
					if (!node.closed) {
						throw createParseError(node, "Bracket is not closed.")
					}
				}
				const i = node.decl.text.indexOf(":")
				if (i !== -1) {
					const prop = node.decl.text.slice(0, i).trim()
					const value = renderThemeFunc(node.decl.text.slice(i + 1)).trim()
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
			case nodes.NodeType.UnknownClassname: {
				if (validate) {
					throw createParseError(node, "Not supported.")
				}
				break
			}
		}
	}

	function simpleVariant(node: nodes.SimpleVariant): Variant | undefined {
		let ret: Variant | undefined
		const [result] = variant(node)
		if (result) {
			ret = result
		}
		if (validate) {
			if (ret == undefined) {
				throw createParseError(node, "Variant is not found.")
			}
		}
		return ret
	}

	function arbitraryVariant(node: nodes.ArbitraryVariant): Variant | undefined {
		let ret: Variant | undefined
		const [result] = variant(node)
		if (result) {
			ret = result
		}
		if (validate) {
			if (ret == undefined) {
				throw createParseError(node, "Variant is not found.")
			}
		}
		return ret
	}

	function arbitrarySelector(node: nodes.ArbitrarySelector) {
		return createVariant([node.selector.text])
	}

	function unknownVariant(node: nodes.UnknownVariant) {
		let variant: Variant | undefined
		if (validate) {
			throw createParseError(node, "Not supported.")
		}
		return variant
	}

	function variant(
		node: nodes.SimpleVariant | nodes.ArbitraryVariant,
	): [variant?: Variant | undefined, spec?: VariantSpec | LookupVariantSpec] {
		if (node.type === nodes.NodeType.ArbitraryVariant) {
			if (node.value.text) {
				node.resolved = renderThemeFunc(node.value.text)
			}
		}

		const { spec, negative, restIndex } = parseInput(
			variantSpecCollection,
			node.key.text,
			node.key.start,
			node.key.end,
		)
		if (!spec) {
			return []
		}

		if (negative) {
			return []
		}

		const arr = toArray(spec)

		for (const spec of arr) {
			if (spec.type === "static") {
				return [spec.variant, spec]
			} else {
				const variant = spec.represent(restIndex, node)
				if (variant != undefined) {
					return [variant, spec]
				}
			}
		}

		return []
	}

	function classname(
		node: nodes.Classname | nodes.ArbitraryClassname,
	): [css?: CSSProperties, spec?: LookupSpec | StaticSpec] {
		if (node.type === nodes.NodeType.ArbitraryClassname) {
			if (node.value.text) {
				node.resolved = renderThemeFunc(node.value.text)
			}
		}

		const { spec, negative, restIndex } = parseInput(
			utilitySpecCollection,
			node.key.text,
			node.key.start,
			node.key.end,
		)
		let specs = toArray(spec ?? [])

		if (node.type === nodes.NodeType.ArbitraryClassname) {
			specs = specs.filter((c): c is LookupSpec => c?.type === "lookup")
		}

		if (specs.length === 1) {
			const c = specs[0]
			if (c.type === "lookup") {
				const css = c.represent(restIndex, node, negative)
				if (css) {
					return [css, c]
				}
			} else {
				return [{ ...c.css }, c]
			}
		} else if (specs.filter(c => c.type === "lookup").length > 1) {
			const lookup = specs.filter((c): c is LookupSpec => c.type === "lookup")
			const result = lookup
				.map(c => {
					const css = c.represent(restIndex, node, negative)
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

			const statik = specs.filter((c): c is StaticSpec => c.type === "static")
			if (statik.length > 0) {
				const c = statik[0]
				return [{ ...c.css }, c]
			}
		} else {
			for (const c of specs) {
				if (c.type === "lookup") {
					const css = c.represent(restIndex, node, negative)
					if (css) {
						return [css, c]
					}
				} else {
					return [{ ...c.css }, c]
				}
			}
		}
		return []
	}

	function parseInput<S>(collection: Map<string, S | S[]>, text: string, start: number, end: number) {
		let spec = collection.get(text)
		const ret = { spec, negative: false, restIndex: end }
		if (spec) {
			return ret
		}

		if (text[0] === "-") {
			ret.negative = true
			text = text.slice(1)
		}

		const x = text.lastIndexOf("/")
		if (x !== -1) {
			text = text.slice(0, x)
		}

		spec = collection.get(text)
		if (spec) {
			ret.spec = spec
			ret.restIndex = (ret.negative ? 1 : 0) + start + text.length
			return ret
		}

		let i = text.length
		while (i > 0) {
			i = text.lastIndexOf("-", i - 1)
			if (i === -1) {
				break
			}

			const key = text.slice(0, i)
			spec = collection.get(key)
			if (!spec) {
				continue
			}

			const lookupSpec = toArray(spec).filter(s => s["type"] === "lookup")
			if (lookupSpec.length === 0) {
				continue
			}

			ret.spec = lookupSpec
			ret.restIndex = (ret.negative ? 1 : 0) + start + i + 1
			return ret
		}

		return ret
	}

	function wrapExpression(expr: nodes.Expression, variantGroup = false) {
		if (expr.type === nodes.NodeType.VariantSpan) {
			return wrapVariantSpan(expr, variantGroup)
		}
		if (variantGroup && expr.type === nodes.NodeType.Group) {
			return mergeVariants(...expr.expressions.map(expr => wrapExpression(expr, true)))
		}
		return undefined
	}

	function wrapGroupVariant(node: nodes.GroupVariant): Variant {
		return mergeVariants(...node.expressions.map(expr => wrapExpression(expr, true)))
	}

	function wrapVariantSpan({ variant, child }: nodes.VariantSpan, variantGroup = false): Variant {
		if (!child) {
			return wrap(variant)
		}
		return composeVariants(
			wrap(variant),
			wrapExpression(child, variantGroup || variant.type === nodes.NodeType.GroupVariant),
		)
	}

	function wrap(variants: string | TemplateStringsArray | nodes.Variant, ...args: nodes.Variant[]): Variant {
		if (variants == undefined) {
			return (css = {}) => css
		}

		if (typeof variants === "string") {
			return mergeVariants(...parser.createProgram(variants).expressions.map(expr => wrapExpression(expr)))
		}

		if (!nodes.isVariant(variants)) {
			variants = variants[0]
			return mergeVariants(...parser.createProgram(variants).expressions.map(expr => wrapExpression(expr)))
		}

		args.unshift(variants)
		args = args.filter(isNotEmpty)

		return composeVariants(
			...args.map(value => {
				const node = value
				if (node.type === nodes.NodeType.SimpleVariant) {
					return simpleVariant(node)
				}

				if (node.type === nodes.NodeType.ArbitraryVariant) {
					return arbitraryVariant(node)
				}

				if (node.type === nodes.NodeType.ArbitrarySelector) {
					return arbitrarySelector(node)
				}

				if (node.type === nodes.NodeType.UnknownVariant) {
					return unknownVariant(node)
				}

				return wrapGroupVariant(node)
			}),
		)
	}
}
