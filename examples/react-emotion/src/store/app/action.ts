import { createAction } from "@reduxjs/toolkit"

export const onScreen = createAction<{ event: MediaQueryListEvent; screen: "2xl" | "xl" | "lg" | "md" | "sm" | "xs" }>(
	"on_screen",
)
export const onScreenUpdated = createAction<"2xl" | "xl" | "lg" | "md" | "sm" | "xs">("on_screen_updated")

export default {}
