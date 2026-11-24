import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useFinance } from './useFinance';
import { monthPrefixOf, labelOfDate, todayStr } from '../../lib/date';
import { formatCny } from '../../lib/money';
import type { FinanceRecord, FinanceType } from '../../db';

const CATEGORIES: Record<FinanceType, string[]> = {
  expense: ['食材', '服饰', '护肤', '零食', '还款', '餐饮', '交通', '人情', '打印', '文具', '饮用水', '水电气', '借出', '其他'],
  income: ['楠楠', '五期课', '思考力课', '一对一', '晚辅', '副业', '红包', '零钱通', '基金', '其他'],
};

const PREVIEW_COUNT = 8;

/** 借出属债权而非花销，统计时单独列出，不计入支出与结余 */
const LENT_OUT_CATEGORY = '借出';

export function FinanceModule() {
  const { records, loading, add, addMany, remove } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [type, setType] = useState<FinanceType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [month, setMonth] = useState<string>(monthPrefixOf());

  /** 有记录的月份，倒序 */
  const months = useMemo(() => {
    const set = new Set(records.map((r) => r.date.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  /** 当前筛选区间内的记录（已按时间倒序） */
  const periodRecords = useMemo(
    () => (month === 'all' ? records : records.filter((r) => r.date.startsWith(month))),
    [records, month]
  );

  const stats = useMemo(() => {
    const expenses = periodRecords.filter((r) => r.type === 'expense');
    const expense = expenses
      .filter((r) => r.category !== LENT_OUT_CATEGORY)
      .reduce((s, r) => s + r.amount, 0);
    const lentOut = expenses
      .filter((r) => r.category === LENT_OUT_CATEGORY)
      .reduce((s, r) => s + r.amount, 0);
    const income = periodRecords
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.amount, 0);
    return { expense, lentOut, income, balance: income - expense, count: periodRecords.length };
  }, [periodRecords]);

  /** 分类汇总：按类型+分类聚合，金额倒序 */
  const breakdown = useMemo(() => {
    const map = new Map<string, { type: FinanceType; category: string; amount: number }>();
    for (const r of periodRecords) {
      const key = `${r.type}:${r.category}`;
      const cur = map.get(key);
      if (cur) cur.amount += r.amount;
      else map.set(key, { type: r.type, category: r.category, amount: r.amount });
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [periodRecords]);

  const periodLabel = month === 'all' ? '全部' : `${Number(month.slice(5))}月`;
  const isCurrentMonth = month === monthPrefixOf();

  const visible = showAll ? periodRecords : periodRecords.slice(0, PREVIEW_COUNT);

  const switchType = (next: FinanceType) => {
    setType(next);
    setCategory(CATEGORIES[next][0]);
  };

  const switchMonth = (next: string) => {
    setMonth(next);
    setShowAll(false);
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

  /** 导出当前区间为 CSV（带 BOM，Excel 中文不乱码） */
  const exportCsv = () => {
    const header = '日期,类型,分类,金额,备注';
    const rows = [...periodRecords]
      .reverse()
      .map((r) => {
        const noteText = (r.note ?? '').replace(/"/g, '""');
        return `${r.date},${r.type === 'expense' ? '支出' : '收入'},${r.category},${r.amount},"${noteText}"`;
      });
    const csv = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myday-记账-${month === 'all' ? '全部' : month}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** 导入「导出 CSV」生成的文件，重复记录（日期+类型+分类+金额+备注均相同）自动跳过 */
  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, '').split(/\r\n|\n/).filter((l) => l.trim());
    if (lines.length === 0) {
      setImportMsg('文件是空的');
      return;
    }
    // 跳过表头（若存在）
    const dataLines = lines[0].includes('类型') && lines[0].includes('分类') ? lines.slice(1) : lines;
    const seen = new Set(
      records.map((r) => `${r.date}|${r.type}|${r.category}|${r.amount}|${r.note ?? ''}`)
    );
    const rows: Omit<FinanceRecord, 'id' | 'createdAt'>[] = [];
    let skipped = 0;
    for (const line of dataLines) {
      // 格式：日期,类型,分类,金额,"备注"
      const m = line.match(/^([^,]*),([^,]*),([^,]*),([^,]*),(.*)$/);
      if (!m) { skipped++; continue; }
      const [, date, typeName, category, amountRaw, noteRaw] = m;
      const type: FinanceType = typeName.trim() === '收入' ? 'income' : 'expense';
      const amount = Number(amountRaw);
      const note = noteRaw.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      const key = `${date.trim()}|${type}|${category.trim()}|${amount}|${note}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || !Number.isFinite(amount) || amount <= 0 || seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      rows.push({ date: date.trim(), type, category: category.trim(), amount: Math.round(amount * 100) / 100, note: note || undefined });
    }
    const added = await addMany(rows);
    setImportMsg(`导入 ${added} 笔${skipped > 0 ? `，跳过 ${skipped} 笔（重复或格式不符）` : ''}`);
    setTimeout(() => setImportMsg(null), 6000);
  };

  return (
    <div className="fin">
      <div className={`fin-stats${stats.lentOut > 0 ? ' has-lent' : ''}`}>
        <div className="fin-stat">
          <span className="fin-stat-label">{periodLabel}支出</span>
          <span className="fin-stat-value fin-expense">{formatCny(stats.expense)}</span>
        </div>
        <div className="fin-stat">
          <span className="fin-stat-label">{periodLabel}收入</span>
          <span className="fin-stat-value fin-income">{formatCny(stats.income)}</span>
        </div>
        {stats.lentOut > 0 && (
          <div className="fin-stat">
            <span className="fin-stat-label">{periodLabel}借出</span>
            <span className="fin-stat-value fin-lent">{formatCny(stats.lentOut)}</span>
          </div>
        )}
        <div className="fin-stat">
          <span className="fin-stat-label">结余</span>
          <span className={`fin-stat-value ${stats.balance < 0 ? 'fin-expense' : 'fin-income'}`}>
            {formatCny(stats.balance)}
          </span>
        </div>
      </div>
      {stats.lentOut > 0 && (
        <p className="fin-lent-note">「借出」是债权不是花销，不计入支出与结余。</p>
      )}

      {months.length > 0 && (
        <div className="fin-period">
          <button
            type="button"
            className={isCurrentMonth ? 'fin-chip active' : 'fin-chip'}
            onClick={() => switchMonth(monthPrefixOf())}
          >
            本月
          </button>
          {months
            .filter((m) => m !== monthPrefixOf())
            .map((m) => (
              <button
                key={m}
                type="button"
                className={m === month ? 'fin-chip active' : 'fin-chip'}
                onClick={() => switchMonth(m)}
              >
                {Number(m.slice(0, 4))}年{Number(m.slice(5))}月
              </button>
            ))}
          <button
            type="button"
            className={month === 'all' ? 'fin-chip active' : 'fin-chip'}
            onClick={() => switchMonth('all')}
          >
            全部
          </button>
        </div>
      )}

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

      {breakdown.length > 0 && (
        <div className="fin-breakdown">
          <div className="fin-recent-head">
            <span>分类汇总</span>
            <span className="fin-recent-count">{periodLabel} · {stats.count} 笔</span>
          </div>
          <ul className="fin-break-list">
            {breakdown.map((b) => {
              // 借出的占比基准是其自身合计（100%），不挤占真实支出的百分比
              const base =
                b.category === LENT_OUT_CATEGORY
                  ? stats.lentOut
                  : b.type === 'expense'
                    ? stats.expense
                    : stats.income;
              const pct = base > 0 ? Math.round((b.amount / base) * 100) : 0;
              return (
                <li key={`${b.type}:${b.category}`} className="fin-break-item">
                  <span className={`fin-break-cat fin-${b.type}`}>{b.category}</span>
                  <span className="fin-break-bar-track">
                    <span
                      className={`fin-break-bar fin-break-bar-${b.type}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </span>
                  <span className="fin-break-pct">{pct}%</span>
                  <span className={`fin-break-amount fin-${b.type}`}>
                    {b.type === 'expense' ? '−' : '+'}
                    {formatCny(b.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 导出/导入常驻显示：空数据库时也要能导入恢复 */}
      <div className="fin-export-row">
        <button type="button" className="fin-export" onClick={exportCsv}>
          导出 {periodLabel} CSV
        </button>
        <button type="button" className="fin-export" onClick={() => fileInputRef.current?.click()}>
          导入 CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importCsv(file);
            e.target.value = '';
          }}
        />
      </div>
      {importMsg && <p className="fin-import-msg">{importMsg}</p>}

      <div className="fin-recent">
        <div className="fin-recent-head">
          <span>记录明细</span>
          <span className="fin-recent-count">
            {stats.count > 0 ? `${periodLabel}共 ${stats.count} 笔` : '暂无记录'}
          </span>
        </div>

        {loading ? (
          <p className="fin-empty">读取中…</p>
        ) : visible.length === 0 ? (
          <p className="fin-empty">
            {month === 'all' ? '还没有记录，记第一笔试试。' : '该月没有记录。'}
          </p>
        ) : (
          <>
            <ul className="fin-list">
              {visible.map((r) => (
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

            {periodRecords.length > PREVIEW_COUNT && (
              <button
                type="button"
                className="fin-more"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? `收起，只看最近 ${PREVIEW_COUNT} 笔`
                  : `查看全部 ${periodRecords.length} 笔`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
