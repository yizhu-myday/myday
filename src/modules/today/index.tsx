function julianDayNumber(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

function mayanKin(date: Date): number {
  const jdn = julianDayNumber(date);
  const MAYAN_ZERO_JDN = 584283; // 3114 BCE Aug 11 (Gregorian proleptic)
  return ((jdn - MAYAN_ZERO_JDN) % 260 + 260) % 260 + 1;
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function TodayModule() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const weekday = WEEKDAYS[today.getDay()];
  const doy = dayOfYear(today);
  const daysInYear = ((yyyy % 4 === 0 && yyyy % 100 !== 0) || yyyy % 400 === 0) ? 366 : 365;
  const kin = mayanKin(today);

  return (
    <div className="today-grid">
      <div className="today-block">
        <div className="today-label">公历</div>
        <div className="today-main">{yyyy} 年 {mm} 月 {dd} 日</div>
        <div className="today-sub">星期{weekday} · 第 {doy} / {daysInYear} 天</div>
      </div>
      <div className="today-block">
        <div className="today-label">玛雅历</div>
        <div className="today-main">Kin {kin}</div>
        <div className="today-sub">卓尔金历第 {kin} / 260 天</div>
      </div>
    </div>
  );
}