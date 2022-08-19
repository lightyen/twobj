export type LocaleType = "en-US" | "zh-TW"

export const supports = {
	"en-US": "English",
	"zh-TW": "繁體中文",
}

export const defaultLocale: LocaleType = (window.navigator.language || "en-US") as LocaleType

export function saveLocale(locale: LocaleType) {
	if (Object.keys(supports).some(loc => loc === locale)) {
		localStorage.setItem("locale", locale)
		window.__locale__ = locale
		const [primary] = locale.toLocaleLowerCase().split(/-/)
		switch (primary) {
			case "zh":
				document.documentElement.lang = "zh"
				break
			default:
				document.documentElement.lang = "en"
				break
		}
	} else {
		throw new Error(`"${locale}" resource is not found.`)
	}
}

export function getLocale(): LocaleType {
	const locale = localStorage.getItem("locale") ?? defaultLocale
	const [primary] = locale.toLocaleLowerCase().split(/-/)
	switch (primary) {
		case "zh":
			document.documentElement.lang = "zh"
			return "zh-TW"
		default:
			document.documentElement.lang = "en"
			return "en-US"
	}
}

import $en from "./locales/en.yml"
import $zhTW from "./locales/zh-TW.yml"

export function getLocaleMessages() {
	const [primary] = window.__locale__.toLocaleLowerCase().split(/-/)
	switch (primary) {
		case "zh":
			return $zhTW
		default:
			return $en
	}
}
