import { useEffect, useState } from 'react';
import defaultConfig from '../config/modules.json';
import type { ModuleConfig, ModuleId } from '../types';

const STORAGE_KEY = 'myday:enabled-modules';

type RawConfig = Omit<ModuleConfig, 'id'> & { id: string };
const defaultConfigs: ModuleConfig[] = (defaultConfig as RawConfig[])
  .map((m) => ({ id: m.id as ModuleId, enabled: m.enabled, order: m.order }))
  .sort((a, b) => a.order - b.order);

function load(): ModuleConfig[] {
  if (typeof localStorage === 'undefined') return defaultConfigs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfigs;
    const saved = JSON.parse(raw) as ModuleConfig[];
    if (!Array.isArray(saved)) return defaultConfigs;
    const merged = defaultConfigs.map((def) => {
      const found = saved.find((s) => s.id === def.id);
      return found ? { ...def, enabled: found.enabled } : def;
    });
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return defaultConfigs;
  }
}

function save(configs: ModuleConfig[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function useModuleConfig() {
  const [configs, setConfigs] = useState<ModuleConfig[]>(load);

  useEffect(() => {
    save(configs);
  }, [configs]);

  const toggle = (id: ModuleId) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const moveUp = (id: ModuleId) => {
    setConfigs((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((c, i) => ({ ...c, order: i + 1 }));
    });
  };

  const moveDown = (id: ModuleId) => {
    setConfigs((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((c, i) => ({ ...c, order: i + 1 }));
    });
  };

  const reset = () => setConfigs(defaultConfigs);

  return { configs, toggle, moveUp, moveDown, reset };
}