import { useState } from 'react';
import { useReadingModule } from './useEssays';
import { useReadingPage } from './useReadingPage';

export function EnglishReadingModule() {
  const { list, active, setActiveId } = useReadingModule();
  const { page, setPage, today } = useReadingPage(active);
  const [jumpTo, setJumpTo] = useState('');

  if (!active) {
    return <div className="module-empty">暂未配置阅读材料</div>;
  }

  // PDF.js URL fragment: page=跳转 · zoom=page-fit 适合屏幕 · 隐藏工具栏
  const pdfSrc = `${active.file}#page=${page}&zoom=page-fit&toolbar=0&navpanes=0&view=FitH`;

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
      </div>

      <div className="reading-frame-wrap">
        <iframe
          key={`${active.id}-${page}`}
          className="reading-frame"
          src={pdfSrc}
          title={`${active.title} 第 ${page} 页`}
          loading="lazy"
        />
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
        <a
          className="reading-open-new"
          href={`${active.file}#page=${page}`}
          target="_blank"
          rel="noreferrer"
        >
          整页打开
        </a>
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
