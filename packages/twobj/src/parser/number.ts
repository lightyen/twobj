import { getUnitFromNumberFunction } from "./css"

export function isValidNumber(value: string): boolean {
	if (value === "") {
		return false
	}

	const num = Number(value)

	if (Number.isNaN(num)) {
		const unit = getUnitFromNumberFunction(value)
		if (unit !== null) {
			return false
		}
		return true
	}

	return true
}
