declare module "twobj" {
	import type { CSSProperties } from "twobj"
	export const globalStyles: Record<string, CSSProperties>
	export function tw(arr: TemplateStringsArray): CSSProperties
	export function theme(arr: TemplateStringsArray): unknown
}
