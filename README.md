# HemsWX Map Studio

A browser-based workbench for the HemsWX mobile app's **remote configuration**. The mobile app
doesn't hardcode its map — it downloads a config document at startup that describes which weather
layers, basemaps and saved map-states to show. This tool is where that config is edited and previewed
against a **real map**, so you can see exactly what the app will render before shipping the config.

Built with **Preact** (+ signals), **TypeScript**, **Vite**, the **ArcGIS Maps SDK for JavaScript**,
and **Monaco** (the editor that powers VS Code).

> This is an internal tool. It's public here so students can read the source. There are no secrets in
> the code — API credentials are typed in by the user at runtime and only ever live in the browser's
> `localStorage`.

---

## The big picture

The whole app is one idea repeated in different shapes: **take a JSON config → turn it into ArcGIS map
layers → draw them.** Everything else (editor, basemaps, templates, preview) is a different lens on that
same pipeline.

```
 config JSON (a "layer" with a type + url)
        │
        ▼
 createLayerFromConfig()         ← the heart of the app: lib/arcgis/index.ts
        │   maps a config.type to a concrete ArcGIS layer class
        ▼
 __esri.Layer  (WMSLayer, TileLayer, FeatureLayer, …)
        │
        ▼
 <arcgis-map> / <arcgis-scene>   ← ArcGIS web components draw it on screen
```

If you only read one file, read [`src/lib/arcgis/index.ts`](src/lib/arcgis/index.ts) — it's the bridge
between "config data" and "things the ArcGIS SDK understands."

---

## ArcGIS integration (the interesting part)

### 1. The layer factory — `createLayerFromConfig()`

A config layer is just `{ type, source, options }`. The factory is a `switch` on `type` that builds the
matching ArcGIS layer class. This is the single place where the app's data model meets the ArcGIS SDK:

| config `type`  | ArcGIS class          | what it is |
|----------------|-----------------------|------------|
| `wms`          | `WMSLayer`            | live weather imagery from a WMS server (e.g. met.no) |
| `wmts`         | `WMTSLayer`           | pre-rendered tiled imagery (or a portal item) |
| `tiled`        | `TileLayer`           | a cached tile service |
| `mapImage`     | `MapImageLayer`       | a dynamic map service rendered server-side |
| `vectorTiled`  | `VectorTileLayer`     | vector tiles styled on the client |
| `feature`      | `FeatureLayer`        | individual features (points/lines/polygons) |
| `portalItem`   | `Layer.fromPortalItem`| anything published as an ArcGIS Online item |

Each gets an `opacity`, optional `customParameters`, and a request **tag** (a small hash of its
identity) so the app can attribute a failed network request back to the exact layer that caused it.

### 2. Drawing — ArcGIS web components

Maps are rendered with the SDK's custom elements, not React/Preact components:
`<arcgis-map>` for 2D and `<arcgis-scene>` for 3D (declared in
[`src/arcgis-elements.d.ts`](src/arcgis-elements.d.ts)). They appear in two places:

- **Layers editor preview** — [`components/editor/PreviewPanel.tsx`](src/components/editor/PreviewPanel.tsx),
  a live 2D map next to the editor.
- **Preview section** — [`components/preview/PreviewView.tsx`](src/components/preview/PreviewView.tsx),
  a full-bleed recreation of the mobile app's Map screen (switches to `<arcgis-scene>` in 3D mode).

The hooks in [`components/workspace/map-preview/`](src/components/workspace/map-preview/) keep the map in
sync with the config: `useMapLayers` diffs the desired layer list against a keyed registry and only
adds/removes what changed (instead of rebuilding the whole map), and `useBasemap` builds the base +
reference layers of the active basemap.

### 3. Sign-in — ArcGIS OAuth

Basemap management talks to a live ArcGIS portal, which needs the user to sign in. The app uses the
SDK's `OAuthInfo` + `IdentityManager` with a **popup** flow. The popup lands on
[`public/oauth-callback.html`](public/oauth-callback.html), which just hands the token back to the main
window and closes. See **ArcGIS OAuth setup** below for the redirect URL you must register.

### 4. Portal & basemaps — `lib/basemaps/portal.ts`

Once signed in, the **Basemaps** section queries an ArcGIS portal **group** for Web Maps, can share items
into/out of that group, and edits the presentation tags the app reads (country, sort order, theme, …).
This is a good example of using the ArcGIS REST/portal API beyond just drawing a map.

