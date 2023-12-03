import styled from "@emotion/styled"
const __tw = {}
__tw[0] = css({
	display: "none",
})
__tw[1] = css({
	outline: "2px solid transparent",
	outlineOffset: "2px",
	"--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
	"--tw-ring-shadow": "var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color)",
	boxShadow: "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
})
__tw[2] = css({
	cursor: "not-allowed",
	opacity: "0.5",
})
__tw[3] = css({})
__tw[4] = css({
	visibility: "visible",
})
__tw[5] = css({
	height: "1rem",
	width: "1rem",
	flexShrink: "0",
	borderRadius: "0.5rem",
	borderWidth: "1px",
	"--tw-shadow-default-color-0": "rgb(0 0 0 / 0.1)",
	"--tw-shadow-default-color-1": "rgb(0 0 0 / 0.1)",
	"--tw-shadow-colored":
		"0 1px 3px 0 var(--tw-shadow-color, var(--tw-shadow-default-color-0)), 0 1px 2px -1px var(--tw-shadow-color, var(--tw-shadow-default-color-1))",
	"--tw-shadow": "var(--tw-shadow-colored)",
	boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
	userSelect: "none",
	cursor: "pointer",
	"&:focus-visible": {
		outline: "2px solid transparent",
		outlineOffset: "2px",
		"--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)",
		"--tw-ring-shadow": "var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color)",
		boxShadow: "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)",
	},
	display: "flex",
	alignItems: "center",
	color: "currentColor",
})
import { css } from "@emotion/react"
import { CheckIcon, DividerHorizontalIcon } from "@radix-ui/react-icons"
import { forwardRef, useEffect, useId, useRef } from "react"
const InputControl = styled.input(__tw[0])
const effects = css`
	${InputControl}:focus-visible + & {
		${__tw[1]}
	}
	${InputControl}:disabled + & {
		${__tw[2]}
	}
	${InputControl}:checked + &, ${InputControl}:indeterminate + & {
		${__tw[3]}
	}
	${InputControl}:not(:checked) + & .checked_icon {
		${__tw[0]}
	}
	${InputControl}:indeterminate + & .checked_icon {
		${__tw[0]}
	}
	${InputControl}:not(:indeterminate) + & .indeterminated_icon {
		${__tw[0]}
	}
	${InputControl}:indeterminate + & .indeterminated_icon {
		${__tw[4]}
	}
`
export const Checkbox = forwardRef(({ id, className, intermediate, onFocus, onBlur, onKeyDown, ...props }, ref) => {
	const innerId = useId()
	const inputRef = useRef(null)
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
				css={[__tw[5], effects]}
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
})
Checkbox.displayName = "Checkbox"