import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { C } from '../../lib/v2/core';
import { ICONS } from '../editor/Icons';
import { MapThumb } from '../editor/primitives';
import { COUNTRIES } from '../../lib/basemaps/portal';
import { basemapChoices, type BasemapChoice } from '../../lib/preview/options';

export function Fab({ icon, on, onClick, title }: {
  icon: JSX.Element;
  on?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 48, height: 48, borderRadius: 999, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
        background: on ? C.accent : 'rgba(18,22,32,0.92)', border: `1px solid ${on ? C.accent : 'rgba(120,140,180,0.25)'}`,
        color: on ? '#fff' : '#dfe6f2', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ width: 22, height: 22 }}>{icon}</span>
    </button>
  );
}

export function BasemapThumb({ choice, style }: { choice: BasemapChoice | null; style?: JSX.CSSProperties }) {
  if (choice?.thumbnailUrl) return <img src={choice.thumbnailUrl} alt="" style={{ objectFit: 'cover', ...style }} />;
  return <MapThumb id={choice?.id ?? 'default'} style={style} />;
}

const COUNTRY_SHORT: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.short])
);

function metaLine(b: BasemapChoice): string {
  const parts = [
    b.countries.map((c) => COUNTRY_SHORT[c] ?? c.toUpperCase()).join('/'),
    b.wkid != null ? `wkid ${b.wkid}` : 'SR ?',
  ];
  if (b.tiles) parts.push(b.tiles);
  return parts.join(' · ');
}

function BasemapPreviewCard({ b, top, left }: { b: BasemapChoice; top: number; left: number }) {
  const rows: [string, string][] = [
    ['Countries', b.countries.map((c) => COUNTRY_SHORT[c] ?? c.toUpperCase()).join(', ')],
    ['Spatial ref', b.wkid != null ? `wkid ${b.wkid}` : 'unreadable'],
    ['Tiles', b.tiles ? `${b.tiles} · ${b.layerCount} layer${b.layerCount === 1 ? '' : 's'}` : '—'],
    ['Source', b.builtin ? 'Built-in (app binary)' : `Web Map · ${b.subtitle}`],
  ];
  if (b.modified) rows.push(['Modified', b.modified]);
  return (
    <div style={{ position: 'fixed', top, left, width: 248, zIndex: 220, pointerEvents: 'none', background: '#0e1016', border: `1px solid ${C.bdHi}`, borderRadius: 14, boxShadow: '0 22px 60px -16px rgba(0,0,0,0.85)', padding: 9 }}>
      <BasemapThumb choice={b} style={{ width: 230, height: 140, borderRadius: 9, border: `1px solid ${C.bd}` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '9px 2px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
        {b.draft && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, color: '#cdb6ff', background: '#221a36', border: '1px solid #3d2f63', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>DRAFT</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '7px 2px 2px' }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span style={{ fontSize: 10, color: C.mut2, width: 64, flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.fg2, minWidth: 0, wordBreak: 'break-word' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BasemapFlyout({ anchor, currentId, defaultId, onPick, onClose }: {
  anchor: { top: number; left: number } | null;
  currentId: string | undefined;
  defaultId: string | undefined;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const all = basemapChoices.value;
  const [tab, setTab] = useState('all');
  const [hover, setHover] = useState<BasemapChoice | null>(null);
  const counts: Record<string, number> = { all: all.length };
  for (const c of COUNTRIES) counts[c.code] = all.filter((b) => b.countries.includes(c.code)).length;
  const list = tab === 'all' ? all : all.filter((b) => b.countries.includes(tab));

  const W = 300;
  const top = anchor ? Math.max(12, Math.min(anchor.top, window.innerHeight - 484)) : 80;
  const left = anchor ? Math.max(12, anchor.left - W - 12) : 100;
  const PW = 248;
  const previewLeft = left - PW - 10 >= 12 ? left - PW - 10 : left + W + 10;
  return (
    <>
      <div onPointerDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
      <div
        onMouseLeave={() => setHover(null)}
        style={{ position: 'fixed', top, left, width: W, zIndex: 210, maxHeight: 470, display: 'flex', flexDirection: 'column', background: '#0e1016', border: `1px solid ${C.bdHi}`, borderRadius: 14, boxShadow: '0 22px 60px -16px rgba(0,0,0,0.85)', padding: 8 }}
      >
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, color: C.mut2, textTransform: 'uppercase', padding: '6px 8px 7px', flexShrink: 0 }}>Basemap · {list.length}</div>
        <div style={{ display: 'flex', gap: 4, padding: '0 4px 8px', overflowX: 'auto', flexShrink: 0 }}>
          {[{ code: 'all', short: 'All' }, ...COUNTRIES].map((c) => {
            const on = tab === c.code;
            const n = counts[c.code] ?? 0;
            return (
              <button
                key={c.code}
                onClick={() => setTab(c.code)}
                disabled={c.code !== 'all' && n === 0}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, cursor: n || c.code === 'all' ? 'pointer' : 'default', flexShrink: 0,
                  fontSize: 10.5, fontWeight: on ? 700 : 600, color: on ? '#fff' : n ? C.fg2 : C.faint,
                  background: on ? C.accent : C.inset, border: `1px solid ${on ? C.accent : C.bd}`, opacity: n || c.code === 'all' ? 1 : 0.55,
                }}
              >
                {c.short}
                <span style={{ fontSize: 9, fontWeight: 700, color: on ? 'rgba(255,255,255,0.75)' : C.faint, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', minHeight: 0 }}>
          {list.map((b) => {
            const on = b.id === (currentId ?? '');
            const isDef = !!defaultId && b.id === defaultId;
            return (
              <button
                key={b.id}
                onPointerDown={() => { onPick(b.id); onClose(); }}
                onMouseEnter={() => setHover(b)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 7, borderRadius: 10, cursor: 'pointer', textAlign: 'left', flexShrink: 0,
                  background: on ? C.cardHi : 'transparent', border: `1px solid ${on ? C.accent : 'transparent'}`,
                }}
              >
                <BasemapThumb choice={b} style={{ width: 50, height: 36, borderRadius: 7, flexShrink: 0, border: `1px solid ${C.bd}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
                    {b.draft && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, color: '#cdb6ff', background: '#221a36', border: '1px solid #3d2f63', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>DRAFT</span>}
                    {isDef && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, color: '#7ee2a8', background: '#11331f', border: '1px solid #1d5235', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>DEFAULT</span>}
                  </div>
                  <div style={{ fontSize: 10, color: C.mut2, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'ui-monospace,monospace' }}>{metaLine(b)}</div>
                </div>
                {on && <span style={{ width: 15, height: 15, color: C.accentText, flexShrink: 0 }}>{ICONS.check}</span>}
              </button>
            );
          })}
          {all.length === BUILTIN_BASEMAPS_COUNT && (
            <div style={{ fontSize: 10.5, color: C.mut, lineHeight: 1.45, padding: '7px 8px' }}>
              Only built-ins — connect the Basemaps section to list your account's Web Maps.
            </div>
          )}
        </div>
      </div>
      {hover && <BasemapPreviewCard b={hover} top={top} left={previewLeft} />}
    </>
  );
}

const BUILTIN_BASEMAPS_COUNT = 2;
