import { __types } from "../values"

test("number", () => {
	expect(__types.number.handleValue("0")).not.toBeUndefined()
	expect(__types.number.handleValue("1")).not.toBeUndefined()
	expect(__types.number.handleValue("0px")).toBeUndefined()
	expect(__types.number.handleValue("5rem")).toBeUndefined()
	expect(__types.number.handleValue("2.2em")).toBeUndefined()
	expect(__types.number.handleValue("10%")).toBeUndefined()
	__types.number
})

test("length", () => {
	expect(__types.length.handleValue("0")).not.toBeUndefined()
	expect(__types.length.handleValue("0px")).not.toBeUndefined()
	expect(__types.length.handleValue("5rem")).not.toBeUndefined()
	expect(__types.length.handleValue("2.2em")).not.toBeUndefined()
	expect(__types.length.handleValue("1")).toBeUndefined()
	expect(__types.length.handleValue("10%")).toBeUndefined()
})

test("percentage", () => {
	expect(__types.percentage.handleValue("0")).not.toBeUndefined()
	expect(__types.percentage.handleValue("0px")).toBeUndefined()
	expect(__types.percentage.handleValue("5rem")).toBeUndefined()
	expect(__types.percentage.handleValue("2.2em")).toBeUndefined()
	expect(__types.percentage.handleValue("1")).toBeUndefined()
	expect(__types.percentage.handleValue("10%")).not.toBeUndefined()
})

test("angle", () => {
	expect(__types.angle.handleValue("0")).not.toBeUndefined()
	expect(__types.angle.handleValue("10reg")).toBeUndefined()
	expect(__types.angle.handleValue("10deg")).not.toBeUndefined()
	expect(__types.angle.handleValue("5rem")).toBeUndefined()
	expect(__types.angle.handleValue("2.2em")).toBeUndefined()
	expect(__types.angle.handleValue("1")).toBeUndefined()
	expect(__types.angle.handleValue("10turn")).not.toBeUndefined()
})

test("color", () => {
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

test("background position", () => {
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

test("url", () => {
	expect(
		__types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)"),
	).not.toBeUndefined()
	expect(__types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/")).not.toBeUndefined()
	expect(
		__types.url.handleValue("rgb(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)"),
	).toBeUndefined()
})

test("image", () => {
	expect(__types.image.handleValue("image(aaaaa)")).not.toBeUndefined()
	expect(__types.image.handleValue("element(xxxx")).not.toBeUndefined()
	expect(
		__types.image.handleValue("linear-gradient(to bottom, rgba(255,255,0,0.5), rgba(0,0,255,0.5))"),
	).not.toBeUndefined()
	expect(__types.image.handleValue("rgb(210 120 20)")).toBeUndefined()
})

test("line-width", () => {
	expect(__types["line-width"].handleValue("thick")).not.toBeUndefined()
	expect(__types["line-width"].handleValue("thin")).not.toBeUndefined()
	expect(__types["line-width"].handleValue("smaller")).toBeUndefined()
	expect(__types["line-width"].handleValue("medium")).not.toBeUndefined()
})

test("relative-size", () => {
	expect(__types["relative-size"].handleValue("larger")).not.toBeUndefined()
	expect(__types["relative-size"].handleValue("smaller")).not.toBeUndefined()
	expect(__types["relative-size"].handleValue("medium")).toBeUndefined()
	expect(__types["relative-size"].handleValue("thin")).toBeUndefined()
})

test("absolute-size", () => {
	expect(__types["absolute-size"].handleValue("xx-small")).not.toBeUndefined()
	expect(__types["absolute-size"].handleValue("xx-large")).not.toBeUndefined()
	expect(__types["absolute-size"].handleValue("thin")).toBeUndefined()
	expect(__types["absolute-size"].handleValue("medium")).not.toBeUndefined()
})

test("generic-name", () => {
	expect(__types["generic-name"].handleValue("monospace")).not.toBeUndefined()
	expect(__types["generic-name"].handleValue("sans-serif")).not.toBeUndefined()
	expect(__types["generic-name"].handleValue("consola")).toBeUndefined()
})

test("family-name", () => {
	expect(__types["family-name"].handleValue("monospace, abc, def")).not.toBeUndefined()
	expect(__types["family-name"].handleValue("sans-serif")).not.toBeUndefined()
	expect(__types["family-name"].handleValue("123")).toBeUndefined()
})
