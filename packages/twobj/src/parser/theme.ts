import type { ResolvedConfigJS } from "../types"
import * as css from "./css"
import { NodeType, ThemePathNode } from "./nodes"
import { parse_theme, parse_theme_val } from "./parse_theme"
import { dlv } from "./util"

export function renderThemeFunc(config: ResolvedConfigJS, value: string): string {
	let start = 0
	let ret = ""

	for (const node of parse_theme({ text: value })) {
		const result = theme(config, node.value.path)
		const val = result.value !== undefined ? renderThemeValue(result) : node.defaultValue ?? ""
		ret += value.slice(start, node.range[0]) + val
		start = node.range[1]
	}

	if (start < value.length) {
		ret += value.slice(start)
	}
	return ret.trim()
}

export function renderTheme(config: ResolvedConfigJS, value: string): string {
	const node = parse_theme_val({ text: value })
	const result = theme(config, node.path)
	return result.value !== undefined ? renderThemeValue(result) : ""
}

export function resolveTheme(config: ResolvedConfigJS, value: string, defaultValue?: unknown): unknown {
	const node = parse_theme_val({ text: value })
	let target = resolvePath(config.theme, node.path, true)
	if (target) {
		return resolveThemeValue({ value: target })
	}

	let opacityValue: string | undefined
	const ret = tryOpacityValue(node.path)
	if (ret.opacityValue) {
		opacityValue = ret.opacityValue
		node.path = ret.path
	}

	target = resolvePath(config.theme, node.path, true)
	return target !== undefined ? resolveThemeValue({ value: target, opacityValue }) : defaultValue ?? ""
}

export function resolveThemeNoDefault(config: ResolvedConfigJS, value: string, defaultValue?: unknown): unknown {
	const node = parse_theme_val({ text: value })
	let target = resolvePath(config.theme, node.path, false)
	if (target) {
		return resolveThemeValue({ value: target })
	}

	let opacityValue: string | undefined
	const ret = tryOpacityValue(node.path)
	if (ret.opacityValue) {
		opacityValue = ret.opacityValue
		node.path = ret.path
	}

	target = resolvePath(config.theme, node.path, false)
	return target !== undefined ? resolveThemeValue({ value: target, opacityValue }) : defaultValue ?? ""
}

// for completions
export function parseThemeValue({
	config,
	useDefault,
	text,
	start = 0,
	end = text.length,
}: {
	config: ResolvedConfigJS
	useDefault?: boolean
	text: string
	start?: number
	end?: number
}) {
	const node = parse_theme_val({ text, start, end })
	const value = resolvePath(config.theme, node.path, useDefault)
	if (value === undefined) {
		const ret = tryOpacityValue(node.path)
		if (ret.opacityValue) {
			node.path = ret.path
		}
	}
	return { path: node.path, range: node.range }
}

export function theme(config: ResolvedConfigJS, path: ThemePathNode[], useDefault = false) {
	let opacityValue: string | undefined
	let value = resolvePath(config.theme, path, useDefault)
	if (value === undefined) {
		const ret = tryOpacityValue(path)
		if (ret.opacityValue) {
			value = resolvePath(config.theme, ret.path, useDefault)
			opacityValue = ret.opacityValue
			path = ret.path
		}
	}
	return { value, opacityValue }
}

export function tryOpacityValue(path: ThemePathNode[]) {
	let opacityValue: string | undefined
	let arr = path.slice().reverse()
	let end: number | undefined
	for (let i = 0; i < arr.length; i++) {
		const n = arr[i]
		const x = n.value.lastIndexOf("/")
		if (x === -1) {
			if (end != undefined && end !== n.range[1]) {
				return { path }
			}
			end = n.range[0]
			opacityValue = n.toString() + (opacityValue ?? "")
			continue
		}

		opacityValue = n.value.slice(x + 1) + (opacityValue ?? "")

		const raw = n.toString()
		const k = raw.lastIndexOf("/")
		const rest = raw.slice(0, k)

		if (end != undefined && end !== n.range[1]) {
			if (k > 0 && k < raw.length - 1) {
				return { path }
			}
		}

		if (rest === "") {
			arr = arr.slice(i + 1)
			break
		}

		const t: ThemePathNode = { ...n, range: [n.range[0], n.range[1]] }
		t.value = n.value.slice(0, n.value.lastIndexOf("/"))
		t.range[1] = t.range[0] + k
		arr[i] = t
		arr = arr.slice(i)

		break
	}

	arr = arr.reverse()
	return { path: arr, opacityValue }
}

export function renderThemePath(
	config: ResolvedConfigJS,
	path: Array<string | ThemePathNode>,
	useDefault = false,
): string {
	const keys = path.map<ThemePathNode>(value => {
		if (typeof value !== "string") return value
		return {
			type: NodeType.ThemePath,
			closed: true,
			value,
			range: [0, value.length],
			toString() {
				return "." + value
			},
		}
	})
	return renderThemeValue(theme(config, keys, useDefault))
}

export function resolvePath(obj: unknown, path: Array<string | ThemePathNode>, useDefault = false): unknown {
	const keys = path.map<string>(p => (typeof p === "string" ? p : p.value))
	let value = dlv(obj, keys)
	if (useDefault && value?.["DEFAULT"] != undefined) {
		value = value["DEFAULT"]
	}
	return value
}

export function renderThemeValue({ value, opacityValue }: { value?: unknown; opacityValue?: string } = {}) {
	if (value == null) {
		return `[${value}]`
	}

	if (typeof value === "object") {
		if (Array.isArray(value)) {
			if (value.every(v => typeof v === "string")) {
				return value.join(", ")
			}
			return `Array[${value.join(", ")}]`
		}
		return (
			`Object{\n` +
			Object.keys(value)
				.map(k => `\t"${k}": "...",\n`)
				.join("") +
			"}\n"
		)
	}

	if (typeof value === "function") {
		const result = value({ opacityValue: opacityValue ?? "1" })
		if (typeof result === "string") {
			return result
		}
		return String(value)
	}

	if (typeof value === "string") {
		if (value.includes("<alpha-value>")) {
			return value.replace("<alpha-value>", _ => {
				return opacityValue ?? "1"
			})
		}

		if (opacityValue) {
			const color = css.parseColor(value)
			if (color && css.isOpacityFunction(color.fn)) {
				const { fn, params } = color
				return fn + "(" + params.slice(0, 3).join(" ") + " / " + opacityValue + ")"
			}
		}
	}

	return String(value)
}

export function resolveThemeValue({ value, opacityValue }: { value?: unknown; opacityValue?: string } = {}): unknown {
	if (value == null || typeof value === "object") {
		return value
	}

	if (typeof value === "function") {
		const result = value({ opacityValue: opacityValue ?? "1" })
		if (typeof result === "string") {
			return result
		}
		return value
	}

	if (typeof value === "string") {
		if (value.includes("<alpha-value>")) {
			return value.replace("<alpha-value>", _ => {
				return opacityValue ?? "1"
			})
		}

		if (opacityValue) {
			const color = css.parseColor(value)
			if (color && css.isOpacityFunction(color.fn)) {
				const { fn, params } = color
				return fn + "(" + params.slice(0, 3).join(" ") + " / " + opacityValue + ")"
			}
		}
	}

	return value
}
