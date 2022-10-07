import { tw } from "./context"

test("array value in style object", async () => {
	expect(
		tw`[background: rgb(0 212 255)] [background: linear-gradient(90deg, rgb(0 212 255) 0%, rgba(68 133 110) 100%)]`,
	).toEqual({
		background: ["rgb(0 212 255)", "linear-gradient(90deg, rgb(0 212 255) 0%, rgba(68 133 110) 100%)"],
	})
})
