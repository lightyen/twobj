import { __types } from "../values"

it("length value", () => {
	expect(__types.length.handleValue("0")).not.toBeUndefined()
	expect(__types.length.handleValue("0px")).not.toBeUndefined()
	expect(__types.length.handleValue("5rem")).not.toBeUndefined()
	expect(__types.length.handleValue("2.2em")).not.toBeUndefined()
	expect(__types.length.handleValue("1")).toBeUndefined()
	expect(__types.length.handleValue("10%")).toBeUndefined()
})

it("percentage value", () => {
	expect(__types.percentage.handleValue("0")).not.toBeUndefined()
	expect(__types.percentage.handleValue("0px")).toBeUndefined()
	expect(__types.percentage.handleValue("5rem")).toBeUndefined()
	expect(__types.percentage.handleValue("2.2em")).toBeUndefined()
	expect(__types.percentage.handleValue("1")).toBeUndefined()
	expect(__types.percentage.handleValue("10%")).not.toBeUndefined()
})

it("number value", () => {
	expect(__types.number.handleValue("0")).not.toBeUndefined()
	expect(__types.number.handleValue("1")).not.toBeUndefined()
	expect(__types.number.handleValue("0px")).toBeUndefined()
	expect(__types.number.handleValue("5rem")).toBeUndefined()
	expect(__types.number.handleValue("2.2em")).toBeUndefined()
	expect(__types.number.handleValue("10%")).toBeUndefined()
	__types.number
})

it("color value", () => {
	expect(__types.color.handleValue("red")).not.toBeUndefined()
	expect(__types.color.handleValue("blue")).not.toBeUndefined()
	expect(__types.color.handleValue("rgb(10,22,66)")).not.toBeUndefined()
	expect(__types.color.handleValue("rgb(10,22,66,0.5)")).not.toBeUndefined()
	expect(__types.color.handleValue("rgba(10,22,66,0.5)")).not.toBeUndefined()
	expect(__types.color.handleValue("rgb(10 22 66)")).not.toBeUndefined()
	expect(__types.color.handleValue("rgb(10 22 66/0.5)")).not.toBeUndefined()
	expect(__types.color.handleValue("rgba(10 22 66 / 0.5)")).not.toBeUndefined()
	expect(__types.color.handleValue("hsk(10 22 66 / 0.5)")).toBeUndefined()
	expect(__types.color.handleValue("var(--color)")).toBeUndefined()
	expect(__types.color.handleValue("center")).toBeUndefined()
})

it("background position value", () => {
	expect(__types.position.handleValue("center")).not.toBeUndefined()
	expect(__types.position.handleValue("left")).not.toBeUndefined()
	expect(__types.position.handleValue("25% 75%")).not.toBeUndefined()
	expect(__types.position.handleValue("bottom 50px right 100px")).not.toBeUndefined()
	expect(__types.position.handleValue("right 35% bottom 45%")).not.toBeUndefined()
	expect(__types.position.handleValue("bottom 10px right")).not.toBeUndefined()
	expect(__types.position.handleValue("bottom right")).not.toBeUndefined()
	expect(__types.position.handleValue("bottom center")).not.toBeUndefined()
	expect(__types.position.handleValue("right 35% center 45%")).toBeUndefined()
	expect(__types.position.handleValue("10% top right")).toBeUndefined()
})

it("url value", () => {
	expect(
		__types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)"),
	).not.toBeUndefined()
	expect(__types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/")).not.toBeUndefined()
	expect(
		__types.url.handleValue("rgb(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)"),
	).toBeFalsy()
})
