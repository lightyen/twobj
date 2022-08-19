import { css, CSSProperties } from "@linaria/core"
import { tw } from "twobj"

export function printStyle(css: CSSProperties) {
	console.log(JSON.stringify(css, null, 2))
}

const style = tw`
text-4xl m-4 px-4 border font-mono transition
ring-0 ring-offset-black ring-offset-[5px]
hover:(ring-4 ring-offset-black ring-pink-200 )`

export default function Layout() {
	return (
		<div
			className={css`
				${tw`h-screen bg-gradient-to-b from-blue-900 to-cyan-600`}
			`}
		>
			<div
				className={css`
					${tw`flex justify-center`}
				`}
			>
				<button
					type="button"
					className={css`
						${style}
					`}
				>
					Button
				</button>
			</div>
			<div
				className={css`
					${tw`flex justify-center [& :first-of-type]:(text-cyan-500 sm:text-pink-500)`}
				`}
			>
				<div>ABC</div>
				<div>DEF</div>
			</div>
		</div>
	)
}
