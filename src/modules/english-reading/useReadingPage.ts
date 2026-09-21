import { useEffect, useState } from 'react';
import type { EssayMeta } from '../../data/essays';
import {
  getTodayPage,
  setPage as savePage,
} from '../../lib/reading-progress';
import { todayStr } from '../../lib/date';

export function useReadingPage(essay: EssayMeta): {
  page: number;
  setPage: (n: number) => void;
  today: string;
} {
  // 首次渲染就锁定今天的页码（用 todayStr 作为稳定依赖，避免午夜跨天后不刷新）
  const [today] = useState(() => todayStr());
  const [page, setPageState] = useState(() => getTodayPage(essay));

  // 跨天后访问时刷新一次（适用于用户长时间挂在页面）
  useEffect(() => {
    const now = todayStr();
    if (now !== today) {
      window.location.reload();
    }
  }, [today]);

  return {
    page,
    today,
    setPage: (n: number) => {
      savePage(essay.id, n);
      setPageState(n);
    },
  };
}
