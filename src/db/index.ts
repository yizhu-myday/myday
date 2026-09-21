import Dexie, { type Table } from 'dexie';

export type FinanceType = 'expense' | 'income';

export interface FinanceRecord {
  id?: number;
  amount: number;
  type: FinanceType;
  category: string;
  note?: string;
  date: string;
  createdAt: number;
}

export type ParcelStatus = 'pending' | 'done';

export interface ParcelRecord {
  id?: number;
  code: string;
  station?: string;
  note?: string;
  /** 取件截止日 YYYY-MM-DD，可留空 */
  deadline?: string;
  status: ParcelStatus;
  createdAt: number;
  pickedAt?: number;
}

class MyDayDB extends Dexie {
  finance!: Table<FinanceRecord, number>;
  parcel!: Table<ParcelRecord, number>;

  constructor() {
    super('myday');
    this.version(1).stores({
      finance: '++id, date, type, category, createdAt',
    });
    this.version(2).stores({
      finance: '++id, date, type, category, createdAt',
      parcel: '++id, status, deadline, createdAt',
    });
  }
}

export const db = new MyDayDB();
