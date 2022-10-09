# babel-plugin-twobj

Integrate twobj and frontend frameworks

## Basic Features

```ts
import { globalStyles, tw, theme, wrap } from "twobj"

const style = tw`block text-black`

const hocus = wrap`focus: hover:`

const value = theme`colors.blue.500`

console.log(globalStyles)
```

## React

Apply component style by `tw` prop.

```jsx
function ComponentA(props) {
  return <div tw="bg-black text-white ..." {...props} />
}
```

## TypeScript

Add type definitions to your code.

Example for [`emotion`](https://github.com/emotion-js/emotion), change your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@emotion/react/types/css-prop", "babel-plugin-twobj/types/emotion"]
  }
}
```

## VS Code Extension

[Install via the Marketplace](https://marketplace.visualstudio.com/items?itemName=lightyen.twobj-intellisense)
