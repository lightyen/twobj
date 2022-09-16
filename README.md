# twobj

Convert tailwind declarations to a style object

## Demo

- [CodeSandbox](https://codesandbox.io/s/tailwind-and-css-in-js-twobj-6txkjh)

## Differ from tailwindcss

- Not support [underscore](https://tailwindcss.com/docs/content#using-spaces-and-underscores)
- Drop all deprecated features and opacity, you can NOT use `flex-grow`, `text-opacity-0` ...

### Syntaxes

- Utilities:

```txt
bg-gray-300 text-white border-4 border-cyan-200
```

- Variants:

```txt
hover:bg-gray-300 text-white focus:border-4 focus:border-cyan-200
```

- Group:

```txt
(text-gray-800 bg-blue-50)
lg:(
  justify-center
  hover:(bg-gray-100)
)
```

- Important decorator:

Add `!important`.

```txt
bg-gray-300/51! text-white/82% border-4 !border-cyan-200/[0.52]
```

- Color opacity:

```txt
bg-gray-300/51 text-white/82% border-4 border-cyan-200/[0.52]
```

- Arbitrary value:

```txt
bg-[rgb(202 101 220)]        // utility
tab-[abc]:bg-black           // variant
[inset: 0 30px 10rem 0]      // css property
[.group:active &]:bg-black   // css selector
```

### Tailwind Plugins

```js
const ctx = createContext(
  resolveConfig({
    plugins: [({ addDefaults, addBase, addUtilities, addComponents, addVariant,  matchUtilities, matchComponents, matchVariant, theme, config }) => {
      // ...
    }],
  }),
)
