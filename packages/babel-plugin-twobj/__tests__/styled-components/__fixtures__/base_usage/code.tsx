import { createGlobalStyle } from "styled-components"
import { globalStyles, theme, tw, wrap } from "twobj"

export const GlobalStyles = createGlobalStyle`${globalStyles}`

tw`divide-black`
tw`flex items-center font-bold text-lg after:text-cyan-400`

export function Header(props: React.PropsWithChildren<{ className?: string }>) {
	return <h1 tw="border-y-4 border-indigo-400 sm:(rounded-2xl border-l-indigo-300 flex justify-around)" {...props} />
}

export function A() {
	return (
		<div tw="flex justify-center mx-auto" css={wrap`md:`({ borderTopWith: "1px", ...tw`bg-red-500` })}>
			<span>{theme`colors.blue.500 / 30%` as string}</span>
			<Header tw="(active: first-of-type:):bg-red-300">Header</Header>
		</div>
	)
}
