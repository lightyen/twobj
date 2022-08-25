import { eventChannel } from "redux-saga"
import { fork, put, take } from "redux-saga/effects"
import * as ac from "./action"
import { ScreenType } from "./screen"

const mediaQuery = (query: string) =>
	eventChannel<MediaQueryListEvent>(emit => {
		const mql = window.matchMedia(query)
		function onchange(e: MediaQueryListEvent) {
			emit(e)
		}
		mql.addEventListener("change", onchange, { passive: true })
		return () => {
			mql.removeEventListener("change", onchange)
		}
	})

function screen(query: string, screen: ScreenType) {
	return fork(function* () {
		const ch = mediaQuery(query)
		while (true) {
			const event: MediaQueryListEvent = yield take(ch)
			if (event.matches) yield put(ac.onScreen({ event, screen }))
		}
	})
}

function onScreenUpdated() {
	return fork(function* () {
		while (true) {
			const e: ReturnType<typeof ac.onScreen> = yield take(ac.onScreen)
			yield put(ac.onScreenUpdated(e.payload.screen))
		}
	})
}

export default function* app() {
	yield screen(`screen and (max-width: 639px)`, "xs")
	yield screen(`screen and (min-width: 640px) and (max-width: 767px)`, "sm")
	yield screen(`screen and (min-width: 768px) and (max-width: 1024px)`, "md")
	yield screen(`screen and (min-width: 1025px) and (max-width: 1279px)`, "lg")
	yield screen(`screen and (min-width: 1280px) and (max-width: 1535px)`, "xl")
	yield screen(`screen and (min-width: 1536px)`, "2xl")
	yield onScreenUpdated()
}
