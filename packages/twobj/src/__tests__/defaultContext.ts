import { resolveConfig } from "../config/resolveConfig"
import { createContext } from "../core"
import type { Context, CSSProperties } from "../types"

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
