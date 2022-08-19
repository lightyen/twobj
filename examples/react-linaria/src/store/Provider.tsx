import { PropsWithChildren } from "react"
import { IntlProvider } from "react-intl"
import { Provider as ReactReduxProvider } from "react-redux"
import { useSelect } from "."
import { AppStoreContext } from "./hooks"
import { getLocaleMessages } from "./i18n/languages"
import { store } from "./store"

export function StoreProvider({ children }: PropsWithChildren<{}>) {
	return (
		<ReactReduxProvider context={AppStoreContext} store={store}>
			{children}
		</ReactReduxProvider>
	)
}

export function LocaleProvider({ children }: PropsWithChildren<{}>) {
	const locale = useSelect(state => state.intl.locale)
	return (
		<IntlProvider locale={locale} key={locale} messages={getLocaleMessages()}>
			{children}
		</IntlProvider>
	)
}
