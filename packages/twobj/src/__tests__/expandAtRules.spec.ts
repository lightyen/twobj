import context from "./defaultContext"

it("expandAtRules", () => {
	expect(context.expandAtRules({ "@apply text-white bg-black": { borderColor: "black" } })).toEqual({
		color: "#fff",
		backgroundColor: "#000",
		borderColor: "black",
	})
	expect(context.expandAtRules({ "@screen md": { borderColor: "black" } })).toEqual({
		"@media (min-width: 768px)": { borderColor: "black" },
	})
	expect(context.expandAtRules({ "@screen md": { "@apply text-white bg-black": { borderColor: "black" } } })).toEqual(
		{
			"@media (min-width: 768px)": { color: "#fff", backgroundColor: "#000", borderColor: "black" },
		},
	)
	expect(
		context.expandAtRules({
			"@screen 2xl": { "@apply text-white bg-black": { "@screen md": { borderColor: "black" } } },
		}),
	).toEqual({
		"@media (min-width: 1536px)": {
			color: "#fff",
			backgroundColor: "#000",
			"@media (min-width: 768px)": {
				borderColor: "black",
			},
		},
	})
	expect(context.expandAtRules({ "& > :not([hidden]) ~ :not([hidden])": { borderColor: "black" } })).toEqual({
		"& > :not([hidden]) ~ :not([hidden])": { borderColor: "black" },
	})
	expect(context.expandAtRules({ "@media (min-width: 1024px)": { ".container": { padding: "10px" } } })).toEqual({
		"@media (min-width: 1024px)": { ".container": { padding: "10px" } },
	})
	expect(context.expandAtRules({ "@media (min-width: 1024px)": { "&": { padding: "10px" } } })).toEqual({
		"@media (min-width: 1024px)": { "&": { padding: "10px" } },
	})
})
