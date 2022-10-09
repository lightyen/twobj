# Develop with [`emotion`](https://github.com/emotion-js/emotion)

```sh
pnpm add -D twobj babel-plugin-twobj @emotion/babel-plugin @emotion/styled @emotion/react
```

## .babelrc.js

```js
module.exports = {
  "presets": [
    "@babel/preset-env",
    "@babel/preset-typescript",
    ["@babel/preset-react", { "runtime": "automatic", "importSource": "@emotion/react" }],
  ],
  jsxImportSource: "@emotion/react",
  "plugins": [["twobj", { tailwindConfig: require("./tailwind.config") }], "@emotion"],
}
```

## More detail

- https://github.com/lightyen/twobj.examples/tree/main/react-emotion
