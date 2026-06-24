import { signal, computed } from '@preact/signals';
import { envKey, readScoped } from '../studio';
import {
  type AppConfiguration,
  type RemoteAppConfiguration,
  type TemplateConfigurationResponse,
  defaultAppConfiguration,
} from './types';
import { clearToggle, setOpacity, setToggle, type LegacyLoc } from '../catalog/mapOptions';

export const TEMPLATES_KEY = 'hemswx-templates';

export const templatesDoc = signal<TemplateConfigurationResponse | null>(loadStored());
export const selectedTemplateId = signal<number | null>(firstId(templatesDoc.value));

export const templates = computed<RemoteAppConfiguration[]>(
  () => templatesDoc.value?.templates.group ?? []
);

export const templateCount = computed(() => templates.value.length);

export const selectedTemplate = computed<RemoteAppConfiguration | null>(() => {
  const id = selectedTemplateId.value;
  if (id == null) return null;
  return templates.value.find((t) => t.id === id) ?? null;
});

function firstId(doc: TemplateConfigurationResponse | null): number | null {
  return doc?.templates.group[0]?.id ?? null;
}

function loadStored(): TemplateConfigurationResponse | null {
  try {
    const stored = readScoped(TEMPLATES_KEY);
    return stored ? normalize(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

function persist() {
  clearTimeout(persistTimer);
  persistTimer = undefined;
  try {
    if (templatesDoc.value) {
      localStorage.setItem(envKey(TEMPLATES_KEY), JSON.stringify(templatesDoc.value));
    } else {
      localStorage.removeItem(envKey(TEMPLATES_KEY));
    }
  } catch (error) {
    console.warn('Failed to persist templates:', error);
  }
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;
function persistSoon() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 400);
}

export function reloadForEnv() {
  templatesDoc.value = loadStored();
  selectedTemplateId.value = firstId(templatesDoc.value);
}

export function persistTemplates() {
  persist();
}

export function normalize(raw: any): TemplateConfigurationResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  let group: any;
  if (Array.isArray(raw)) group = raw;
  else if (Array.isArray(raw.group)) group = raw.group;
  else if (raw.templates && Array.isArray(raw.templates.group)) group = raw.templates.group;
  else return null;
  const clean = group
    .filter((t: any) => t && typeof t === 'object')
    .map(({ edit: _edit, ...t }: any) => t);
  return { templates: { group: clean } };
}

export function loadTemplatesRaw(raw: any): boolean {
  const doc = normalize(raw);
  if (!doc) return false;
  templatesDoc.value = doc;
  selectedTemplateId.value = firstId(doc);
  persist();
  return true;
}

export function clearTemplates() {
  templatesDoc.value = { templates: { group: [] } };
  selectedTemplateId.value = null;
  persist();
}

export function editTemplatesDoc(raw: any): boolean {
  const doc = normalize(raw);
  if (!doc) return false;
  templatesDoc.value = doc;
  if (selectedTemplateId.value == null || !doc.templates.group.some((t) => t.id === selectedTemplateId.value)) {
    selectedTemplateId.value = firstId(doc);
  }
  persist();
  return true;
}

function commit(group: RemoteAppConfiguration[]) {
  templatesDoc.value = { templates: { group } };
  persistSoon();
}

function nextId(group: RemoteAppConfiguration[]): number {
  return group.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

export function addTemplate(): number {
  const group = [...templates.value];
  const id = nextId(group);
  group.push({
    id,
    name: `Template ${id}`,
    json: defaultAppConfiguration(`Template ${id}`),
  });
  commit(group);
  selectedTemplateId.value = id;
  return id;
}

export function addTemplateFrom(mapOptions: Record<string, any>): number {
  const group = [...templates.value];
  const id = nextId(group);
  const name = `Preview ${id}`;
  group.push({
    id,
    name,
    json: { ...defaultAppConfiguration(name), mapOptions },
  });
  commit(group);
  selectedTemplateId.value = id;
  return id;
}

export function deleteTemplate(id: number) {
  const group = templates.value.filter((t) => t.id !== id);
  commit(group);
  if (selectedTemplateId.value === id) {
    selectedTemplateId.value = group[0]?.id ?? null;
  }
}

export function selectTemplate(id: number) {
  selectedTemplateId.value = id;
}

function mutate(id: number, fn: (t: RemoteAppConfiguration) => RemoteAppConfiguration) {
  commit(templates.value.map((t) => (t.id === id ? fn(t) : t)));
}

export function updateRemote(id: number, patch: Partial<RemoteAppConfiguration>) {
  mutate(id, (t) => ({ ...t, ...patch }));
}

export function updateAppConfig(id: number, patch: Partial<AppConfiguration>) {
  mutate(id, (t) => ({
    ...t,
    json: { ...(t.json ?? defaultAppConfiguration(t.name)), ...patch },
  }));
}

function mutateMapOptions(id: number, fn: (mapOptions: Record<string, any>) => Record<string, any>) {
  mutate(id, (t) => {
    const json = t.json ?? defaultAppConfiguration(t.name);
    return { ...t, json: { ...json, mapOptions: fn(json.mapOptions ?? {}) } };
  });
}

export function setMapToggle(id: number, loc: LegacyLoc, enabled: boolean) {
  mutateMapOptions(id, (mo) => setToggle(mo, loc, enabled));
}

export function clearMapToggle(id: number, loc: LegacyLoc) {
  mutateMapOptions(id, (mo) => clearToggle(mo, loc));
}

export function setMapOpacity(id: number, loc: LegacyLoc, value: number) {
  mutateMapOptions(id, (mo) => setOpacity(mo, loc, value));
}

export function setMapOptionField(id: number, key: string, value: any) {
  mutateMapOptions(id, (mo) => {
    const next = { ...mo };
    if (value === undefined || value === null || value === '') delete next[key];
    else next[key] = value;
    return next;
  });
}

export function setMapOptionSubField(id: number, objKey: string, field: string, value: any) {
  mutateMapOptions(id, (mo) => {
    const obj: Record<string, any> = { ...(mo[objKey] ?? {}) };
    if (value === undefined || value === null || value === '') delete obj[field];
    else obj[field] = value;
    const next = { ...mo };
    if (Object.keys(obj).length === 0) delete next[objKey];
    else next[objKey] = obj;
    return next;
  });
}
