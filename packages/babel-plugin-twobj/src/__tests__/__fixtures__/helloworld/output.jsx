import { jsx as _jsx } from "@emotion/react/jsx-runtime"
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

function A() {
	return _jsx("div", {
		css: [
			"display:flex;justify-content:center;margin-left:auto;margin-right:auto;",
			(e => ({
				"@media (min-width: 640px)": e,
			}))({
				accentColor: "red",
			}),
			process.env.NODE_ENV === "production" ? "" : ";label:A;",
			process.env.NODE_ENV === "production"
				? ""
				: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvZGUuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU93QyIsImZpbGUiOiJjb2RlLmpzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR3LCB3cmFwIH0gZnJvbSBcInR3b2JqXCJcblxudHdgZGl2aWRlLWJsYWNrYFxudHdgZmxleCBpdGVtcy1jZW50ZXIgZm9udC1ib2xkIHRleHQtbGcgYWZ0ZXI6dGV4dC1jeWFuLTQwMGBcblxuZnVuY3Rpb24gQSgpIHtcblx0cmV0dXJuIChcblx0XHQ8ZGl2IHR3PVwiZmxleCBqdXN0aWZ5LWNlbnRlciBteC1hdXRvXCIgY3NzPXt3cmFwYHNtOiRlYCh7IGFjY2VudENvbG9yOiBcInJlZFwiIH0pfT5cblx0XHRcdEFcblx0XHQ8L2Rpdj5cblx0KVxufVxuIl19 */",
		],
		children: "A",
	})
}
