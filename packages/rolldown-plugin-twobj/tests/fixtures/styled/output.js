import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { jsx } from "@emotion/react/jsx-runtime";
//#region virtual:entry.tsx
const _tw = [];
_tw[0] = /* @__PURE__ */ css({ "width": "100%" });
function MyComponent({ width }) {
	return /* @__PURE__ */ jsx("div", {
		style: { width },
		children: "comp"
	});
}
const C1 = /* @__PURE__ */ styled(MyComponent, { target: "erl7nak0" })(_tw[0]);
const C2 = /* @__PURE__ */ styled(MyComponent, { target: "erl7nak1" })((myComponentProps) => ({ width: myComponentProps.width }));
const C3 = /* @__PURE__ */ styled("div", { target: "erl7nak2" })(_tw[0]);
const C4 = /* @__PURE__ */ styled("div", { target: "erl7nak3" })(_tw[0]);
const CC = /* @__PURE__ */ styled("div", { target: "erl7nak4" })((props) => ({ width: props.width }));
//#endregion
export { C1, C2, C3, C4, CC };
