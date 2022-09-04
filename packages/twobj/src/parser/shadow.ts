import { Param, splitCssParams } from "./css"
import { isValidLength } from "./length"
import { splitAtTopLevelOnly } from "./util"

const keywords = ["inset", "inherit", "initial", "revert", "revert-layer", "unset"]

export function isValidShadow(value: string): boolean {
	const params = splitCssParams(value)
	if (params.length === 0) {
		return false
	}

	let keyword = ""
	let x = ""
	let y = ""
	let blur = ""
	let spread = ""
	let color: Param | undefined

	for (const part of params) {
		if (typeof part === "string") {
			if (!keyword && keywords.find(v => v === part)) {
				keyword = part
				continue
			}

			if (isValidLength(part)) {
				if (!x) {
					x = part
				} else if (!y) {
					y = part
				} else if (!blur) {
					blur = part
				} else if (!spread) {
					spread = part
				}
				continue
			}
		}

		if (color == undefined) {
			color = part
		} else {
			return false
		}
	}

	if (!x || !y) {
		return false
	}

	return true
}

/**
 * @returns 3px 5px 5px 10px var(--tw-shadow-color, var(--tw-shadow-default-color))
 */
export function parseBoxShadowValues(source: string) {
	return splitAtTopLevelOnly(source).map(({ value, range }) => {
		const ret = parseBoxShadow(source, range)
		if (ret == undefined) {
			return value
		}
		return ret
	})
}

export interface Shadow {
	color: Param
	value: string
}

export function parseBoxShadow(source: string, range: [number, number]): Shadow | undefined {
	const params = splitCssParams(source, range)

	if (params.length === 0) {
		return undefined
	}

	let keyword = ""
	let x = ""
	let y = ""
	let blur = ""
	let spread = ""
	let color: Param | undefined

	for (const part of params) {
		if (typeof part === "string") {
			if (!keyword && keywords.find(v => v === part)) {
				keyword = part
				continue
			}

			if (isValidLength(part)) {
				if (!x) {
					x = part
				} else if (!y) {
					y = part
				} else if (!blur) {
					blur = part
				} else if (!spread) {
					spread = part
				}
				continue
			}
		}

		if (!color) {
			color = part
		} else {
			return undefined
		}
	}

	if (!x || !y || !color) {
		return undefined
	}

	return {
		color,
		value: [keyword, x, y, blur, spread, "var(--tw-shadow-color, var(--tw-shadow-default-color))"]
			.filter(Boolean)
			.join(" "),
	}
}
