const LF = "\n".charCodeAt(0)

/**
 * Get the 0-indexed line number and column for a character offset in the source.
 */
export function getPos(source: string, offset: number): { line: number; column: number } {
	let line = 0
	let column = 0
	for (let i = 0; i < offset && i < source.length; i++) {
		if (source.charCodeAt(i) === LF) {
			line++
			column = 0
		} else {
			column++
		}
	}
	return { line, column }
}
