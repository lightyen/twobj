import { css } from "@emotion/react"
const _tw = {}
_tw[0] = css({
	content: "var(--tw-content)",
	"--tw-content": "'ab\\tab'",
})
_tw[1] = css({
	content: "var(--tw-content)",
	"--tw-content": '"ab\\tab"',
})
_tw[2] = css({
	content: "var(--tw-content)",
	"--tw-content": "'ab\tab'",
})
_tw[3] = css({
	content: "var(--tw-content)",
	"--tw-content": '"ab\tab"',
})
export function Test() {
	return (
		<div>
			<span css={_tw[0]}></span>
			<span css={_tw[1]}></span>
			<span css={_tw[2]}></span>
			<span css={_tw[3]}></span>
			<span css={_tw[2]}></span>
			<span css={_tw[3]}></span>
		</div>
	)
}