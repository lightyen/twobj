import { css } from "@emotion/react"
const __tw = {}
__tw[0] = css({
	content: "var(--tw-content)",
	"--tw-content": "'ab\\tab'",
})
__tw[1] = css({
	content: "var(--tw-content)",
	"--tw-content": '"ab\\tab"',
})
__tw[2] = css({
	content: "var(--tw-content)",
	"--tw-content": "'ab\tab'",
})
__tw[3] = css({
	content: "var(--tw-content)",
	"--tw-content": '"ab\tab"',
})
export function Test() {
	return (
		<div>
			<span css={__tw[0]}></span>
			<span css={__tw[1]}></span>
			<span css={__tw[2]}></span>
			<span css={__tw[3]}></span>
			<span css={__tw[2]}></span>
			<span css={__tw[3]}></span>
		</div>
	)
}