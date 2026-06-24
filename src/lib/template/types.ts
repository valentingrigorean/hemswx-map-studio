export type MergeStrategy = 'replace' | 'merge' | 'toggle';
export type ViewpointType = 'base' | 'mission' | 'hcp';

export const MERGE_STRATEGIES: MergeStrategy[] = ['replace', 'merge', 'toggle'];
export const VIEWPOINT_TYPES: ViewpointType[] = ['base', 'mission', 'hcp'];

export interface AppConfiguration {
  id: string;
  name: string;
  mergeStrategy: MergeStrategy;
  order?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  mapOptions: Record<string, any>;
  viewpoint?: any;
  viewpointType?: ViewpointType | null;
  rotation?: number | null;
}

export interface RemoteAppConfiguration {
  id: number;
  name: string;
  json?: AppConfiguration | null;
}

export interface TemplatesEntity {
  group: RemoteAppConfiguration[];
}

export interface TemplateConfigurationResponse {
  templates: TemplatesEntity;
}

export function defaultAppConfiguration(name = ''): AppConfiguration {
  return {
    id: '',
    name,
    mergeStrategy: 'merge',
    mapOptions: {},
  };
}
