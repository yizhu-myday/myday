import type { ModuleMeta } from '../types';

export const moduleMeta: Record<string, ModuleMeta> = {
  today: {
    id: 'today',
    name: '今日',
    subtitle: '日历 · 玛雅历 · 节气',
    accent: '#0F6E56',
  },
  fitness: {
    id: 'fitness',
    name: '运动跟练',
    subtitle: '每周核心肌群 · B 站跟练视频',
    accent: '#534AB7',
  },
  'english-listening': {
    id: 'english-listening',
    name: '英语听力',
    subtitle: '干活时听 · B 站每日一条',
    accent: '#185FA5',
  },
  'english-reading': {
    id: 'english-reading',
    name: '英语阅读',
    subtitle: '每日一页 · 英文原版精读',
    accent: '#378ADD',
  },
  finance: {
    id: 'finance',
    name: '记账',
    subtitle: '本地 IndexedDB · 不上云',
    accent: '#854F0B',
  },
  parcel: {
    id: 'parcel',
    name: '取件提醒',
    subtitle: '手动输入 · 倒计时推送',
    accent: '#A32D2D',
  },
};