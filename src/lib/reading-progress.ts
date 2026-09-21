// 阅读进度：每日一页的 PDF 书/文集
// 每条记录：{ currentPage, lastVisitDate, totalPages? }

import type { EssayMeta } from '../data/essays';
import { todayStr } from './date';

export interface ReadingProgress {
  currentPage: number;
  lastVisitDate: string; // YYYY-MM-DD
}

const KEY_PREFIX = 'myday:reading:';

export function loadProgress(id: string): ReadingProgress | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingProgress;
  } catch {
    return null;
  }
}

export function saveProgress(id: string, p: ReadingProgress): void {
  try {
    localStorage.setItem(KEY_PREFIX + id, JSON.stringify(p));
  } catch {
    // localStorage 可能因隐私模式不可用，安静失败
  }
}

/** 拿到「今天该看的页码」。规则：
 *  - 首次进入：从第 1 页开始
 *  - 同一天再次进入：返回上次记录
 *  - 跨天进入：currentPage + 1（不管中间隔了几天，避免一次跳几页）
 */
export function getTodayPage(essay: EssayMeta, today: Date = new Date()): number {
  const stored = loadProgress(essay.id);
  const todayStrNow = todayStr(today);
  if (!stored) {
    const init: ReadingProgress = { currentPage: 1, lastVisitDate: todayStrNow };
    saveProgress(essay.id, init);
    return 1;
  }
  if (stored.lastVisitDate === todayStrNow) {
    return stored.currentPage;
  }
  // 新的一天，+1 页
  const next = stored.currentPage + 1;
  const updated: ReadingProgress = { currentPage: next, lastVisitDate: todayStrNow };
  saveProgress(essay.id, updated);
  return next;
}

/** 用户手动跳转页码（覆盖 + 不动 lastVisitDate） */
export function setPage(id: string, page: number): void {
  const stored = loadProgress(id);
  const lastVisitDate = stored?.lastVisitDate ?? todayStr();
  saveProgress(id, { currentPage: Math.max(1, page), lastVisitDate });
}
