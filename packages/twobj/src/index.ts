export { resolveConfig } from "./config/resolveConfig"
export { createContext } from "./core"
export type { CSSProperties, CSSValue } from "./types"
export type { ValueType } from "./values"
import type { CSSProperties } from "./types"

// Fake
export const globalStyles: Record<string, CSSProperties> = {}
export function tw(arr: TemplateStringsArray): CSSProperties {
	return {}
}
export function theme(arr: TemplateStringsArray): unknown {
	return undefined
}
