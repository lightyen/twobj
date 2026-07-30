import { css } from "@emotion/react"
import { memo } from "react"
import { tw, wrap } from "twobj"

function cond1(): boolean {
	return true
}

function cond2(): boolean {
	return true
}

export function LocaleButton({ hide }: { hide: boolean }) {
	return (
		<div
			tw="flex justify-between cursor-pointer py-[8px] px-[10px] [& svg]:invisible [&[data-state=selected] svg]:visible"
			css={[
				cond1() ? tw`text-red-300` : cond2() ? tw`text-green-500` : tw`text-gray-500 `,
				wrap`md:`(wrap`hover:`([tw`backdrop-blur`, tw`backdrop-sepia`])),
			]}
		>
			Test
		</div>
	)
}

const styles = css`
	${tw`inline-block relative px-5 pt-4 pb-5 rounded-t-lg whitespace-nowrap capitalize transition-all cursor-pointer
		mt-1
		focus-visible:(outline-none ring-2 ring-blue-400)
		after:(translate-y-[2px] h-[3px] absolute left-0 bottom-0 w-full transition-all delay-[16ms] duration-200 scale-0 opacity-0)
	`}
`

export const Label = memo(function Label({ htmlFor, label }: { htmlFor: string; label: React.ReactNode }) {
	return (
		<label tw="select-none" htmlFor={htmlFor} css={styles}>
			{label}
		</label>
	)
})
