import { context, tw } from "./context"

test("boxShadow", async () => {
	expect(context.globalStyles).toMatchObject({
		"*, ::before, ::after": {
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		},
		"::backdrop": {
			"--tw-transfrom-translate-default": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		},
	})
	expect(tw`transform`).toEqual({
		transform:
			"var(--tw-transfrom-translate, var(--tw-transfrom-translate-default)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))",
	})
	expect(tw`transform-cpu`).toEqual({
		"--tw-transfrom-translate": "translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0))",
		transform:
			"var(--tw-transfrom-translate, var(--tw-transfrom-translate-default)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))",
	})
	expect(tw`transform-gpu`).toEqual({
		"--tw-transfrom-translate": "translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), 0)",
		transform:
			"var(--tw-transfrom-translate, var(--tw-transfrom-translate-default)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))",
	})
	expect(tw`translate-x-8`).toEqual({
		"--tw-translate-x": "2rem",
		transform:
			"var(--tw-transfrom-translate, var(--tw-transfrom-translate-default)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))",
	})
	expect(tw`translate-y-1`).toEqual({
		"--tw-translate-y": "0.25rem",
		transform:
			"var(--tw-transfrom-translate, var(--tw-transfrom-translate-default)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))",
	})
})
