import { createContext } from "../src/core"
import { resolveConfig } from "../src/resolveConfig"
import type { Context, CSSProperties, VariantSpec } from "../src/types"

export const context = createContext(resolveConfig())

export function tw(classname: string, ctx?: Context): CSSProperties
export function tw(classname: TemplateStringsArray, ctx?: Context): CSSProperties
export function tw(classname: string | TemplateStringsArray, ctx = context) {
	let value = ""
	if (typeof classname !== "string") {
		value = classname[0] as string
	} else {
		value = classname
	}
	return ctx.css(value)
}

export function wrap(variants: string, ctx?: Context): VariantSpec
export function wrap(variants: TemplateStringsArray, ctx?: Context): VariantSpec
export function wrap(variants: string | TemplateStringsArray, ctx = context) {
	let value = ""
	if (typeof variants !== "string") {
		value = variants[0] as string
	} else {
		value = variants
	}
	return ctx.wrap(value)
}

export function createTw(ctx: Context) {
	return function tw(classname: string | TemplateStringsArray) {
		let value = ""
		if (typeof classname !== "string") {
			value = classname[0] as string
		} else {
			value = classname
		}
		return ctx.css(value)
	}
}
