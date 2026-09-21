import { useMemo } from 'react';
import listening from '../../data/english-listening.json';
import { biliEmbedUrl } from '../../lib/bilibili';
import { getDayOfWeek } from '../../lib/date';

type ListeningEntry = {
  day: number; // 1=周一 ... 7=周日
  bvid: string;
  title: string;
};

export function EnglishListeningModule() {
  const data = listening as ListeningEntry[];
  const { entry, dayOfWeek } = useMemo(() => {
    const dow = getDayOfWeek(new Date());
    const hit = data.find((e) => e.day === dow) ?? data[0];
    return { entry: hit, dayOfWeek: dow };
  }, []);

  return (
    <div className="listening-module">
      <div className="listening-meta">
        <span className="listening-day">周{dayName(dayOfWeek)}</span>
        <span className="listening-title">{entry.title}</span>
      </div>
      <div className="listening-frame-wrap">
        <iframe
          key={entry.bvid}
          className="listening-frame"
          src={biliEmbedUrl(entry.bvid)}
          title="English listening"
          allow="autoplay"
        />
      </div>
      <div className="listening-tip">
        干活时挂着听 · BV {entry.bvid}
      </div>
    </div>
  );
}

function dayName(d: number): string {
  return ['一', '二', '三', '四', '五', '六', '日'][d - 1] ?? '?';
}
