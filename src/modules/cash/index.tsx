import { useMemo, useState, type FormEvent } from 'react';
import { useCash } from './useCash';
import { labelOfDate, monthPrefixOf, todayStr } from '../../lib/date';
import { formatCny } from '../../lib/money';
import type { CashRecord, FinanceType } from '../../db';

const PREVIEW_COUNT = 8;

export function CashModule() {
  const { records, loading, add, remove } = useCash();
  const [type, setType] = useState<FinanceType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  /** 余额按全部流水算；本月收支只看当月 */
  const stats = useMemo(() => {
    const sum = (list: CashRecord[]) =>
      list.reduce((s, r) => s + (r.type === 'income' ? r.amount : -r.amount), 0);
    const month = monthPrefixOf();
    const monthRecords = records.filter((r) => r.date.startsWith(month));
    const balance = sum(records);
    const monthIncome = monthRecords
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.amount, 0);
    const monthExpense = monthRecords
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.amount, 0);
    return { balance, monthIncome, monthExpense };
  }, [records]);

  const visible = showAll ? records : records.slice(0, PREVIEW_COUNT);

  const switchType = (next: FinanceType) => {
    setType(next);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    await add({
      amount: Math.round(value * 100) / 100,
      type,
      note: note.trim() || undefined,
      date: todayStr(),
    });
    setAmount('');
    setNote('');
    setSaving(false);
  };

  return (
    <div className="fin cash">
      <div className="fin-stats">
        <div className="fin-stat">
          <span className="fin-stat-label">现金余额</span>
          <span className={`fin-stat-value ${stats.balance < 0 ? 'fin-expense' : 'fin-cash-balance'}`}>
            {formatCny(stats.balance)}
          </span>
        </div>
        <div className="fin-stat">
          <span className="fin-stat-label">本月收入</span>
          <span className="fin-stat-value fin-income">{formatCny(stats.monthIncome)}</span>
        </div>
        <div className="fin-stat">
          <span className="fin-stat-label">本月支出</span>
          <span className="fin-stat-value fin-expense">{formatCny(stats.monthExpense)}</span>
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
          <span>现金流水</span>
          <span className="fin-recent-count">
            {records.length > 0 ? `共 ${records.length} 笔` : '暂无记录'}
          </span>
        </div>

        {loading ? (
          <p className="fin-empty">读取中…</p>
        ) : visible.length === 0 ? (
          <p className="fin-empty">还没有流水，记第一笔试试。</p>
        ) : (
          <>
            <ul className="fin-list">
              {visible.map((r) => (
                <li key={r.id} className="fin-item">
                  <span className="fin-item-date">{labelOfDate(r.date)}</span>
                  <span className="fin-item-main">
                    <span className="fin-item-cat">{r.type === 'expense' ? '支出' : '收入'}</span>
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

            {records.length > PREVIEW_COUNT && (
              <button
                type="button"
                className="fin-more"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? `收起，只看最近 ${PREVIEW_COUNT} 笔`
                  : `查看全部 ${records.length} 笔`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
