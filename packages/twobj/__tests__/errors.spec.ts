import { expect, test } from "vitest"
import { createContext, resolveConfig } from "../src"

test("throw errors", () => {
	const ctx = createContext(resolveConfig({ corePlugins: { textColor: false } }))
	expect(ctx.css("text-black")).toEqual({})
	expect(ctx.css("accent-black")).toEqual({ accentColor: "#000" })
	expect(ctx.css("first:text-black")).toEqual({ "&:first-child": {} })
	expect(ctx.css("first:accent-black")).toEqual({ "&:first-child": { accentColor: "#000" } })

	ctx.throwError = true
	expect(() => {
		ctx.css(" (text-black) ")
	}).toThrowErrorMatchingSnapshot()
	expect(ctx.css("accent-black")).toEqual({ accentColor: "#000" })
	expect(() => {
		ctx.css("  first:(text-black)  ")
	}).toThrowErrorMatchingSnapshot()
	expect(ctx.css("first:accent-black")).toEqual({ "&:first-child": { accentColor: "#000" } })
	expect(() => {
		ctx.css("second:accent-black")
	}).toThrowErrorMatchingSnapshot()
	expect(() => {
		ctx.css("(second:):accent-black")
	}).toThrowErrorMatchingSnapshot()
	expect(() => {
		ctx.css(" (bg-black")
	}).toThrowErrorMatchingSnapshot()
	expect(() => {
		ctx.css(" bg-[red")
	}).toThrowErrorMatchingSnapshot()
	expect(() => {
		ctx.css(" bg-[red]/[")
	}).toThrowErrorMatchingSnapshot()
	expect(() => {
		ctx.css(" bg[red]")
	}).toThrowErrorMatchingSnapshot()
	expect(() => {
		ctx.css(" bg[red]/[")
	}).toThrowErrorMatchingSnapshot()
})
