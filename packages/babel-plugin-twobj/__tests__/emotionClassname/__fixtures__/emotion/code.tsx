import { theme, tw, wrap } from "twobj"

tw`divide-black`
tw`flex items-center font-bold text-lg after:text-cyan-400`

export function Header(props: React.PropsWithChildren<{ className?: string }>) {
	return (
		<h1
			className="border-y-4 border-indigo-400 sm:(rounded-2xl border-l-indigo-300 flex justify-around)"
			{...props}
		/>
	)
}

export function A() {
	return (
		<div className="flex justify-center mx-auto" css={wrap`md:`({ borderTopWith: "1px", ...tw`bg-red-500` })}>
			<span className="text-gray-700 bg-gray-100">{theme`colors.blue.500 / 30%` as string}</span>
			<Header className="bg-red-300">Header</Header>
		</div>
	)
}
