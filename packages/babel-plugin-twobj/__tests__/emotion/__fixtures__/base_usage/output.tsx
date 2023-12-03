import { css } from "@emotion/react"
const __tw = {}
__tw[0] = css({
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
__tw[1] = css({
	display: "flex",
	justifyContent: "center",
	marginLeft: "auto",
	marginRight: "auto",
})
__tw[2] = css({
	"&:active, &:first-of-type": {
		backgroundColor: "#fca5a5",
	},
})
__tw[3] = css({})
import styled from "@emotion/styled"
__tw[4] = css({
	display: "none",
})
const globalStyles = {
	"*, ::before, ::after": {
		"--tw-border-spacing-x": "0",
		"--tw-border-spacing-y": "0",
		"--tw-ring-inset": "var(--tw-empty,/**/ /**/)",
		"--tw-ring-offset-shadow": "0 0 #0000",
		"--tw-ring-shadow": "0 0 #0000",
		"--tw-ring-offset-width": "0px",
		"--tw-ring-offset-color": "#fff",
		"--tw-ring-color": "rgb(59 130 246 / 0.5)",
		"--tw-blur": "var(--tw-empty,/**/ /**/)",
		"--tw-brightness": "var(--tw-empty,/**/ /**/)",
		"--tw-contrast": "var(--tw-empty,/**/ /**/)",
		"--tw-grayscale": "var(--tw-empty,/**/ /**/)",
		"--tw-hue-rotate": "var(--tw-empty,/**/ /**/)",
		"--tw-invert": "var(--tw-empty,/**/ /**/)",
		"--tw-saturate": "var(--tw-empty,/**/ /**/)",
		"--tw-sepia": "var(--tw-empty,/**/ /**/)",
		"--tw-drop-shadow": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-blur": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-brightness": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-contrast": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-grayscale": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-hue-rotate": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-invert": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-opacity": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-saturate": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-sepia": "var(--tw-empty,/**/ /**/)",
		"--tw-ordinal": "var(--tw-empty,/**/ /**/)",
		"--tw-slashed-zero": "var(--tw-empty,/**/ /**/)",
		"--tw-numeric-figure": "var(--tw-empty,/**/ /**/)",
		"--tw-numeric-spacing": "var(--tw-empty,/**/ /**/)",
		"--tw-numeric-fraction": "var(--tw-empty,/**/ /**/)",
		"--tw-scroll-snap-strictness": "proximity",
		"--tw-pan-x": "var(--tw-empty,/**/ /**/)",
		"--tw-pan-y": "var(--tw-empty,/**/ /**/)",
		"--tw-pinch-zoom": "var(--tw-empty,/**/ /**/)",
	},
	"::backdrop": {
		"--tw-border-spacing-x": "0",
		"--tw-border-spacing-y": "0",
		"--tw-ring-inset": "var(--tw-empty,/**/ /**/)",
		"--tw-ring-offset-shadow": "0 0 #0000",
		"--tw-ring-shadow": "0 0 #0000",
		"--tw-ring-offset-width": "0px",
		"--tw-ring-offset-color": "#fff",
		"--tw-ring-color": "rgb(59 130 246 / 0.5)",
		"--tw-blur": "var(--tw-empty,/**/ /**/)",
		"--tw-brightness": "var(--tw-empty,/**/ /**/)",
		"--tw-contrast": "var(--tw-empty,/**/ /**/)",
		"--tw-grayscale": "var(--tw-empty,/**/ /**/)",
		"--tw-hue-rotate": "var(--tw-empty,/**/ /**/)",
		"--tw-invert": "var(--tw-empty,/**/ /**/)",
		"--tw-saturate": "var(--tw-empty,/**/ /**/)",
		"--tw-sepia": "var(--tw-empty,/**/ /**/)",
		"--tw-drop-shadow": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-blur": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-brightness": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-contrast": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-grayscale": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-hue-rotate": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-invert": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-opacity": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-saturate": "var(--tw-empty,/**/ /**/)",
		"--tw-backdrop-sepia": "var(--tw-empty,/**/ /**/)",
		"--tw-ordinal": "var(--tw-empty,/**/ /**/)",
		"--tw-slashed-zero": "var(--tw-empty,/**/ /**/)",
		"--tw-numeric-figure": "var(--tw-empty,/**/ /**/)",
		"--tw-numeric-spacing": "var(--tw-empty,/**/ /**/)",
		"--tw-numeric-fraction": "var(--tw-empty,/**/ /**/)",
		"--tw-scroll-snap-strictness": "proximity",
		"--tw-pan-x": "var(--tw-empty,/**/ /**/)",
		"--tw-pan-y": "var(--tw-empty,/**/ /**/)",
		"--tw-pinch-zoom": "var(--tw-empty,/**/ /**/)",
	},
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
	html: {
		lineHeight: "1.5",
		WebkitTextSizeAdjust: "100%",
		MozTabSize: "4",
		tabSize: "4",
		fontFamily:
			'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		fontFeatureSettings: "normal",
		fontVariationSettings: "normal",
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
		fontWeight: "inherit",
		lineHeight: "inherit",
		color: "inherit",
		margin: "0",
		padding: "0",
	},
	"button,select": {
		textTransform: "none",
	},
	"button,[type='button'],[type='reset'],[type='submit']": {
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
e => ({
	"@media (hover: hover) and (pointer: fine)": {
		"&:hover": e,
	},
	"&:focus": e,
})
export function Header(props) {
	return <h1 css={__tw[0]} {...props} />
}
export function A() {
	return (
		<div
			css={[
				__tw[1],
				(e => ({
					"@media (min-width: 768px)": e,
				}))({
					borderTopWidth: "1px",
					...{
						backgroundColor: "#ef4444",
					},
				}),
			]}
		>
			<span
				css={[
					{
						color: "#374151",
					},
					{
						backgroundColor: "#f3f4f6",
					},
				]}
			>
				{"rgb(59 130 246 / 30%)"}
			</span>
			<Header css={__tw[2]}>Header</Header>
			<div css={__tw[3]}>Empty</div>
		</div>
	)
}
const style = {
	a: {
		color: "#000",
	},
	b: {
		backgroundColor: "#fff",
	},
}
const Styled1 = styled(Header)(style.a, style.b)
const Styled2 = styled.input(__tw[4])
const Styled3 = styled("input")(__tw[4])