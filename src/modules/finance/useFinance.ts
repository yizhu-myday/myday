import { useCallback, useEffect, useState } from 'react';
import { db, type FinanceRecord } from '../../db';

export function useFinance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.finance.orderBy('createdAt').reverse().toArray();
    setRecords(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (r: Omit<FinanceRecord, 'id' | 'createdAt'>) => {
      await db.finance.add({ ...r, createdAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  /** 批量导入（CSV 恢复用），返回新增条数 */
  const addMany = useCallback(
    async (rows: Omit<FinanceRecord, 'id' | 'createdAt'>[]) => {
      if (rows.length === 0) return 0;
      await db.finance.bulkAdd(rows.map((r) => ({ ...r, createdAt: Date.now() })));
      await refresh();
      return rows.length;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await db.finance.delete(id);
      await refresh();
    },
    [refresh]
  );

  return { records, loading, add, addMany, remove, refresh };
}