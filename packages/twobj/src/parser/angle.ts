import { getUnitFromNumberFunction } from "./css"
import { isValidNumber } from "./number"

const units = ["deg", "rad", "grad", "turn"]

export function isValidAngle(value: string): { num: string; unit: string } | undefined {
	const unit = units.find(u => value.endsWith(u))

	if (!unit) {
		if (value === "") {
			return undefined
		}
		if (Number(value) === 0) {
			return { num: value, unit: "" }
		}
		const unit = getUnitFromNumberFunction(value)
		if (unit && units.includes(unit)) {
			return { num: value, unit }
		}
		return undefined
	}

	value = value.slice(0, -unit.length)
	return isValidNumber(value) ? { num: value, unit } : undefined
}
