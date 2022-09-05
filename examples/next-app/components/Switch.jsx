import { css } from "@emotion/react"
import { forwardRef, useId } from "react"
import { tw } from "twobj"

const InputControl = tw.input`hidden`

const styles = css`
	${tw`
		w-[3.7rem] h-[1.8rem]
		relative transition-colors rounded-full bg-stone-400
		px-0 py-[0.4rem]
		flex items-center justify-between
		cursor-pointer select-none
	`}

	${tw`
		after:(
			transition cursor-pointer rounded-full absolute bg-white
			w-[1.3rem] h-[1.3rem]
			top-[0.25rem] left-[0.16rem]
			translate-x-[0.14rem]
		)
		hover:after:shadow-[0 0 1px 3px rgb(66 225 106 / 0.8)]
	`}

	${InputControl}:checked + & {
		${tw`bg-green-400`}
	}

	${InputControl}:checked + &::after {
		--tw-translate-x: 2rem;
	}
`

export const Switch = forwardRef(({ className, id: userId, ...props }, ref) => {
	const id = useId()
	return (
		<div tw="inline-block relative">
			<InputControl type="checkbox" ref={ref} id={userId || id} {...props} />
			<label htmlFor={userId || id} className={className} css={styles} />
		</div>
	)
})
