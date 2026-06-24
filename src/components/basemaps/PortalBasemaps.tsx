import { useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { C } from '../../lib/v2/core';
import {
  PORTAL_HOST,
  arcgisItemUrl,
  baseLayersLabel,
  parseTags,
  statusOf,
} from '../../lib/basemaps/portal';
import type { BasemapStatus, PortalBasemap } from '../../lib/basemaps/portal';
import {
  authPhase,
  cancelSignIn,
  connection,
  init,
  items,
  lastSync,
  portalInfo,
  query,
  refresh,
  selectedId,
  signOut,
  view,
} from '../../lib/basemaps/store';
import { PORTAL_URL } from '../../lib/arcgis';
import { ICONS } from '../editor/Icons';
import { MapThumb } from '../editor/primitives';

const STATUS_CFG: Record<BasemapStatus, { label: string; dot: string; fg: string; bg: string; bd: string; note: string }> = {
  ok: { label: 'OK', dot: '#2ecc71', fg: '#7ee2a8', bg: '#11331f', bd: '#1d5235', note: 'Spatial reference readable. Shown in app.' },
  warn: { label: 'WARN', dot: '#ffb020', fg: '#ffd27a', bg: '#2e2815', bd: '#5a4a1c', note: 'Spatial reference could not be read from the item JSON. The offline filter may misbehave.' },
  draft: { label: 'DRAFT', dot: '#b48bff', fg: '#cdb6ff', bg: '#221a36', bd: '#3d2f63', note: 'Tagged env:test. Hidden in production, dev/test builds only.' },
};

function statusFor(bm: PortalBasemap): BasemapStatus {
  return statusOf(parseTags(bm.tags), bm.wkid);
}

function StatusPill({ s }: { s: BasemapStatus }) {
  const cfg = STATUS_CFG[s];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px 2px 6px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.bd}` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: cfg.dot }} />{cfg.label}
    </span>
  );
}

function Thumb({ bm, style }: { bm: { id: string; thumbnailUrl: string | null }; style?: any }) {
  if (bm.thumbnailUrl) return <img src={bm.thumbnailUrl} alt="" style={{ objectFit: 'cover', ...style }} />;
  return <MapThumb id={bm.id} style={style} />;
}

function BasemapCard({ bm }: { bm: PortalBasemap }) {
  const s = statusFor(bm);
  const selected = selectedId.value === bm.id;
  return (
    <button onClick={() => (selectedId.value = bm.id)} className="bm-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', cursor: 'pointer', padding: 0, borderRadius: 10, overflow: 'hidden', position: 'relative', background: selected ? '#141a2b' : '#12141c', border: `1px solid ${selected ? C.accent : C.bd}`, boxShadow: selected ? `0 0 0 1px ${C.accent}, 0 8px 24px -10px rgba(58,92,255,0.5)` : 'none' }}>
      <div style={{ position: 'relative', height: 92 }}>
        <Thumb bm={bm} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,17,21,0) 55%, rgba(15,17,21,0.55))' }} />
        <div style={{ position: 'absolute', top: 7, left: 7 }}><StatusPill s={s} /></div>
      </div>
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, lineHeight: 1.2 }}>{bm.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 11, color: C.mut, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bm.owner}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.mut2, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{bm.wkid ? `wkid ${bm.wkid}` : 'SR ?'}</span>
        </div>
      </div>
    </button>
  );
}

function BasemapRow({ bm }: { bm: PortalBasemap }) {
  const s = statusFor(bm);
  const selected = selectedId.value === bm.id;
  return (
    <button onClick={() => (selectedId.value = bm.id)} className="nav-row" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '7px 10px', borderRadius: 8, background: selected ? '#141a2b' : 'transparent', border: `1px solid ${selected ? C.accent : 'transparent'}` }}>
      <Thumb bm={bm} style={{ width: 52, height: 36, borderRadius: 6, flexShrink: 0, border: `1px solid ${C.bd}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bm.title}</div>
        <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{bm.owner} · {bm.wkid ? `wkid ${bm.wkid}` : 'SR ?'}</div>
      </div>
      <StatusPill s={s} />
    </button>
  );
}

