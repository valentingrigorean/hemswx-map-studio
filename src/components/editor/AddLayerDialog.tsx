import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type { LayerType } from '../../lib/types';
import { ADDABLE_LAYER_TYPES, C, LAYER_TYPES } from '../../lib/v2/core';
import { PORTAL_HOST } from '../../lib/basemaps/portal';
import { SUPPORTED_ITEM_TYPES } from '../../lib/addlayer/portal';
import type { BrowseFilter, PortalLayerItem } from '../../lib/addlayer/portal';
import {
  addDetected,
  addLayerOpen,
  addManual,
  addPortalItem,
  addTab,
  addedCount,
  browseFilter,
  browseLoading,
  browseMineOnly,
  browseQuery,
  browseResults,
  closeAddLayer,
  connectPortal,
  detectUrl,
  portalConn,
  portalError,
  runBrowseSearch,
  urlDetecting,
  urlInput,
  urlResult,
} from '../../lib/addlayer/store';
import type { AddTab } from '../../lib/addlayer/store';
import { ICONS } from './Icons';
import { MapThumb, Note, TypeChip } from './primitives';

const TABS: { value: AddTab; label: string; icon: JSX.Element }[] = [
  { value: 'browse', label: 'Browse portal', icon: ICONS.search },
  { value: 'url', label: 'From URL', icon: ICONS.link },
  { value: 'manual', label: 'Manual', icon: ICONS.grid },
];

const FILTERS: { value: BrowseFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...SUPPORTED_ITEM_TYPES.map((t) => ({ value: t.v2 as BrowseFilter, label: t.label })),
];

const spinner = (size: number, ring: string, top: string) => (
  <span className="bm-spin" style={{ width: size, height: size, borderRadius: 999, border: `${size > 16 ? 3 : 2}px solid ${ring}`, borderTopColor: top }} />
);

function Thumb({ item }: { item: PortalLayerItem }) {
  const [failed, setFailed] = useState(false);
  const base: JSX.CSSProperties = { width: 56, height: 38, borderRadius: 6, flexShrink: 0, border: `1px solid ${C.bd}` };
  if (item.thumbnailUrl && !failed) {
    return <img src={item.thumbnailUrl} alt="" onError={() => setFailed(true)} style={{ ...base, objectFit: 'cover' }} />;
  }
  return <MapThumb id={item.id} style={base} />;
}

function TabStrip() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', borderBottom: `1px solid ${C.bd2}` }}>
      {TABS.map((t) => {
        const on = addTab.value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => (addTab.value = t.value)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: on ? C.fg : C.mut, background: 'transparent', border: 'none', borderBottom: `2px solid ${on ? C.accentText : 'transparent'}`, marginBottom: -1 }}
          >
            <span style={{ width: 14, height: 14, color: on ? C.accentText : C.mut2 }}>{t.icon}</span>{t.label}
          </button>
        );
      })}
    </div>
  );
}

function ErrorNote({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '9px 11px', marginBottom: 10, borderRadius: 8, background: '#34161a', border: '1px solid #5a2228', color: '#ff9b9b', fontSize: 12, lineHeight: 1.45 }}>
      <span style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}>{ICONS.alert}</span>{msg}
    </div>
  );
}

function ConnectGate() {
  if (portalConn.value === 'connecting') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', gap: 12, height: '100%', color: C.mut2, fontSize: 13 }}>
        {spinner(22, '#2a3a8f', C.accentText)}Connecting to {PORTAL_HOST}…
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 14, height: '100%', textAlign: 'center', padding: 16 }}>
      <span style={{ width: 34, height: 34, color: C.mut2 }}>{ICONS.cloud}</span>
      <div style={{ fontSize: 12.5, color: C.mut, lineHeight: 1.5, maxWidth: 300 }}>Sign in to browse layers your account can access on {PORTAL_HOST}.</div>
      {portalConn.value === 'error' && portalError.value && <div style={{ fontSize: 12, color: '#ff9b9b', maxWidth: 320 }}>{portalError.value}</div>}
      <button onClick={connectPortal} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: '#fff', background: C.accent, border: 'none', cursor: 'pointer' }}>
        <span style={{ width: 15, height: 15 }}>{ICONS.cloud}</span>Connect to {PORTAL_HOST}
      </button>
    </div>
  );
}

