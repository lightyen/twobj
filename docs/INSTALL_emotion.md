# Install (with emotion)

```sh
pnpm add twobj babel-plugin-twobj
```

## .babelrc.js

```js
module.exports = {
  "plugins": [["twobj", { tailwindConfig: require("./tailwind.config") }], "@emotion"],
}
```

## TypeScript

Add types to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@emotion/react/types/css-prop", "babel-plugin-twobj/types/emotion"]
  }
}

```

## More detail

- https://github.com/lightyen/twobj.examples/tree/main/react-emotion
