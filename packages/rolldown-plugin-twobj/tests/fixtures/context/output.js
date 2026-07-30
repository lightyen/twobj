import { css } from "@emotion/react";
import { jsx } from "@emotion/react/jsx-runtime";
import { memo } from "react";
//#region virtual:entry.tsx
const _tw = [];
_tw[0] = /* @__PURE__ */ css({
	"display": "flex",
	"justifyContent": "space-between",
	"cursor": "pointer",
	"paddingTop": "8px",
	"paddingBottom": "8px",
	"paddingLeft": "10px",
	"paddingRight": "10px",
	"& svg": { "visibility": "hidden" },
	"&[data-state=selected] svg": { "visibility": "visible" }
});
_tw[1] = /* @__PURE__ */ css({ "color": "#fca5a5" });
_tw[2] = /* @__PURE__ */ css({ "color": "#22c55e" });
_tw[3] = /* @__PURE__ */ css({ "color": "#6b7280" });
_tw[4] = (e) => ({ "@media (min-width: 768px)": e });
_tw[5] = (e) => ({ "@media (hover: hover) and (pointer: fine)": { "&:hover": e } });
_tw[6] = /* @__PURE__ */ css({
	"--tw-backdrop-blur": "blur(8px)",
	"--tw-backdrop-brightness": "initial",
	"--tw-backdrop-contrast": "initial",
	"--tw-backdrop-grayscale": "initial",
	"--tw-backdrop-hue": "initial",
	"--tw-backdrop-invert": "initial",
	"--tw-backdrop-saturate": "initial",
	"--tw-backdrop-sepia": "initial",
	"--tw-backdrop-opacity": "initial",
	"backdropFilter": "var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)"
});
_tw[7] = /* @__PURE__ */ css({
	"--tw-backdrop-blur": "initial",
	"--tw-backdrop-brightness": "initial",
	"--tw-backdrop-contrast": "initial",
	"--tw-backdrop-grayscale": "initial",
	"--tw-backdrop-hue": "initial",
	"--tw-backdrop-invert": "initial",
	"--tw-backdrop-saturate": "initial",
	"--tw-backdrop-sepia": "sepia(100%)",
	"--tw-backdrop-opacity": "initial",
	"backdropFilter": "var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)"
});
_tw[8] = /* @__PURE__ */ css({
	"--tw-translate-x": "initial",
	"--tw-translate-y": "initial",
	"--tw-rotate": "initial",
	"--tw-skew-x": "initial",
	"--tw-skew-y": "initial",
	"--tw-scale-x": "initial",
	"--tw-scale-y": "initial",
	"--tw-ring-offset-color": "initial",
	"--tw-ring-offset-width": "initial",
	"--tw-ring-color": "initial",
	"--tw-ring-inset": "initial",
	"--tw-ring-offset-shadow": "initial",
	"--tw-ring-shadow": "initial",
	"--tw-shadow": "initial",
	"display": "inline-block",
	"position": "relative",
	"paddingLeft": "1.25rem",
	"paddingRight": "1.25rem",
	"paddingTop": "1rem",
	"paddingBottom": "1.25rem",
	"borderTopLeftRadius": "0.5rem",
	"borderTopRightRadius": "0.5rem",
	"whiteSpace": "nowrap",
	"textTransform": "capitalize",
	"transitionProperty": "all",
	"transitionTimingFunction": "cubic-bezier(0.4, 0, 0.2, 1)",
	"transitionDuration": "150ms",
	"cursor": "pointer",
	"marginTop": "0.25rem",
	"&:focus-visible": {
		"outline": "2px solid transparent",
		"outlineOffset": "2px",
		"--tw-ring-offset-shadow": "var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff)",
		"--tw-ring-shadow": "var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, rgb(59 130 246 / 0.5))",
		"boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
		"--tw-ring-color": "#60a5fa"
	},
	"&::after": {
		"--tw-content": "''",
		"content": "var(--tw-content)",
		"--tw-translate-y": "2px",
		"transform": "var(--tw-transfrom-translate, translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))",
		"height": "3px",
		"position": "absolute",
		"left": "0px",
		"bottom": "0px",
		"width": "100%",
		"transitionProperty": "all",
		"transitionTimingFunction": "cubic-bezier(0.4, 0, 0.2, 1)",
		"transitionDuration": "200ms",
		"transitionDelay": "16ms",
		"--tw-scale-x": "0",
		"--tw-scale-y": "0",
		"opacity": "0"
	}
});
_tw[9] = /* @__PURE__ */ css({ "userSelect": "none" });
function cond1() {
	return true;
}
function cond2() {
	return true;
}
function LocaleButton({ hide }) {
	return /* @__PURE__ */ jsx("div", {
		css: [
			_tw[0],
			cond1() ? _tw[1] : cond2() ? _tw[2] : _tw[3],
			_tw[4](_tw[5]([_tw[6], _tw[7]]))
		],
		children: "Test"
	});
}
const styles = /* @__PURE__ */ css(_tw[8]);
const Label = memo(function Label({ htmlFor, label }) {
	return /* @__PURE__ */ jsx("label", {
		htmlFor,
		css: [_tw[9], styles],
		children: label
	});
});
//#endregion
export { Label, LocaleButton };
