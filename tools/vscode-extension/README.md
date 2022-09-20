# Twobj IntelliSense

VSCode IntelliSense Extension for [twobj](https://github.com/lightyen/twobj)

![preview](https://github.com/lightyen/twobj/raw/vscode-web/tools/vscode-extension/preview.png)

## Features

- auto completion
- hover
- color decoration
- document references
- diagnostics

## Pack

```sh
pnpm install && pnpm package
```

## VSCode Settings

### Recommended

```json5
{
  // none
}
```

### Defaults

```json5
{
  "twobj.colorDecorators": "inherit", // inherit from "editor.colorDecorators"
  "twobj.references": true,
  "twobj.diagnostics":true,
  "twobj.preferVariantWithParentheses": false,
  "twobj.fallbackDefaultConfig": true,
  "twobj.enabled": true,
  "twobj.rootFontSize": 16,
  "twobj.logLevel": "info",
  "twobj.hoverColorHint": "none",
  "twobj.otherLanguages": []
}
```

### Custom CompletionList Panel

```json5
// example
{
  "workbench.colorCustomizations": {
    "[One Dark Pro Darker]": {
      "editorHoverWidget.background": "#1f2229e8",
      "editorSuggestWidget.background": "#1f2229e8",
      "editor.wordHighlightBackground": "#0000",
      "editor.wordHighlightBorder": "#3f3f3f3d",
      "editor.wordHighlightStrongBorder": "#3f3f3f3d"
    }
  }
}
```

### Custom Semantic Colors [(docs)](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)

```json5
{
  "editor.tokenColorCustomizations": {
    "[One Dark Pro Darker]": {
      "textMateRules": [
        {
          "scope": "support.constant.classname.tw",
          "settings": {
            "foreground": "#7ddb89"
          }
        },
        {
          "scope": "entity.other.inherited-class.variant.tw",
          "settings": {
            "foreground": "#c678dd"
          }
        },

        {
          "scope": "support.type.arbitrary-style.prop.tw",
            "settings": {
              "foreground": "#8a88fc"
            }
        }
      ]
    }
  }
}
```
