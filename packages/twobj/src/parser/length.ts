import { getUnitFromNumberFunction } from "./css"
import { isValidNumber } from "./number"

export const lengthUnits = [
	"px",
	"rem",
	"em",
	"vw",
	"vh",
	"vmin",
	"vmax",
	"ex",
	"cm",
	"mm",
	"in",
	"pt",
	"pc",
	"ch",
	"Q",
	"lh",
	"cap",
	"cqb",
	"cqh",
	"cqi",
	"cqmax",
	"cqmin",
	"cqw",
	"dvb",
	"dvh",
	"dvi",
	"dvw",
	"lvb",
	"lvh",
	"lvi",
	"lvw",
	"svb",
	"svh",
	"svi",
	"svw",
	"vb",
	"vi",
]

export function isValidLength(value: string): { num: string; unit: string } | undefined {
	const unit = lengthUnits.find(u => value.endsWith(u))

	if (!unit) {
		if (value === "") {
			return undefined
		}
		if (Number(value) === 0) {
			return { num: value, unit: "" }
		}
		const unit = getUnitFromNumberFunction(value)
		if (unit && lengthUnits.includes(unit)) {
			return { num: value, unit }
		}
		return undefined
	}

	value = value.slice(0, -unit.length)
	return isValidNumber(value) ? { num: value, unit } : undefined
}
