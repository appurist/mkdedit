---
title: Nuemark Demo
sections: true
---

# Welcome to Nuemark

This demonstrates **Nuemark's** advanced features beyond standard Markdown.

## Standard Markdown

- **Bold text** and *italic text*
- `inline code` and links: [Nue.js](https://nuejs.org)
- > Blockquotes work great

### Code Blocks

```javascript
function hello() {
  return "Hello from Nuemark!"
}
```

## Nuemark Extensions

### Sections
With `sections: true` in front matter, content gets wrapped in semantic `<section>` tags.

### Enhanced Formatting

- ~strikethrough text~
- "quoted text" becomes semantic quotes
- highlighted| text gets marked

### Custom Components

[.hero]
  # Hero Section
  This content gets wrapped in a section with class="hero"

[button "Click me" href="/docs/"]

---

# Another Section
This becomes a separate `<section>` due to the sections setting.

Try editing this content to see Nuemark in action!