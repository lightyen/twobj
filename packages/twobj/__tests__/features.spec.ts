import { context } from "./context"

const features = [
	"preflight",
	"container",
	"accessibility",
	"pointerEvents",
	"visibility",
	"position",
	"inset",
	"isolation",
	"zIndex",
	"order",
	"gridColumn",
	"gridColumnStart",
	"gridColumnEnd",
	"gridRow",
	"gridRowStart",
	"gridRowEnd",
	"float",
	"clear",
	"margin",
	"boxSizing",
	"display",
	"aspectRatio",
	"height",
	"maxHeight",
	"minHeight",
	"width",
	"minWidth",
	"maxWidth",
	"flex",
	"flexShrink",
	"flexGrow",
	"flexBasis",
	"tableLayout",
	"borderCollapse",
	"borderSpacing",
	"transformOrigin",
	"translate",
	"rotate",
	"skew",
	"scale",
	"transform",
	"animation",
	"cursor",
	"touchAction",
	"userSelect",
	"resize",
	"scrollSnapType",
	"scrollSnapAlign",
	"scrollSnapStop",
	"scrollMargin",
	"scrollPadding",
	"listStylePosition",
	"listStyleType",
	"appearance",
	"columns",
	"breakBefore",
	"breakInside",
	"breakAfter",
	"gridAutoColumns",
	"gridAutoFlow",
	"gridAutoRows",
	"gridTemplateColumns",
	"gridTemplateRows",
	"flexDirection",
	"flexWrap",
	"placeContent",
	"placeItems",
	"alignContent",
	"alignItems",
	"justifyContent",
	"justifyItems",
	"gap",
	"space",
	"divideWidth",
	"divideStyle",
	"divideColor",
	"placeSelf",
	"alignSelf",
	"justifySelf",
	"overflow",
	"overscrollBehavior",
	"scrollBehavior",
	"textOverflow",
	"whitespace",
	"wordBreak",
	"borderRadius",
	"borderWidth",
	"borderStyle",
	"borderColor",
	"backgroundColor",
	"backgroundImage",
	"gradientColorStops",
	"boxDecorationBreak",
	"backgroundSize",
	"backgroundAttachment",
	"backgroundClip",
	"backgroundPosition",
	"backgroundRepeat",
	"backgroundOrigin",
	"fill",
	"stroke",
	"strokeWidth",
	"objectFit",
	"objectPosition",
	"padding",
	"textAlign",
	"textIndent",
	"verticalAlign",
	"fontFamily",
	"fontSize",
	"fontWeight",
	"textTransform",
	"fontStyle",
	"fontVariantNumeric",
	"lineHeight",
	"letterSpacing",
	"textColor",
	"textDecoration",
	"textDecorationColor",
	"textDecorationStyle",
	"textDecorationThickness",
	"textUnderlineOffset",
	"fontSmoothing",
	"placeholderColor",
	"caretColor",
	"accentColor",
	"opacity",
	"backgroundBlendMode",
	"mixBlendMode",
	"boxShadow",
	"boxShadowColor",
	"outlineStyle",
	"outlineWidth",
	"outlineOffset",
	"outlineColor",
	"ringWidth",
	"ringColor",
	"ringOffsetWidth",
	"ringOffsetColor",
	"blur",
	"brightness",
	"contrast",
	"dropShadow",
	"grayscale",
	"hueRotate",
	"invert",
	"saturate",
	"sepia",
	"filter",
	"backdropBlur",
	"backdropBrightness",
	"backdropContrast",
	"backdropGrayscale",
	"backdropHueRotate",
	"backdropInvert",
	"backdropSaturate",
	"backdropSepia",
	"backdropFilter",
	"backdropOpacity",
	"transitionProperty",
	"transitionDelay",
	"transitionDuration",
	"transitionTimingFunction",
	"willChange",
	"content",
]

test("features", async () => {
	expect(features.sort()).toEqual(Array.from(context.features).sort())
})

it("snapshots", async () => {
	const list = context.getClassList()
	list.forEach(classname => {
		expect(context.css(classname)).toMatchSnapshot(classname)
	})
})
