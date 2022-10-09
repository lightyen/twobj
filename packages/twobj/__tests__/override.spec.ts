import { tw } from "./context"

test("override padding", async () => {
	expect(Object.entries(tw`p-4 pt-1`)).toStrictEqual(
		Object.entries({
			padding: "1rem",
			paddingTop: "0.25rem",
		}),
	)

	expect(Object.entries(tw`p-4 pt-1 p-2 pb-0`)).toStrictEqual(
		Object.entries({
			paddingTop: "0.25rem",
			padding: "0.5rem",
			paddingBottom: "0px",
		}),
	)
})
