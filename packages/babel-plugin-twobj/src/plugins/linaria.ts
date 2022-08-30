import type { Plugin } from "../types"

export const linaria: Plugin = function ({ t, buildStyle, addImportDeclaration }) {
	return {}
}
linaria.id = "linaria"
linaria.lookup = []
linaria.manifest = { styled: "@emotion/react", className: "@emotion/core" }
