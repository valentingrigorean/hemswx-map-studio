import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const OUT = join(here, '..', 'src', 'lib', 'catalog', 'builtins.generated.json');

const ENUMS_DART = join(repoRoot, 'lib/features/map_options/domain/map_options_enums.dart');
const CONSTS_DART = join(repoRoot, 'lib/features/map/domain/map_constants.dart');
const MAP_OPTIONS_DART = join(repoRoot, 'lib/features/map_options/domain/map_options.dart');

// Display metadata for each MapLayerId. The Dart side has no single source for
// names/groups today (they live in l10n + UI widgets), so this table is the
// tool-side source of truth, flowing through the generated catalog so the editor
// reads one file. Keep it in sync when MapLayerId gains entries (the --check gate
// catches drift in the *generated* output, not missing META rows).
const META = {
  sigmet: { name: 'SIGMET', group: 'weather', dim: 'map' },
  airmet: { name: 'AIRMET', group: 'weather', dim: 'map' },
  aviationObstacles: { name: 'Aviation obstacles', group: 'aviation', dim: 'map' },
  ais: { name: 'AIS vessels', group: 'traffic', dim: 'map' },
  helicopterRange: { name: 'Helicopter range', group: 'helicopter', dim: 'map' },
  helicopterOnlyAir: { name: 'Helicopter (air only)', group: 'helicopter', dim: 'map' },
  lightning: { name: 'Lightning', group: 'weather', dim: 'map' },
  safeSky: { name: 'SafeSky traffic', group: 'traffic', dim: 'map', config: 'safeSky' },
  vfrRoutes: { name: 'VFR routes', group: 'aviation', dim: 'map', config: 'vfrRoutes' },
  notam: { name: 'NOTAM', group: 'aviation', dim: 'map', config: 'notam' },
  mpdls: { name: 'MPDLS', group: 'aviation', dim: 'map' },
  dispatch: { name: 'Dispatch', group: 'dispatch', dim: 'map' },
  dispatchV2: { name: 'Dispatch v2', group: 'dispatch', dim: 'map' },
  labels: { name: 'Place labels', group: 'base', dim: 'map' },
  relief: { name: 'Relief shading', group: 'base', dim: 'map' },
  weatherStation: { name: 'Weather stations', group: 'weather', dim: 'map', config: 'weatherStation' },
  buildings3D: { name: '3D buildings', group: 'threeD', dim: 'scene' },
  trees3D: { name: '3D trees', group: 'threeD', dim: 'scene' },
  details3D: { name: '3D details', group: 'threeD', dim: 'scene' },
  labels3D: { name: '3D labels', group: 'threeD', dim: 'scene' },
  sunLighting3D: { name: '3D sun lighting', group: 'threeD', dim: 'scene' },
};

// Built-ins whose legacy on/off flag is written by a dedicated toLegacyJson
// branch (not the _legacyBoolFieldMap loop), so the parser below can't see them.
const LEGACY_BOOL_EXTRA = { safeSky: 'showSafeSky', vfrRoutes: 'showVfrRoutes' };

function humanize(id) {
  return id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function enumBody(src, name) {
  const start = src.indexOf(`enum ${name}`);
  if (start < 0) throw new Error(`enum ${name} not found`);
  const open = src.indexOf('{', start);
  const semi = src.indexOf(';', open);
  const brace = src.indexOf('}', open);
  const end = semi >= 0 && (brace < 0 || semi < brace) ? semi : brace;
  return src.slice(open + 1, end);
}

function plainEnumValues(src, name) {
  return enumBody(src, name)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s));
}

function poiTypes(src) {
  const body = enumBody(src, 'PoiType');
  const out = [];
  const re = /([a-zA-Z][a-zA-Z0-9]*)\(\s*(-?\d+)\s*\)/g;
  let m;
  while ((m = re.exec(body))) out.push({ name: m[1], id: parseInt(m[2], 10) });
  return out;
}

function recognizedOverrides(src) {
  const start = src.indexOf('fromRemoteConfigId');
  if (start < 0) throw new Error('fromRemoteConfigId not found');
  const block = src.slice(start, src.indexOf('};', start));
  const out = {};
  const re = /'([^']+)'\s*=>\s*\.([a-zA-Z][a-zA-Z0-9]*)/g;
  let m;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}

