import { globalStyles, theme, tw, wrap } from "twobj"

globalStyles

tw`divide-black`
tw`flex items-center font-bold text-lg after:text-cyan-400`

wrap`(hover: focus:):`

export function Header(props: React.PropsWithChildren<{ className?: string }>) {
	return <h1 tw="border-y-4 border-indigo-400 sm:(rounded-2xl border-l-indigo-300 flex justify-around)" {...props} />
}

export function A() {
	return (
		<div tw="flex justify-center mx-auto" css={wrap`md:`({ borderTopWidth: "1px", ...tw`bg-red-500` })}>
			<span css={[tw`text-gray-700`, tw`bg-gray-100`]}>{theme`colors.blue.500 / 30%` as string}</span>
			<Header tw="(active: first-of-type:):bg-red-300">Header</Header>
			<div tw="">Empty</div>
		</div>
	)
}

const style = {
	a: tw`text-black`,
	b: tw`bg-white`,
}

const Styled1 = tw(Header)(style.a, style.b)

const Styled2 = tw.input`hidden`

const Styled3 = tw("input")`hidden`
