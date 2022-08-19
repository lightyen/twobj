import { __types } from "../values"

it("url", () => {
	const ans = __types.url.handleValue("url(https://interactive-examples.mdn.mozilla.net/media/examples/lizard.png)")
	expect(ans).toBeTruthy()
})
