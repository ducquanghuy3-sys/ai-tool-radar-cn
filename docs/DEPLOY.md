# 上线说明

## 当前能上线到什么程度

当前版本可以上线成公开预览版：

- 首页可访问
- 自动内容可展示
- Hermes 可抓取、中文化、生成发布内容
- 本地提交、收藏、评论、审核可在浏览器里使用

当前版本还不是完整公众产品：

- 不支持多人账号
- 评论和提交只保存在访问者自己的浏览器
- 管理员审核不是云端共享
- Hermes 还没有部署到服务器定时运行

## 推荐上线方式

第一阶段推荐用静态托管：

- 网站放到 Vercel、Netlify、Cloudflare Pages 或 GitHub Pages
- Hermes 每天定时运行
- Hermes 更新 `content/auto-posts.js`
- 网站自动重新发布
- 托管平台发布目录使用 `site/`

这样成本低，稳定，适合先验证内容方向。

## Hermes 部署方式

Hermes 是一个 Node.js 脚本：

```powershell
tools\run-hermes.ps1
```

它会做四件事：

1. 抓取来源
2. 过滤低质量内容
3. 生成中文标题和中文判断
4. 写入发布文件

输出文件：

- `content/auto-posts.js`
- `content/review-queue.json`
- `content/hermes-report.json`
- `content/hermes-report.js`

## 最简单部署方案

### 方案 A：GitHub Actions

适合第一版上线。

流程：

1. 把项目放到 GitHub
2. GitHub Actions 每天运行 Hermes
3. Hermes 改写内容文件
4. 自动提交回仓库
5. Vercel / Netlify 自动重新发布

上线前需要设置 `SITE_URL`：

- GitHub: Repository Variables 里新增 `SITE_URL`
- Vercel / Cloudflare Pages: Environment Variables 里新增 `SITE_URL`
- 值填写正式域名，例如 `https://你的域名.com`

如果不设置，生成的 sitemap 会使用占位域名，不适合正式 SEO。

优点：

- 不用自己买服务器
- 每天自动更新
- 失败记录可查

缺点：

- 不适合做复杂后台
- 不适合大量抓取

### 方案 B：VPS 定时任务

适合后续正式运营。

流程：

1. 服务器每天运行 Hermes
2. Hermes 写入内容文件或数据库
3. 网站读取最新内容

优点：

- 控制力强
- 以后能接数据库和后台

缺点：

- 需要维护服务器
- 需要处理备份、安全和日志

### 方案 C：完整后台

适合已经有用户后再做。

需要：

- 用户账号
- 数据库
- 管理员后台
- 云端评论
- 云端提交
- 审核权限
- Hermes 定时任务

优点：

- 真正多人可用

缺点：

- 工作量最大

## 推荐顺序

先用方案 A 上线公开预览版。

验证内容有人看，再做方案 C。

## Vercel 设置

项目已包含 `vercel.json`：

- Build Command: `node tools/hermes.mjs`
- Output Directory: `site`

导入 GitHub 仓库后，设置 `SITE_URL` 即可。

## Cloudflare Pages 设置

- Build command: `node tools/hermes.mjs`
- Build output directory: `site`
- Environment variable: `SITE_URL=https://你的域名.com`
