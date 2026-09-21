import { useState } from 'react';
import essays from '../../data/essays.json';
import type { EssayMeta } from '../../data/essays';

export type EssayList = EssayMeta[];

// 让 TS 知道 essays.json 是 EssayMeta[]
export function loadEssays(): EssayList {
  return essays as EssayList;
}

export function useReadingModule() {
  const list = loadEssays();
  const [activeId, setActiveId] = useState(list[0]?.id ?? '');
  const active = list.find((e) => e.id === activeId) ?? list[0];
  return { list, active, setActiveId };
}
