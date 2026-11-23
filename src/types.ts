export type ModuleId =
  | 'today'
  | 'fitness'
  | 'english-listening'
  | 'english-reading'
  | 'finance'
  | 'cash'
  | 'parcel';

export interface ModuleConfig {
  id: ModuleId;
  enabled: boolean;
  order: number;
}

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  subtitle: string;
  accent: string;
}