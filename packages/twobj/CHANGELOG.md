# Changelog

## [2.4.0] - `2023-04-08`

Support tailwindcss v3.3.1

### Changed

- ~~Support ESM and TypeScript config files (https://github.com/tailwindlabs/tailwindcss/pull/10785)~~
- [x] Extend default color palette with new 950 shades (https://github.com/tailwindlabs/tailwindcss/pull/10879)
- [x] Add line-height modifier support to font-size utilities (https://github.com/tailwindlabs/tailwindcss/pull/9875)
- ~~Add support for using variables as arbitrary values without var(...) (https://github.com/tailwindlabs/tailwindcss/pull/9880, https://github.com/tailwindlabs/tailwindcss/pull/9962)~~
- [x] Add logical properties support for inline direction (https://github.com/tailwindlabs/tailwindcss/pull/10166)
- [x] Add hyphens utilities (https://github.com/tailwindlabs/tailwindcss/pull/10071)
- [x] Add from-{position}, via-{position} and to-{position} utilities (https://github.com/tailwindlabs/tailwindcss/pull/10886)
- [x] Add list-style-image utilities (https://github.com/tailwindlabs/tailwindcss/pull/10817) (config)
- [x] Add caption-side utilities (https://github.com/tailwindlabs/tailwindcss/pull/10470)
- [x] Add line-clamp utilities from @tailwindcss/line-clamp to core (https://github.com/tailwindlabs/tailwindcss/pull/10768, https://github.com/tailwindlabs/tailwindcss/pull/10876, https://github.com/tailwindlabs/tailwindcss/pull/10862) (config)
- [x] Add delay-0 and duration-0 utilities (https://github.com/tailwindlabs/tailwindcss/pull/10294)
- [x] Add justify-normal and justify-stretch utilities (https://github.com/tailwindlabs/tailwindcss/pull/10560)
- [x] Add content-normal and content-stretch utilities (https://github.com/tailwindlabs/tailwindcss/pull/10645)
- [x] Add whitespace-break-spaces utility (https://github.com/tailwindlabs/tailwindcss/pull/10729)
- [x] Add support for configuring default font-variation-settings for a font-family (https://github.com/tailwindlabs/tailwindcss/pull/10034, https://github.com/tailwindlabs/tailwindcss/pull/10515)
- [x] Mark rtl and ltr variants as stable and remove warnings (https://github.com/tailwindlabs/tailwindcss/pull/10764)
- [x] Use inset instead of top, right, bottom, and left properties (https://github.com/tailwindlabs/tailwindcss/pull/10765)
- [x] Make dark and rtl/ltr variants insensitive to **DOM order** (https://github.com/tailwindlabs/tailwindcss/pull/10766)
- ~~Use :is to make important selector option insensitive to **DOM order** (https://github.com/tailwindlabs/tailwindcss/pull/10835)~~

### Fixed

- Fix duplicate important selector rendering

## [2.3.6]
