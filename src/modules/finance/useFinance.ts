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

  const remove = useCallback(
    async (id: number) => {
      await db.finance.delete(id);
      await refresh();
    },
    [refresh]
  );

  return { records, loading, add, remove, refresh };
}