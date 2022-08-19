import { ThemeProvider } from "@emotion/react"
import { PropsWithChildren } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { LocaleProvider, StoreProvider } from "~/store/Provider"
import { GlobalStyles } from "./GlobalStyles"
import { Main } from "./Main"
import { useSelect } from "./store"

function ReactQueryProvider({ children }: PropsWithChildren<{}>) {
	const queryClient = useSelect(state => state.app.queryClient)
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default function App() {
	return (
		<>
			<GlobalStyles />
			<StoreProvider>
				<LocaleProvider>
					<ReactQueryProvider>
						<ThemeProvider theme={{ colors: { primary: "#abcaca9f" } }}>
							<Main />
						</ThemeProvider>
					</ReactQueryProvider>
				</LocaleProvider>
			</StoreProvider>
		</>
	)
}
