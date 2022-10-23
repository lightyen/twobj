import { tw } from "./context"

test("content", async () => {
	expect(tw`bg-black text-white`).toEqual({
		backgroundColor: "#000",
		color: "#fff",
	})
})