function Inspector({ bm }: { bm: PortalBasemap }) {
  const s = statusFor(bm);
  const scfg = STATUS_CFG[s];
  return (
    <div style={{ width: 388, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', background: C.pageBg, borderLeft: `1px solid ${C.bd}` }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: C.fg, margin: 0 }}>{bm.title}</h2>
            <StatusPill s={s} />
          </div>
          <div style={{ fontSize: 11, color: C.mut2, marginTop: 3, fontFamily: 'ui-monospace,monospace' }}>item {bm.id}</div>
        </div>
        <button onClick={() => (selectedId.value = null)} style={{ width: 26, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', color: C.fg3, background: 'transparent', border: `1px solid ${C.bd}`, cursor: 'pointer', flexShrink: 0 }}><span style={{ width: 14, height: 14 }}>{ICONS.close}</span></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.bd}` }}>
          <Thumb bm={bm} style={{ width: '100%', height: 150 }} />
          <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10.5, fontWeight: 600, color: '#cfd6e2', background: 'rgba(11,13,18,0.75)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#2ecc71' }} />Portal thumbnail · {PORTAL_HOST}
          </div>
        </div>
        {bm.snippet && <div style={{ fontSize: 12, color: '#8b94a6', lineHeight: 1.5 }}>{bm.snippet}</div>}

        <div style={{ display: 'flex', gap: 9, padding: '9px 11px', borderRadius: 8, background: scfg.bg, border: `1px solid ${scfg.bd}` }}>
          <span style={{ width: 15, height: 15, color: scfg.dot, flexShrink: 0, marginTop: 1 }}>{s === 'ok' ? ICONS.check : s === 'warn' ? ICONS.alert : ICONS.moon}</span>
          <div style={{ fontSize: 11.5, color: scfg.fg, lineHeight: 1.45 }}>{scfg.note}</div>
        </div>

        <div style={{ borderRadius: 8, border: `1px solid ${C.bd}`, overflow: 'hidden' }}>
          {([['Owner', bm.owner], ['Modified', bm.modified], ['Spatial ref', bm.wkid ? `wkid ${bm.wkid}` : 'unreadable'], ['Base layers', bm.baseLayerCount ? `${baseLayersLabel(bm.baseLayerTypes)} · ${bm.baseLayerCount}` : '—'], ['Item type', 'Web Map']] as [string, string][]).map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 11px', fontSize: 12, background: i % 2 ? C.pageBg : C.card, borderTop: i ? `1px solid ${C.bd2}` : 'none' }}>
              <span style={{ color: C.mut }}>{k}</span>
              <span style={{ color: v === 'unreadable' ? '#ffd27a' : '#cfd6e2', fontFamily: k === 'Spatial ref' || k === 'Modified' ? 'ui-monospace,monospace' : 'inherit' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '11px 14px', borderTop: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href={arcgisItemUrl(bm.id)} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: C.accentText, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <span style={{ width: 14, height: 14 }}>{ICONS.ext}</span>Open in ArcGIS
        </a>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: C.mut2, fontWeight: 600 }}>Read-only</span>
      </div>
    </div>
  );
}

function CenterCard({ children }: { children: ComponentChildren }) {
  return <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 32 }}><div style={{ width: 420, maxWidth: '100%', textAlign: 'center' }}>{children}</div></div>;
}

function ConnectScreen() {
  return (
    <CenterCard>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: C.card, border: `1px solid ${C.bd}`, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: C.accentText }}><span style={{ width: 30, height: 30 }}>{ICONS.cloud}</span></div>
      <h2 style={{ fontSize: 19, fontWeight: 600, color: C.fg, marginBottom: 8 }}>Connect to SNLA Portal</h2>
      <p style={{ fontSize: 13, color: '#8b94a6', lineHeight: 1.55, marginBottom: 6 }}>
        Sign in to browse all Web Maps your account can access on ArcGIS Online. This view is read-only — nothing is written back to the portal.
      </p>
      <p style={{ fontSize: 12, color: C.mut2, fontFamily: 'ui-monospace,monospace', marginBottom: 22 }}>{PORTAL_HOST}</p>
      <button onClick={() => refresh()} style={{ width: '100%', height: 44, borderRadius: 10, background: C.accent, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>Sign in with ArcGIS</button>
    </CenterCard>
  );
}

function ErrorScreen() {
  return (
    <CenterCard>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: '#34161a', border: '1px solid #5a2228', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: '#ff7676' }}><span style={{ width: 30, height: 30 }}>{ICONS.alert}</span></div>
      <h2 style={{ fontSize: 19, fontWeight: 600, color: C.fg, marginBottom: 8 }}>Couldn't reach the portal</h2>
      <p style={{ fontSize: 13, color: '#8b94a6', lineHeight: 1.55, marginBottom: 22 }}>
        Request to <span style={{ fontFamily: 'ui-monospace,monospace', color: C.fg2 }}>{PORTAL_HOST}</span> failed, or you're not signed in.
      </p>
      <button onClick={() => refresh()} style={{ height: 42, padding: '0 22px', borderRadius: 10, background: '#171923', color: C.fg, border: `1px solid ${C.line}`, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 15, height: 15 }}>{ICONS.refresh}</span>Retry
      </button>
    </CenterCard>
  );
}

