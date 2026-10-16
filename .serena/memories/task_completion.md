# Task completion checks

For frontend changes, run from the project root:

1. `npm run lint` and expect zero warnings or errors.
2. `npm run build` and expect a successful production build. Vite may warn that the combined MapLibre/Three.js bundle exceeds its default chunk threshold; note it and evaluate code splitting if startup performance becomes an issue.
3. For sample data changes, validate that `public/data/trees-central-park-10000.json` parses and contains 10,000 records.

A successful build verifies compilation but not browser rendering. State whether browser-level smoke testing was performed.