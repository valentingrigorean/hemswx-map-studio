import type { LayerConfig, BaseMapEntity } from '../types';

export type Sublayer = LayerConfig;

export type Legend = true | { url: string } | { text: string } | { image: string };

export type Section = 'weather' | 'features' | 'overrides';

export interface Item {
  id: string;
  name?: string;
  legend?: Legend;
  sublayers?: Sublayer[];
}

export interface Node {
  id: string;
  name?: string;
  legend?: Legend;
  select?: 'one' | 'many';
  sublayers?: Sublayer[];
  items?: Item[];
}

export interface Override {
  id: string;
  sublayers?: Sublayer[];
}

export interface MapConfigV2 {
  schemaVersion: 2;
  weather: Node[];
  features: Node[];
  overrides: Override[];
  baseMaps?: BaseMapEntity[];
}

export type NodeStatus = 'ok' | 'warn' | 'empty';
export type LegendKind = 'none' | 'auto' | 'url' | 'text' | 'image';

export interface TreeItem {
  section: Section;
  parent: string;
  index: number;
  itemIndex: number;
  id: string;
  name: string;
  kind: 'leaf';
  legend?: Legend;
  sublayers: Sublayer[];
}

export interface TreeNode {
  section: Section;
  index: number;
  id: string;
  name: string | null;
  kind: 'leaf' | 'group';
  select: 'one' | 'many' | null;
  legend?: Legend;
  sublayers: Sublayer[];
  items: TreeItem[] | null;
  raw: Node | Override;
}

export interface Tree {
  weather: TreeNode[];
  features: TreeNode[];
  overrides: TreeNode[];
}
