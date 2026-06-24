import { useState } from 'preact/hooks';
import type { LayerType } from '../../lib/types';
import {
  ADDABLE_LAYER_TYPES,
  C,
  LAYER_TYPES,
  isPlaceholder,
  legendKind,
  optSummary,
  shortSource,
  sublayerIssues,
} from '../../lib/v2/core';
import {
  changeSublayerType,
  removeSublayer,
  setLegend,
  setSublayerOption,
  updateSublayer,
} from '../../lib/v2/store';
import type { Legend, Section, Sublayer } from '../../lib/v2/types';
import { ICONS } from './Icons';
import { Field, Note, Segmented, TextInput, TypeChip } from './primitives';

export interface LeafPath {
  section: Section;
  index: number;
  itemIndex: number | null;
}

const TYPE_SEG_OPTIONS = ADDABLE_LAYER_TYPES.map((t) => ({ value: t, label: LAYER_TYPES[t]?.short || t }));

function ChipList({ values, onChange, placeholder }: {
  values: string[] | undefined;
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v) {
      onChange([...(values || []), v]);
      setDraft('');
    }
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {(values || []).map((v, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontFamily: 'ui-monospace,monospace', color: '#bfe6dd', background: '#0e2a28', border: '1px solid #1c4a45', borderRadius: 6, padding: '3px 6px 3px 9px' }}>
          {v}
          <button onClick={() => onChange(values!.filter((_, j) => j !== i))} style={{ width: 14, height: 14, display: 'grid', placeItems: 'center', color: '#6fb0a6', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ width: 11, height: 11 }}>{ICONS.close}</span>
          </button>
        </span>
      ))}
      <input
        value={draft}
        onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder || 'add…'}
        style={{ flex: '1 0 90px', minWidth: 90, height: 28, padding: '0 9px', borderRadius: 6, background: C.inset, color: C.fg, border: `1px dashed ${C.line}`, fontSize: 11.5, fontFamily: 'ui-monospace,monospace', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function ZStepper({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const v = value ?? 0;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => onChange(v - 1)} style={{ width: 28, height: 30, background: C.inset, color: C.fg2, border: 'none', cursor: 'pointer', fontSize: 15 }}>−</button>
      <div style={{ width: 36, textAlign: 'center', fontSize: 13, fontWeight: 700, color: C.fg, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      <button onClick={() => onChange(v + 1)} style={{ width: 28, height: 30, background: C.inset, color: C.fg2, border: 'none', cursor: 'pointer', fontSize: 15 }}>+</button>
    </div>
  );
}

export function SublayerCard({ sl, subIndex, path, expanded, onToggle, showZ }: {
  sl: Sublayer;
  subIndex: number;
  path: LeafPath;
  expanded: boolean;
  onToggle: () => void;
  showZ?: boolean;
}) {
  const meta = LAYER_TYPES[sl.type] || ({} as any);
  const issues = sublayerIssues(sl);
  const bad = issues.length > 0;
  const o = sl.options || {};
  const extras = Object.entries(o).filter(([k]) => !['layerNames', 'layerId', 'opacity'].includes(k));
  const set = (changes: Partial<Sublayer>) => updateSublayer(path.section, path.index, path.itemIndex, subIndex, changes);
  const setOpt = (key: string, value: any) => setSublayerOption(path.section, path.index, path.itemIndex, subIndex, key, value);

  return (
    <div style={{ borderRadius: 10, border: `1px solid ${bad ? '#5a4a1c' : C.bd}`, background: C.card, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', background: 'transparent', border: 'none' }}>
        <span style={{ width: 13, height: 13, color: C.mut2, cursor: 'grab', flexShrink: 0 }}>{ICONS.grip}</span>
        <TypeChip type={sl.type} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: isPlaceholder(sl.source) ? '#ffd27a' : C.fg2, fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortSource(sl.source)}</div>
          <div style={{ fontSize: 10.5, color: C.mut2, marginTop: 2 }}>{optSummary(sl)}</div>
        </div>
        {bad && <span title={issues.join('\n')} style={{ width: 14, height: 14, color: '#ffb020', flexShrink: 0 }}>{ICONS.alert}</span>}
        {showZ && <span style={{ fontSize: 10, fontWeight: 700, color: C.mut, background: C.inset, border: `1px solid ${C.bd}`, borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>z{sl.zIndex ?? 0}</span>}
        <span style={{ width: 13, height: 13, color: C.mut2, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>{ICONS.chevron}</span>
      </button>

      {expanded && (
        <div style={{ padding: '4px 12px 13px', borderTop: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ paddingTop: 12 }}>
            <Field label="Layer type">
              <Segmented size="sm" value={sl.type} onChange={(t) => changeSublayerType(path.section, path.index, path.itemIndex, subIndex, t as LayerType)} options={TYPE_SEG_OPTIONS} />
            </Field>
          </div>

          <Field label="Source" hint={sl.sourceKind ? `sourceKind: ${sl.sourceKind}` : meta.need === 'layerId' ? 'portal item id' : 'service url'}>
            <TextInput mono value={sl.source} onInput={(e) => set({ source: (e.target as HTMLInputElement).value })} />
          </Field>

          {meta.need === 'layerNames' && (
            <Field label="Layer names" hint="options.layerNames">
              <ChipList values={o.layerNames} onChange={(v) => setOpt('layerNames', v)} placeholder="layer name" />
            </Field>
          )}
          {meta.need === 'layerId' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Layer id" hint="options.layerId">
                <TextInput
                  mono
                  value={String(o.layerId ?? '')}
                  onInput={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    const num = Number(raw);
                    setOpt('layerId', raw.trim() === '' ? undefined : Number.isFinite(num) && /^\d+$/.test(raw.trim()) ? num : raw);
                  }}
                />
              </Field>
              <Field label="Source kind" hint="sourceKind">
                <Segmented size="sm" value={sl.sourceKind || 'portalItem'} onChange={(v) => set({ sourceKind: v as any })} options={[{ value: 'portalItem', label: 'Portal' }, { value: 'uri', label: 'URI' }]} />
              </Field>
            </div>
          )}

          <Field label="Opacity" hint={`${Math.round((o.opacity ?? 1) * 100)}%`}>
            <input type="range" min={0} max={1} step={0.05} value={o.opacity ?? 1} onInput={(e) => setOpt('opacity', Number((e.target as HTMLInputElement).value))} style={{ width: '100%', accentColor: C.accent }} />
          </Field>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Field label="Stacking" hint="zIndex"><ZStepper value={sl.zIndex} onChange={(v) => set({ zIndex: v })} /></Field>
            {extras.length > 0 && (
              <div style={{ flex: 1 }}>
                <Field label="Extra params" hint="read-only">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {extras.map(([k, v]) => (
                      <span key={k} style={{ fontSize: 10.5, fontFamily: 'ui-monospace,monospace', color: C.mut, background: C.inset, border: `1px solid ${C.bd}`, borderRadius: 5, padding: '2px 7px' }}>{k}{String(v) ? `: ${v}` : ''}</span>
                    ))}
                  </div>
                </Field>
              </div>
            )}
          </div>

          {bad && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '9px 11px', borderRadius: 8, background: '#2e2815', border: '1px solid #5a4a1c' }}>
              {issues.map((iss, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11.5, color: '#ffd27a' }}>
                  <span style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }}>{ICONS.alert}</span>{iss}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => removeSublayer(path.section, path.index, path.itemIndex, subIndex)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#ff8585', background: 'transparent', border: '1px solid #4a2228', borderRadius: 7, padding: '5px 11px', cursor: 'pointer' }}>
              <span style={{ width: 13, height: 13 }}>{ICONS.trash}</span>Remove sublayer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LegendEditor({ legend, path }: { legend: Legend | undefined; path: LeafPath }) {
  const kind = legendKind(legend);
  const opts = [
    { value: 'none', label: 'None', icon: ICONS.ban },
    { value: 'auto', label: 'Auto', icon: ICONS.auto, iconColor: '#7ee2a8' },
    { value: 'url', label: 'Image', icon: ICONS.image, iconColor: '#9fd0ff' },
    { value: 'text', label: 'Text', icon: ICONS.text, iconColor: '#ffcf8a' },
  ];
  const apply = (next: Legend | undefined) => setLegend(path.section, path.index, path.itemIndex, next);
  const onKind = (k: string) => {
    if (k === 'none') apply(undefined);
    else if (k === 'auto') apply(true);
    else if (k === 'url') apply({ url: (legend && typeof legend === 'object' && 'url' in legend ? legend.url : '') || '' });
    else if (k === 'text') apply({ text: (legend && typeof legend === 'object' && 'text' in legend ? legend.text : '') || '' });
  };
  const urlVal = legend && typeof legend === 'object' && 'url' in legend ? legend.url : '';
  const textVal = legend && typeof legend === 'object' && 'text' in legend ? legend.text : '';
  const imageVal = legend && typeof legend === 'object' && 'image' in legend ? legend.image : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <Segmented size="sm" value={kind} onChange={onKind} options={opts} />
      {kind === 'none' && <Note>No legend shown for this layer.</Note>}
      {kind === 'image' && (
        <div style={{ display: 'flex', gap: 11 }}>
          <div style={{ flex: 1 }}>
            <Note>Inline base64 legend image (preserved as-is) — picking another kind replaces it.</Note>
          </div>
          <div style={{ width: 84, height: 56, borderRadius: 8, border: `1px solid ${C.bd}`, background: C.inset, display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <img src={imageVal.startsWith('data:') ? imageVal : `data:image/png;base64,${imageVal}`} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      )}
      {kind === 'auto' && <Note><b style={{ color: C.fg2 }}>legend: true</b> — the app renders the legend directly from the service capabilities.</Note>}
      {kind === 'url' && (
        <div style={{ display: 'flex', gap: 11 }}>
          <div style={{ flex: 1 }}>
            <TextInput mono value={urlVal} onInput={(e) => apply({ url: (e.target as HTMLInputElement).value })} />
            <Note style={{ marginTop: 7 }}>Static legend image hosted on hemswx.no.</Note>
          </div>
          <div style={{ width: 84, height: 56, borderRadius: 8, border: `1px solid ${C.bd}`, background: C.inset, display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {urlVal ? <img src={urlVal} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ width: '70%', height: '60%', borderRadius: 4, background: 'linear-gradient(90deg,#2e6f4e,#c9b84a,#c0492f)' }} />}
          </div>
        </div>
      )}
      {kind === 'text' && (
        <div>
          <textarea value={textVal} onInput={(e) => apply({ text: (e.target as HTMLTextAreaElement).value })} style={{ width: '100%', minHeight: 60, padding: 10, borderRadius: 9, background: C.inset, color: C.fg, border: `1px solid ${C.bd}`, fontSize: 12.5, lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <Note style={{ marginTop: 7 }}>Free-text caption shown under the layer toggle.</Note>
        </div>
      )}
    </div>
  );
}