### 5. The WMS proxy — why a Vite plugin exists

WMS weather servers (met.no) don't send CORS headers, so a browser **can't** fetch them directly. During
local dev/preview, a small Vite middleware ([`vite.config.ts`](vite.config.ts), `wms-proxy`) forwards WMS
requests server-side. A request **interceptor** in `lib/arcgis/index.ts` rewrites WMS URLs to go through
that proxy — but **only on localhost** (it checks the hostname). On the deployed site there is no proxy,
so WMS layers that lack CORS simply won't load there; that's expected.

---

## The data model (kept short on purpose)

The config the app downloads is an envelope called `AppBootstrapConfig`; the map lives in its
`map_layers` field (the **v2** schema: `weather[]`, `features[]`, `overrides[]`, each with inline
sublayers). The editor's hard rule is **1:1 compatibility with the Flutter app's parser** — field names,
defaults and per-type requirements must match the Dart model exactly, or the app would reject the config.
Legacy **v1** documents are auto-converted to v2 on open. The deep dive lives in
[`CLAUDE.md`](CLAUDE.md) if you're curious, but you don't need it to understand the ArcGIS side.

---

## Project layout

```
src/
  lib/
    arcgis/          ← ArcGIS SDK bridge: layer factory, OAuth, WMS proxy, error tracking  ★ start here
    basemaps/        ← portal group queries + tag write-back (portal.ts)
    v2/              ← the map-config schema, parsing, migration (store = source of truth)
    catalog/         ← app built-ins (generated from the Flutter sources)
    template/        ← saved map-state ("RemoteAppConfiguration") documents
    preview/         ← preview working-state model
  components/
    editor/          ← the Layers editor + its live ArcGIS preview
    preview/         ← full Map-screen recreation (the realistic preview)
    workspace/map-preview/  ← the React-less hooks that drive <arcgis-map>
    basemaps/, templates/, catalog/, tools/, studio/   ← the other sections
  arcgis-elements.d.ts   ← TypeScript types for the <arcgis-*> web components
public/
  oauth-callback.html    ← ArcGIS OAuth redirect target
vite.config.ts           ← build config + the dev-only WMS proxy
```

State is held in module-level `@preact/signals` stores under `lib/`; components read the signals
directly (no Redux, no context). Persistence is per-environment `localStorage`.

---

## Running it locally

```bash
npm install
npm run dev        # → http://localhost:3000/hemswx-map-studio/
npm run build      # production build (verifies the generated catalog first)
npm run preview    # serve the production build locally
npm run deploy     # build + publish to GitHub Pages (gh-pages branch)
```

Live deployment: **https://valentingrigorean.github.io/hemswx-map-studio/**

> Note the URL path `/hemswx-map-studio/` — Vite is configured with that as its `base` (in
> `vite.config.ts`), so the app is served under that sub-path in **both** dev and production. This
> matters for the OAuth redirect URL below.

---

## ArcGIS OAuth setup

To sign in (needed only for the **Basemaps** section), the app's ArcGIS OAuth application must list the
exact callback URL as an allowed **Redirect URL**. The app computes it as:

```
<origin> + <vite base> + oauth-callback.html
```

Because the Vite `base` is `/hemswx-map-studio/`, the redirect URL **includes that path segment**. Register
these two on the ArcGIS application:

| Where you run it | Redirect URL to register |
|---|---|
| Local dev | `http://localhost:3000/hemswx-map-studio/oauth-callback.html` |
| GitHub Pages | `https://valentingrigorean.github.io/hemswx-map-studio/oauth-callback.html` |

A redirect URL **without** the `/hemswx-map-studio/` segment (e.g. `…/oauth-callback.html` at the root)
will **not** match and sign-in will fail — that's the most common setup mistake.

---

## Regenerating the catalog

The built-in catalog ([`src/lib/catalog/builtins.generated.json`](src/lib/catalog/builtins.generated.json))
is generated from the Flutter sources by `scripts/gen-catalog.mjs` so it always mirrors the app's enums.
Never hand-edit it; after changing the relevant Dart enums, run:

```bash
npm run gen:catalog
```

`npm run build` fails if the generated file has drifted from the Dart sources.
