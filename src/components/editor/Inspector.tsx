import { useState } from 'preact/hooks';
import {
  C,
  SECTION_BADGE,
  allSubs,
  nodeStatus,
  shortSource,
} from '../../lib/v2/core';
import {
  addItem,
  deleteItem,
  deleteNode,
  editorView,
  mapConfig,
  select,
  setSelectMode,
  updateItemField,
  updateNodeField,
} from '../../lib/v2/store';
import { openAddLayer } from '../../lib/addlayer/store';
import type { Selection } from '../../lib/v2/store';
import type { Item, Legend, Node, Override, Sublayer } from '../../lib/v2/types';
import { ICONS } from './Icons';
import { LegendEditor, SublayerCard, type LeafPath } from './SublayerCard';
import { Field, Note, Segmented, StatusPill, TextInput, TypeChip } from './primitives';
import { isRecognizedOverride, overridableFeatures, recognizedOverrideIds } from '../../lib/catalog';

import type { ComponentChildren } from 'preact';

function SectionTitle({ children, count, action }: { children: ComponentChildren; count?: number; action?: ComponentChildren }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: C.fg3, textTransform: 'uppercase' }}>{children}</span>
      {count != null && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{count}</span>}
      <div style={{ flex: 1, height: 1, background: C.bd2 }} />
      {action}
    </div>
  );
}

