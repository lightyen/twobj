import postcss from "postcss"
import postcssJs from "postcss-js"
import expandApplyAtRules from "tailwindcss/lib/lib/expandApplyAtRules"
import { generateRules } from "tailwindcss/lib/lib/generateRules"
import { createContext } from "tailwindcss/lib/lib/setupContextUtils"
import escapeClassName from "tailwindcss/lib/util/escapeClassName"
import resolveConfig from "tailwindcss/resolveConfig"
import { Config } from "tailwindcss/types/config"
import { escapeRegexp } from "../src/parser"
import { CSSProperties } from "../src/types"
import { isCSSEntry } from "../src/util"
import { context } from "./context"

test("diff tailwindcss", async () => {
	const ctx = createContext(resolveConfig({} as Config))

	/** classnames */

	const tailwind = ctx.getClassList().filter(classname => {
		// Deprecated, replace with 'grow'
		if (/flex-grow(-\d+)?$/.test(classname)) {
			return false
		}

		// Deprecated, replace with 'shrink'
		if (/flex-shrink(-\d+)?$/.test(classname)) {
			return false
		}

		// Deprecated, replace with 'bg-red-500/80'
		if (/^(text|bg|divide|border|placeholder|ring)-opacity-\d+$/.test(classname)) {
			return false
		}

		switch (classname) {
			case "*":
			case "overflow-ellipsis": // Deprecated, replace with 'text-ellipsis'
			case "decoration-slice": // Deprecated, replace with 'box-decoration-slice'
			case "decoration-clone": // Deprecated, replace with 'box-decoration-clone'
				return false
		}

		return true
	})

	const s0 = new Set(context.getClassList())
	const s1 = new Set(tailwind)
	for (const s of s0) {
		expect(s1).toContain(s)
	}
	for (const s of s1) {
		expect(s0).toContain(s)
	}

	/** variants */

	const s2 = new Set(ctx.variantMap.keys())
	const s3 = new Set(context.variantMap.keys())
	for (const s of s2) {
		expect(s3).toContain(s)
	}
	for (const s of s3) {
		expect(s2).toContain(s)
	}

	const colors = context.getColorClasses()
	for (const c of tailwind.filter(classname => {
		if (classname[0] === "-") return false
		if (classname.startsWith("float")) return false
		if (classname.startsWith("transform")) return false
		if (classname.startsWith("translate")) return false
		if (classname.startsWith("rotate")) return false
		if (classname.startsWith("scale")) return false
		if (classname.startsWith("skew")) return false
		if (classname.startsWith("origin")) return false
		if (classname.startsWith("shadow")) return false
		if (colors.has(classname)) return false
		return true
	})) {
		const c0 = context.css(c)
		const root = objectify(c)
		const c1 = postcssJs.objectify(root)
		if (c === "sr-only" || c === "not-sr-only") {
			c1["marginTop"] = c1["margin"]
			c1["marginBottom"] = c1["margin"]
			c1["marginLeft"] = c1["margin"]
			c1["marginRight"] = c1["margin"]
			c1["paddingTop"] = c1["padding"]
			c1["paddingBottom"] = c1["padding"]
			c1["paddingLeft"] = c1["padding"]
			c1["paddingRight"] = c1["padding"]
			delete c1["margin"]
			delete c1["padding"]
		}
		if (c.startsWith("m-") && c1["margin"]) {
			c1["marginTop"] = c1["margin"]
			c1["marginBottom"] = c1["margin"]
			c1["marginLeft"] = c1["margin"]
			c1["marginRight"] = c1["margin"]
			delete c1["margin"]
		}
		if (c.startsWith("p-") && c1["padding"]) {
			c1["paddingTop"] = c1["padding"]
			c1["paddingBottom"] = c1["padding"]
			c1["paddingLeft"] = c1["padding"]
			c1["paddingRight"] = c1["padding"]
			delete c1["padding"]
		}

		if (c.startsWith("scroll-m-") && c1["scrollMargin"]) {
			c1["scrollMarginTop"] = c1["scrollMargin"]
			c1["scrollMarginBottom"] = c1["scrollMargin"]
			c1["scrollMarginLeft"] = c1["scrollMargin"]
			c1["scrollMarginRight"] = c1["scrollMargin"]
			delete c1["scrollMargin"]
		}
		if (c.startsWith("scroll-p-") && c1["scrollPadding"]) {
			c1["scrollPaddingTop"] = c1["scrollPadding"]
			c1["scrollPaddingBottom"] = c1["scrollPadding"]
			c1["scrollPaddingLeft"] = c1["scrollPadding"]
			c1["scrollPaddingRight"] = c1["scrollPadding"]
			delete c1["scrollPadding"]
		}

		stringProperties(c0)
		stringProperties(c1)
		expect(c0).toEqual(c1)
	}

	return

	function stringProperties(c: CSSProperties) {
		for (const k in c) {
			const value = c[k]

			if (!isCSSEntry(value)) {
				stringProperties(value)
			} else {
				c[k] = `${c[k]}`
			}
		}
	}

	function render(classname: string) {
		const items = generateRules([classname], ctx).sort(([a], [b]) => {
			if (a < b) {
				return -1
			} else if (a > b) {
				return 1
			} else {
				return 0
			}
		})

		const root = postcss.root({ nodes: items.map(([, rule]) => rule) })
		expandApplyAtRules(ctx)(root)

		root.walkAtRules("defaults", rule => {
			rule.remove()
		})

		return root
	}

	function objectify(classname: string) {
		const replace = (str: string) => {
			return str.replace(new RegExp(`[.]${escapeRegexp(escapeClassName(classname))}(?!-)\\b`, "g"), "&")
		}
		const root = render(classname)
		root.walkRules(rule => {
			rule.selector = replace(rule.selector)
			if (rule.selector === "&") {
				if (rule.parent) {
					if (rule.parent.type !== "root") {
						rule.parent.nodes = rule.nodes
					}
				}
			}
		})
		if (root.nodes.some(n => n.type === "rule" && n.selector === "&")) {
			const fake = postcss.rule({ selector: "&" })
			root.each(n => {
				if (n.type === "rule" && n.selector === "&") {
					fake.nodes.push(...n.nodes)
				} else {
					fake.nodes.push(n)
				}
			})
			return fake
		}
		return root
	}
})
