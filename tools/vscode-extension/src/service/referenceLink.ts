import docs from "./docs.yaml"
import references from "./references.yaml"

export interface Reference {
	name: string
	url: string
}

export function getReferenceLinks(keyword: string) {
	const value = keyword.replace(":", "")
	const originUrl = references[value]
	const links: Reference[] = []
	const last = /[\w-.]+$/
	if (typeof originUrl === "string") {
		const match = originUrl.match(last)
		links.push({ name: match?.[0] || "", url: originUrl })
	}
	return links
}

export function getName(keyword: string): string | undefined {
	keyword = keyword.replace(":", "")
	const originUrl = references[keyword]
	const url = originUrl
	if (url) {
		if (docs[originUrl]) {
			return docs[originUrl].name
		}
	}
	return undefined
}

export function getDescription(keyword: string): string | undefined {
	keyword = keyword.replace(":", "")
	const originUrl = references[keyword]
	const url = originUrl
	if (url) {
		if (docs[originUrl]) {
			return docs[originUrl].desc
		}
	}
	return undefined
}
