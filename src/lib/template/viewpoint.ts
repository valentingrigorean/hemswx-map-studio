export interface Envelope {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

const num = (v: any): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};

function fromParts(xmin: any, ymin: any, xmax: any, ymax: any): Envelope | null {
  const x0 = num(xmin); const y0 = num(ymin); const x1 = num(xmax); const y1 = num(ymax);
  if (x0 == null || y0 == null || x1 == null || y1 == null) return null;
  return { xmin: x0, ymin: y0, xmax: x1, ymax: y1 };
}

export function parseEnvelope(value: any): Envelope | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    try { return parseEnvelope(JSON.parse(value)); } catch { return null; }
  }
  if (typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    return value.length >= 4 ? fromParts(value[0], value[1], value[2], value[3]) : null;
  }
  const arcgis = fromParts(
    value.xmin ?? value.xMin, value.ymin ?? value.yMin,
    value.xmax ?? value.xMax, value.ymax ?? value.yMax,
  );
  if (arcgis) return arcgis;
  if (Array.isArray(value.bbox) && value.bbox.length >= 4) {
    return fromParts(value.bbox[0], value.bbox[1], value.bbox[2], value.bbox[3]);
  }
  if (value.type === 'Polygon' && Array.isArray(value.coordinates)) {
    const pts = (value.coordinates as any[]).flat(1).filter((p) => Array.isArray(p) && p.length >= 2);
    const xs = pts.map((p) => num(p[0])).filter((n): n is number => n != null);
    const ys = pts.map((p) => num(p[1])).filter((n): n is number => n != null);
    if (xs.length < 3) return null;
    return { xmin: Math.min(...xs), ymin: Math.min(...ys), xmax: Math.max(...xs), ymax: Math.max(...ys) };
  }
  return null;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function serializeEnvelope(env: Envelope): Record<string, number> {
  return { xmin: round(env.xmin), ymin: round(env.ymin), xmax: round(env.xmax), ymax: round(env.ymax) };
}

export function fmtEnvelope(env: Envelope): string {
  const f = (n: number) => round(n).toFixed(2).replace(/\.?0+$/, '').replace(/^(-?\d+)$/, '$1.0');
  return `${f(env.xmin)}, ${f(env.ymin)} → ${f(env.xmax)}, ${f(env.ymax)}`;
}

export const VIEWPOINT_PRESETS: { id: string; label: string; env: Envelope }[] = [
  { id: 'no', label: 'Norway', env: { xmin: 4.0, ymin: 57.8, xmax: 18.8, ymax: 71.0 } },
  { id: 'south', label: 'South Norway', env: { xmin: 4.5, ymin: 58.0, xmax: 12.6, ymax: 62.6 } },
  { id: 'west', label: 'West coast', env: { xmin: 4.0, ymin: 58.4, xmax: 8.2, ymax: 63.0 } },
  { id: 'oslo', label: 'Oslo region', env: { xmin: 9.4, ymin: 59.3, xmax: 11.9, ymax: 60.7 } },
  { id: 'mid', label: 'Mid Norway', env: { xmin: 6.8, ymin: 62.0, xmax: 14.2, ymax: 66.2 } },
  { id: 'north', label: 'North Norway', env: { xmin: 12.0, ymin: 65.8, xmax: 20.2, ymax: 71.2 } },
];
