import { signal } from '@preact/signals';

export type StudioNav = 'workspace' | 'basemaps' | 'preview' | 'settings';
export type Env = 'dev' | 'prod';
export type SectionTab = 'editor' | 'json';

const ENV_KEY = 'hemswx-studio-env';

export const ENVS: Env[] = ['dev', 'prod'];

export const ENV_DOMAIN: Record<Env, string> = {
  dev: 'config.dev.hemswx.no',
  prod: 'config.hemswx.no',
};

export const ENV_COLOR: Record<Env, string> = {
  dev: '#7ee2a8',
  prod: '#ff8585',
};

function loadEnv(): Env {
  try {
    const v = localStorage.getItem(ENV_KEY);
    if (v === 'dev' || v === 'prod') return v;
  } catch {}
  return 'dev';
}

export const env = signal<Env>(loadEnv());

export function setEnv(e: Env) {
  env.value = e;
  try {
    localStorage.setItem(ENV_KEY, e);
  } catch {}
}

export function envKeyFor(base: string, e: Env): string {
  return `${base}:${e}`;
}

export function envKey(base: string): string {
  return envKeyFor(base, env.value);
}

export function readScopedFor(base: string, e: Env): string | null {
  try {
    const scoped = localStorage.getItem(envKeyFor(base, e));
    if (scoped !== null) return scoped;
    if (e === 'dev') return localStorage.getItem(base);
  } catch {}
  return null;
}

export function readScoped(base: string): string | null {
  return readScopedFor(base, env.value);
}

export function scopedHas(base: string, e: Env): boolean {
  try {
    if (localStorage.getItem(envKeyFor(base, e)) !== null) return true;
    if (e === 'dev') return localStorage.getItem(base) !== null;
  } catch {}
  return false;
}

export const activeNav = signal<StudioNav>('workspace');

export const layersTab = signal<SectionTab>('editor');
