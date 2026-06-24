import { useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { C } from '../../lib/v2/core';
import { ICONS } from '../editor/Icons';
import { SICONS } from '../studio/icons';
import { type Legacy } from '../../lib/catalog/mapOptions';
import {
  basemapChoices, basemapTitle, dimensionOf,
  type Dimension, type PreviewCounts, type PreviewFeature,
} from '../../lib/preview/options';
import { BasemapFlyout, BasemapThumb } from './controls';
import LayersTab from './LayersTab';

type Tab = 'layers' | 'editor';

function Section({ label, right, children }: {
  label: string;
  right?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <div style={{ padding: '13px 15px', borderTop: `1px solid ${C.bd2}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: C.mut2, textTransform: 'uppercase' }}>{label}</span>
        <div style={{ flex: 1 }} />
        {right}
      </div>
      {children}
    </div>
  );
}

function Readout({ label, value, text }: { label: string; value: string | number; text?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, color: C.mut2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: text ? 12 : 16, fontWeight: 700, color: C.fg, marginTop: 2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: text ? 96 : 'none' }}>{value}</div>
    </div>
  );
}

export default function ControlPanel({ opts, update, tree, counts, failedItems, onClose }: {
  opts: Legacy;
  update: (fn: (prev: Legacy) => Legacy) => void;
  tree: PreviewFeature[];
  counts: PreviewCounts;
  failedItems: Map<string, { name: string; error: string }>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('layers');
  const [bmOpen, setBmOpen] = useState(false);
  const [bmAnchor, setBmAnchor] = useState<{ top: number; left: number } | null>(null);
  const bmBtnRef = useRef<HTMLButtonElement | null>(null);

  const dim = dimensionOf(opts);
  const is3D = dim === 'scene';

  const treeTotal = tree.reduce((n, f) => n + f.items.length, 0);
  const treeOn = counts.layers;

  const currentBmId: string | undefined = opts.selectedBasemapId || undefined;
  const bmChoice = basemapChoices.value.find((b) => b.id === currentBmId) ?? null;
  const setBasemap = (id: string | undefined) => update((o) => {
    const next = { ...o };
    if (id) next.selectedBasemapId = id;
    else delete next.selectedBasemapId;
    return next;
  });
  const setDim = (v: Dimension) => update((o) => {
    const next = { ...o };
    if (v === 'scene') next.dimension = 'scene';
    else delete next.dimension;
    return next;
  });

  const tabs: { id: Tab; label: string; badge: string | null }[] = [
    { id: 'layers', label: 'Layers', badge: treeTotal ? `${treeOn}/${treeTotal}` : null },
    { id: 'editor', label: 'Editor', badge: null },
  ];

  return (
    <div style={{ width: 372, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0c0e13', border: `1px solid ${C.bdHi}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 50px -18px rgba(0,0,0,0.7)' }}>

      <div style={{ padding: '14px 15px 0', borderBottom: `1px solid ${C.bd2}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, color: C.accentText, textTransform: 'uppercase' }}>Live preview</span>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#7ee2a8' }} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#9fb6e6', background: 'rgba(15,20,30,0.7)', border: `1px solid ${C.bd}`, padding: '2px 8px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>{is3D ? '3D' : '2D'}</span>
          <button onClick={onClose} title="Hide panel" style={{ width: 27, height: 27, borderRadius: 8, display: 'grid', placeItems: 'center', cursor: 'pointer', background: C.inset, border: `1px solid ${C.bd}`, color: C.mut }}>
            <span style={{ width: 14, height: 14 }}>{ICONS.chevron}</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 11 }}>
          <Readout label="Layers" value={counts.layers} />
          <span style={{ width: 1, height: 22, background: C.bd2 }} />
          <Readout label="Basemap" value={basemapTitle(currentBmId)} text />
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 11 }}>
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0 9px', cursor: 'pointer',
                  fontSize: 12, fontWeight: on ? 700 : 600, color: on ? C.fg : C.mut,
                  background: 'transparent', border: 'none', borderBottom: `2px solid ${on ? C.accent : 'transparent'}`,
                }}
              >
                {t.label}
                {t.badge && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: on ? C.accentText : C.faint, background: C.inset, border: `1px solid ${C.bd}`, borderRadius: 999, padding: '1px 6px', fontVariantNumeric: 'tabular-nums' }}>{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {tab === 'layers' && (
          <LayersTab tree={tree} opts={opts} update={update} failedItems={failedItems} />
        )}

        {tab === 'editor' && (
          <Section label="Basemap">
            <button
              ref={bmBtnRef}
              onClick={() => setBmOpen((o) => {
                const n = !o;
                if (n && bmBtnRef.current) {
                  const r = bmBtnRef.current.getBoundingClientRect();
                  setBmAnchor({ top: r.top, left: r.left });
                }
                return n;
              })}
              style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: 9, borderRadius: 11, cursor: 'pointer', textAlign: 'left', background: C.card, border: `1px solid ${bmOpen ? C.accent : C.bd}` }}
            >
              <BasemapThumb choice={bmChoice} style={{ width: 56, height: 40, borderRadius: 8, flexShrink: 0, border: `1px solid ${C.bd}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{basemapTitle(currentBmId)}</div>
                <div style={{ fontSize: 10.5, color: C.mut2, marginTop: 2 }}>Preview only</div>
              </div>
              <span style={{ width: 16, height: 16, color: C.mut, transform: bmOpen ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>{ICONS.chevron}</span>
            </button>
            {bmOpen && <BasemapFlyout anchor={bmAnchor} currentId={currentBmId} defaultId={undefined} onPick={setBasemap} onClose={() => setBmOpen(false)} />}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {([['map', '2D map'], ['scene', '3D scene']] as [Dimension, string][]).map(([v, lab]) => {
                const on = dim === v;
                return (
                  <button key={v} onClick={() => setDim(v)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: on ? C.cardHi : C.inset, color: on ? C.fg : C.mut, border: `1px solid ${on ? C.accent : C.bd}` }}>
                    <span style={{ width: 14, height: 14, color: on ? C.accentText : C.mut2 }}>{v === 'scene' ? SICONS.cube : ICONS.map}</span>{lab}
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
