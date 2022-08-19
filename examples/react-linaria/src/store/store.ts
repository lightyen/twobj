import { configureStore } from "@reduxjs/toolkit"
import createSagaMiddleware from "redux-saga"
import rootSaga from "~/store/saga"
import { app, AppStore } from "./app/reducer"
import { intl, IntlStore } from "./i18n/reducer"

interface RootStoreType {
	app: AppStore
	intl: IntlStore
}

export type RootStore = Readonly<RootStoreType>

export function makeStore() {
	const sagaMiddleware = createSagaMiddleware()
	const store = configureStore({
		reducer: {
			app,
			intl,
		},
		middleware: [sagaMiddleware],
		devTools: process.env.NODE_ENV === "development" ? { name: process.env.APP_NAME } : false,
	})

	let sagaTask = sagaMiddleware.run(rootSaga)

	if (module.hot) {
		module.hot.accept(["./saga"], () => {
			sagaTask.cancel()
			sagaTask.toPromise().then(() => {
				sagaTask = sagaMiddleware.run(rootSaga)
			})
		})
	}
	return store
}

export const store = makeStore()
