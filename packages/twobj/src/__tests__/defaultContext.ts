import { resolveConfig } from "../config/resolveConfig"
import { createContext } from "../core"
import type { CSSProperties } from "../types"

export const context = createContext(resolveConfig())

export function tw(classname: string): CSSProperties
export function tw(classname: TemplateStringsArray): CSSProperties
export function tw(classname: string | TemplateStringsArray) {
	let value = ""
	if (typeof classname !== "string") {
		value = classname[0] as string
	} else {
		value = classname
	}
	return context.css(value)
}
