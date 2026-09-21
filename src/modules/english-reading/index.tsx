import { useCallback, useState } from 'react';
import { useReadingModule } from './useEssays';
import { useReadingPage } from './useReadingPage';
import { PdfCanvas } from './PdfCanvas';

export function EnglishReadingModule() {
  const { list, active, setActiveId } = useReadingModule();
  const { page, setPage, today } = useReadingPage(active);
  const [jumpTo, setJumpTo] = useState('');
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const handleTotalPages = useCallback((n: number) => {
    setTotalPages((prev) => (prev === n ? prev : n));
  }, []);

  if (!active) {
    return <div className="module-empty">暂未配置阅读材料</div>;
  }

  // file 是以 / 开头的绝对路径；拼上部署 base（根路径或 /myday/ 子路径都正确）
  const base = import.meta.env.BASE_URL ?? '/';
  const fileUrl = base.replace(/\/$/, '') + active.file;

  return (
    <div className="reading-module">
      {list.length > 1 && (
        <select
          className="reading-book-select"
          value={active.id}
          onChange={(e) => setActiveId(e.target.value)}
          aria-label="选择书籍"
        >
          {list.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} · {b.author}
            </option>
          ))}
        </select>
      )}

      <div className="reading-meta">
        <div className="reading-title">{active.title}</div>
        <div className="reading-author">{active.author} · 今日 {today}</div>
      </div>

      <div className="reading-progress">
        第 <strong>{page}</strong> 页
        {totalPages ? <span className="reading-total"> / {totalPages}</span> : null}
      </div>

      <div className="pdf-canvas-wrap-outer">
        <PdfCanvas url={fileUrl} page={page} onTotalPages={handleTotalPages} />
      </div>

      <div className="reading-controls">
        <button
          type="button"
          className="reading-btn"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          ← 上一页
        </button>
        <button
          type="button"
          className="reading-btn"
          onClick={() => setPage(page + 1)}
        >
          下一页 →
        </button>
        <form
          className="reading-jump"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(jumpTo, 10);
            if (!isNaN(n) && n >= 1) {
              setPage(n);
              setJumpTo('');
            }
          }}
        >
          <input
            type="number"
            min={1}
            placeholder="跳转到"
            value={jumpTo}
            onChange={(e) => setJumpTo(e.target.value)}
            className="reading-jump-input"
            aria-label="跳转到指定页"
          />
          <button type="submit" className="reading-btn-secondary">
            跳转
          </button>
        </form>
      </div>

      {active.note && <div className="reading-note">{active.note}</div>}
    </div>
  );
}