function BrowseTab() {
  if (portalConn.value !== 'connected') return <ConnectGate />;
  const results = browseResults.value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '12px 14px', borderBottom: `1px solid ${C.bd2}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button
            onClick={() => { browseMineOnly.value = !browseMineOnly.value; runBrowseSearch(); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: browseMineOnly.value ? C.accent : 'transparent', color: browseMineOnly.value ? '#fff' : C.fg2, border: `1px solid ${browseMineOnly.value ? C.accent : C.line}` }}
          >
            {browseMineOnly.value && <span style={{ width: 13, height: 13 }}>{ICONS.check}</span>}My content
          </button>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 10, width: 14, height: 14, color: C.mut2 }}>{ICONS.search}</span>
            <input
              value={browseQuery.value}
              onInput={(e) => (browseQuery.value = (e.target as HTMLInputElement).value)}
              onKeyDown={(e) => { if ((e as KeyboardEvent).key === 'Enter') runBrowseSearch(); }}
              placeholder={`Search ${PORTAL_HOST}…`}
              autoFocus
              style={{ width: '100%', height: 34, padding: '0 10px 0 30px', borderRadius: 8, background: C.inset, color: C.fg, border: `1px solid ${C.bd}`, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {FILTERS.map((f) => {
            const on = browseFilter.value === f.value;
            return (
              <button
                key={f.value}
                onClick={() => { browseFilter.value = f.value; runBrowseSearch(); }}
                style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999, cursor: 'pointer', color: on ? C.fg : C.mut, background: on ? C.cardHi : 'transparent', border: `1px solid ${on ? C.bdHi : C.bd}` }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 200 }}>
        {portalError.value && <ErrorNote msg={portalError.value} />}
        {browseLoading.value ? (
          <div style={{ display: 'grid', placeItems: 'center', gap: 12, height: 180, color: C.mut2, fontSize: 13 }}>{spinner(22, '#2a3a8f', C.accentText)}Searching…</div>
        ) : results.length === 0 ? (
          <div style={{ display: 'grid', placeItems: 'center', height: 180, color: C.mut2, fontSize: 13, textAlign: 'center' }}>No items match. Try a different search or filter.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 9, background: C.card, border: `1px solid ${C.bd}` }}>
                <Thumb item={r} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                    <TypeChip type={r.v2Type} />
                  </div>
                  <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{r.owner} · {r.modified}</div>
                </div>
                <button onClick={() => addPortalItem(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#fff', background: C.accent, border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ width: 13, height: 13 }}>{ICONS.plus}</span>Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UrlTab() {
  const res = urlResult.value;
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 11, width: 14, height: 14, color: C.mut2 }}>{ICONS.link}</span>
          <input
            value={urlInput.value}
            onInput={(e) => (urlInput.value = (e.target as HTMLInputElement).value)}
            onKeyDown={(e) => { if ((e as KeyboardEvent).key === 'Enter') detectUrl(); }}
            placeholder="Service URL or portal item id…"
            autoFocus
            style={{ width: '100%', height: 36, padding: '0 11px 0 32px', borderRadius: 9, background: C.inset, color: C.fg, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: 'ui-monospace,monospace', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={detectUrl} disabled={urlDetecting.value} style={{ height: 36, padding: '0 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: urlDetecting.value ? 'default' : 'pointer', background: C.card, color: C.fg, border: `1px solid ${C.line}`, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {urlDetecting.value && spinner(13, '#2a3a8f', C.accentText)}{urlDetecting.value ? 'Detecting…' : 'Detect'}
        </button>
      </div>
      <Note>Paste an ArcGIS Server layer URL (FeatureServer / MapServer / VectorTileServer / SceneServer), a WMS endpoint, or a portal item id. The type is detected automatically.</Note>

      {res && !res.ok && <ErrorNote msg={res.error} />}
      {res && res.ok && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, background: C.card, border: `1px solid ${C.bd}` }}>
          <TypeChip type={res.v2Type} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</div>
            <div style={{ fontSize: 11, color: C.mut, fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{res.config.source}</div>
          </div>
          <button onClick={addDetected} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#fff', background: C.accent, border: 'none', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ width: 13, height: 13 }}>{ICONS.plus}</span>Add layer
          </button>
        </div>
      )}
    </div>
  );
}

function ManualTab() {
  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <Note style={{ marginBottom: 12 }}>Pick a layer type — a placeholder sublayer is added, ready to fill in on the card.</Note>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ADDABLE_LAYER_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => addManual(t as LayerType)}
            className="nav-row"
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 9, background: C.card, border: `1px solid ${C.bd}`, cursor: 'pointer', textAlign: 'left' }}
          >
            <TypeChip type={t} mini />
            <span style={{ fontSize: 12.5, color: C.fg2 }}>{LAYER_TYPES[t]?.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AddLayerDialog() {
  if (!addLayerOpen.value) return null;
  const n = addedCount.value;
  return (
    <div onClick={closeAddLayer} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(7,9,13,0.66)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 660, maxWidth: '100%', maxHeight: '84vh', display: 'flex', flexDirection: 'column', background: C.pageBg, border: `1px solid ${C.bd}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 70px -20px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: '#fff', background: C.accent, flexShrink: 0 }}><span style={{ width: 17, height: 17 }}>{ICONS.plus}</span></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: C.fg }}>Add layer</div>
            <div style={{ fontSize: 11.5, color: C.mut2 }}>Adds one sublayer to this feature</div>
          </div>
          <button onClick={closeAddLayer} style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: C.fg3, background: 'transparent', border: `1px solid ${C.bd}`, cursor: 'pointer', flexShrink: 0 }}><span style={{ width: 14, height: 14 }}>{ICONS.close}</span></button>
        </div>

        <TabStrip />

        <div style={{ height: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {addTab.value === 'browse' && <BrowseTab />}
          {addTab.value === 'url' && <UrlTab />}
          {addTab.value === 'manual' && <ManualTab />}
        </div>

        <div style={{ padding: '11px 16px', borderTop: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, color: n > 0 ? '#7ee2a8' : C.mut2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {n > 0 && <span style={{ width: 13, height: 13 }}>{ICONS.check}</span>}
            {n > 0 ? `${n} added · ` : ''}Add several, then close.
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={closeAddLayer} style={{ height: 34, padding: '0 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#fff', background: C.accent, border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
