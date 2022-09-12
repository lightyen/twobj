function Test() {
	return (
		<div>
			<span
				css={[
					{
						content: "var(--tw-content)",
						"--tw-content": "'ab\\tab'",
					},
				]}
			></span>
			<span
				css={[
					{
						content: "var(--tw-content)",
						"--tw-content": '"ab\\tab"',
					},
				]}
			></span>
			<span
				css={[
					{
						content: "var(--tw-content)",
						"--tw-content": "'ab\tab'",
					},
				]}
			></span>
			<span
				css={[
					{
						content: "var(--tw-content)",
						"--tw-content": '"ab\tab"',
					},
				]}
			></span>
			<span
				css={[
					{
						content: "var(--tw-content)",
						"--tw-content": "'ab\tab'",
					},
				]}
			></span>
			<span
				css={[
					{
						content: "var(--tw-content)",
						"--tw-content": '"ab\tab"',
					},
				]}
			></span>
		</div>
	)
}
