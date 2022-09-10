import type { CSSProperties } from "@linaria/react"
import {} from "react"

declare module "twobj" {
	export function tw(arr: TemplateStringsArray): CSSProperties
	export const globalStyles: CSSProperties
	export function theme(arr: TemplateStringsArray): unknown
	export function wrap(arr: TemplateStringsArray): (arg: CSSProperties) => CSSProperties
}
