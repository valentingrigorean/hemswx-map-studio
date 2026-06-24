import { signal, computed } from '@preact/signals';

export interface AppSettings {
  previewBasemap: string;
}

const SETTINGS_KEY = 'hemswx-map-editor-settings';

const defaultSettings: AppSettings = {
  previewBasemap: 'gray-vector'
};

const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        previewBasemap: parsed.previewBasemap || 'gray-vector'
      };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return { ...defaultSettings };
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
};

export const settings = signal<AppSettings>(loadSettings());

export const previewBasemap = computed(() => settings.value.previewBasemap);

export const setPreviewBasemap = (basemapId: string) => {
  const newSettings = { ...settings.value, previewBasemap: basemapId };
  settings.value = newSettings;
  saveSettings(newSettings);
};
