import { effect, signal } from '@preact/signals';
import type { Legacy } from '../catalog/mapOptions';
import { mapConfig } from '../v2/store';
import { featureItemsById, featureTreeOf } from './options';

export const previewOpts = signal<Legacy>({});

effect(() => {
  const ids = featureItemsById(featureTreeOf(mapConfig.value));
  const mf = previewOpts.value.mapFeatures;
  if (!mf || typeof mf !== 'object') return;
  const stale = Object.keys(mf).filter((k) => !ids.has(k));
  if (!stale.length) return;
  const nextMf = { ...mf };
  for (const k of stale) delete nextMf[k];
  const next = { ...previewOpts.value };
  if (Object.keys(nextMf).length) next.mapFeatures = nextMf;
  else delete next.mapFeatures;
  previewOpts.value = next;
});
