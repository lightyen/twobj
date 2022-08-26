# twobj

Convert tailwind declarations to a style object

## Demo

- [CodeSandbox](https://codesandbox.io/s/tailwind-and-css-in-js-twobj-6txkjh)

## Differ from tailwindcss

- Not support [vender prefix](https://tailwindcss.com/docs/browser-support#vendor-prefixes)
- Not support [important everything](https://tailwindcss.com/docs/configuration#important)
- Not support [underscore](https://tailwindcss.com/docs/content#using-spaces-and-underscores)
- Not support custom separator
- All deprecated features are dropped, you can NOT use `flex-grow`, `text-opacity-0` ...

### Features

- Color opacity: `text-black/50`, `text-black/52`, `text-black/[0.52]`, `text-black/[52%]`
- Important decorator: `text-black!`, `!text-black`, `sm:(text-gray-800 bg-blue-50)!`
- Variant group:

	```js
	tw`sm:(text-gray-800 bg-blue-50)`
	tw`
	  flex
	  lg:(
	    justify-center
	    hover:(
	      bg-gray-100
	    )
	  )
	`
	```

- Arbitrary utility/variant/property/selector

	```js
	tw`bg-[rgb(202 101 220)]`
	tw`tab-[abc]:bg-black`
	tw`[inset: 0 30px 10rem 0]`
	tw`[.group:active &]:bg-black`
	```

- Tailwind plugin system (if the plugin not depends on postcss)
