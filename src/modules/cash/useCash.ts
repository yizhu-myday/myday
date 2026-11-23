import { useCallback, useEffect, useState } from 'react';
import { db, type CashRecord } from '../../db';

export function useCash() {
  const [records, setRecords] = useState<CashRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.cash.orderBy('createdAt').reverse().toArray();
    setRecords(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (r: Omit<CashRecord, 'id' | 'createdAt'>) => {
      await db.cash.add({ ...r, createdAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await db.cash.delete(id);
      await refresh();
    },
    [refresh]
  );

  return { records, loading, add, remove, refresh };
}
