import { jsx as _jsx } from "@emotion/react/jsx-runtime"
import { jsxs as _jsxs } from "@emotion/react/jsx-runtime"

function _EMOTION_STRINGIFIED_CSS_ERROR__() {
	return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."
}

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

var _ref =
	process.env.NODE_ENV === "production"
		? {
				name: "1913iin",
				styles: "border-top-width:4px;border-bottom-width:4px;border-color:#818cf8;@media (min-width: 640px){border-radius:1rem;border-left-color:#a5b4fc;display:flex;justify-content:space-around;}",
		  }
		: {
				name: "1k1mlv4-Header",
				styles: "border-top-width:4px;border-bottom-width:4px;border-color:#818cf8;@media (min-width: 640px){border-radius:1rem;border-left-color:#a5b4fc;display:flex;justify-content:space-around;};label:Header;",
				toString: _EMOTION_STRINGIFIED_CSS_ERROR__,
		  }

function Header(props) {
	return _jsx("h1", {
		css: _ref,
		...props,
	})
}

var _ref2 =
	process.env.NODE_ENV === "production"
		? {
				name: "1t96w7l",
				styles: "background-color:#fca5a5",
		  }
		: {
				name: "133m1ub-A",
				styles: "background-color:#fca5a5;label:A;",
				toString: _EMOTION_STRINGIFIED_CSS_ERROR__,
		  }

function A() {
	return _jsxs("div", {
		css: [
			"display:flex;justify-content:center;margin-left:auto;margin-right:auto;",
			(e => ({
				"@media (min-width: 768px)": e,
			}))({
				borderTopWith: "1px",
				...{
					backgroundColor: "#ef4444",
				},
			}),
			process.env.NODE_ENV === "production" ? "" : ";label:A;",
		],
		children: [
			_jsx("span", {
				children: "rgb(59 130 246 / 30%)",
			}),
			_jsx(Header, {
				css: _ref2,
				children: "Header",
			}),
		],
	})
}
