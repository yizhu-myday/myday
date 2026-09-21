import { useMemo, useState, type FormEvent } from 'react';
import { useFinance } from './useFinance';
import { monthPrefixOf, labelOfDate, todayStr } from '../../lib/date';
import { formatCny } from '../../lib/money';
import type { FinanceType } from '../../db';

const CATEGORIES: Record<FinanceType, string[]> = {
  expense: ['餐饮', '交通', '购物', '居家', '学习', '医疗', '人情', '其他'],
  income: ['工资', '副业', '红包', '其他'],
};

export function FinanceModule() {
  const { records, loading, add, remove } = useFinance();
  const [type, setType] = useState<FinanceType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const prefix = monthPrefixOf();
    const monthly = records.filter((r) => r.date.startsWith(prefix));
    const expense = monthly
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.amount, 0);
    const income = monthly
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.amount, 0);
    return { expense, income, balance: income - expense, count: monthly.length };
  }, [records]);

  const switchType = (next: FinanceType) => {
    setType(next);
    setCategory(CATEGORIES[next][0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    await add({
      amount: Math.round(value * 100) / 100,
      type,
      category,
      note: note.trim() || undefined,
      date: todayStr(),
    });
    setAmount('');
    setNote('');
    setSaving(false);
  };

  const recent = records.slice(0, 8);

  return (
    <div className="fin">
      <div className="fin-stats">
        <div className="fin-stat">
          <span className="fin-stat-label">本月支出</span>
          <span className="fin-stat-value fin-expense">{formatCny(stats.expense)}</span>
        </div>
        <div className="fin-stat">
          <span className="fin-stat-label">本月收入</span>
          <span className="fin-stat-value fin-income">{formatCny(stats.income)}</span>
        </div>
        <div className="fin-stat">
          <span className="fin-stat-label">结余</span>
          <span className={`fin-stat-value ${stats.balance < 0 ? 'fin-expense' : 'fin-income'}`}>
            {formatCny(stats.balance)}
          </span>
        </div>
      </div>

      <form className="fin-form" onSubmit={submit}>
        <div className="fin-type-switch">
          <button
            type="button"
            className={type === 'expense' ? 'active expense' : ''}
            onClick={() => switchType('expense')}
          >
            支出
          </button>
          <button
            type="button"
            className={type === 'income' ? 'active income' : ''}
            onClick={() => switchType('income')}
          >
            收入
          </button>
        </div>

        <div className="fin-amount-row">
          <span className="fin-amount-symbol">¥</span>
          <input
            className="fin-amount-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          />
        </div>

        <div className="fin-categories">
          {CATEGORIES[type].map((c) => (
            <button
              type="button"
              key={c}
              className={c === category ? 'fin-chip active' : 'fin-chip'}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <input
          className="fin-note-input"
          type="text"
          placeholder="备注（可选）"
          value={note}
          maxLength={30}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="fin-submit" type="submit" disabled={saving || !amount}>
          {saving ? '保存中…' : '记一笔'}
        </button>
      </form>

      <div className="fin-recent">
        <div className="fin-recent-head">
          <span>最近记录</span>
          <span className="fin-recent-count">
            {stats.count > 0 ? `本月共 ${stats.count} 笔` : '本月暂无'}
          </span>
        </div>

        {loading ? (
          <p className="fin-empty">读取中…</p>
        ) : recent.length === 0 ? (
          <p className="fin-empty">还没有记录，记第一笔试试。</p>
        ) : (
          <ul className="fin-list">
            {recent.map((r) => (
              <li key={r.id} className="fin-item">
                <span className="fin-item-date">{labelOfDate(r.date)}</span>
                <span className="fin-item-main">
                  <span className="fin-item-cat">{r.category}</span>
                  {r.note && <span className="fin-item-note">{r.note}</span>}
                </span>
                <span
                  className={`fin-item-amount ${r.type === 'expense' ? 'fin-expense' : 'fin-income'}`}
                >
                  {r.type === 'expense' ? '−' : '+'}
                  {formatCny(r.amount)}
                </span>
                {confirmId === r.id ? (
                  <button
                    type="button"
                    className="fin-item-del confirm"
                    onClick={() => {
                      if (r.id != null) void remove(r.id);
                      setConfirmId(null);
                    }}
                  >
                    确认
                  </button>
                ) : (
                  <button
                    type="button"
                    className="fin-item-del"
                    aria-label="删除"
                    onClick={() => setConfirmId(r.id ?? null)}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}