import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { C } from '../../lib/v2/core';
import { ICONS } from '../editor/Icons';
import { SICONS } from './icons';
import { type StudioNav } from '../../lib/studio';

function RailItem({ icon, label, active, badge, onClick }: {
  icon: JSX.Element;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
        background: active ? 'rgba(58,92,255,0.14)' : hov ? '#12141c' : 'transparent',
        border: `1px solid ${active ? '#2a3a8f' : 'transparent'}`,
        color: active ? C.fg : C.fg2, textAlign: 'left', transition: 'background .12s',
      }}
    >
      <span style={{ width: 19, height: 19, color: active ? C.accentText : C.mut, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
      {badge != null && (
        <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? C.accentText : C.mut2, fontVariantNumeric: 'tabular-nums' }}>{badge}</span>
      )}
    </button>
  );
}

const RAIL_W = 198;

export default function Rail({ active, onNav, counts }: {
  active: StudioNav;
  onNav: (n: StudioNav) => void;
  counts: { layers?: number; basemaps?: number };
}) {
  const nav: { key: StudioNav; icon: JSX.Element; label: string; badge?: number }[] = [
    { key: 'workspace', icon: ICONS.layers, label: 'Layers', badge: counts.layers },
    { key: 'basemaps', icon: ICONS.map, label: 'Basemaps', badge: counts.basemaps },
    { key: 'preview', icon: SICONS.eye, label: 'Preview' },
  ];

  return (
    <div style={{ width: RAIL_W, background: C.railBg, borderRight: `1px solid ${C.bd2}`, display: 'flex', flexDirection: 'column', padding: '12px 10px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 14px' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>H</div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.fg }}>Map Studio</div>
          <div style={{ fontSize: 10, color: C.mut2, fontWeight: 600, letterSpacing: 0.3 }}>HemsWX · config</div>
        </div>
      </div>

      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.7, color: C.faint, textTransform: 'uppercase', padding: '6px 10px' }}>Manage</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((n) => (
          <RailItem key={n.key} icon={n.icon} label={n.label} badge={n.badge} active={active === n.key} onClick={() => onNav(n.key)} />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 999, background: '#2a3146', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700, color: '#cfd6e2', flexShrink: 0 }}>VG</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: C.fg2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Valentin G.</div>
          <div style={{ fontSize: 10, color: C.mut2 }}>Config admin</div>
        </div>
        <button
          onClick={() => onNav('settings')}
          title="Settings"
          style={{
            width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
            color: active === 'settings' ? C.accentText : C.mut,
            background: active === 'settings' ? 'rgba(58,92,255,0.12)' : 'transparent',
            border: `1px solid ${active === 'settings' ? '#2a3a8f' : C.bd}`,
          }}
        >
          <span style={{ width: 15, height: 15 }}>{ICONS.gear}</span>
        </button>
      </div>
    </div>
  );
}
