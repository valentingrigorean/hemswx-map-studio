import { signal, computed } from '@preact/signals';
import { envKey, readScoped } from '../studio';

const ENVELOPE_KEY = 'hemswx-envelope-raw';
const MAP_LAYERS_KEY = 'map_layers';

export const envelopeRaw = signal<Record<string, any> | null>(loadStored());

export const hasEnvelope = computed(() => envelopeRaw.value !== null);

function loadStored(): Record<string, any> | null {
  try {
    const stored = readScoped(ENVELOPE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    if (envelopeRaw.value) {
      localStorage.setItem(envKey(ENVELOPE_KEY), JSON.stringify(envelopeRaw.value));
    } else {
      localStorage.removeItem(envKey(ENVELOPE_KEY));
    }
  } catch (error) {
    console.warn('Failed to persist envelope:', error);
  }
}

export function persistEnvelope() {
  persist();
}

export function reloadForEnv() {
  envelopeRaw.value = loadStored();
}

function isEnvelope(raw: any): boolean {
  return (
    !!raw &&
    typeof raw === 'object' &&
    !!raw[MAP_LAYERS_KEY] &&
    typeof raw[MAP_LAYERS_KEY] === 'object'
  );
}

export function splitDocument(raw: any): any {
  if (isEnvelope(raw)) {
    const { [MAP_LAYERS_KEY]: mapLayers, ...rest } = raw;
    envelopeRaw.value = rest;
    persist();
    return mapLayers;
  }
  envelopeRaw.value = null;
  persist();
  return raw;
}

export function composeDocument(mapLayers: any): any {
  if (!envelopeRaw.value) return mapLayers;
  return { ...envelopeRaw.value, [MAP_LAYERS_KEY]: mapLayers };
}

export function clearEnvelope() {
  envelopeRaw.value = null;
  persist();
}
