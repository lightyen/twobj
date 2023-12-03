import { css } from "@emotion/react"
import { CheckIcon, DividerHorizontalIcon } from "@radix-ui/react-icons"
import { InputHTMLAttributes, forwardRef, useEffect, useId, useRef } from "react"
import { tw, tx } from "twobj"

const InputControl = tw.input`hidden`

const effects = css`
	${InputControl}:focus-visible + & {
		${tx`outline-none ring-1 ring-ring`}
	}
	${InputControl}:disabled + & {
		${tx`cursor-not-allowed opacity-50`}
	}
	${InputControl}:checked + &, ${InputControl}:indeterminate + & {
		${tx`bg-primary text-primary-foreground`}
	}
	${InputControl}:not(:checked) + & .checked_icon {
		${tx`hidden`}
	}
	${InputControl}:indeterminate + & .checked_icon {
		${tx`hidden`}
	}
	${InputControl}:not(:indeterminate) + & .indeterminated_icon {
		${tx`hidden`}
	}
	${InputControl}:indeterminate + & .indeterminated_icon {
		${tx`visible`}
	}
`

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
	intermediate?: boolean | undefined
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ id, className, intermediate, onFocus, onBlur, onKeyDown, ...props }, ref) => {
		const innerId = useId()
		const inputRef = useRef<HTMLInputElement | null>(null)
		const isFocus = useRef(false)
		if (!id) id = innerId
		useEffect(() => {
			if (intermediate != undefined) {
				if (inputRef.current) {
					inputRef.current.indeterminate = intermediate
				}
			}
		}, [intermediate])
		return (
			<>
				<InputControl
					ref={el => {
						inputRef.current = el
						if (typeof ref === "function") {
							ref(el)
						} else if (ref) {
							ref.current = el
						}
					}}
					id={id}
					type="checkbox"
					{...props}
				/>
				<label
					htmlFor={id}
					tabIndex={0}
					role="checkbox"
					tw="h-4 w-4 shrink-0 rounded-lg border border-primary shadow select-none cursor-pointer
						focus-visible:(outline-none ring-1 ring-ring)
						flex items-center text-current
					"
					css={effects}
					className={className}
					onFocus={_ => {
						isFocus.current = true
					}}
					onBlur={_ => {
						isFocus.current = false
					}}
					onKeyDown={e => {
						if (!isFocus.current || !inputRef.current) {
							return
						}
						const isSpace = e.key == " " || e.code == "Space"
						if (isSpace || e.key == "Enter") {
							e.preventDefault()
							inputRef.current.checked = !inputRef.current.checked
						}
					}}
				>
					<CheckIcon className="checked_icon" />
					<DividerHorizontalIcon className="indeterminated_icon" />
				</label>
			</>
		)
	},
)
Checkbox.displayName = "Checkbox"
