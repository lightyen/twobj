export function kebab(value: string) {
	return value.replace(/\B[A-Z][a-z]*/g, s => "-" + s.toLowerCase())
}

export function camelCase(value: string) {
	if (value.startsWith("--")) return value
	return value.replace(/-[a-z]/g, x => x[1].toUpperCase())
}

/** Try to find right bracket from left bracket, return `undefind` if it is not found. */
export function findRightBracket({
	text,
	start = 0,
	end = text.length,
	brackets = [40, 41],
	comments = true,
}: {
	text: string
	start?: number
	end?: number
	brackets?: [number, number]
	comments?: boolean
}): number | undefined {
	let stack = 0
	const [lbrac, rbrac] = brackets
	let comment = 0
	let string = 0
	let url = 0

	for (let i = start; i < end; i++) {
		const char = text.charCodeAt(i)
		if (char === lbrac) {
			if (string === 0 && comment === 0) {
				stack++
			}
		} else if (char === rbrac) {
			if (string === 0 && comment === 0) {
				if (stack === 1) {
					return i
				}
				if (stack < 1) {
					return undefined
				}
				stack--
			}
		}

		if (string === 0 && comment === 0) {
			if (url === 0 && char === 117 && /\W/.test(text[i - 1] || " ")) {
				url = 1
			} else if (url === 1 && char === 114) {
				url = 2
			} else if (url === 2 && char === 108) {
				url = 3
			} else if (url < 3 || (url === 3 && char === 41)) {
				url = 0
			}
		}

		if (comments) {
			if (url < 3 && comment === 0) {
				if (string === 0) {
					if (char === 47 && text.charCodeAt(i + 1) === 47) {
						comment = 1
					} else if (char === 47 && text.charCodeAt(i + 1) === 42) {
						comment = 2
					}
				}
			} else if (comment === 1 && char === 10) {
				comment = 0
			} else if (comment === 2 && char === 42 && text.charCodeAt(i + 1) === 47) {
				comment = 0
				i += 1
			}
		}

		if (string === 0) {
			if (comment === 0) {
				if (char === 34) {
					string = 1
				} else if (char === 39) {
					string = 2
				}
			}
		} else if (string === 1 && char === 34) {
			string = 0
		} else if (string === 2 && char === 39) {
			string = 0
		}
	}
	return undefined
}

export function isSpace(char: number) {
	if (Number.isNaN(char)) return true
	switch (char) {
		case 32:
		case 12:
		case 10:
		case 13:
		case 9:
		case 11:
			return true
		default:
			return false
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dlv(cur: any, paths: string[]): any {
	if (cur == undefined) {
		return undefined
	}
	for (let i = 0; i < paths.length; ++i) {
		if (cur[paths[i]] == undefined) {
			return undefined
		} else {
			cur = cur[paths[i]]
		}
	}
	return cur
}

export function splitAtTopLevelOnly(value: string, trim = true): Array<{ value: string; range: [number, number] }> {
	const stack: number[] = []
	const result: Array<{ value: string; range: [number, number] }> = []

	let quoted = false
	let base = 0
	let i = base
	for (; i < value.length; i++) {
		const char = value.charCodeAt(i)
		if (char === 44) {
			if (stack.length !== 0) {
				continue
			}

			let start = base
			let end = i
			if (trim) {
				while (start < end && isSpace(value.charCodeAt(start))) start++
				while (start < end && isSpace(value.charCodeAt(end - 1))) end--
			}
			const str = value.slice(start, end)
			if (str) {
				result.push({ value: str, range: [start, end] })
			}
			base = i + 1
			continue
		}

		if (char === 40) {
			stack.push(41)
		} else if (char === 91) {
			stack.push(93)
		} else if (char === 123) {
			stack.push(125)
		} else if (quoted) {
			if (char === 34 || char === 39) {
				if (stack.pop() !== char) break
				quoted = false
			}
		} else if (char === 34 || char === 39) {
			stack.push(char)
			quoted = true
		} else if (char === 41) {
			if (stack.pop() !== char) break
		} else if (char === 93) {
			if (stack.pop() !== char) break
		} else if (char === 125) {
			if (stack.pop() !== char) break
		}
	}

	let start = base
	let end = value.length
	if (trim) {
		while (start < end && isSpace(value.charCodeAt(start))) start++
		while (start < end && isSpace(value.charCodeAt(end - 1))) end--
	}
	const last = value.slice(start, end)
	if (last) {
		result.push({ value: last, range: [start, end] })
	}

	return result
}

const valueRegexp = /^([+-]?(?:[0-9]+(?:[.][0-9]*)?|[.][0-9]+))([a-zA-Z]+|%)?$/

export function matchValue(value: string): { num: string; unit?: string } | undefined {
	const match = valueRegexp.exec(value)
	if (match == null) {
		return undefined
	}
	const [, num, unit] = match
	return { num, unit }
}

export function removeComments(
	source: string,
	keepSpaces = false,
	separator = ":",
	[start = 0, end = source.length] = [],
): string {
	const regexp = /(")|(')|(\[)|(\/\/[^\r\n]*(?:[^\r\n]|$))|((?:\/\*).*?(?:\*\/|$))/gs
	let match: RegExpExecArray | null
	regexp.lastIndex = start
	source = source.slice(0, end)
	let strings: 1 | 2 | undefined

	let buffer = ""
	while ((match = regexp.exec(source))) {
		const [, doubleQuote, singleQuote, bracket, lineComment, blockComment] = match

		let hasComment = false
		if (doubleQuote) {
			if (!strings) {
				strings = 1
			} else {
				strings = undefined
			}
		} else if (singleQuote) {
			if (!strings) {
				strings = 2
			} else {
				strings = undefined
			}
		} else if (bracket) {
			const rb = findRightBracket({
				text: source,
				start: regexp.lastIndex - 1,
				brackets: [91, 93],
				end,
				comments: false,
			})

			// TODO: Remove comments in arbitrary selectors only.
			if (rb) {
				let match = true
				for (let i = 0; i < separator.length; i++) {
					if (separator.charCodeAt(i) !== source.charCodeAt(rb + 1 + i)) {
						match = false
						break
					}
				}
				if (match && source[regexp.lastIndex - 2] !== "-") {
					buffer += source.slice(start, regexp.lastIndex)
					buffer += removeComments(source, keepSpaces, separator, [regexp.lastIndex, rb])
					start = rb
				}
			}

			regexp.lastIndex = rb ? rb + 1 : end
		} else if (!strings && (lineComment || blockComment)) {
			hasComment = true
		}

		let data = source.slice(start, regexp.lastIndex)
		if (hasComment) {
			data = data.replace(lineComment || blockComment, match => {
				if (keepSpaces) {
					return "".padStart(match.length)
				}
				return ""
			})
		}

		buffer += data
		start = regexp.lastIndex
	}

	if (start < end) {
		buffer += source.slice(start, end)
	}

	return buffer
}
