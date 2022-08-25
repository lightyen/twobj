# Install (with emotion)

```sh
pnpm add twobj babel-plugin-twobj
```

## .babelrc

```json
{
	"plugins": ["@emotion", "twobj"],
}
```

## TypeScript

Add this line to your `src/typings/tw.d.ts`:

```ts
/// <reference types="babel-plugin-twobj/types/emotion" />
```

## More detail

- https://github.com/lightyen/twobj/tree/main/examples/react-emotion