function AddSublayerBtn({ path }: { path: LeafPath }) {
  return (
    <button onClick={() => openAddLayer(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 10, background: C.inset, color: C.fg2, border: `1px dashed ${C.line}`, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
      <span style={{ width: 14, height: 14 }}>{ICONS.plus}</span>Add layer
    </button>
  );
}

function SublayerList({ subs, path, showZ }: { subs: Sublayer[]; path: LeafPath; showZ?: boolean }) {
  const [exp, setExp] = useState<number | null>(subs.length === 1 ? 0 : null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {subs.length === 0 && <Note>No sublayers yet. Add one to make this feature render on the map.</Note>}
      {subs.map((sl, i) => (
        <SublayerCard key={i} sl={sl} subIndex={i} path={path} showZ={showZ} expanded={exp === i} onToggle={() => setExp((e) => (e === i ? null : i))} />
      ))}
      <AddSublayerBtn path={path} />
    </div>
  );
}

interface LeafData {
  path: LeafPath;
  id: string;
  name: string;
  legend: Legend | undefined;
  sublayers: Sublayer[];
}

function LeafEditor({ leaf }: { leaf: LeafData }) {
  const patch = (changes: Partial<Item & Node>) => {
    if (leaf.path.itemIndex == null) updateNodeField(leaf.path.section, leaf.path.index, changes as Partial<Node>);
    else updateItemField(leaf.path.section, leaf.path.index, leaf.path.itemIndex, changes as Partial<Item>);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionTitle>General</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Item id" hint="id"><TextInput mono value={leaf.id} onInput={(e) => patch({ id: (e.target as HTMLInputElement).value })} /></Field>
          <Field label="Name" hint="name"><TextInput value={leaf.name} onInput={(e) => patch({ name: (e.target as HTMLInputElement).value })} /></Field>
        </div>
      </div>
      <div>
        <SectionTitle>Legend</SectionTitle>
        <LegendEditor legend={leaf.legend} path={leaf.path} />
      </div>
      <div>
        <SectionTitle count={leaf.sublayers.length}>Sublayers</SectionTitle>
        <SublayerList key={`${leaf.path.section}:${leaf.path.index}:${leaf.path.itemIndex}`} subs={leaf.sublayers} path={leaf.path} />
      </div>
    </div>
  );
}

function GroupEditor({ node, index, section }: { node: Node; index: number; section: 'weather' | 'features' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionTitle>Group</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Group id" hint="id"><TextInput mono value={node.id} onInput={(e) => updateNodeField(section, index, { id: (e.target as HTMLInputElement).value })} /></Field>
          <Field label="Name" hint="name"><TextInput value={node.name || ''} onInput={(e) => updateNodeField(section, index, { name: (e.target as HTMLInputElement).value })} /></Field>
        </div>
      </div>

      <div>
        <SectionTitle>Selection mode</SectionTitle>
        <Segmented value={node.select || 'many'} onChange={(v) => setSelectMode(section, index, v as 'one' | 'many')} options={[{ value: 'one', label: 'One', icon: ICONS.radio }, { value: 'many', label: 'Many', icon: ICONS.checkbox }]} />
        <Note style={{ marginTop: 9 }}>
          {(node.select || 'many') === 'many'
            ? <><b style={{ color: C.fg2 }}>select: many</b> — items act as independent toggles; several can be active at once (e.g. Radar layers stacked together).</>
            : <><b style={{ color: C.fg2 }}>select: one</b> — items behave like radio buttons; turning one on turns the others off (e.g. one wind altitude at a time).</>}
        </Note>
      </div>

      <div>
        <SectionTitle count={node.items?.length || 0} action={
          <button onClick={() => { const ix = addItem(section, index); select(section, index, ix); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: C.accentText, background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <span style={{ width: 12, height: 12 }}>{ICONS.plus}</span>Add item
          </button>}>Items</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(node.items || []).map((it, itemIndex) => {
            const sc = (it.sublayers || []).length;
            const many = (node.select || 'many') === 'many';
            return (
              <button key={it.id || itemIndex} onClick={() => select(section, index, itemIndex)} className="nav-row" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 10, background: C.card, border: `1px solid ${C.bd}` }}>
                <span style={{ width: 16, height: 16, color: C.mut2, flexShrink: 0 }}>{many ? ICONS.checkbox : ICONS.radio}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{it.name || it.id || '(unnamed)'}</div>
                  <div style={{ fontSize: 11, color: C.mut2, fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>{it.id || '—'}</div>
                </div>
                {(it.sublayers || []).slice(0, 3).map((sl, i) => <TypeChip key={i} type={sl.type} mini />)}
                <span style={{ fontSize: 11, color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{sc} layer{sc === 1 ? '' : 's'}</span>
                <StatusPill s={nodeStatus(it)} quiet />
                <span style={{ width: 14, height: 14, color: C.mut2, flexShrink: 0 }}>{ICONS.chevron}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OverrideEditor({ node, index }: { node: Override; index: number }) {
  const subs = node.sublayers || [];
  const ordered = subs.map((s, i) => ({ s, i })).sort((a, b) => (a.s.zIndex ?? 0) - (b.s.zIndex ?? 0));
  const path: LeafPath = { section: 'overrides', index, itemIndex: null };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 11, padding: '12px 14px', borderRadius: 10, background: '#2e1620', border: '1px solid #5a2638' }}>
        <span style={{ width: 17, height: 17, color: '#ffb0c8', flexShrink: 0, marginTop: 1 }}>{ICONS.stack}</span>
        <div style={{ fontSize: 12, color: '#ffc4d4', lineHeight: 1.5 }}>
          This <b>overrides</b> the app-defined feature <b style={{ fontFamily: 'ui-monospace,monospace', color: '#fff' }}>{node.id || '…'}</b>. Its sublayers and stacking replace whatever the app ships, without touching the feature's name, icon or placement.
        </div>
      </div>

      <div>
        <SectionTitle>Target feature</SectionTitle>
        <Field label="Overrides feature id" hint="remote_config id">
          <TextInput
            mono
            list="override-target-keys"
            value={node.id}
            placeholder="e.g. aviation_obstacle"
            onInput={(e) => updateNodeField('overrides', index, { id: (e.target as HTMLInputElement).value } as any)}
          />
          <datalist id="override-target-keys">
            {overridableFeatures.map((f) => <option key={f.id} value={f.overridableRemoteId as string}>{f.displayName}</option>)}
          </datalist>
          {node.id ? (
            isRecognizedOverride(node.id) ? (
              <Note style={{ marginTop: 7, color: '#7ee2a8' }}>
                Recognized override — maps to built-in <b style={{ color: '#9be6c0' }}>{overridableFeatures.find((f) => f.overridableRemoteId === node.id)?.displayName}</b>.
              </Note>
            ) : (
              <Note style={{ marginTop: 7, color: '#ffd27a' }}>
                Not recognized by this app build — <b style={{ fontFamily: 'ui-monospace,monospace' }}>fromRemoteConfigId</b> maps only {recognizedOverrideIds.join(', ')}. Any other id is ignored, so the override won't apply.
              </Note>
            )
          ) : null}
        </Field>
      </div>

      {ordered.length > 0 && (
        <div>
          <SectionTitle>Stacking order <span style={{ fontWeight: 400, textTransform: 'none', color: C.mut2 }}>low → high zIndex</span></SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ordered.map(({ s }, k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderRadius: 7, background: C.inset, border: `1px solid ${C.bd}` }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.mut, width: 26, fontVariantNumeric: 'tabular-nums' }}>z{s.zIndex ?? 0}</span>
                <TypeChip type={s.type} mini />
                <span style={{ flex: 1, fontSize: 11, color: C.mut, fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortSource(s.source)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle count={subs.length}>Sublayers</SectionTitle>
        <SublayerList key={`overrides:${index}`} subs={subs} path={path} showZ />
      </div>
    </div>
  );
}

function JsonView({ raw }: { raw: unknown }) {
  return (
    <pre style={{ margin: 0, padding: 16, borderRadius: 10, background: C.inset, border: `1px solid ${C.bd}`, color: '#c6d0e0', fontSize: 12, lineHeight: 1.55, fontFamily: 'ui-monospace,monospace', overflowX: 'auto', whiteSpace: 'pre' }}>{JSON.stringify(raw, null, 2)}</pre>
  );
}

function EmptyInspector() {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: C.pageBg, borderRight: `1px solid ${C.bd2}` }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: C.card, border: `1px solid ${C.bd}`, display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: C.mut2 }}><span style={{ width: 26, height: 26 }}>{ICONS.layers}</span></div>
        <div style={{ fontSize: 14, color: C.fg2, marginBottom: 6 }}>Select a feature</div>
        <div style={{ fontSize: 12.5, color: C.mut, lineHeight: 1.5 }}>Pick a weather feature, general feature or override from the navigator to edit its layers, legend and stacking.</div>
      </div>
    </div>
  );
}

export default function Inspector({ selection }: { selection: Selection | null }) {
  const cfg = mapConfig.value;
  if (!selection) return <EmptyInspector />;

  const { section, index, itemIndex } = selection;
  const node = cfg[section][index] as Node | Override | undefined;
  if (!node) return <EmptyInspector />;

  const asNode = node as Node;
  const isGroup = Array.isArray(asNode.items);
  const editingItem = itemIndex != null && isGroup;
  const item = editingItem ? asNode.items![itemIndex!] : null;

  const target = item ?? node;
  const targetName = (target as any).name || target.id || (section === 'overrides' ? target.id : '');
  const status = nodeStatus(target as Node);
  const subCount = allSubs(target as Node).length;
  const badge = SECTION_BADGE[section];
  const parentName = editingItem ? (asNode.name || asNode.id) : null;

  let body: ComponentChildren;
  if (editorView.value === 'json') {
    body = <JsonView raw={target} />;
  } else if (editingItem && item) {
    const leaf: LeafData = { path: { section, index, itemIndex: itemIndex! }, id: item.id, name: item.name || '', legend: item.legend, sublayers: item.sublayers || [] };
    body = <LeafEditor leaf={leaf} />;
  } else if (isGroup && section !== 'overrides') {
    body = <GroupEditor node={asNode} index={index} section={section} />;
  } else if (section === 'overrides') {
    body = <OverrideEditor node={node as Override} index={index} />;
  } else {
    const leaf: LeafData = { path: { section, index, itemIndex: null }, id: asNode.id, name: asNode.name || '', legend: asNode.legend, sublayers: asNode.sublayers || [] };
    body = <LeafEditor leaf={leaf} />;
  }

  const onDelete = () => {
    if (editingItem) deleteItem(section, index, itemIndex!);
    else deleteNode(section, index);
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: C.pageBg, borderRight: `1px solid ${C.bd2}`, minHeight: 0 }}>
      <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: badge.fg, background: badge.bg, border: `1px solid ${badge.bd}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{badge.label}</span>
          {parentName && <span style={{ fontSize: 11.5, color: C.mut2 }}>in <b style={{ color: C.fg2 }}>{parentName}</b></span>}
          <div style={{ flex: 1 }} />
          <Segmented size="sm" value={editorView.value} onChange={(v) => editorView.value = v as 'form' | 'json'} options={[{ value: 'form', label: 'Form' }, { value: 'json', label: 'JSON' }]} />
          <button onClick={onDelete} title="Delete" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#ff8585', background: 'transparent', border: '1px solid #4a2228', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
            <span style={{ width: 13, height: 13 }}>{ICONS.trash}</span>Delete
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: C.fg, margin: 0 }}>{targetName || '(unnamed)'}</h1>
          <StatusPill s={status} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: C.mut2, fontVariantNumeric: 'tabular-nums' }}>{isGroup && !editingItem ? `${asNode.items!.length} items · ` : ''}{subCount} sublayer{subCount === 1 ? '' : 's'}</span>
        </div>
        <div style={{ fontSize: 11, color: C.mut2, fontFamily: 'ui-monospace,monospace' }}>{section}[].{target.id || '…'}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>{body}</div>
    </div>
  );
}
