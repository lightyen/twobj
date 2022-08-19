import { QueryClientProvider } from "@tanstack/react-query"
import { PropsWithChildren } from "react"

import { LocaleProvider, StoreProvider } from "~/store/Provider"
import Layout from "./Layout"
import { useSelect } from "./store"

function ReactQueryProvider({ children }: PropsWithChildren<{}>) {
	const queryClient = useSelect(state => state.app.queryClient)
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default function App() {
	return (
		<>
			<StoreProvider>
				<LocaleProvider>
					<ReactQueryProvider>
						<Layout />
					</ReactQueryProvider>
				</LocaleProvider>
			</StoreProvider>
		</>
	)
}
