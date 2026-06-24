import type { ComponentChildren } from 'preact';
import { C } from '../../lib/v2/core';
import type { SectionTab } from '../../lib/studio';

export interface TopBarTab {
  key: SectionTab;
  label: string;
}

export default function TopBar({ title, sub, tabs, tab, onTab, right }: {
  title: string;
  sub?: string;
  tabs?: TopBarTab[];
  tab?: SectionTab;
  onTab?: (t: SectionTab) => void;
  right?: ComponentChildren;
}) {
  return (
    <div style={{ minHeight: 52, borderBottom: `1px solid ${C.bd2}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', flexShrink: 0, background: C.panelBg }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: C.fg, margin: 0 }}>{title}</h1>
          {sub && <span style={{ fontSize: 11.5, color: C.mut2, whiteSpace: 'nowrap' }}>{sub}</span>}
        </div>
      </div>

      {tabs && tab && onTab && (
        <div style={{ display: 'inline-flex', background: C.inset, border: `1px solid ${C.bd}`, borderRadius: 9, padding: 2, gap: 2, marginLeft: 4 }}>
          {tabs.map((tb) => {
            const on = tb.key === tab;
            return (
              <button
                key={tb.key}
                onClick={() => onTab(tb.key)}
                style={{
                  padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: on ? C.cardHi : 'transparent', color: on ? C.fg : C.mut, border: `1px solid ${on ? C.bdHi : 'transparent'}`,
                }}
              >
                {tb.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {right}
    </div>
  );
}
