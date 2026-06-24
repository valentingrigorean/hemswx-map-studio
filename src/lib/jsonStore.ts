import { signal } from '@preact/signals';
import { MapLayersData } from './types';
import { getDefaultData } from './utils';
import { envKey, readScoped } from './studio';

export const LAST_JSON_KEY = 'hemswx-last-json-data';

export const jsonData = signal<MapLayersData>(getDefaultData());

export const updateJsonData = (newData: MapLayersData) => {
  jsonData.value = newData;
  persistJsonData();
};

export const loadLastJsonData = () => {
  try {
    const stored = readScoped(LAST_JSON_KEY);
    if (stored) {
      jsonData.value = JSON.parse(stored);
      return true;
    }
  } catch (error) {
    console.warn('Failed to load JSON data from localStorage:', error);
  }
  return false;
};

export const persistJsonData = () => {
  try {
    localStorage.setItem(envKey(LAST_JSON_KEY), JSON.stringify(jsonData.value));
  } catch (error) {
    console.warn('Failed to save JSON data to localStorage:', error);
  }
};

export const reloadLastJsonData = () => {
  const stored = readScoped(LAST_JSON_KEY);
  if (stored) {
    try {
      jsonData.value = JSON.parse(stored);
      return;
    } catch (error) {
      console.warn('Failed to load JSON data from localStorage:', error);
    }
  }
  jsonData.value = getDefaultData();
};