// MapLayerId.defaultConfig — the config the app applies when a layer has no
// stored entry. The base LayerConfig defaults to enabled: false, and the typed
// subclasses (SafeSkyLayerConfig, …) keep that, so only literal constructor
// args in the switch arms matter here.
function layerDefaults(src) {
  const start = src.indexOf('defaultConfig => switch');
  if (start < 0) throw new Error('defaultConfig switch not found');
  const block = src.slice(start, src.indexOf('};', start));
  const out = {};
  const re = /([a-zA-Z0-9_ |]+?)\s*=>\s*const\s+\w+\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(block))) {
    const ids = m[1].split('||').map((s) => s.trim()).filter((s) => s && s !== '_');
    const enabled = /enabled:\s*true/.test(m[2]);
    const op = m[2].match(/opacity:\s*([\d.]+)/);
    for (const id of ids) out[id] = { enabled, opacity: op ? parseFloat(op[1]) : null };
  }
  return out;
}

function layerKeys(src) {
  const out = [];
  const re = /const\s+String\s+(k\w*LayerKey)\s*=\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) out.push({ key: m[2], constant: m[1] });
  return out;
}

// Parses `const Map<String, MapLayerId> _legacyBoolFieldMap = { 'showSigmet': .sigmet, ... }`
// into { sigmet: 'showSigmet', ... } — the bridge from a built-in to its legacy
// mapOptions on/off flag (the wire shape templates use).
function legacyBoolByLayerId(src) {
  const start = src.indexOf('_legacyBoolFieldMap = {');
  if (start < 0) throw new Error('_legacyBoolFieldMap declaration not found');
  const block = src.slice(start, src.indexOf('};', start));
  const out = {};
  const re = /'([^']+)'\s*:\s*\.([a-zA-Z][a-zA-Z0-9]*)/g;
  let m;
  while ((m = re.exec(block))) out[m[2]] = m[1];
  return out;
}

function builtinFeatures(mapLayerIds, legacyByLayerId, overrides, defaults) {
  const remoteByLayerId = {};
  for (const [remoteId, layerId] of Object.entries(overrides)) {
    remoteByLayerId[layerId] = remoteId;
  }
  return mapLayerIds.map((id) => {
    const meta = META[id] ?? {};
    return {
      id,
      storageKey: `builtin:${id}`,
      legacyJsonKey: legacyByLayerId[id] ?? LEGACY_BOOL_EXTRA[id] ?? null,
      overridableRemoteId: remoteByLayerId[id] ?? null,
      displayName: meta.name ?? humanize(id),
      group: meta.group ?? 'other',
      dimension: meta.dim ?? 'map',
      config: meta.config ?? 'basic',
      defaultEnabled: defaults[id]?.enabled ?? false,
      defaultOpacity: defaults[id]?.opacity ?? null,
    };
  });
}

function build() {
  const enumsSrc = readFileSync(ENUMS_DART, 'utf8');
  const constsSrc = readFileSync(CONSTS_DART, 'utf8');
  const optionsSrc = readFileSync(MAP_OPTIONS_DART, 'utf8');
  const mapLayerIds = plainEnumValues(enumsSrc, 'MapLayerId');
  const overrides = recognizedOverrides(enumsSrc);
  return {
    mapLayerIds,
    poiTypes: poiTypes(enumsSrc),
    routeForecastSources: plainEnumValues(enumsSrc, 'RouteForecastSource'),
    layerKeys: layerKeys(constsSrc),
    recognizedOverrides: overrides,
    builtinFeatures: builtinFeatures(mapLayerIds, legacyBoolByLayerId(optionsSrc), overrides, layerDefaults(enumsSrc)),
  };
}

const data = build();
const json = JSON.stringify(data, null, 2) + '\n';

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {}
  if (current !== json) {
    console.error('catalog drift: src/lib/catalog/builtins.generated.json is stale. Run: node scripts/gen-catalog.mjs');
    process.exit(1);
  }
  console.log('catalog up to date');
} else {
  writeFileSync(OUT, json);
  console.log(
    `wrote ${OUT}\n  mapLayerIds=${data.mapLayerIds.length} poiTypes=${data.poiTypes.length} ` +
      `routeForecast=${data.routeForecastSources.length} layerKeys=${data.layerKeys.length} ` +
      `recognizedOverrides=${Object.keys(data.recognizedOverrides).length} builtinFeatures=${data.builtinFeatures.length}`
  );
}
