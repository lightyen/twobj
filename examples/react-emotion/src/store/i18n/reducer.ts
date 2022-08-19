import { createReducer } from "@reduxjs/toolkit"
import { setLocale } from "./action"
import { getLocale, saveLocale } from "./languages"

interface IntlStoreType {
	enable: boolean
	locale: string
}

export type IntlStore = Readonly<IntlStoreType>

window.__locale__ = getLocale()

const init: IntlStore = {
	enable: true,
	locale: window.__locale__,
}

export const intl = createReducer(init, builder =>
	builder.addCase(setLocale, (state, { payload }) => {
		saveLocale(payload)
		state.locale = payload
	}),
)
