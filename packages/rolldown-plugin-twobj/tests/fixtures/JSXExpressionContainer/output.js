import { css } from "@emotion/react";
import { jsx, jsxs } from "@emotion/react/jsx-runtime";
//#region virtual:entry.tsx
const _tw = [];
_tw[0] = /* @__PURE__ */ css({
	"content": "var(--tw-content)",
	"--tw-content": "'ab\\tab'"
});
_tw[1] = /* @__PURE__ */ css({
	"content": "var(--tw-content)",
	"--tw-content": "\"ab\\tab\""
});
_tw[2] = /* @__PURE__ */ css({
	"content": "var(--tw-content)",
	"--tw-content": "'ab	ab'"
});
_tw[3] = /* @__PURE__ */ css({
	"content": "var(--tw-content)",
	"--tw-content": "\"ab	ab\""
});
function Test() {
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("span", { css: _tw[0] }),
		/* @__PURE__ */ jsx("span", { css: _tw[1] }),
		/* @__PURE__ */ jsx("span", { css: _tw[2] }),
		/* @__PURE__ */ jsx("span", { css: _tw[3] }),
		/* @__PURE__ */ jsx("span", { css: _tw[2] }),
		/* @__PURE__ */ jsx("span", { css: _tw[3] })
	] });
}
//#endregion
export { Test };
