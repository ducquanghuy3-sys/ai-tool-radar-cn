# AI 工具雷达

中文 AI 工具决策引擎。

Hermes 每天抓取一手来源，筛选、中文化并生成完整静态网站。

## 本地生成

```powershell
npm run build
```

输出目录：

```text
site/
```

## 部署

推荐使用 Cloudflare Pages：

- Build command: `npm run build`
- Build output directory: `site`
- Node.js: `22`
- Environment variable: `SITE_URL=https://你的域名`

详细说明见 `docs/DEPLOY.md`。
