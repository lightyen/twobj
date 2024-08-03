import { css } from "@emotion/react"
const _tw = {}
_tw[0] = css({
	"& > :not([hidden]) ~ :not([hidden])": {
		borderColor: "#000",
	},
})
_tw[1] = css({
	display: "flex",
	alignItems: "center",
	fontWeight: "700",
	fontSize: "1.125rem",
	lineHeight: "1.75rem",
	"&::after": {
		"--tw-content": "''",
		content: "var(--tw-content)",
		color: "#22d3ee",
	},
})
_tw[2] = css({
	borderTopWidth: "4px",
	borderBottomWidth: "4px",
	borderColor: "#818cf8",
	"@media (min-width: 640px)": {
		borderRadius: "1rem",
		borderLeftColor: "#a5b4fc",
		display: "flex",
		justifyContent: "space-around",
	},
})
_tw[3] = css({
	display: "flex",
	justifyContent: "center",
	marginLeft: "auto",
	marginRight: "auto",
})
_tw[4] = css({
	backgroundColor: "#ef4444",
})
_tw[5] = css({
	color: "#374151",
})
_tw[6] = css({
	backgroundColor: "#f3f4f6",
})
_tw[7] = css({
	"&:active, &:first-of-type": {
		backgroundColor: "#fca5a5",
	},
})
_tw[8] = css({})
_tw[9] = css({
	color: "#000",
})
_tw[10] = css({
	backgroundColor: "#fff",
})
import styled from "@emotion/styled"
_tw[11] = css({
	display: "none",
})
const globalStyles = {
	"*": {
		boxSizing: "border-box",
		borderWidth: "0",
		borderStyle: "solid",
		borderColor: "#e5e7eb",
	},
	"::before": {
		boxSizing: "border-box",
		borderWidth: "0",
		borderStyle: "solid",
		borderColor: "#e5e7eb",
		"--tw-content": "''",
	},
	"::after": {
		boxSizing: "border-box",
		borderWidth: "0",
		borderStyle: "solid",
		borderColor: "#e5e7eb",
		"--tw-content": "''",
	},
	"html,:host": {
		lineHeight: "1.5",
		WebkitTextSizeAdjust: "100%",
		MozTabSize: "4",
		tabSize: "4",
		fontFamily:
			'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		fontFeatureSettings: "normal",
		fontVariationSettings: "normal",
		WebkitTapHighlightColor: "transparent",
	},
	body: {
		margin: "0",
		lineHeight: "inherit",
	},
	hr: {
		height: "0",
		color: "inherit",
		borderTopWidth: "1px",
	},
	"abbr:where([title])": {
		textDecoration: "underline dotted",
	},
	"h1,h2,h3,h4,h5,h6": {
		fontSize: "inherit",
		fontWeight: "inherit",
	},
	a: {
		color: "inherit",
		textDecoration: "inherit",
	},
	"b,strong": {
		fontWeight: "bolder",
	},
	"code,kbd,samp,pre": {
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		fontFeatureSettings: "normal",
		fontVariationSettings: "normal",
		fontSize: "1em",
	},
	small: {
		fontSize: "80%",
	},
	"sub,sup": {
		fontSize: "75%",
		lineHeight: "0",
		position: "relative",
		verticalAlign: "baseline",
	},
	sub: {
		bottom: "-0.25em",
	},
	sup: {
		top: "-0.5em",
	},
	table: {
		textIndent: "0",
		borderColor: "inherit",
		borderCollapse: "collapse",
	},
	"button,input,optgroup,select,textarea": {
		fontFamily: "inherit",
		fontSize: "100%",
		fontFeatureSettings: "inherit",
		fontVariationSettings: "inherit",
		fontWeight: "inherit",
		lineHeight: "inherit",
		letterSpacing: "inherit",
		color: "inherit",
		margin: "0",
		padding: "0",
	},
	"button,select": {
		textTransform: "none",
	},
	"button,input:where([type='button']),input:where([type='reset']),input:where([type='submit'])": {
		WebkitAppearance: "button",
		backgroundColor: "transparent",
		backgroundImage: "none",
	},
	":-moz-focusring": {
		outline: "auto",
	},
	":-moz-ui-invalid": {
		boxShadow: "none",
	},
	progress: {
		verticalAlign: "baseline",
	},
	"::-webkit-inner-spin-button,::-webkit-outer-spin-button": {
		height: "auto",
	},
	"[type='search']": {
		WebkitAppearance: "textfield",
		outlineOffset: "-2px",
	},
	"::-webkit-search-decoration": {
		WebkitAppearance: "none",
	},
	"::-webkit-file-upload-button": {
		WebkitAppearance: "button",
		font: "inherit",
	},
	summary: {
		display: "list-item",
	},
	"blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre": {
		margin: "0",
	},
	fieldset: {
		margin: "0",
		padding: "0",
	},
	legend: {
		padding: "0",
	},
	"ol,ul,menu": {
		listStyle: "none",
		margin: "0",
		padding: "0",
	},
	dialog: {
		padding: "0",
	},
	textarea: {
		resize: "vertical",
	},
	"input::placeholder,textarea::placeholder": {
		opacity: "1",
		color: "#9ca3af",
	},
	'button,[role="button"]': {
		cursor: "pointer",
	},
	":disabled": {
		cursor: "default",
	},
	"img,svg,video,canvas,audio,iframe,embed,object": {
		display: "block",
		verticalAlign: "middle",
	},
	"img,video": {
		maxWidth: "100%",
		height: "auto",
	},
	"[hidden]": {
		display: "none",
	},
}
globalStyles
_tw[0]
_tw[1]
e => ({
	"@media (hover: hover) and (pointer: fine)": {
		"&:hover": e,
	},
	"&:focus": e,
})
export function Header(props) {
	return <h1 css={_tw[2]} {...props} />
}
export function A() {
	return (
		<div
			css={[
				_tw[3],
				(e => ({
					"@media (min-width: 768px)": e,
				}))({
					borderTopWidth: "1px",
					..._tw[4],
				}),
			]}
		>
			<span css={[_tw[5], _tw[6]]}>{"rgb(59 130 246 / 30%)"}</span>
			<Header css={_tw[7]}>Header</Header>
			<div css={_tw[8]}>Empty</div>
		</div>
	)
}
const style = {
	a: _tw[9],
	b: _tw[10],
}
const Styled1 = styled(Header)(style.a, style.b)
const Styled2 = styled.input(_tw[11])
const Styled3 = styled("input")(_tw[11])