import fitnessData from '../../data/fitness.json';
import { getIsoWeek } from '../../lib/date';
import { biliEmbedUrl } from '../../lib/bilibili';

interface FitnessEntry {
  week: number;
  bvid: string;
  title: string;
  note?: string;
}

const data = fitnessData as FitnessEntry[];

export function FitnessModule() {
  const currentWeek = getIsoWeek();
  const entry = data.find((e) => e.week === currentWeek) ?? data[0];

  if (!entry || !entry.bvid) {
    return (
      <div className="module-empty">
        <p>本周跟练待更新</p>
        <p className="empty-hint">
          去 <code>data/fitness.json</code> 添加第 {currentWeek} 周的 BV 号
        </p>
      </div>
    );
  }

  return (
    <div className="fitness-module">
      <div className="fitness-meta">
        <span className="fitness-tag">第 {currentWeek} 周</span>
        <span className="fitness-title">{entry.title}</span>
      </div>
      <div className="fitness-embed">
        <iframe
          src={biliEmbedUrl(entry.bvid)}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
          title={entry.title}
        />
      </div>
      {entry.note && <p className="fitness-note">{entry.note}</p>}
    </div>
  );
}