function AuthWaitingScreen() {
  const origin = typeof window !== 'undefined' ? window.location.origin + import.meta.env.BASE_URL : '';
  const callbackUrl = origin.endsWith('/') ? `${origin}oauth-callback.html` : `${origin}/oauth-callback.html`;
  return (
    <CenterCard>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: C.card, border: `1px solid ${C.bd}`, display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
        <span className="bm-spin" style={{ width: 26, height: 26, borderRadius: 999, border: '3px solid #2a3a8f', borderTopColor: C.accentText }} />
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 600, color: C.fg, marginBottom: 8 }}>Waiting for ArcGIS sign-in…</h2>
      <p style={{ fontSize: 13, color: '#8b94a6', lineHeight: 1.55, marginBottom: 14 }}>
        A sign-in window should have opened. If you don't see it, your browser likely <b style={{ color: C.fg2 }}>blocked the pop-up</b> — allow pop-ups for this site and retry.
      </p>
      <div style={{ fontSize: 11, color: C.mut2, lineHeight: 1.5, marginBottom: 22, padding: '9px 11px', borderRadius: 8, background: C.inset, border: `1px solid ${C.bd}` }}>
        If the window opens but ArcGIS shows an error, this redirect URI must be registered on the OAuth app ({PORTAL_URL}):
        <div style={{ fontFamily: 'ui-monospace,monospace', color: C.fg2, marginTop: 5, wordBreak: 'break-all' }}>{callbackUrl}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => refresh()} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: C.accent, color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        <button onClick={cancelSignIn} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: 'transparent', color: C.fg2, border: `1px solid ${C.line}`, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      </div>
    </CenterCard>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.bd2}`, background: C.card }}>
      <div className="bm-shimmer" style={{ height: 92 }} />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="bm-shimmer" style={{ height: 12, width: '70%', borderRadius: 4 }} />
        <div className="bm-shimmer" style={{ height: 10, width: '40%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

function ConnStrip() {
  const connecting = connection.value === 'connecting';
  const initials = (portalInfo.value.fullName || portalInfo.value.username || '?')
    .split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 16px', borderBottom: `1px solid ${C.bd2}`, background: C.panelBg, flexShrink: 0 }}>
      <span style={{ width: 15, height: 15, color: connecting ? '#ffb020' : '#2ecc71' }}>{ICONS.cloud}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.fg, fontFamily: 'ui-monospace,monospace' }}>{PORTAL_HOST}</span>
      {!connecting && <span style={{ fontSize: 11.5, color: C.mut }}>{items.value.length} Web Maps</span>}
      <div style={{ flex: 1 }} />
      {connecting ? (
        <span style={{ fontSize: 11.5, color: '#ffb020', display: 'inline-flex', alignItems: 'center', gap: 7 }}><span className="bm-spin" style={{ width: 12, height: 12, borderRadius: 999, border: '2px solid #4a3f1c', borderTopColor: '#ffb020' }} />Loading…</span>
      ) : (
        <>
          {lastSync.value && <span style={{ fontSize: 11, color: C.mut2 }}>synced {lastSync.value}</span>}
          <button onClick={() => refresh()} title="Refresh" style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color: C.fg3, background: 'transparent', border: `1px solid ${C.bd}`, cursor: 'pointer' }}><span style={{ width: 14, height: 14 }}>{ICONS.refresh}</span></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6, marginLeft: 2, borderLeft: `1px solid ${C.bd}` }}>
            <div style={{ width: 24, height: 24, borderRadius: 999, background: '#2a3146', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#cfd6e2' }}>{initials}</div>
            <span style={{ fontSize: 11.5, color: C.fg2 }}>{portalInfo.value.username || 'signed in'}</span>
            <button onClick={signOut} style={{ fontSize: 11.5, color: C.mut, background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
          </div>
        </>
      )}
    </div>
  );
}

const GRID_STYLE: any = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px,1fr))', gap: 12 };

export default function PortalBasemaps() {
  useEffect(() => {
    if (connection.value === 'idle') init();
  }, []);

  const conn = connection.value;

  let body: ComponentChildren;
  if (conn === 'idle') {
    body = <ConnectScreen />;
  } else if (conn === 'error') {
    body = <ErrorScreen />;
  } else if (conn === 'connecting' && authPhase.value === 'authenticating') {
    body = <AuthWaitingScreen />;
  } else {
    const connecting = conn === 'connecting';

    let list = items.value.slice();
    if (query.value.trim()) {
      const q = query.value.toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q));
    }
    list = list.sort((a, b) => a.title.localeCompare(b.title));

    const sel = items.value.find((b) => b.id === selectedId.value) || null;

    body = (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ConnStrip />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${C.bd2}`, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: C.mut }}>{list.length} basemap{list.length === 1 ? '' : 's'}</span>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 9, width: 13, height: 13, color: C.mut2 }}>{ICONS.search}</span>
            <input value={query.value} onInput={(e) => (query.value = (e.target as HTMLInputElement).value)} placeholder="Search…" style={{ height: 30, width: 180, padding: '0 10px 0 28px', borderRadius: 8, background: C.inset, color: C.fg, border: `1px solid ${C.bd}`, fontSize: 12.5 }} />
          </div>
          <div style={{ display: 'flex', border: `1px solid ${C.bd}`, borderRadius: 8, overflow: 'hidden' }}>
            {([['grid', ICONS.grid], ['list', ICONS.list]] as const).map(([k, ic]) => (
              <button key={k} onClick={() => (view.value = k)} style={{ width: 32, height: 30, display: 'grid', placeItems: 'center', cursor: 'pointer', background: view.value === k ? '#171c2b' : 'transparent', color: view.value === k ? C.accentText : C.mut2, border: 'none' }}><span style={{ width: 15, height: 15 }}>{ic}</span></button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, minWidth: 0 }}>
            {connecting ? (
              <div style={GRID_STYLE}>{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : conn === 'empty' || list.length === 0 ? (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', color: C.mut2 }}>
                <div>
                  <div style={{ fontSize: 14, color: '#8b94a6', marginBottom: 6 }}>{conn === 'empty' ? 'No Web Maps found for this account' : 'No basemaps match'}</div>
                  <div style={{ fontSize: 12 }}>{conn === 'empty' ? 'This account has no Web Maps it can access.' : 'Clear the search to see all basemaps.'}</div>
                </div>
              </div>
            ) : view.value === 'grid' ? (
              <div style={GRID_STYLE}>{list.map((b) => <BasemapCard key={b.id} bm={b} />)}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{list.map((b) => <BasemapRow key={b.id} bm={b} />)}</div>
            )}
          </div>
          {sel && !connecting && <Inspector key={sel.id} bm={sel} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, background: C.pageBg, position: 'relative' }}>
      {body}
    </div>
  );
}
