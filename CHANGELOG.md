# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-24

### Added

- Components returning escaped, accessible HTML strings: `button`, `badge`, `metricTile`, `dataTable`, `formField`,
  `select`, `timeline`, `alert`, `card`, `pagination`, `emptyState`, `sparkline` and `barChart`.
- Helpers: `escapeHtml`, `attrs` (validated names, no event handlers, URL filtering), `safeUrl`, `cx`, `uid`,
  `resetIds`, `pageRange`, `describeSeries`, `formatCompact`, `formatNumber`.
- `styles/ligatrix-components.css`: design tokens for colour, spacing, radius and type as CSS custom properties in a
  cascade layer, light and dark themes via `prefers-color-scheme` or `data-theme`, and styles for every component.
- Hand-written type declarations in `src/index.d.ts`.
- `npm run gallery`, which renders every component into the self-contained `gallery/index.html`.
- 101 `node:test` tests, including injection tests across every text option of every component.
- `npm run lint` for whitespace and final-newline checks; CI on Node.js 20 and 22.

[1.0.0]: https://github.com/Ligatrix/ligatrix-components/releases/tag/v1.0.0
