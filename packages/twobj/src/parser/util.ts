import * as nodes from "./nodes"

export function kebab(value: string) {
	return value.replace(/\B[A-Z][a-z]*/g, s => "-" + s.toLowerCase())
}

export function camelCase(value: string) {
	if (value.startsWith("--")) return value
	return value.replace(/-[a-z]/g, x => x[1].toUpperCase())
}

interface SimpleVariantToken extends nodes.TokenString {
	type: nodes.NodeType.SimpleVariant
}

interface ArbitrarySelectorToken extends nodes.TokenString {
	type: nodes.NodeType.ArbitrarySelector
	selector: nodes.CssSelector
}

interface ArbitraryVariantToken extends nodes.TokenString {
	type: nodes.NodeType.ArbitraryVariant
	selector: nodes.CssSelector
}

export function getVariant(
	variant: nodes.Variant,
	sep: string,
): SimpleVariantToken | ArbitrarySelectorToken | ArbitraryVariantToken {
	switch (variant.type) {
		case nodes.NodeType.ArbitrarySelector:
			return {
				type: nodes.NodeType.ArbitrarySelector,
				range: variant.selector.range,
				value: variant.selector.value,
				selector: variant.selector,
			}
		case nodes.NodeType.ArbitraryVariant:
			return {
				type: nodes.NodeType.ArbitraryVariant,
				range: [variant.range[0], variant.range[1] - sep.length],
				value: variant.prefix.value + "[" + variant.selector.value + "]",
				selector: variant.selector,
			}
		default:
			return {
				type: nodes.NodeType.SimpleVariant,
				range: variant.id.range,
				value: variant.id.value,
			}
	}
}

/** NOTE: respect quoted string */
export function removeComment(text: string): string {
	let comment = 0
	let string = 0
	const arr: string[] = []
	const start = 0
	const end = text.length

	let base = start
	let i = start
	for (; i < end; i++) {
		const char = text.charCodeAt(i)
		let __comment = comment

		if (comment === 0) {
			if (string === 0) {
				if (char === 47 && text.charCodeAt(i + 1) === 47) {
					__comment = 1
				} else if (char === 47 && text.charCodeAt(i + 1) === 42) {
					__comment = 2
				}
			}
		} else if (comment === 1 && char === 10) {
			__comment = 0
		} else if (comment === 2 && char === 42 && text.charCodeAt(i + 1) === 47) {
			__comment = 0
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

		if (comment === 0 && __comment > 0) {
			if (base < i) {
				arr.push(text.slice(base, i))
				base = i
			}
			if (__comment === 2) i += 1
		} else if (comment > 0 && __comment === 0) {
			base = i
			if (comment === 2) {
				i += 1
				base += 2
			}
		}

		comment = __comment
	}

	if (comment === 0 && base < i) {
		arr.push(text.slice(base, i))
	}

	return arr.join("").trim()
}

/** Try to find right bracket from left bracket, return `undefind` if not found. */
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

export function splitAtTopLevelOnly(value: string, trim = true): string[] {
	const stack: number[] = []
	const result: string[] = []

	let quoted = false
	let base = 0
	let i = base
	for (; i < value.length; i++) {
		const char = value.charCodeAt(i)
		if (char === 44) {
			if (stack.length !== 0) {
				continue
			}

			let str = value.slice(base, i)
			if (trim) {
				str = str.trim()
			}
			if (str) {
				result.push(str)
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

	let last = value.slice(base, value.length)
	if (trim) {
		last = last.trim()
	}
	if (last) {
		result.push(last)
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
