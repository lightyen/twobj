import type { NodePath } from "@babel/core"
import type babel from "@babel/types"
import type { Plugin, State } from "../types"
import { getFirstQuasi } from "../util"

export const styledComponents: Plugin = function ({
	thirdParty,
	t,
	buildStyle,
	buildWrap,
	addImportDeclaration,
	useClassName,
}) {
	const styled = t.importDeclaration(
		[t.importDefaultSpecifier(t.identifier("styled"))],
		t.stringLiteral("styled-components"),
	)

	const removeTwAttr = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test"

	return {
		JSXOpeningElement(path, state) {
			if (thirdParty.cssProp) {
				/** <div tw="bg-black" /> ==> <div css={{...}} /> */
				const attrs = path.get("attributes")

				interface TwAttr {
					kind: "tw"
					index: number
					path: NodePath<babel.JSXAttribute>
					value: string
				}

				interface ClassNameAttr {
					kind: "className"
					index: number
					path: NodePath<babel.JSXAttribute>
					value: string
				}

				interface CssAttr {
					kind: "css"
					index: number
					path: NodePath<babel.JSXAttribute>
				}

				type JSXAttr = TwAttr | ClassNameAttr | CssAttr

				const attributes: JSXAttr[] = []

				for (let i = 0; i < attrs.length; i++) {
					if ((!useClassName && attributes.length >= 2) || (useClassName && attributes.length >= 3)) {
						break
					}

					const attr = attrs[i]
					if (!attr.isJSXAttribute()) {
						continue
					}

					const name = attr.get("name").node.name
					const value = attr.get("value")

					if (name === "tw") {
						if (value.isStringLiteral()) {
							if (!attributes.find(a => a.kind === "tw")) {
								attributes.push({
									kind: "tw",
									index: i,
									value: value.node.value,
									path: attr,
								})
							}
						} else if (value.isJSXExpressionContainer()) {
							const expression = value.get("expression")
							if (expression.isStringLiteral()) {
								if (!attributes.find(a => a.kind === "tw")) {
									attributes.push({
										kind: "tw",
										index: i,
										value: expression.node.value,
										path: attr,
									})
								}
							} else if (expression.isTemplateLiteral()) {
								const quasi = getFirstQuasi(expression)
								if (quasi) {
									if (!attributes.find(a => a.kind === "tw")) {
										attributes.push({
											kind: "tw",
											index: i,
											value: quasi.node.value.cooked ?? quasi.node.value.raw,
											path: attr,
										})
									}
								}
							}
						}
					} else if (name === "css") {
						if (!attributes.find(a => a.kind === "css")) {
							attributes.push({
								kind: "css",
								index: i,
								path: attr,
							})
						}
					} else if (useClassName && name === "className" && value.isStringLiteral()) {
						if (!attributes.find(a => a.kind === "className")) {
							attributes.push({
								kind: "className",
								index: i,
								value: value.node.value,
								path: attr,
							})
						}
					}
				}

				const cssProp = attributes.find(a => a.kind === "css")
				const targets = attributes.filter((a): a is TwAttr | ClassNameAttr => a.kind !== "css")

				if (targets.length > 0) {
					if (cssProp) {
						const value = cssProp.path.get("value")
						if (value.isJSXExpressionContainer()) {
							const expression = value.get("expression")
							if (expression.isArrayExpression()) {
								const elements = expression.get("elements")
								if (elements.length === 0) {
									const expr =
										targets.length === 1
											? buildStyle(targets[0].value, targets[0].path, state.file)
											: t.arrayExpression(
													targets.map(t => buildStyle(t.value, t.path, state.file)),
											  )
									expression.replaceWith(expr)
								} else {
									interface A {
										index: number
										elements: Array<babel.Expression | babel.SpreadElement | null>
									}
									const sorted = targets
										.map<A>(t => ({
											index: t.index,
											elements: [buildStyle(t.value, t.path, state.file)],
										}))
										.concat({ index: cssProp.index, elements: elements.map(e => e.node) })
										.sort((a, b) => {
											if (a.index < b.index) {
												return -1
											}
											return 1
										})
									expression.replaceWith(
										t.arrayExpression(
											sorted.flatMap<babel.Expression | babel.SpreadElement | null>(
												s => s.elements,
											),
										),
									)
								}
							} else if (expression.isExpression()) {
								interface B {
									index: number
									element: babel.Expression | babel.SpreadElement
								}
								const sorted = targets
									.map<B>(t => ({
										index: t.index,
										element: buildStyle(t.value, t.path, state.file),
									}))
									.concat({ index: cssProp.index, element: expression.node })
									.sort((a, b) => {
										if (a.index < b.index) {
											return -1
										}
										return 1
									})
								expression.replaceWith(t.arrayExpression(sorted.map(s => s.element)))
							}
						}
					} else {
						const attr = t.jsxAttribute(
							t.jsxIdentifier("css"),
							t.jsxExpressionContainer(
								t.arrayExpression(targets.map(t => buildStyle(t.value, t.path, state.file))),
							),
						)
						const last = targets[targets.length - 1]
						last.path.insertAfter(attr)
					}

					if (removeTwAttr) {
						const tw = attributes.find(a => a.kind === "tw")
						if (tw) {
							tw.path.remove()
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
										[buildStyle(value, quasi, state.file)],
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
										[buildStyle(value, quasi, state.file)],
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
										t.arrowFunctionExpression(
											[t.identifier("e")],
											buildWrap(value, quasi, state.file),
										),
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
			if (libName !== "styled-components") continue
			if (defaultName) {
				return { defaultName }
			}
		}
		return undefined
	}
}
styledComponents.id = "styled-components"
styledComponents.lookup = ["styled-components"]
styledComponents.manifest = { cssProp: "babel-plugin-styled-components", styled: "styled-components" }

// import styled from "styled-components"
