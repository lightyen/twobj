import styled from "@emotion/styled"
const _tw = {}
_tw[0] = css({
	display: "none",
})
_tw[1] = css({
	"--tw-ring-offset-color": "initial",
	"--tw-ring-offset-width": "initial",
	"--tw-ring-color": "initial",
	"--tw-ring-inset": "initial",
	"--tw-ring-offset-shadow":
		"var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff)",
	"--tw-ring-shadow":
		"var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, rgb(59 130 246 / 0.5))",
	"--tw-shadow": "initial",
	outline: "2px solid transparent",
	outlineOffset: "2px",
	boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
})
_tw[2] = css({
	cursor: "not-allowed",
	opacity: "0.5",
})
_tw[3] = css({})
_tw[4] = css({
	visibility: "visible",
})
_tw[5] = css({
	"--tw-ring-offset-color": "initial",
	"--tw-ring-offset-width": "initial",
	"--tw-ring-color": "initial",
	"--tw-ring-inset": "initial",
	"--tw-ring-offset-shadow": "initial",
	"--tw-ring-shadow": "initial",
	"--tw-shadow": "var(--tw-shadow-colored)",
	height: "1rem",
	width: "1rem",
	flexShrink: "0",
	borderRadius: "0.5rem",
	borderWidth: "1px",
	"--tw-shadow-colored":
		"0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1))",
	boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	userSelect: "none",
	cursor: "pointer",
	"&:focus-visible": {
		outline: "2px solid transparent",
		outlineOffset: "2px",
		"--tw-ring-offset-shadow":
			"var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width, 0px) var(--tw-ring-offset-color, #fff)",
		"--tw-ring-shadow":
			"var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, rgb(59 130 246 / 0.5))",
		boxShadow: "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)",
	},
	display: "flex",
	alignItems: "center",
	color: "currentColor",
})
import { css } from "@emotion/react"
import { CheckIcon, DividerHorizontalIcon } from "@radix-ui/react-icons"
import { forwardRef, useEffect, useId, useRef } from "react"
const InputControl = styled.input(_tw[0])
const effects = css`
	${InputControl}:focus-visible + & {
		${_tw[1]}
	}
	${InputControl}:disabled + & {
		${_tw[2]}
	}
	${InputControl}:checked + &, ${InputControl}:indeterminate + & {
		${_tw[3]}
	}
	${InputControl}:not(:checked) + & .checked_icon {
		${_tw[0]}
	}
	${InputControl}:indeterminate + & .checked_icon {
		${_tw[0]}
	}
	${InputControl}:not(:indeterminate) + & .indeterminated_icon {
		${_tw[0]}
	}
	${InputControl}:indeterminate + & .indeterminated_icon {
		${_tw[4]}
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
				css={[_tw[5], effects]}
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