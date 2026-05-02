# Hermes 自动发布说明

Hermes 是本站的自动编辑机器人，负责抓取、分析、中文化和发布。

## 当前规则

- 官方来源命中关键词后自动发布。
- 讨论来源进入待审，不直接上首页。
- 广告、榜单、标题党、重复内容会被丢弃。
- Hermes 会把自动发布内容写入 `content/auto-posts.js`，网页打开时会自动读取。
- 待审内容写入 `content/review-queue.json`。
- 运行报告写入 `content/hermes-report.json` 和 `content/hermes-report.js`。
- 自动发布前会生成中文标题、中文摘要、中文标签和适合人群。
- 原始英文标题保存在 `originalTitle`，页面正文不显示，详情评论里保留溯源。
- Hermes 会生成 `site/` 静态网站，包括文章页、工具页、任务页、对比页、周报、RSS、sitemap、robots 和 llms.txt。

## 内容来源

- OpenAI Product
- Anthropic News
- GitHub Blog
- Google AI
- Hacker News

来源配置在 `content/sources.json`。

## 手动执行

在项目目录运行：

```powershell
.\tools\run-auto-publish.ps1
```

也可以直接运行：

```powershell
.\tools\run-hermes.ps1
```

执行后刷新 `index.html`，自动发布内容和 Hermes 运行状态会出现在页面里；`site/` 目录会生成可上线的完整静态站。

## 定时执行

可以用 Windows Task Scheduler 每天运行一次：

- Program: `powershell.exe`
- Arguments: `-ExecutionPolicy Bypass -File C:\Users\PC\ai-tool-radar-cn\tools\run-auto-publish.ps1`
- Start in: `C:\Users\PC\ai-tool-radar-cn`

## 后续上线版

上线后应改成服务器定时任务：

- 抓取来源
- 去重
- AI 生成中文标题、中文摘要、中文判断
- 高置信内容自动发布
- 低置信内容进入审核台
- 每天生成一版摘要
- 每天更新静态站、RSS、sitemap 和 llms.txt
