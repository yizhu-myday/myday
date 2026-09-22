/**
 * 玛雅卓尔金历（Dreamspell / 13月亮历体系）
 *
 * 与正统 GMT 584283 算法不同，Dreamspell 的关键规则：
 *  - 闰日（2月29日）不计入计数，直接跳过
 *  - 锚点：1992-07-26 = Kin 39（tortuga1320.com 公认锚点）
 *  - 交叉验证：2013-07-26 = Kin 164 ✓、2026-09-22 = Kin 27 磁性的蓝手 ✓
 */

const DREAMSPELL_EPOCH = new Date(1992, 6, 26); // 1992-07-26 本地零点
const DREAMSPELL_EPOCH_KIN = 39;

/** 13 调性（Galactic Tones） */
const TONES = [
  '磁性', '月亮', '电力', '自我存在', '泛音', '韵律', '共鸣',
  '银河', '太阳', '行星', '光谱', '水晶', '宇宙',
];

/** 20 图腾（Solar Seals，Dreamspell 彩色印章顺序：红白蓝黄循环） */
const SEALS = [
  '红龙', '白风', '蓝夜', '黄种子', '红蛇', '白世界桥', '蓝手', '黄星星',
  '红月', '白狗', '蓝猴', '黄人', '红天行者', '白巫师', '蓝鹰', '黄战士',
  '红地球', '白镜子', '蓝风暴', '黄太阳',
];

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** (from, to] 区间内的闰日（2月29日）数量 */
function countLeapDays(from: Date, to: Date): number {
  let n = 0;
  const y1 = from.getFullYear();
  const y2 = to.getFullYear();
  for (let y = y1; y <= y2; y++) {
    if (isLeapYear(y)) {
      const feb29 = new Date(y, 1, 29);
      if (feb29 > from && feb29 <= to) n++;
    }
  }
  return n;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Dreamspell Kin：日历天数差 - 区间闰日，再 mod 260 */
export function dreamspellKin(date: Date): number {
  const d = startOfDay(date);
  const calendarDays = Math.round((d.getTime() - DREAMSPELL_EPOCH.getTime()) / 86400000);
  const leapDays = countLeapDays(DREAMSPELL_EPOCH, d);
  const dsDays = calendarDays - leapDays;
  return ((DREAMSPELL_EPOCH_KIN - 1 + dsDays) % 260 + 260) % 260 + 1;
}

export interface TzolkinDay {
  kin: number;
  toneName: string;
  sealName: string;
  label: string; // 如 "kin27 磁性的蓝手"
}

export function tzolkinOf(date: Date): TzolkinDay {
  const kin = dreamspellKin(date);
  const tone = TONES[(kin - 1) % 13];
  const seal = SEALS[(kin - 1) % 20];
  return { kin, toneName: tone, sealName: seal, label: `kin${kin} ${tone}的${seal}` };
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
  const tz = tzolkinOf(today);

  return (
    <div className="today-grid">
      <div className="today-block">
        <div className="today-label">公历</div>
        <div className="today-main">{yyyy} 年 {mm} 月 {dd} 日</div>
        <div className="today-sub">星期{weekday} · 第 {doy} / {daysInYear} 天</div>
      </div>
      <div className="today-block">
        <div className="today-label">玛雅历</div>
        <div className="today-main">{tz.label}</div>
        <div className="today-sub">卓尔金历第 {tz.kin} / 260 天 · {tz.toneName}调 · {tz.sealName}</div>
      </div>
    </div>
  );
}
