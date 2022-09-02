import { tw } from "./context"

test("content", async () => {
	expect(tw`content`).toEqual({})

	expect(tw`content-none`).toEqual({
		"--tw-content": "none",
		content: "var(--tw-content)",
	})

	expect(tw`content-["ABC"]`).toEqual({
		"--tw-content": '"ABC"',
		content: "var(--tw-content)",
	})
})

test("display", async () => {
	expect(tw`flex`).toEqual({ display: "flex" })
})

test("flex", async () => {
	expect(tw`flex-auto`).toEqual({ flex: "1 1 auto" })
	expect(tw`flex-[1 1]`).toEqual({ flex: "1 1" })
})

test("flexGrow", async () => {
	expect(tw`flex-grow`).toEqual({})
	expect(tw`grow`).toEqual({ flexGrow: "1" })
})

test("fill", async () => {
	expect(tw`fill-red-500`).toEqual({ fill: "#ef4444" })
	expect(tw`fill-[#121029]`).toEqual({ fill: "#121029" })
	expect(tw`fill-[url(#helloworld)]`).toEqual({ fill: "url(#helloworld)" })
	expect(tw`fill-none`).toEqual({ fill: "none" })
})

test("stroke", async () => {
	expect(tw`stroke-red-500`).toEqual({ stroke: "#ef4444" })
	expect(tw`stroke-[#121029]`).toEqual({ stroke: "#121029" })
	expect(tw`stroke-none`).toEqual({ stroke: "none" })
})

test("backgroundColor", async () => {
	expect(tw`bg-black`).toEqual({ backgroundColor: "#000" })
	expect(tw`bg-[ #444 ]`).toEqual({ backgroundColor: "#444" })
	expect(tw`bg-black/31`).toEqual({ backgroundColor: "rgb(0 0 0 / 0.31)" })
	expect(tw`bg-[ #444 ]/31`).toEqual({ backgroundColor: "rgb(68 68 68 / 0.31)" })
	expect(tw`bg-[color:var(--color)]`).toEqual({ backgroundColor: "var(--color)" })
})

test("backgroundImage", async () => {
	expect(tw`bg-none`).toEqual({ backgroundImage: "none" })
	expect(tw`bg-gradient-to-tr`).toEqual({
		backgroundImage: "linear-gradient(to top right, var(--tw-gradient-stops))",
	})
	expect(tw`bg-[url('/img/hero-pattern.svg')]`).toEqual({
		backgroundImage: "url('/img/hero-pattern.svg')",
	})
	expect(tw`bg-[url(/img/hero-pattern.svg)]`).toEqual({
		backgroundImage: "url(/img/hero-pattern.svg)",
	})
	expect(tw`bg-[linear-gradient(to bottom, rgba(255,255,0,0.5), rgba(0,0,255,0.5))]`).toEqual({
		backgroundImage: "linear-gradient(to bottom, rgba(255,255,0,0.5), rgba(0,0,255,0.5))",
	})
	expect(tw`bg-[image:var(--image)]`).toEqual({ backgroundImage: "var(--image)" })
})

test("backgroundPosition", async () => {
	expect(tw`bg-top`).toEqual({ backgroundPosition: "top" })
	expect(tw`bg-right-bottom`).toEqual({ backgroundPosition: "right bottom" })
	expect(tw`bg-[25% 75%]`).toEqual({ backgroundPosition: "25% 75%" })
	expect(tw`bg-[bottom 50px right 100px]`).toEqual({ backgroundPosition: "bottom 50px right 100px" })
	expect(tw`bg-[bottom 10px right]`).toEqual({ backgroundPosition: "bottom 10px right" })
	expect(tw`bg-[position:var(--position)]`).toEqual({ backgroundPosition: "var(--position)" })
})

test("backgroundSize", async () => {
	expect(tw`bg-auto`).toEqual({ backgroundSize: "auto" })
	expect(tw`bg-contain`).toEqual({ backgroundSize: "contain" })
	expect(tw`bg-cover`).toEqual({ backgroundSize: "cover" })
	expect(tw`bg-[12%]`).toEqual({ backgroundSize: "12%" })
	expect(tw`bg-[length:200px 20%]`).toEqual({ backgroundSize: "200px 20%" })
	expect(tw`bg-[length:var(--size)]`).toEqual({ backgroundSize: "var(--size)" })
})

test("textColor", async () => {
	expect(tw`text-white`).toEqual({ color: "#fff" })
	expect(tw`text-[white]`).toEqual({ color: "white" })
	expect(tw`text-[rgb(33 33 139)]`).toEqual({ color: "rgb(33 33 139)" })
})

test("fontSize", async () => {
	expect(tw`text-lg`).toEqual({ fontSize: "1.125rem", lineHeight: "1.75rem" })
	expect(tw`text-[22px]`).toEqual({ fontSize: "22px" })
})

test("float", async () => {
	expect(tw`float-left`).toEqual({ float: "left" })
	expect(tw`float-right`).toEqual({ float: "right" })
	expect(tw`float-none`).toEqual({ float: "none" })
})
