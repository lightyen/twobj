import { theme } from "twobj"

export type ScreenType = "2xl" | "xl" | "lg" | "md" | "sm" | "xs"

export function getScreen(): ScreenType {
	let mql = window.matchMedia(`(min-width: ${theme`screens.2xl`})`)
	if (mql.matches) return "2xl"
	mql = window.matchMedia(`(min-width: ${theme`screens.xl`})`)
	if (mql.matches) return "xl"
	mql = window.matchMedia(`(min-width: ${theme`screens.lg`})`)
	if (mql.matches) return "lg"
	mql = window.matchMedia(`(min-width: ${theme`screens.md`})`)
	if (mql.matches) return "md"
	mql = window.matchMedia(`(min-width: ${theme`screens.sm`})`)
	if (mql.matches) return "sm"
	return "xs"
}
