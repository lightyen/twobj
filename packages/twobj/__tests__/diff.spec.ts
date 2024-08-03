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
import { isCSSValue } from "../src/util"
import { context } from "./context"

test("diff tailwindcss", async () => {
	const tailwindContext = createContext(resolveConfig({} as Config))

	/** classnames */

	const tailwind: string[] = tailwindContext.getClassList().filter(classname => {
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

		// Not supported
		if (/^contain-/.test(classname)) {
			return false
		}

		switch (classname) {
			case "overflow-ellipsis": // Deprecated, replace with 'text-ellipsis'
			case "decoration-slice": // Deprecated, replace with 'box-decoration-slice'
			case "decoration-clone": // Deprecated, replace with 'box-decoration-clone'
				return false
		}

		return true
	})

	const libSet = new Set(context.getUtilities())
	const tailwindSet = new Set(tailwind)
	for (const name of libSet) {
		if (/^bg-gradient/.test(name)) {
			continue
		}
		expect(tailwindSet).toContain(name)
	}
	for (const name of tailwindSet) {
		if (/^bg-gradient/.test(name as string)) {
			continue
		}
		expect(libSet).toContain(name)
	}

	/** variants */

	const tailwindVariants = new Set<string>()
	tailwindContext.getVariants().forEach(v => {
		if (v.isArbitrary) {
			for (const value of v.values) {
				tailwindVariants.add(v.name + "-" + value)
			}
		} else {
			// Not supported
			if (v.name === "*") {
				return
			}
			tailwindVariants.add(v.name)
		}
	})

	const libVariants = context.getVariants()
	for (const s of tailwindVariants) {
		expect(libVariants).toContain(s)
	}

	const colors = context.getColorUtilities()
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
		if (classname.startsWith("bg-gradient")) return false
		if (classname.startsWith("from-")) return false
		if (classname.startsWith("via-")) return false
		if (classname.startsWith("to-")) return false
		if (classname.startsWith("touch-")) return false
		if (classname.startsWith("snap-")) return false
		if (classname.startsWith("border-spacing-")) return false
		if (classname.startsWith("shadow")) return false
		if (classname.startsWith("ring")) return false
		if (classname.startsWith("filter")) return false
		if (classname.startsWith("blur")) return false
		if (classname.startsWith("brightness")) return false
		if (classname.startsWith("contrast")) return false
		if (classname.startsWith("grayscale")) return false
		if (classname.startsWith("hue-rotate")) return false
		if (classname.startsWith("invert")) return false
		if (classname.startsWith("saturate")) return false
		if (classname.startsWith("sepia")) return false
		if (classname.startsWith("drop-shadow")) return false
		if (classname.startsWith("backdrop-filter")) return false
		if (classname.startsWith("backdrop-blur")) return false
		if (classname.startsWith("backdrop-brightness")) return false
		if (classname.startsWith("backdrop-contrast")) return false
		if (classname.startsWith("backdrop-grayscale")) return false
		if (classname.startsWith("backdrop-hue-rotate")) return false
		if (classname.startsWith("backdrop-invert")) return false
		if (classname.startsWith("backdrop-saturate")) return false
		if (classname.startsWith("backdrop-sepia")) return false
		if (classname.startsWith("backdrop-drop-shadow")) return false
		if (classname.startsWith("backdrop-opacity")) return false
		if (classname.startsWith("space-x")) return false
		if (classname.startsWith("space-y")) return false
		if (classname.startsWith("divide-x")) return false
		if (classname.startsWith("divide-y")) return false
		if (classname === "bg-none") return false
		if (classname === "normal-nums") return false
		if (classname === "ordinal") return false
		if (classname === "slashed-zero") return false
		if (classname === "lining-nums") return false
		if (classname === "oldstyle-nums") return false
		if (classname === "proportional-nums") return false
		if (classname === "tabular-nums") return false
		if (classname === "diagonal-fractions") return false
		if (classname === "stacked-fractions") return false
		if (colors.has(classname)) return false
		return true
	})) {
		const c0 = context.css(c)
		const root = objectify(c)
		const c1 = postcssJs.objectify(root)

		stringProperties(c0)
		stringProperties(c1)
		expect(c0).toEqual(c1)
	}

	return

	function stringProperties(c: CSSProperties) {
		for (const k in c) {
			const value = c[k]

			if (!isCSSValue(value)) {
				stringProperties(value)
			} else {
				c[k] = `${c[k]}`
			}
		}
	}

	function render(classname: string) {
		const items = generateRules([classname], tailwindContext).sort(([a], [b]) => {
			if (a < b) {
				return -1
			} else if (a > b) {
				return 1
			} else {
				return 0
			}
		})

		const root = postcss.root({ nodes: items.map(([, rule]) => rule) })
		expandApplyAtRules(tailwindContext)(root)

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
