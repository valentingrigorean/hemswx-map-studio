import type { ComponentChildren, JSX } from 'preact';
import { C } from '../../lib/v2/core';

type BtnKind = 'primary' | 'ghost' | 'soft' | 'danger';

export function Btn({ children, onClick, kind = 'ghost', icon, disabled, title }: {
  children: ComponentChildren;
  onClick?: () => void;
  kind?: BtnKind;
  icon?: JSX.Element;
  disabled?: boolean;
  title?: string;
}) {
  const styles: Record<BtnKind, { bg: string; fg: string; bd: string }> = {
    primary: { bg: C.accent, fg: '#fff', bd: C.accent },
    ghost: { bg: 'transparent', fg: C.fg2, bd: C.bd },
    soft: { bg: C.card, fg: C.fg2, bd: C.bd },
    danger: { bg: 'transparent', fg: '#ff9e9e', bd: 'rgba(255,133,133,0.35)' },
  };
  const s = styles[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 9,
        fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ width: 14, height: 14 }}>{icon}</span>}{children}
    </button>
  );
}

export function Pill({ active, onClick, children, accent }: {
  active?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
  accent?: string;
}) {
  const a = accent || C.accent;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        background: active ? a : 'transparent', color: active ? '#fff' : C.fg2,
        border: `1px solid ${active ? a : C.line}`, transition: 'all .12s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onClick, accent }: { on?: boolean; onClick?: () => void; accent?: string }) {
  const a = accent || C.accent;
  return (
    <button
      onClick={onClick}
      style={{
        width: 38, height: 22, borderRadius: 999, flexShrink: 0, position: 'relative', cursor: 'pointer',
        background: on ? a : '#2a3146', border: 'none', transition: 'background .15s',
      }}
    >
      <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}
