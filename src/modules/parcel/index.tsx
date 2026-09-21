import { useEffect, useMemo, useState } from 'react';
import { useParcel } from './useParcel';
import type { ParcelRecord } from '../../db';
import { countdownLabel, daysUntil, todayStr } from '../../lib/date';

const NOTIFY_KEY = 'myday:parcel:notified';

export function ParcelModule() {
  const { records, loading, add, markDone, markPending, remove } = useParcel();

  const [code, setCode] = useState('');
  const [station, setStation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const pending = records.filter((r) => r.status === 'pending');
  const done = records.filter((r) => r.status === 'done');

  // 待取且今天到期/已过期的，做一次本地通知（每天最多一次）
  const dueNow = useMemo(
    () =>
      pending.filter((p) => {
        if (!p.deadline) return false;
        const n = daysUntil(p.deadline);
        return !Number.isNaN(n) && n <= 0;
      }),
    [pending]
  );

  useEffect(() => {
    if (!dueNow.length) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    const stamp = `${todayStr()}:${dueNow.map((p) => p.id).join(',')}`;
    if (localStorage.getItem(NOTIFY_KEY) === stamp) return;
    try {
      new Notification('MyDay · 有快递要取', {
        body: dueNow.map((p) => `${p.code}${p.station ? ' · ' + p.station : ''}`).join('\n'),
        tag: 'myday-parcel',
      });
      localStorage.setItem(NOTIFY_KEY, stamp);
    } catch {
      // 部分环境不支持构造 Notification，忽略
    }
  }, [dueNow]);

  const [notifyState, setNotifyState] = useState<string>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  async function enableNotify() {
    if (typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      setNotifyState(p);
    } catch {
      setNotifyState('denied');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    await add({
      code: trimmed,
      station: station.trim() || undefined,
      deadline: deadline || undefined,
      note: note.trim() || undefined,
    });
    setCode('');
    setStation('');
    setDeadline('');
    setNote('');
  }

  return (
    <div className="parcel">
      <form className="parcel-form" onSubmit={submit}>
        <div className="parcel-row">
          <input
            className="parcel-input parcel-input-code"
            placeholder="取件码 *"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="取件码"
          />
          <input
            className="parcel-input"
            placeholder="取件点（可选）"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            aria-label="取件点"
          />
        </div>
        <div className="parcel-row">
          <label className="parcel-date-wrap">
            <span className="parcel-date-label">截止</span>
            <input
              type="date"
              className="parcel-input parcel-input-date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-label="取件截止日"
            />
          </label>
          <input
            className="parcel-input"
            placeholder="备注（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="备注"
          />
        </div>
        <button type="submit" className="parcel-submit" disabled={!code.trim()}>
          存一条取件
        </button>
      </form>

      {notifyState === 'default' && (
        <button type="button" className="parcel-notify-btn" onClick={enableNotify}>
          开启到期提醒（到期当天弹通知）
        </button>
      )}

      <div className="parcel-section-head">
        <span>待取</span>
        <span className="parcel-count">{pending.length}</span>
      </div>

      {loading ? (
        <p className="parcel-empty">读取中…</p>
      ) : pending.length === 0 ? (
        <p className="parcel-empty">没有待取快递。</p>
      ) : (
        <ul className="parcel-list">
          {pending.map((p) => (
            <ParcelItem
              key={p.id}
              p={p}
              confirmId={confirmId}
              setConfirmId={setConfirmId}
              onToggle={markDone}
              onRemove={remove}
            />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <button
            type="button"
            className="parcel-toggle-done"
            onClick={() => setShowDone((v) => !v)}
          >
            {showDone ? '收起' : '展开'}已取（{done.length}）
          </button>
          {showDone && (
            <ul className="parcel-list parcel-list-done">
              {done.map((p) => (
                <ParcelItem
                  key={p.id}
                  p={p}
                  confirmId={confirmId}
                  setConfirmId={setConfirmId}
                  onToggle={markPending}
                  onRemove={remove}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ParcelItem({
  p,
  confirmId,
  setConfirmId,
  onToggle,
  onRemove,
}: {
  p: ParcelRecord;
  confirmId: number | null;
  setConfirmId: (id: number | null) => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const isDone = p.status === 'done';
  const days = p.deadline ? daysUntil(p.deadline) : NaN;
  const urgency = isDone
    ? 'done'
    : Number.isNaN(days)
      ? 'plain'
      : days < 0
        ? 'overdue'
        : days === 0
          ? 'today'
          : 'future';

  return (
    <li className={`parcel-item parcel-item-${urgency}`}>
      <div className="parcel-item-main">
        <span className="parcel-item-code">{p.code}</span>
        {p.station && <span className="parcel-item-station">{p.station}</span>}
        {p.note && <span className="parcel-item-note">{p.note}</span>}
      </div>
      {p.deadline && (
        <span className={`parcel-badge parcel-badge-${urgency}`}>
          {countdownLabel(p.deadline)}
        </span>
      )}
      <div className="parcel-item-btns">
        <button
          type="button"
          className="parcel-btn"
          onClick={() => p.id != null && onToggle(p.id)}
        >
          {isDone ? '恢复' : '已取'}
        </button>
        <button
          type="button"
          className={`parcel-btn-danger ${confirmId === p.id ? 'confirm' : ''}`}
          onClick={() => {
            if (p.id == null) return;
            if (confirmId === p.id) {
              onRemove(p.id);
              setConfirmId(null);
            } else {
              setConfirmId(p.id);
            }
          }}
          onBlur={() => setConfirmId(null)}
        >
          {confirmId === p.id ? '确认删' : '×'}
        </button>
      </div>
    </li>
  );
}
