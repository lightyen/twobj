import { tw } from "twobj"

function MyComponent({ width }: { width: number }) {
	return <div style={{ width }}>comp</div>
}

export const C1 = tw(MyComponent)`w-full`
export const C2 = tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width }))
export const C3 = tw.div`w-full`
export const C4 = tw("div")`w-full`

interface Props {
	width: number
}

export const CC = tw("div")<Props>(props => ({ width: props.width }))
