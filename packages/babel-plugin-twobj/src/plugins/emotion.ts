import type { NodePath } from "@babel/core"
import babel from "@babel/types"
import { normalize } from "twobj/parser"
import type { Plugin, ProgramState } from "../types"
import { getFirstQuasi } from "../util"

const styleVarName = "_tw"

export const emotion: Plugin = ({ types: t, buildStyle }) => {
	const hideTwAttribute = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test"

	const importCss = t.importDeclaration(
		[t.importSpecifier(t.identifier("css"), t.identifier("css"))],
		t.stringLiteral("@emotion/react"),
	)

	const importStyled = t.importDeclaration(
		[t.importDefaultSpecifier(t.identifier("styled"))],
		t.stringLiteral("@emotion/styled"),
	)

	interface TwAttribute {
		kind: "tw"
		value: string
		index: number
		path: NodePath<babel.JSXAttribute>
	}

	interface CssAttribute {
		kind: "css"
		index: number
		path: NodePath<babel.JSXAttribute>
	}

	// interface ClassNameAttribute {
	// 	kind: "className"
	// 	index: number
	// 	path: NodePath<babel.JSXAttribute>
	// 	value: string
	// }

	type XAttribute = TwAttribute | CssAttribute // | ClassNameAttribute

	let styleIndex = 0

	function addImportStyled(state: ProgramState) {
		state.styledLocalName = "styled"
		state.added.push(importStyled)
	}

	function addStyle(state: ProgramState, value: string, path: NodePath) {
		const { types: t, parser } = state
		if (styleIndex === 0) {
			if (!state.cssLocalName) {
				state.cssLocalName = "css"
				state.added.push(importCss)
			}
			state.added.push(
				t.variableDeclaration("const", [
					t.variableDeclarator(t.identifier(styleVarName), t.objectExpression([])),
				]),
			)
		}

		value = normalize(parser.createProgram(value))
		let member = state.styles.get(value)
		if (!member) {
			// $__tw[<index>]
			member = t.memberExpression(t.identifier(styleVarName), t.identifier(String(styleIndex)), true)

			// $__tw[<index>] = css(styleObject)
			const statement = t.expressionStatement(
				t.assignmentExpression(
					"=",
					member,
					t.callExpression(t.identifier(state.cssLocalName), [buildStyle(value, path)]),
				),
			)

			state.added.push(statement)
			state.styles.set(value, member)
			styleIndex++
		}

		return member
	}

	return {
		/**
		 * <div tw="bg-black" /> ==> <div css={$__tw[<index>]} />
		 */
		JSXOpeningElement(path, state) {
			const attrs = path.get("attributes")

			let tw: TwAttribute | undefined
			let css: CssAttribute | undefined
			const collection: XAttribute[] = []

			for (let i = 0; i < attrs.length; i++) {
				if (collection.length >= 2) {
					break
				}

				const attr = attrs[i]
				if (!attr.isJSXAttribute()) {
					continue
				}

				const attrName = attr.get("name").node.name
				const attrValue = attr.get("value")

				if (tw == null && attrName === "tw") {
					// tw=""
					if (attrValue.isStringLiteral()) {
						collection.push(
							(tw = {
								kind: "tw",
								index: i,
								value: attrValue.node.value,
								path: attr,
							}),
						)
					} else if (attrValue.isJSXExpressionContainer()) {
						const expression = attrValue.get("expression")
						// tw={""}
						if (expression.isStringLiteral()) {
							collection.push(
								(tw = {
									kind: "tw",
									index: i,
									value: expression.node.value,
									path: attr,
								}),
							)
						} else if (expression.isTemplateLiteral()) {
							// tw={``}
							const quasi = getFirstQuasi(expression)
							if (quasi) {
								collection.push(
									(tw = {
										kind: "tw",
										index: i,
										value: quasi.node.value.cooked ?? quasi.node.value.raw,
										path: attr,
									}),
								)
							}
						}
					}
				} else if (css == null && attrName === "css") {
					collection.push(
						(css = {
							kind: "css",
							index: i,
							path: attr,
						}),
					)
				}
			}

			if (tw == null) {
				return
			}

			if (css == null) {
				const member = addStyle(state, tw.value, tw.path)
				// <div css={$__tw[<index>]} />
				tw.path.insertAfter(t.jsxAttribute(t.jsxIdentifier("css"), t.jsxExpressionContainer(member)))
				if (hideTwAttribute) {
					tw.path.remove()
				}
				return
			}

			const value = css.path.get("value")
			// css={...}
			if (value.isJSXExpressionContainer()) {
				const expression = value.get("expression")
				const member = addStyle(state, tw.value, tw.path)
				// css={[...]}
				if (expression.isArrayExpression()) {
					const elements = expression.get("elements")
					if (elements.length === 0) {
						expression.replaceWith(member)
					} else {
						interface A {
							index: number
							elements: Array<babel.Expression | babel.SpreadElement | null>
						}
						const sorted = [tw]
							.map<A>(v => ({
								index: v.index,
								elements: [member],
							}))
							.concat({ index: css.index, elements: elements.map(e => e.node) })
							.sort((a, b) => {
								if (a.index < b.index) {
									return -1
								}
								return 1
							})

						expression.replaceWith(
							t.arrayExpression(
								sorted.reduce(
									(acc, s) => {
										acc.push(...s.elements)
										return acc
									},
									[] as Array<babel.Expression | babel.SpreadElement | null>,
								),
							),
						)
					}
				} else if (expression.isExpression()) {
					interface B {
						index: number
						element: babel.Expression | babel.SpreadElement
					}
					const sorted = [tw]
						.map<B>(t => ({
							index: t.index,
							element: member,
						}))
						.concat({ index: css.index, element: expression.node })
						.sort((a, b) => {
							if (a.index < b.index) {
								return -1
							}
							return 1
						})
					expression.replaceWith(t.arrayExpression(sorted.map(s => s.element)))
				}
			}

			if (hideTwAttribute) {
				tw.path.remove()
			}
		},
		/**
		 * tw(<element>)`` ==> styled(<element>)($__tw[<index>])
		 * tw.element`` ==> styled.element($__tw[<index>])
		 * tw`` => css({...})
		 */
		TaggedTemplateExpression(path, state) {
			if (!state.thirdParty?.styled) {
				return
			}

			const t = state.types

			const tag = path.get("tag")
			let tagName = ""

			if (tag.isCallExpression()) {
				const callee = tag.get("callee")
				if (callee.isIdentifier()) {
					tagName = callee.node.name
				}
			} else if (tag.isMemberExpression()) {
				const object = tag.get("object")
				const property = tag.get("property")
				if (object.isIdentifier() && property.isIdentifier()) {
					tagName = object.node.name
				}
			} else if (tag.isIdentifier()) {
				tagName = tag.node.name
			}

			if (tagName === "") {
				return
			}

			let skip = false

			if (state.twIdentifiers["tw"].get(tagName)) {
				const quasi = getFirstQuasi(path)
				if (quasi) {
					if (tag.isIdentifier()) {
						const value = quasi.node.value.cooked ?? quasi.node.value.raw
						const member = addStyle(state, value, quasi)
						path.replaceWith(member)
					} else if (tag.isCallExpression()) {
						if (!state.styledLocalName) {
							addImportStyled(state)
						}
						const args = tag.get("arguments")
						const value = quasi.node.value.cooked ?? quasi.node.value.raw
						const member = addStyle(state, value, quasi)
						const expr = t.callExpression(
							t.callExpression(
								t.identifier(state.styledLocalName),
								args.map(a => a.node),
							),
							[member],
						)
						path.replaceWith(expr)
					} else if (tag.isMemberExpression()) {
						const property = tag.get("property")
						if (property.isIdentifier()) {
							if (!state.styledLocalName) {
								addImportStyled(state)
							}
							const value = quasi.node.value.cooked ?? quasi.node.value.raw
							const member = addStyle(state, value, quasi)
							const expr = t.callExpression(
								t.memberExpression(
									t.identifier(state.styledLocalName),
									t.identifier(property.node.name),
								),
								[member],
							)
							path.replaceWith(expr)
						}
					}
				}
				skip = true
			}

			if (skip) {
				path.skip()
			}
		},
		/**
		 * tw('div')(props => ({ width: props.width })) ==> styled('div')(props => ({ width: props.width }))
		 * tw.div(props => ({ width: props.width })) ==> styled.div(props => ({ width: props.width }))
		 */
		CallExpression(path, state) {
			if (!state.thirdParty?.styled) {
				return
			}

			const t = state.types

			const callee = path.get("callee")
			let tagName = ""

			if (callee.isCallExpression()) {
				const c = callee.get("callee")
				if (c.isIdentifier()) {
					tagName = c.node.name
				}
			} else if (callee.isMemberExpression()) {
				const object = callee.get("object")
				const property = callee.get("property")
				if (object.isIdentifier() && property.isIdentifier()) {
					tagName = object.node.name
				}
			}

			if (tagName === "") {
				return
			}

			let skip = false

			if (state.twIdentifiers["tw"].get(tagName)) {
				if (callee.isCallExpression()) {
					const c = callee.get("callee")
					if (c.isIdentifier()) {
						if (!state.styledLocalName) {
							addImportStyled(state)
						}
						c.replaceWith(t.identifier(state.styledLocalName))
					}
				} else if (callee.isMemberExpression()) {
					const object = callee.get("object")
					const property = callee.get("property")
					if (property.isIdentifier()) {
						if (!state.styledLocalName) {
							addImportStyled(state)
						}
						object.replaceWith(t.identifier(state.styledLocalName))
					}
				}
				skip = true
			}

			if (skip) {
				path.skip()
			}
		},
	}
}
emotion.id = "emotion"
emotion.lookup = ["@emotion/styled", "@emotion/react", "@emotion/css"]
emotion.manifest = { cssProp: "@emotion/babel-plugin", styled: "@emotion/styled", className: ["@emotion/react", "@emotion/css"] }
