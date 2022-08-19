import { createAction } from "@reduxjs/toolkit"
import { LocaleType } from "./languages"

export const setLocale = createAction<LocaleType>("set_locale")

export default {
	setLocale,
}
