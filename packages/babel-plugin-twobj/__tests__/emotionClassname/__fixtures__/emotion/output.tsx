;({
	"& > :not([hidden]) ~ :not([hidden])": {
		borderColor: "#000",
	},
})
;({
	display: "flex",
	alignItems: "center",
	fontWeight: "700",
	fontSize: "1.125rem",
	lineHeight: "1.75rem",
	"&::after": {
		color: "#22d3ee",
		content: "var(--tw-content)",
	},
})
export function Header(props) {
	return (
		<h1
			className="border-y-4 border-indigo-400 sm:(rounded-2xl border-l-indigo-300 flex justify-around)"
			css={[
				{
					borderTopWidth: "4px",
					borderBottomWidth: "4px",
					borderColor: "#818cf8",
					"@media (min-width: 640px)": {
						borderRadius: "1rem",
						borderLeftColor: "#a5b4fc",
						display: "flex",
						justifyContent: "space-around",
					},
				},
			]}
			{...props}
		/>
	)
}
export function A() {
	return (
		<div
			className="flex justify-center mx-auto"
			css={[
				{
					display: "flex",
					justifyContent: "center",
					marginLeft: "auto",
					marginRight: "auto",
				},
				(e => ({
					"@media (min-width: 768px)": e,
				}))({
					borderTopWith: "1px",
					...{
						backgroundColor: "#ef4444",
					},
				}),
			]}
		>
			<span
				className="text-gray-700 bg-gray-100"
				css={[
					{
						color: "#374151",
						backgroundColor: "#f3f4f6",
					},
				]}
			>
				{"rgb(59 130 246 / 30%)"}
			</span>
			<Header
				className="bg-red-300"
				css={[
					{
						backgroundColor: "#fca5a5",
					},
				]}
			>
				Header
			</Header>
		</div>
	)
}
