import type { ComponentChildren, JSX } from 'preact';
import { C, LAYER_TYPES, STATUS, legendKind } from '../../lib/v2/core';
import type { Legend, NodeStatus } from '../../lib/v2/types';
import { ICONS } from './Icons';

export function StatusPill({ s, quiet }: { s: NodeStatus; quiet?: boolean }) {
  const cfg = STATUS[s];
  if (quiet) {
    return <span title={cfg.label} style={{ width: 8, height: 8, borderRadius: 999, background: cfg.dot, flexShrink: 0 }} />;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px 2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.bd}`, flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: cfg.dot }} />{cfg.label}
    </span>
  );
}

export function TypeChip({ type, mini }: { type: string; mini?: boolean }) {
  const m = LAYER_TYPES[type] || { short: (type || '?').toUpperCase(), fg: '#aeb8c8', bg: '#171a22', bd: '#2a3146' };
  return (
    <span style={{ fontSize: mini ? 9.5 : 10, fontWeight: 700, letterSpacing: 0.3, color: m.fg, background: m.bg, border: `1px solid ${m.bd}`, padding: mini ? '1px 5px' : '2px 7px', borderRadius: 5, fontFamily: 'ui-monospace,monospace', flexShrink: 0 }}>{m.short}</span>
  );
}

const PROV_BADGE: Record<string, [string, string, string, string]> = {
  builtin: ['BUILT-IN', '#9fb0cc', '#161b27', '#2a3346'],
  remote: ['REMOTE', '#7ee2d0', '#0e2a28', '#1c4a45'],
  overridden: ['OVERRIDDEN', '#cdb6ff', '#221a36', '#3d2f63'],
};

export function ProvBadge({ kind }: { kind: 'builtin' | 'remote' | 'overridden' }) {
  const [lab, fg, bg, bd] = PROV_BADGE[kind] ?? PROV_BADGE.builtin;
  return (
    <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.4, color: fg, background: bg, border: `1px solid ${bd}`, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>{lab}</span>
  );
}

export function SelectBadge({ select }: { select: 'one' | 'many' | null }) {
  if (!select) return null;
  const many = select === 'many';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, color: many ? '#9fd0ff' : '#cdb6ff', background: many ? '#101a30' : '#1c1633', border: `1px solid ${many ? '#23375e' : '#392c5e'}`, padding: '1px 6px 1px 4px', borderRadius: 5, flexShrink: 0 }}>
      <span style={{ width: 11, height: 11 }}>{many ? ICONS.checkbox : ICONS.radio}</span>{many ? 'MANY' : 'ONE'}
    </span>
  );
}

export function LegendDot({ legend }: { legend: Legend | undefined }) {
  const k = legendKind(legend);
  if (k === 'none') return null;
  const map: Record<string, [string, JSX.Element]> = {
    auto: ['#7ee2a8', ICONS.auto],
    url: ['#9fd0ff', ICONS.image],
    text: ['#ffcf8a', ICONS.text],
    image: ['#9fd0ff', ICONS.image],
  };
  const [col, ic] = map[k];
  return <span title={`legend: ${k}`} style={{ width: 13, height: 13, color: col, opacity: 0.85, flexShrink: 0 }}>{ic}</span>;
}

export type SegOption = string | { value: string; label?: string; icon?: JSX.Element; iconColor?: string };

export function Segmented({ value, options, onChange, size = 'md' }: {
  value: string;
  options: SegOption[];
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
}) {
  const pad = size === 'sm' ? '4px 9px' : '6px 12px';
  const fs = size === 'sm' ? 11.5 : 12.5;
  return (
    <div style={{ display: 'inline-flex', background: C.inset, border: `1px solid ${C.bd}`, borderRadius: 9, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const on = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad, borderRadius: 7, fontSize: fs, fontWeight: 600, cursor: 'pointer', background: on ? C.cardHi : 'transparent', color: on ? C.fg : C.mut, border: `1px solid ${on ? C.bdHi : 'transparent'}`, transition: 'all .12s', whiteSpace: 'nowrap' }}>
            {opt.icon && <span style={{ width: 14, height: 14, color: on ? (opt.iconColor || C.accentText) : C.mut2 }}>{opt.icon}</span>}{opt.label ?? opt.value}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ComponentChildren }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.fg3, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
        {label}{hint && <span style={{ fontWeight: 400, color: C.mut2, fontFamily: 'ui-monospace,monospace' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export const inputStyle: JSX.CSSProperties = {
  width: '100%', height: 34, padding: '0 11px', borderRadius: 9, background: C.inset, color: C.fg,
  border: `1px solid ${C.bd}`, fontSize: 13, boxSizing: 'border-box',
};

export function TextInput({ mono, style, ...props }: JSX.IntrinsicElements['input'] & { mono?: boolean }) {
  return <input {...props} style={{ ...inputStyle, fontFamily: mono ? 'ui-monospace,monospace' : 'inherit', ...((style as JSX.CSSProperties) || {}) }} />;
}

export function Note({ children, style }: { children: ComponentChildren; style?: JSX.CSSProperties }) {
  return <div style={{ fontSize: 11.5, color: C.mut, lineHeight: 1.5, ...style }}>{children}</div>;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < (s || '').length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function MapThumb({ id, style, className }: { id: string; style?: JSX.CSSProperties; className?: string }) {
  const seed = hashStr(id || 'x');
  const p = (n: number) => 8 + (Math.floor(seed / Math.pow(7, n)) % 84);
  const water = '#aec6d6', land = '#e8e5d7', accent = '#cdd9d0';
  const grid = 'rgba(40,55,50,0.06)';
  const bg = [
    `repeating-linear-gradient(0deg, ${grid} 0 1px, transparent 1px 15px)`,
    `repeating-linear-gradient(90deg, ${grid} 0 1px, transparent 1px 15px)`,
    `radial-gradient(40% 48% at ${p(1)}% ${p(2)}%, ${land} 0%, ${land} 60%, transparent 72%)`,
    `radial-gradient(30% 40% at ${p(3)}% ${p(4)}%, ${accent} 0%, ${accent} 55%, transparent 70%)`,
    `radial-gradient(26% 30% at ${p(2)}% ${p(5)}%, ${land} 0%, ${land} 55%, transparent 72%)`,
    `linear-gradient(160deg, ${water}, ${water})`,
  ].join(',');
  return <div className={className} style={{ background: bg, backgroundColor: water, ...style }} />;
}
