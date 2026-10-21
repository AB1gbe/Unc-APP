---
tags: [decision, design]
status: accepted
date: 2026-10-21
---
# ADR-009 Styling: one plain CSS file with design tokens

## Options considered
| Option | Pros | Cons |
|---|---|---|
| Tailwind CSS | Fast once learned | Class soup in JSX is hard to read for beginners; extra build config |
| Component library (MUI, Chakra) | Ready-made widgets | Heavy, opinionated look, theming learning curve |
| CSS Modules | Scoped styles | More files |
| **Single `client/src/styles.css` with CSS variables** ✅ | Readable, one place to change the look, no dependency | Must keep class names tidy ourselves |

## Decision
See [[Design System]] for the tokens, components and the rules that keep the design *simple and understandable* (MUST #2).
