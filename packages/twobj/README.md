# twobj

Convert tailwind declarations to a style object

## How to use

```ts
import { createContext, resolveConfig } from "twobj"

const ctx = createContext(resolveConfig({}))

const output = ctx.css("[& :first-of-type]:(text-cyan-500 sm:text-pink-500)")

output => {
  "& :first-of-type": {
    "color": "#06b6d4",
    "@media (min-width: 640px)": {
      "color": "#ec4899"
    }
  }
}
```

## Plugin feature

Tailwind plugin is acceptable.

```ts
resolveConfig({
  plugins: [
    function ({ addUtilities, matchUtilities, ... }) {

    }
  ]
})
```
