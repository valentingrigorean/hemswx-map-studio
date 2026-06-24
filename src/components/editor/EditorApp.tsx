import { C } from '../../lib/v2/core';
import { mapConfig, previewOpen, selection, setPreviewOpen, tree } from '../../lib/v2/store';
import type { Legend, Section, Sublayer } from '../../lib/v2/types';
import Navigator from './Navigator';
import Inspector from './Inspector';
import PreviewPanel from './PreviewPanel';
import AddLayerDialog from './AddLayerDialog';

const NAV_WIDTH = 320;

interface PreviewTarget {
  subs: Sublayer[];
  name: string;
  legend: Legend | undefined;
  section: Section | null;
}

function previewTarget(): PreviewTarget {
  const sel = selection.value;
  if (!sel) return { subs: [], name: '', legend: undefined, section: null };
  const node: any = mapConfig.value[sel.section][sel.index];
  if (!node) return { subs: [], name: '', legend: undefined, section: null };
  if (sel.itemIndex != null && node.items) {
    const it = node.items[sel.itemIndex];
    if (it) return { subs: it.sublayers || [], name: it.name || it.id, legend: it.legend, section: sel.section };
  }
  if (node.items) {
    return { subs: node.items.flatMap((i: any) => i.sublayers || []), name: node.name || node.id, legend: node.legend, section: sel.section };
  }
  return { subs: node.sublayers || [], name: node.name || node.id, legend: node.legend, section: sel.section };
}

export default function EditorApp() {
  const t = tree.value;
  const sel = selection.value;
  const pt = previewTarget();

  return (
    <div style={{ height: '100%', display: 'flex', minHeight: 0, background: C.pageBg }}>
      <div style={{ width: NAV_WIDTH, flexShrink: 0 }}>
        <Navigator tree={t} selection={sel} />
      </div>
      <Inspector selection={sel} />
      <PreviewPanel
        subs={pt.subs}
        name={pt.name}
        legend={pt.legend}
        section={pt.section}
        open={previewOpen.value}
        setOpen={setPreviewOpen}
      />
      <AddLayerDialog />
    </div>
  );
}
