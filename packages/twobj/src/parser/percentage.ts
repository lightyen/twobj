import { getUnitFromNumberFunction } from "./css"
import { isValidNumber } from "./number"

export function isValidPercentage(value: string): { num: string; unit: string } | undefined {
	const unit = value.endsWith("%")

	if (!unit) {
		if (value === "") {
			return undefined
		}
		if (Number(value) === 0) {
			return { num: value, unit: "" }
		}
		const unit = getUnitFromNumberFunction(value)
		if (unit === "%") {
			return { num: value, unit }
		}
		return undefined
	}

	value = value.slice(0, -1)
	return isValidNumber(value) ? { num: value, unit: "%" } : undefined
}
