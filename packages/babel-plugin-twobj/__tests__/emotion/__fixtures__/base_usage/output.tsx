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

function Header(props) {
	return (
		<h1
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

function A() {
	return (
		<div
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
			<span>{"rgb(59 130 246 / 30%)"}</span>
			<Header
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
