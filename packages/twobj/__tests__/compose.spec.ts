import { expect, test } from "vitest"
import { tw } from "./context"

test("content", () => {
	expect(tw`bg-black text-white`).toEqual({
		backgroundColor: "#000",
		color: "#fff",
	})
})
