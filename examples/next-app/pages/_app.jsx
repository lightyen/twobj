import { cache } from "@emotion/css"
import { CacheProvider, css, Global } from "@emotion/react"
import { globalStyles, tw } from "twobj"

const customStyles = css([
	globalStyles,
	{
		body: tw`antialiased`,
	},
])

function GlobalStyles() {
	return <Global styles={customStyles} />
}

export default function App({ Component, pageProps }) {
	return (
		<CacheProvider value={cache}>
			<GlobalStyles />
			<Component {...pageProps} />
		</CacheProvider>
	)
}
