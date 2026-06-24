# Repository Guidelines

## Project Structure & Module Organization
- Vite + Preact + TypeScript app (see CLAUDE.md for the full architecture map).
- `src/components/`: UI by section — `editor/` (Layers), `basemaps/`, `remote-config/`, `catalog/`, `templates/`, `tools/`, `studio/` (shell: Rail, TopBar, env switch).
- `src/lib/`: signals-based stores and domain logic — `v2/` (map-config schema, migrate, store), `envelope/`, `basemaps/`, `catalog/`, `template/`, `studio.ts` (nav + per-env persistence), `workspace.ts` (env switching).
- `scripts/gen-catalog.mjs`: generates `src/lib/catalog/builtins.generated.json` from the Flutter sources — never hand-edit the JSON.
- `index.html`: Vite template. `dist/`: build output.

## Build, Test, and Development Commands
- `npm run dev`: start Vite dev server with HMR.
- `npm run build`: verifies the generated catalog, then builds to `dist/`.
- `npm run gen:catalog`: regenerate the built-in catalog after Dart enum changes.
- `npm run deploy`: build and publish `dist/` to GitHub Pages (`gh-pages`).

## Coding Style & Naming Conventions
- TypeScript + JSX (Preact). Functional components; state via @preact/signals stores in `lib/`.
- Indentation: 2 spaces; semicolons; single quotes.
- `PascalCase` components/types, `camelCase` variables/functions; `components/` files are `PascalCase.tsx`, `lib/` files `camelCase.ts`.
- Reuse the shared primitives (`components/editor/primitives.tsx`, `components/studio/primitives.tsx`) instead of inlining styled controls.
- Comments explain *why*, never restate the code.

## Testing Guidelines
- No automated tests yet. Manual flow: open a remote-config JSON (or paste/drop it), edit in the Layers section, Download, and re-import to verify the envelope round-trips. `tsc --noEmit` must stay clean.

## Commit & Pull Request Guidelines
- Follow the parent repository's CONTRIBUTING.md conventions (`[HWX-xxxx] type: subject`).

## Security & Configuration Tips
- Runs locally; edits provided JSON only. ArcGIS OAuth credentials stay in the browser (localStorage).
