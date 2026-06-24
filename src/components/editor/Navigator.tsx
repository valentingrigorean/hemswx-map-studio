import { useState } from 'preact/hooks';
import { C, SECTIONS, allSubs, nodeStatus } from '../../lib/v2/core';
import { addNode, select } from '../../lib/v2/store';
import type { Section, Tree, TreeNode } from '../../lib/v2/types';
import type { Selection } from '../../lib/v2/store';
import { ICONS } from './Icons';
import { LegendDot, SelectBadge, StatusPill } from './primitives';

function Caret({ open }: { open: boolean }) {
  return <span style={{ width: 12, height: 12, color: C.mut2, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>{ICONS.chevron}</span>;
}

function NodeRow({ node, selection }: { node: TreeNode; selection: Selection | null }) {
  const [open, setOpen] = useState(false);
  const isGroup = node.kind === 'group';
  const selected = !!selection && selection.section === node.section && selection.index === node.index && selection.itemIndex == null;
  const childSelected = !!selection && selection.section === node.section && selection.index === node.index && selection.itemIndex != null;
  const s = nodeStatus(node);
  const subCount = allSubs(node).length;

  return (
    <div>
      <button
        onClick={() => {
          select(node.section, node.index);
          if (isGroup) setOpen((o) => (childSelected ? true : !o));
        }}
        className="nav-row"
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, background: selected ? C.cardHi : 'transparent', border: `1px solid ${selected ? C.accent : 'transparent'}` }}
      >
        <span
          onClick={(e) => { if (isGroup) { e.stopPropagation(); setOpen((o) => !o); } }}
          style={{ width: 14, display: 'grid', placeItems: 'center', flexShrink: 0 }}
        >
          {isGroup ? <Caret open={open || childSelected} /> : <span style={{ width: 5, height: 5, borderRadius: 999, background: C.faint }} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: node.name ? C.fg : C.mut, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {node.name || node.id || '(unnamed)'}
            </span>
            {node.section === 'overrides' && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#ffb0c8', background: '#2e1620', border: '1px solid #5a2638', padding: '0 5px', borderRadius: 4, flexShrink: 0 }}>OVERRIDE</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: 10.5, color: C.mut2, fontFamily: 'ui-monospace,monospace', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>{node.id || '—'}</span>
            <span style={{ fontSize: 10, color: C.faint, flexShrink: 0 }}>{isGroup ? `· ${node.items!.length} items` : `· ${subCount} layer${subCount === 1 ? '' : 's'}`}</span>
          </div>
        </div>
        <SelectBadge select={isGroup ? node.select : null} />
        <LegendDot legend={node.legend} />
        <StatusPill s={s} />
      </button>

      {isGroup && (open || childSelected) && (
        <div style={{ marginLeft: 15, paddingLeft: 9, borderLeft: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1, marginBottom: 2 }}>
          {node.items!.map((it) => {
            const isel = !!selection && selection.section === node.section && selection.index === node.index && selection.itemIndex === it.itemIndex;
            const isub = it.sublayers.length;
            const many = node.select === 'many';
            return (
              <button
                key={it.id || it.itemIndex}
                onClick={() => select(node.section, node.index, it.itemIndex)}
                className="nav-row"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 7, background: isel ? C.cardHi : 'transparent', border: `1px solid ${isel ? C.accent : 'transparent'}` }}
              >
                <span style={{ width: 13, height: 13, color: isel ? C.accentText : C.mut2, flexShrink: 0 }}>{many ? ICONS.checkbox : ICONS.radio}</span>
                <span style={{ flex: 1, fontSize: 12, color: isel ? C.fg : C.fg2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                <LegendDot legend={it.legend} />
                <span style={{ fontSize: 10, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{isub}</span>
                <StatusPill s={nodeStatus(it)} quiet />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHead({ label, count, onAdd }: { label: string; count: number; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 7 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.7, color: C.mut2, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      <div style={{ flex: 1 }} />
      <button onClick={onAdd} title={`Add ${label}`} style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', color: C.mut2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <span style={{ width: 13, height: 13 }}>{ICONS.plus}</span>
      </button>
    </div>
  );
}

export default function Navigator({ tree, selection }: { tree: Tree; selection: Selection | null }) {
  const [query, setQuery] = useState('');

  const match = (n: TreeNode): boolean => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if ((n.id || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)) return true;
    if (n.items) return n.items.some((i) => (i.id || '').toLowerCase().includes(q) || (i.name || '').toLowerCase().includes(q));
    return false;
  };

  const sections = SECTIONS.map((s) => ({ ...s, nodes: tree[s.key as Section].filter(match) }));

  return (
    <div style={{ width: '100%', height: '100%', background: C.pageBg, borderRight: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: C.fg2, margin: 0 }}>Feature Manager</h2>
          <div style={{ flex: 1 }} />
          <button onClick={() => addNode('weather')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: C.accentText, background: 'rgba(58,92,255,0.1)', border: '1px solid #2a3a8f', borderRadius: 7, padding: '4px 9px', cursor: 'pointer' }}>
            <span style={{ width: 13, height: 13 }}>{ICONS.plus}</span>New
          </button>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, width: 13, height: 13, color: C.mut2 }}>{ICONS.search}</span>
          <input
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Search features, ids…"
            style={{ width: '100%', height: 32, padding: '0 10px 0 30px', borderRadius: 8, background: C.inset, color: C.fg, border: `1px solid ${C.bd}`, fontSize: 12.5, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {sections.map((sec) => (
          <div key={sec.key}>
            <SectionHead label={sec.label} count={sec.nodes.length} onAdd={() => addNode(sec.key as Section)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sec.nodes.length === 0 ? (
                <div style={{ fontSize: 11.5, color: C.faint, padding: '4px 9px' }}>{query ? 'No matches' : 'Empty'}</div>
              ) : (
                sec.nodes.map((n) => <NodeRow key={`${n.section}:${n.index}`} node={n} selection={selection} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
