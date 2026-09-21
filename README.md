# MyDay · 每日面板

> 打开一个 App，看完今天该做的一切。本地优先、零账号、零上云的可自建 PWA。

MyDay 不是信息订阅器，而是你的**门口日历 + 冰箱贴备忘板**：打开 10 秒看完全部，看完即走。

## 模块

| 模块 | 说明 | 数据来源 |
|---|---|---|
| 📅 今日 | 公历日历 + 玛雅历（卓尔金历 Kin） | 纯本地算法 |
| 💪 运动跟练 | 每周一条跟练视频，按 ISO 周自动轮换 | B 站嵌入（`src/data/fitness.json`） |
| 🎧 英语听力 | 每天一条视频，按周几轮换 | B 站嵌入（`src/data/english-listening.json`） |
| 📖 英语阅读 | 长篇书每日一页，跨天自动 +1，进度本地保存 | 自己的 PDF 放 `public/essays/` |
| 💰 记账 | 快速记一笔 + 本月收支统计 | IndexedDB（Dexie） |
| 📦 取件提醒 | 手动录入取件码 + 到期倒计时 + 本地通知 | IndexedDB |

所有模块都可以在**设置页**开关 / 排序，偏好存在 localStorage。

## 快速开始

```bash
git clone https://github.com/yizhu-myday/myday.git
cd myday
npm install
npm run dev        # 开发预览
npm run build      # 生产构建（输出 dist/，即完整 PWA）
```

构建后把 `dist/` 部署到任意静态托管（GitHub Pages / Vercel / Cloudflare Pages / 自己的服务器），手机浏览器打开 → 「添加到主屏幕」，即可像原生 App 一样全屏使用，离线可开。

### 放入你自己的阅读材料

仓库**不附带任何书籍 PDF**（版权原因）。把你的书放进 `public/essays/`，然后在 `src/data/essays.json` 登记：

```json
[
  {
    "id": "my-book",
    "title": "书名",
    "file": "/essays/my-book.pdf",
    "totalPages": 720,
    "startPage": 1
  }
]
```

### 更新每周视频

- 运动：编辑 `src/data/fitness.json`，按 `week`（ISO 周）登记 `bvid`
- 听力：编辑 `src/data/english-listening.json`，按 `day`（1=周一 … 7=周日）登记 `bvid`

没有对应周/天的数据时自动回退到第一条，保证永远有内容。

## 技术栈

- Vite + React 19 + TypeScript
- vite-plugin-pwa（Workbox 离线缓存）
- Dexie（IndexedDB）
- 零后端、零账号、零跟踪

## 写一个新模块

1. 新建 `src/modules/<你的模块>/index.tsx`，导出 `YourModule` 组件
2. 在 `src/modules/registry.ts` 注册
3. 在 `src/config/meta.ts` 加标题/配色，在 `src/config/modules.json` 加默认开关
4. 完成——设置页会自动出现这个模块的开关

## License

[MIT](./LICENSE)
