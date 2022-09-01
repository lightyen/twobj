import { tw, wrap } from "twobj"

tw`divide-black`
tw`flex items-center font-bold text-lg after:text-cyan-400`

function A() {
	return (
		<div tw="flex justify-center mx-auto" css={wrap`sm:$e`({ accentColor: "red" })}>
			A
		</div>
	)
}
