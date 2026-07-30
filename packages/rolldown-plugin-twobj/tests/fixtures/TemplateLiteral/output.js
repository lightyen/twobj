import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { jsx, jsxs } from "@emotion/react/jsx-runtime";
//#region virtual:entry.tsx
const _tw = [];
_tw[0] = /* @__PURE__ */ css({
	"borderTopWidth": "4px",
	"borderBottomWidth": "4px",
	"borderColor": "#818cf8",
	"@media (min-width: 640px)": {
		"borderRadius": "1rem",
		"borderLeftColor": "#a5b4fc",
		"display": "flex",
		"justifyContent": "space-around"
	}
});
_tw[1] = /* @__PURE__ */ css({
	"display": "flex",
	"justifyContent": "center",
	"marginLeft": "auto",
	"marginRight": "auto"
});
_tw[2] = (e) => ({ "@media (min-width: 768px)": e });
_tw[3] = /* @__PURE__ */ css({ "backgroundColor": "#ef4444" });
_tw[4] = /* @__PURE__ */ css({ "color": "#374151" });
_tw[5] = /* @__PURE__ */ css({ "backgroundColor": "#f3f4f6" });
_tw[6] = "rgb(59 130 246 / 30%)";
_tw[7] = /* @__PURE__ */ css({ "&:active, &:first-of-type": { "backgroundColor": "#fca5a5" } });
_tw[8] = /* @__PURE__ */ css({ "& > :not([hidden]) ~ :not([hidden])": { "borderColor": "#000" } });
_tw[9] = { "backgroundColor": "#ef4444" };
_tw[10] = /* @__PURE__ */ css({ "color": "#000" });
_tw[11] = /* @__PURE__ */ css({ "backgroundColor": "#fff" });
_tw[12] = /* @__PURE__ */ css({
	"marginTop": "1rem",
	"marginBottom": "1rem",
	"maxWidth": "36rem"
});
function Header(props) {
	return /* @__PURE__ */ jsx("h1", {
		css: _tw[0],
		...props
	});
}
function A() {
	return /* @__PURE__ */ jsxs("div", {
		css: [_tw[1], _tw[2]({
			borderTopWidth: "1px",
			..._tw[3]
		})],
		children: [
			/* @__PURE__ */ jsx("span", {
				css: [_tw[4], _tw[5]],
				children: _tw[6]
			}),
			/* @__PURE__ */ jsx(Header, {
				css: _tw[7],
				children: "Header"
			}),
			/* @__PURE__ */ jsx("div", {
				css: _tw[8],
				style: _tw[9],
				children: "Empty"
			})
		]
	});
}
_tw[10], _tw[11];
const Separator = /* @__PURE__ */ styled("hr", { target: "e6s4fge0" })(_tw[12]);
//#endregion
export { A, Header, Separator };
