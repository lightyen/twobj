import { __types } from "../values"

it("url", () => {
	expect(
		__types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)"),
	).toBeTruthy()
	expect(__types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/")).toBeTruthy()
	expect(
		__types.url.handleValue("rgb(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)"),
	).toBeFalsy()
})
