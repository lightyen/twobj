import type { NodePath } from "@babel/core"
import type babel from "@babel/types"
import type { Plugin, State } from "../types"
import { getFirstQuasi } from "../util"

export const emotion: Plugin = function ({ thirdParty, t, buildStyle, buildWrap, addImportDeclaration }) {
	const styled = t.importDeclaration(
		[t.importDefaultSpecifier(t.identifier("styled"))],
		t.stringLiteral("@emotion/styled"),
	)

	return {
		JSXOpeningElement(path, state) {
			if (thirdParty.cssProp) {
				/** <div tw="bg-black" /> ==> <div css={{...}} /> */
				const attrs = path.get("attributes")
				let twIndex = -1
				let twAttr: NodePath<babel.JSXAttribute> | undefined
				let cssIndex = -1
				let cssAttr: NodePath<babel.JSXAttribute> | undefined
				let input = ""

				for (let i = 0; i < attrs.length; i++) {
					if (twIndex >= 0 && cssIndex >= 0) {
						break
					}
					const attr = attrs[i]
					if (!attr.isJSXAttribute()) {
						continue
					}
					const name = attr.get("name").node.name
					const value = attr.get("value")
					if (name === "tw" && value.isStringLiteral()) {
						twIndex = i
						twAttr = attr
						input = value.node.value
					}
					if (name === "css") {
						cssIndex = i
						cssAttr = attr
					}
				}

				if (twAttr) {
					const objExpr = buildStyle(input)
					if (!cssAttr) {
						const attr = t.jsxAttribute(t.jsxIdentifier("css"), t.jsxExpressionContainer(objExpr))
						twAttr.replaceWith(attr)
					} else {
						const v = cssAttr.get("value")
						if (v.isJSXExpressionContainer()) {
							const expression = v.get("expression")
							if (expression.isArrayExpression()) {
								const elements = expression.get("elements")
								if (elements.length === 0) {
									expression.replaceWith(objExpr)
								} else if (twIndex < cssIndex) {
									expression.replaceWith(t.arrayExpression([objExpr, ...elements.map(e => e.node)]))
								} else {
									expression.replaceWith(t.arrayExpression([...elements.map(e => e.node), objExpr]))
								}
							} else if (expression.isExpression()) {
								if (twIndex < cssIndex) {
									expression.replaceWith(t.arrayExpression([objExpr, expression.node]))
								} else {
									expression.replaceWith(t.arrayExpression([expression.node, objExpr]))
								}
							}
						}
					}
				}
			}
		},
		/**
		 * tw.any`` ==> styled.any({...})
		 * tw(<any>)`` ==> styled(<any>)({...})
		 */
		TaggedTemplateExpression(path, state) {
			if (state.imports.length === 0) return
			let skip = false
			for (const { variables } of state.imports) {
				for (const { localName, importedName } of variables) {
					if (thirdParty.styled) {
						const tag = path.get("tag")
						if (tag.isCallExpression()) {
							const callee = tag.get("callee")
							if (callee.isIdentifier() && callee.node.name === localName && importedName === "tw") {
								const args = tag.get("arguments")
								const quasi = getFirstQuasi(path)
								if (quasi) {
									if (!state.styled.imported) {
										state.styled.imported = true
										const imported = getStyledDefaultName(state)
										if (!imported) {
											addImportDeclaration(styled)
										} else {
											state.styled.localName = imported.defaultName
										}
									}

									const value = quasi.node.value.cooked ?? quasi.node.value.raw
									const expr = t.callExpression(
										t.callExpression(
											t.identifier(state.styled.localName),
											args.map(a => a.node),
										),
										[buildStyle(value)],
									)
									path.replaceWith(expr)
								}
								skip = true
								break
							}
						} else if (tag.isMemberExpression()) {
							const object = tag.get("object")
							const property = tag.get("property")
							if (
								object.isIdentifier() &&
								property.isIdentifier() &&
								object.node.name === localName &&
								importedName === "tw"
							) {
								const quasi = getFirstQuasi(path)
								if (quasi) {
									if (!state.styled.imported) {
										state.styled.imported = true
										const imported = getStyledDefaultName(state)
										if (!imported) {
											addImportDeclaration(styled)
										} else {
											state.styled.localName = imported.defaultName
										}
									}

									const value = quasi.node.value.cooked ?? quasi.node.value.raw
									const expr = t.callExpression(
										t.memberExpression(
											t.identifier(state.styled.localName),
											t.identifier(property.node.name),
										),
										[buildStyle(value)],
									)
									path.replaceWith(expr)
								}
								skip = true
								break
							}
						}
					}
				}
			}

			if (skip) {
				path.skip()
			}
		},
		/**
		 * tw('div')(props => ({ width: props.width })) ==> styled('div')(props => ({ width: props.width }))
		 * tw.div(props => ({ width: props.width })) ==> styled.div(props => ({ width: props.width }))
		 * wrap``(payload) ==> ((e) => ({ ... }))(payload)
		 */
		CallExpression(path, state) {
			if (state.imports.length === 0) return
			let skip = false
			for (const { variables } of state.imports) {
				for (const { localName, importedName } of variables) {
					if (thirdParty.styled) {
						let callee = path.get("callee")
						if (callee.isCallExpression()) {
							callee = callee.get("callee")
							if (callee.isIdentifier() && callee.node.name === localName && importedName === "tw") {
								if (!state.styled.imported) {
									state.styled.imported = true
									const imported = getStyledDefaultName(state)
									if (!imported) {
										addImportDeclaration(styled)
									} else {
										state.styled.localName = imported.defaultName
									}
								}
								callee.replaceWith(t.identifier(state.styled.localName))
								skip = true
								break
							}
						} else if (callee.isMemberExpression()) {
							const object = callee.get("object")
							const property = callee.get("property")
							if (
								object.isIdentifier() &&
								property.isIdentifier() &&
								object.node.name === localName &&
								importedName === "tw"
							) {
								if (!state.styled.imported) {
									state.styled.imported = true
									const imported = getStyledDefaultName(state)
									if (!imported) {
										addImportDeclaration(styled)
									} else {
										state.styled.localName = imported.defaultName
									}
								}
								object.replaceWith(t.identifier(state.styled.localName))
							}
						} else if (callee.isTaggedTemplateExpression()) {
							const tag = callee.get("tag")
							if (tag.isIdentifier() && importedName === "wrap" && tag.node.name === localName) {
								const quasi = getFirstQuasi(callee)
								if (quasi) {
									const value = quasi.node.value.cooked ?? quasi.node.value.raw

									const expr = t.callExpression(
										t.arrowFunctionExpression([t.identifier("e")], buildWrap(value)),
										path.get("arguments").map(arg => arg.node),
									)

									path.replaceWith(expr)
									skip = true
									break
								}
							}
						}
					}
				}
			}

			if (skip) {
				path.skip()
			}
		},
	}

	function getStyledDefaultName({ imports }: State): { defaultName: string } | undefined {
		for (const { libName, defaultName } of imports) {
			if (libName !== "@emotion/styled") continue
			if (defaultName) {
				return { defaultName }
			}
		}
		return undefined
	}
}
emotion.id = "emotion"
emotion.lookup = ["@emotion/styled", "@emotion/css"]
emotion.manifest = { cssProp: "@emotion/babel-plugin", styled: "@emotion/styled", className: "@emotion/css" }
