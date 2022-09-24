import { createContext, resolveConfig } from "../src"

test("style objects are immutable", async () => {
	const ctx = createContext(resolveConfig())
	expect(ctx.css("sm:(flex py-32)")).toEqual({
		"@media (min-width: 640px)": { display: "flex", paddingTop: "8rem", paddingBottom: "8rem" },
	})
	expect(ctx.css("flex text-black border-black border-2 bg-gray-100")).toEqual({
		display: "flex",
		color: "#000",
		borderColor: "#000",
		borderWidth: "2px",
		backgroundColor: "#f3f4f6",
	})
	expect(ctx.css("sm:divide-black")).toEqual({
		"@media (min-width: 640px)": { "& > :not([hidden]) ~ :not([hidden])": { borderColor: "#000" } },
	})
	expect(ctx.css("flex border-black")).toEqual({
		display: "flex",
		borderColor: "#000",
	})
})
