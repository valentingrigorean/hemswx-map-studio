import { useState } from 'preact/hooks';
import { C } from '../../lib/v2/core';
import { ICONS } from '../editor/Icons';
import { Toggle } from '../studio/primitives';
import { readToggle, setToggle, type Legacy, type LegacyLoc } from '../../lib/catalog/mapOptions';
import type { PreviewFeature, PreviewFeatureItem } from '../../lib/preview/options';

const locOf = (id: string): LegacyLoc => ({ kind: 'map', mapKey: 'mapFeatures', entryKey: id });

function SelectBadge({ select }: { select: 'one' | 'many' }) {
  const one = select === 'one';
  return (
    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.4, color: one ? '#cdb6ff' : '#9fb6e6', background: one ? '#221a36' : '#16202f', border: `1px solid ${one ? '#3d2f63' : '#27405f'}`, borderRadius: 4, padding: '0 5px', flexShrink: 0 }}>
      {one ? 'ONE OF' : 'MULTI'}
    </span>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span style={{ width: 16, height: 16, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center', border: `1.5px solid ${on ? C.accent : C.line}`, background: 'transparent' }}>
      {on && <span style={{ width: 8, height: 8, borderRadius: 999, background: C.accent }} />}
    </span>
  );
}

function ItemRow({ item, on, radio, warn, onClick }: {
  item: PreviewFeatureItem;
  on: boolean;
  radio: boolean;
  warn?: string;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0', cursor: 'pointer' }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: on ? C.fg : C.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
      {warn && <span title={warn} style={{ width: 13, height: 13, color: '#ffd27a', flexShrink: 0 }}>{ICONS.alert}</span>}
      {item.sublayers.length === 0 && <span title="No sublayers — nothing to draw" style={{ fontSize: 8.5, fontWeight: 700, color: C.faint, flexShrink: 0 }}>EMPTY</span>}
      {radio ? <Radio on={on} /> : <Toggle on={on} />}
    </div>
  );
}

function FeatureGroup({ feature, opts, update, failedItems }: {
  feature: PreviewFeature;
  opts: Legacy;
  update: (fn: (prev: Legacy) => Legacy) => void;
  failedItems: Map<string, { name: string; error: string }>;
}) {
  const itemOn = (id: string) => readToggle(opts, locOf(id)) === true;
  const enabled = feature.items.filter((it) => itemOn(it.id)).length;
  const [open, setOpen] = useState(enabled > 0);

  const flip = (item: PreviewFeatureItem) => {
    const on = itemOn(item.id);
    if (feature.select === 'one' && !on) {
      update((o) => {
        let next = o;
        for (const sib of feature.items) next = setToggle(next, locOf(sib.id), sib.id === item.id);
        return next;
      });
      return;
    }
    update((o) => setToggle(o, locOf(item.id), !on));
  };

  if (feature.items.length === 1) {
    const item = feature.items[0];
    return (
      <ItemRow
        item={{ ...item, name: feature.name }}
        on={itemOn(item.id)}
        radio={false}
        warn={failedItems.get(item.id) && `Failing to load — ${failedItems.get(item.id)?.error}`}
        onClick={() => flip(item)}
      />
    );
  }

  const select = feature.select ?? 'many';
  return (
    <div style={{ margin: '3px 0', borderRadius: 10, border: `1px solid ${open ? C.bd : 'transparent'}`, background: open ? C.inset : 'transparent' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: open ? '8px 10px' : '8px 0', cursor: 'pointer' }}>
        <span style={{ width: 13, height: 13, color: C.mut, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>{ICONS.chevron}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: enabled ? C.fg : C.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feature.name}</span>
        <SelectBadge select={select} />
        <span style={{ fontSize: 10, fontWeight: 700, color: enabled ? '#7ee2a8' : C.faint, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{enabled}/{feature.items.length}</span>
        {select === 'many' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const all = enabled === feature.items.length;
              update((o) => {
                let next = o;
                for (const it of feature.items) next = setToggle(next, locOf(it.id), !all);
                return next;
              });
            }}
            style={{ fontSize: 9.5, fontWeight: 600, color: C.fg2, background: C.card, border: `1px solid ${C.bd}`, borderRadius: 6, padding: '2px 7px', cursor: 'pointer', flexShrink: 0 }}
          >{enabled === feature.items.length ? 'None' : 'All'}</button>
        )}
      </div>
      {open && (
        <div style={{ padding: '0 10px 4px 31px' }}>
          {feature.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              on={itemOn(it.id)}
              radio={select === 'one'}
              warn={failedItems.get(it.id) && `Failing to load — ${failedItems.get(it.id)?.error}`}
              onClick={() => flip(it)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayersTab({ tree, opts, update, failedItems }: {
  tree: PreviewFeature[];
  opts: Legacy;
  update: (fn: (prev: Legacy) => Legacy) => void;
  failedItems: Map<string, { name: string; error: string }>;
}) {
  const sections: { section: 'weather' | 'features'; label: string }[] = [
    { section: 'weather', label: 'Weather' },
    { section: 'features', label: 'Features' },
  ];

  if (!tree.length) {
    return (
      <div style={{ padding: '15px', fontSize: 11.5, color: C.mut, lineHeight: 1.5 }}>
        No layers document loaded — import one in the <b style={{ color: C.fg2 }}>Layers</b> section first.
      </div>
    );
  }

  return (
    <>
      {sections.map(({ section, label }) => {
        const feats = tree.filter((f) => f.section === section);
        if (!feats.length) return null;
        const on = feats.reduce((n, f) => n + f.items.filter((it) => readToggle(opts, locOf(it.id)) === true).length, 0);
        const total = feats.reduce((n, f) => n + f.items.length, 0);
        return (
          <div key={section} style={{ padding: '13px 15px', borderTop: `1px solid ${C.bd2}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: C.mut2, textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{on}/{total}</span>
            </div>
            {feats.map((f) => (
              <FeatureGroup key={`${f.section}:${f.id}`} feature={f} opts={opts} update={update} failedItems={failedItems} />
            ))}
          </div>
        );
      })}
      <div style={{ margin: '0 15px 13px', fontSize: 10.5, color: C.mut, lineHeight: 1.45, background: C.inset, border: `1px solid ${C.bd}`, borderRadius: 8, padding: '8px 10px' }}>
        Same semantics as the app's layer list: a <b style={{ color: '#cdb6ff' }}>ONE OF</b> group keeps a single item active, <b style={{ color: '#9fb6e6' }}>MULTI</b> groups toggle independently. Enabled items draw on the map.
      </div>
    </>
  );
}
