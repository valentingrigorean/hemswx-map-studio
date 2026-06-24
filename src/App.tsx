import { useRef, useEffect } from 'preact/hooks';
import { loadLastJsonData } from './lib/jsonStore';
import {
  hasConfig,
  loadStoredConfig,
  mapConfig,
  setConfig,
  summary,
  convertedNotice,
  dismissConverted,
} from './lib/v2/store';
import { coerceToV2 } from './lib/v2/migrate';
import { ingestRaw } from './lib/v2/ingest';
import { items as basemapItems } from './lib/basemaps/store';
import { activeNav, layersTab } from './lib/studio';
import { C } from './lib/v2/core';
import { ICONS } from './components/editor/Icons';
import { SICONS } from './components/studio/icons';
import Rail from './components/studio/Rail';
import TopBar, { type TopBarTab } from './components/studio/TopBar';
import { Btn } from './components/studio/primitives';
import JsonEditor from './components/JsonEditor';
import EditorApp from './components/editor/EditorApp';
import PortalBasemaps from './components/basemaps/PortalBasemaps';
import PreviewView from './components/preview/PreviewView';
import SettingsPanel from './components/SettingsPanel';
import EmptyState from './components/EmptyState';
import { readJsonFile } from './lib/utils';
import '@arcgis/core/assets/esri/themes/dark/main.css';
import './styles/globals.css';

const SECTION_TABS: TopBarTab[] = [
  { key: 'editor', label: 'Editor' },
  { key: 'json', label: 'JSON' },
];

function JsonFileInput({ inputRef, onJson }: { inputRef: any; onJson: (data: any) => void }) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="application/json,.json"
      style={{ display: 'none' }}
      onChange={(e) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) readJsonFile(file, onJson);
        input.value = '';
      }}
    />
  );
}

function ConversionToast() {
  const info = convertedNotice.value;
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(dismissConverted, 8000);
    return () => clearTimeout(t);
  }, [info]);
  if (!info) return null;
  const counts = `${info.weather} weather · ${info.features} features · ${info.overrides.length} override${info.overrides.length === 1 ? '' : 's'}`;
  return (
    <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(13,16,22,0.97)', border: '1px solid #23375e', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9fd0ff' }}>Legacy v1 document converted to v2</div>
        <div style={{ fontSize: 11.5, color: C.fg2, marginTop: 3 }}>
          {counts}
          {info.overrides.length > 0 && <> — {info.overrides.join(', ')}</>}
        </div>
      </div>
      <button onClick={dismissConverted} title="Dismiss" style={{ width: 14, height: 14, marginTop: 2, display: 'grid', placeItems: 'center', color: '#5b9cff', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>{ICONS.close}</button>
    </div>
  );
}

function WarnChip({ n }: { n: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#ffd27a', background: '#2e2815', border: '1px solid #5a4a1c', borderRadius: 7, padding: '4px 9px' }}>
      <span style={{ width: 13, height: 13 }}>{ICONS.alert}</span>{`${n} to check`}
    </span>
  );
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!hasConfig.value) loadStoredConfig();
    loadLastJsonData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleLoadFile = () => fileInputRef.current?.click();

  const nav = activeNav.value;
  const s = summary.value;
  const counts = {
    layers: s.weather + s.features + s.overrides,
    basemaps: basemapItems.value.length || undefined,
  };

  let title = 'Layers';
  let sub: string | undefined;
  let tabs: TopBarTab[] | undefined;
  let tab: 'editor' | 'json' | undefined;
  let onTab: ((t: 'editor' | 'json') => void) | undefined;
  let right: any = null;

  if (nav === 'workspace') {
    title = 'Layers';
    sub = 'remote_config · weather, features & overrides';
    tabs = SECTION_TABS;
    tab = layersTab.value;
    onTab = (t) => { layersTab.value = t; };
    right = (
      <>
        {s.warn > 0 && <WarnChip n={s.warn} />}
        <Btn kind="soft" icon={SICONS.upload} onClick={handleLoadFile}>Open JSON…</Btn>
      </>
    );
  } else if (nav === 'basemaps') {
    title = 'Basemaps';
    sub = 'All Web Maps your account can access · snla.maps.arcgis.com';
  } else if (nav === 'preview') {
    title = 'Preview';
    sub = 'Layers ⊕ basemap — what the pilot sees';
  } else if (nav === 'settings') {
    title = 'Settings';
    sub = 'ArcGIS credentials & preferences';
  }

  let body: any;
  if (nav === 'workspace') {
    body = layersTab.value === 'json' ? <LayersJsonView /> : <EditorApp />;
  } else if (nav === 'basemaps') {
    body = <PortalBasemaps />;
  } else if (nav === 'preview') {
    body = <PreviewView />;
  } else {
    body = (
      <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', background: C.card, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 16 }}>
          <SettingsPanel />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', background: C.pageBg, color: C.fg }}>
      <JsonFileInput inputRef={fileInputRef} onJson={ingestRaw} />

      {!hasConfig.value ? (
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <EmptyState onOpenClick={handleLoadFile} />
        </div>
      ) : (
        <>
          <Rail active={nav} onNav={(n) => { activeNav.value = n; }} counts={counts} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <TopBar title={title} sub={sub} tabs={tabs} tab={tab} onTab={onTab} right={right} />
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
              {body}
            </div>
          </div>
        </>
      )}

      <ConversionToast />
    </div>
  );
}

function JsonView({ title, value, onChange }: { title: string; value: any; onChange: (v: any) => void }) {
  return (
    <div style={{ height: '100%', padding: 14, boxSizing: 'border-box' }}>
      <div style={{ height: '100%', background: C.card, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 12, boxSizing: 'border-box' }}>
        <JsonEditor title={title} value={value} onChange={onChange} height="100%" />
      </div>
    </div>
  );
}

function LayersJsonView() {
  return (
    <JsonView
      title="Map config (v2)"
      value={mapConfig.value}
      onChange={(newData: any) => setConfig(coerceToV2(newData).config, { select: false })}
    />
  );
}

export default App;
