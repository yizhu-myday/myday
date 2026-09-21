import { useCallback, useEffect, useState } from 'react';
import { db, type ParcelRecord } from '../../db';

function sortParcels(list: ParcelRecord[]): ParcelRecord[] {
  // 待取在前；同组内：有截止日的按截止日升序排前面，无截止日的按创建时间倒序
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.createdAt - a.createdAt;
  });
}

export function useParcel() {
  const [records, setRecords] = useState<ParcelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.parcel.toArray();
    setRecords(sortParcels(all));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (r: Omit<ParcelRecord, 'id' | 'createdAt' | 'status'>) => {
      await db.parcel.add({ ...r, status: 'pending', createdAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  const markDone = useCallback(
    async (id: number) => {
      await db.parcel.update(id, { status: 'done', pickedAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  const markPending = useCallback(
    async (id: number) => {
      await db.parcel.update(id, { status: 'pending', pickedAt: undefined });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await db.parcel.delete(id);
      await refresh();
    },
    [refresh]
  );

  return { records, loading, add, markDone, markPending, remove, refresh };
}
