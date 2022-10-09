# twobj

Convert tailwind declarations to a style object

## Getting Started

```ts
import { createContext, resolveConfig } from "twobj"

const c = createContext(resolveConfig())

const output = c.css("[& :first-of-type]:(text-cyan-500 sm:text-pink-500)")

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

Tailwind plugin is supported.

```ts
resolveConfig({
  plugins: [
    function ({ addUtilities, matchUtilities, ... }) {

    }
  ]
})
```
