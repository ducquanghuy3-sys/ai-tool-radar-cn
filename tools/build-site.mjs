import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "site");
const baseUrl = process.env.SITE_URL || "https://example.com";
const basePath = new URL(baseUrl).pathname.replace(/\/$/, "");
const siteName = "AI 工具雷达";
const siteDescription = "中文 AI 工具每日读物：追踪更新、价格、风险和适用场景，帮助判断该不该使用或更换工具。";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "item";
}

function parseAutoPosts(value) {
  return JSON.parse(value.replace(/^window\.AUTO_POSTS\s*=\s*/, "").replace(/;\s*$/, ""));
}

async function writePage(file, html) {
  const full = path.join(siteDir, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, html, "utf8");
}

function pageShell({ title, description, canonical, content, jsonLd }) {
  const json = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}｜${siteName}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="alternate" type="application/rss+xml" title="${siteName} RSS" href="${baseUrl}/rss.xml">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(canonical)}">
  <style>
    :root{--bg:#f6f4ea;--panel:#fffdf6;--ink:#191914;--muted:#706c61;--soft:#ebe5d4;--line:#d4ceb9;--accent:#a83e32;--green:#3e6f55;--wash:#eee7d2}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;letter-spacing:0}
    a{color:inherit;text-decoration:none}
    .wrap{width:min(960px,100%);margin:0 auto;padding:14px 18px 28px}
    header{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:20px;align-items:end;border-top:3px solid var(--ink);border-bottom:1px solid var(--line);padding:10px 0 9px}
    .brand{font-size:22px;line-height:1;font-weight:850;letter-spacing:.015em}
    .tagline{display:block;margin-top:6px;color:var(--muted);font-size:12px;font-weight:450}
    nav{display:flex;gap:2px;flex-wrap:wrap;justify-content:flex-end}
    nav a{padding:6px 8px;border-radius:4px;color:#38362f;font-size:13px}
    nav a:hover{background:var(--wash);color:var(--accent)}
    main{padding-top:22px}
    h1{max-width:760px;margin:0 0 7px;font-size:32px;line-height:1.14;font-weight:850;letter-spacing:0}
    h2{display:flex;align-items:center;gap:10px;margin:30px 0 0;padding:0 0 7px;border-bottom:1px solid var(--line);font-size:16px;line-height:1.3;font-weight:800}
    h2::after{content:"";height:1px;background:var(--soft);flex:1}
    h3{font-size:16px;line-height:1.45}
    p{max-width:760px;margin:8px 0 0;color:#35352f;font-size:15px;line-height:1.78}
    ul{margin:10px 0 0;padding-left:22px}
    li{margin:6px 0;color:#35352f;line-height:1.72}
    .muted{color:var(--muted);font-size:13px}
    .meta{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:7px 0 0;color:var(--muted);font-size:12px}
    .pill{display:inline-flex;align-items:center;border:1px solid var(--soft);background:var(--wash);border-radius:999px;padding:2px 7px;color:#47443b;font-size:12px;line-height:1.35}
    .source{word-break:break-all;color:var(--green);text-decoration:underline;text-underline-offset:3px}
    .hero{border-bottom:1px solid var(--line);padding:13px 0 16px}
    .hero p{font-size:16px;color:#504d44}
    .topic-bar{display:flex;gap:7px;flex-wrap:wrap;margin-top:18px}
    .topic-bar a,.view-tabs a{display:inline-flex;align-items:center;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:5px 9px;color:#36342e;font-size:13px;line-height:1.25}
    .topic-bar a:hover,.view-tabs a:hover{border-color:#b9aa87;color:var(--accent)}
    .topic-bar span{margin-left:4px;color:var(--muted)}
    .view-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:26px;border-bottom:1px solid var(--line);padding-bottom:7px}
    .view-row h2{margin:0;padding:0;border:0}
    .view-row h2::after{display:none}
    .view-tabs{display:flex;gap:6px;flex-wrap:wrap}
    .view-tabs a:first-child{background:var(--ink);border-color:var(--ink);color:#fffdf6}
    .feed{border-top:0}
    .feed-item{display:grid;grid-template-columns:42px minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--soft)}
    .rank{color:var(--muted);font-variant-numeric:tabular-nums;text-align:right;padding-top:1px}
    .rank b{display:block;color:#4c473d;font-size:14px;font-weight:650}.rank span{display:block;margin-top:2px;font-size:12px}
    .feed-item h3{margin:0;font-size:17px;font-weight:720;line-height:1.42}
    .feed-item h3 a:hover{color:var(--accent)}
    .feed-item p{margin:4px 0 0;max-width:760px;color:#555045;font-size:14px;line-height:1.6}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border-top:1px solid var(--line);border-left:1px solid var(--line);background:var(--panel)}
    .card{display:block;min-height:132px;padding:14px 15px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--panel)}
    .card:hover{background:#f7f4ea}
    .card h3{margin:0 0 7px;font-size:16px;font-weight:750}
    .card p{margin:0;color:#56564e;font-size:13px;line-height:1.62}
    table{width:100%;border-collapse:collapse;background:var(--panel);margin-top:10px}
    td,th{border:1px solid var(--line);padding:11px 12px;text-align:left;vertical-align:top;line-height:1.6}
    th{width:32%;background:var(--wash);font-weight:700}
    footer{border-top:1px solid var(--line);margin-top:34px;padding-top:12px;color:var(--muted);font-size:12px}
    @media(max-width:760px){.wrap{padding:12px 14px 24px}header{grid-template-columns:1fr;align-items:start}nav{justify-content:flex-start}h1{font-size:26px}.view-row{display:block}.view-tabs{margin-top:10px}.grid{grid-template-columns:1fr}.feed-item{grid-template-columns:38px minmax(0,1fr)}.rank{text-align:left}.topic-bar a,.view-tabs a{font-size:12px}}
  </style>
  ${json}
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="${siteHref("/")}">${siteName}<span class="tagline">帮中文用户判断该用什么 AI 工具</span></a>
      <nav>
        <a href="${siteHref("/")}">首页</a>
        <a href="${siteHref("/tools/")}">工具</a>
        <a href="${siteHref("/tasks/")}">任务</a>
        <a href="${siteHref("/compare/")}">对比</a>
        <a href="${siteHref("/weekly/")}">周报</a>
        <a href="${siteHref("/tags/")}">标签</a>
      </nav>
    </header>
    ${content}
    <footer>由 Hermes 自动更新。所有页面保留原始来源链接，中文判断用于帮助读者决策。</footer>
  </div>
</body>
</html>`;
}

function card(title, href, text, extra = "") {
  const target = href.startsWith("/") ? siteHref(href) : href;
  return `<a class="card" href="${target}"><h3>${esc(title)}</h3><p>${esc(text)}</p>${extra}</a>`;
}

function feedItem(post, index) {
  return `<article class="feed-item">
    <div class="rank"><b>${index + 1}.</b></div>
    <div>
      <h3><a href="${siteHref(`/posts/${postSlug(post)}/`)}">${esc(post.title)}</a></h3>
      <p>${esc(post.summary)}</p>
      <div class="meta"><span class="pill">${esc(post.tag)}</span><span>${esc(post.source)}</span><span>${esc(post.editor)}</span></div>
    </div>
  </article>`;
}

function topicBar(posts) {
  const counts = new Map();
  for (const post of posts) counts.set(post.tag, (counts.get(post.tag) || 0) + 1);
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 7);
  return `<div class="topic-bar">${tags.map(([tag, count]) => `<a href="${siteHref(`/tags/${slugify(tag)}/`)}">${esc(tag)}<span>${count}</span></a>`).join("")}<a href="${siteHref("/tags/")}">全部标签 →</a></div>`;
}

function viewTabs() {
  return `<div class="view-tabs"><a href="${siteHref("/")}">热门</a><a href="${siteHref("/weekly/")}">最近</a><a href="${siteHref("/tools/")}">工具</a></div>`;
}

function postSlug(post) {
  return `${slugify(post.title)}-${post.id.replace(/^auto-/, "").slice(0, 18)}`;
}

function siteHref(value) {
  const clean = value.startsWith("/") ? value : `/${value}`;
  return `${basePath}${clean}` || clean;
}

function makePostPage(post) {
  const canonical = `${baseUrl}/posts/${postSlug(post)}/`;
  const content = `<main>
    <div class="meta"><span class="pill">${esc(post.tag)}</span><span class="pill">${esc(post.type)}</span><span class="pill">${esc(post.editor)}</span></div>
    <h1>${esc(post.title)}</h1>
    <p>${esc(post.summary)}</p>
    <h2>适合谁</h2>
    <ul>${(post.audience || []).map(item => `<li>${esc(item)}</li>`).join("")}</ul>
    <h2>为什么值得看</h2>
    <p>${esc(post.summary)}</p>
    <h2>原始来源</h2>
    <p><a class="source" href="${esc(post.url)}" rel="noreferrer" target="_blank">${esc(post.originalTitle || post.title)}</a></p>
    <h2>编辑记录</h2>
    <p class="muted">${esc((post.commentsSample || [])[0]?.[1] || "Hermes 自动生成中文判断。")}</p>
  </main>`;
  return pageShell({
    title: post.title,
    description: post.summary,
    canonical,
    content,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.summary,
      "dateModified": new Date().toISOString(),
      "author": {"@type": "Organization", "name": "Hermes"},
      "publisher": {"@type": "Organization", "name": siteName},
      "mainEntityOfPage": canonical,
      "isBasedOn": post.url
    }
  });
}

function makeToolPage(tool, posts) {
  const related = posts.filter(post => (tool.relatedTags || []).includes(post.tag)).slice(0, 8);
  const canonical = `${baseUrl}/tools/${tool.slug}/`;
  const content = `<main>
    <h1>${esc(tool.name)}：适合谁，怎么用，有什么坑</h1>
    <p>${esc(tool.summary)}</p>
    <h2>最适合</h2><ul>${tool.bestFor.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <h2>不适合</h2><ul>${tool.notFor.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <h2>成本判断</h2><p>${esc(tool.pricingNote)}</p>
    <h2>风险提醒</h2><p>${esc(tool.risk)}</p>
    <h2>相关更新</h2><div class="grid">${related.map(post => card(post.title, `/posts/${postSlug(post)}/`, post.summary)).join("") || "<p>暂无相关更新。</p>"}</div>
  </main>`;
  return pageShell({
    title: `${tool.name} 使用决策`,
    description: tool.summary,
    canonical,
    content,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": tool.name,
      "applicationCategory": tool.category,
      "description": tool.summary
    }
  });
}

function makeTaskPage(task, tools) {
  const toolMap = new Map(tools.map(tool => [tool.slug, tool]));
  const canonical = `${baseUrl}/tasks/${task.slug}/`;
  const content = `<main>
    <h1>${esc(task.title)}</h1>
    <p>${esc(task.summary)}</p>
    <h2>推荐工具</h2>
    <div class="grid">${task.recommendedTools.map(slug => {
      const tool = toolMap.get(slug);
      return tool ? card(tool.name, `/tools/${tool.slug}/`, tool.summary) : "";
    }).join("")}</div>
    <h2>决策规则</h2><ul>${task.decisionRules.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <h2>常见坑</h2><ul>${task.pitfalls.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
  </main>`;
  return pageShell({
    title: task.title,
    description: task.summary,
    canonical,
    content,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": task.title,
      "description": task.summary,
      "step": task.decisionRules.map((rule, index) => ({ "@type": "HowToStep", "position": index + 1, "text": rule }))
    }
  });
}

function makeComparisonPage(comparison, tools) {
  const toolMap = new Map(tools.map(tool => [tool.slug, tool]));
  const canonical = `${baseUrl}/compare/${comparison.slug}/`;
  const rows = comparison.winnerByUseCase.map(row => `<tr><th>${esc(row.case)}</th><td>${esc(row.winner)}</td></tr>`).join("");
  const content = `<main>
    <h1>${esc(comparison.title)}</h1>
    <p>${esc(comparison.summary)}</p>
    <h2>一句话结论</h2><p>${esc(comparison.summary)}</p>
    <h2>按场景选择</h2><table><tbody>${rows}</tbody></table>
    <h2>相关工具</h2>
    <div class="grid">${comparison.tools.map(slug => {
      const tool = toolMap.get(slug);
      return tool ? card(tool.name, `/tools/${tool.slug}/`, tool.summary) : "";
    }).join("")}</div>
  </main>`;
  return pageShell({
    title: comparison.title,
    description: comparison.summary,
    canonical,
    content,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": comparison.title,
      "description": comparison.summary,
      "dateModified": new Date().toISOString()
    }
  });
}

function makeTagPage(tag, posts) {
  const canonical = `${baseUrl}/tags/${slugify(tag)}/`;
  const content = `<main>
    <h1>${esc(tag)} 最新情报</h1>
    <p>Hermes 自动整理的 ${esc(tag)} 相关 AI 工具变化、判断和来源。</p>
    <div class="feed">${posts.map(feedItem).join("")}</div>
  </main>`;
  return pageShell({ title: `${tag} 最新情报`, description: `${tag} 相关 AI 工具更新和中文判断。`, canonical, content });
}

function makeWeeklyPage(posts) {
  const canonical = `${baseUrl}/weekly/latest/`;
  const tags = [...new Set(posts.map(post => post.tag))];
  const content = `<main>
    <h1>本周 AI 工具雷达</h1>
    <p>本周最值得关注的是：${esc(tags.slice(0, 4).join("、"))}。重点不是发生了多少更新，而是哪几件事会改变真实工作流。</p>
    <h2>本周精选</h2>
    <div class="feed">${posts.slice(0, 9).map(feedItem).join("")}</div>
    <h2>本周判断</h2>
    <ul>
      <li>AI 编程工具正在从补全走向任务执行。</li>
      <li>计费、权限和数据边界会变成团队采用 AI 工具的关键问题。</li>
      <li>创意工具和 Agent 连接器开始进入真实生产流程。</li>
    </ul>
  </main>`;
  return pageShell({ title: "本周 AI 工具雷达", description: "本周 AI 工具更新、中文判断和使用建议。", canonical, content });
}

function makeIndex(posts, data) {
  const content = `<main>
    <section class="hero">
      <h1>今日 AI 工具流</h1>
      <p>给中文用户看的 AI 工具每日读物：更新、价格、风险、适合谁用，以及该不该换工具。</p>
      ${topicBar(posts)}
    </section>
    <div class="view-row"><h2>今日情报</h2>${viewTabs()}</div>
    <div class="feed">${posts.slice(0, 9).map(feedItem).join("")}</div>
    <h2>按任务找工具</h2>
    <div class="grid">${data.tasks.map(task => card(task.title, `/tasks/${task.slug}/`, task.summary)).join("")}</div>
    <h2>工具档案</h2>
    <div class="grid">${data.tools.map(tool => card(tool.name, `/tools/${tool.slug}/`, tool.summary)).join("")}</div>
  </main>`;
  return pageShell({ title: "今日 AI 工具流", description: siteDescription, canonical: `${baseUrl}/`, content });
}

function makeListing(title, description, items, basePath) {
  const content = `<main><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="grid">${items.map(item => card(item.title || item.name, `/${basePath}/${item.slug}/`, item.summary)).join("")}</div></main>`;
  return pageShell({ title, description, canonical: `${baseUrl}/${basePath}/`, content });
}

function rss(posts) {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
<title>${esc(siteName)}</title>
<link>${baseUrl}/</link>
<description>${esc(siteDescription)}</description>
${posts.slice(0, 30).map(post => `<item><title>${esc(post.title)}</title><link>${baseUrl}/posts/${postSlug(post)}/</link><description>${esc(post.summary)}</description><guid>${baseUrl}/posts/${postSlug(post)}/</guid></item>`).join("")}
</channel></rss>`;
}

function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `<url><loc>${esc(url)}</loc><lastmod>${new Date().toISOString()}</lastmod></url>`).join("\n")}
</urlset>`;
}

async function main() {
  const autoPosts = parseAutoPosts(await readFile(path.join(root, "content", "auto-posts.js"), "utf8"));
  const data = JSON.parse(await readFile(path.join(root, "content", "decision-data.json"), "utf8"));
  await rm(siteDir, { recursive: true, force: true });
  await mkdir(siteDir, { recursive: true });

  const urls = new Set([`${baseUrl}/`]);
  await writePage("index.html", makeIndex(autoPosts, data));
  await writePage("tools/index.html", makeListing("AI 工具档案", "按工具查看适合场景、风险和最新变化。", data.tools, "tools"));
  await writePage("tasks/index.html", makeListing("AI 工具任务指南", "按你要完成的任务选择工具。", data.tasks, "tasks"));
  await writePage("compare/index.html", makeListing("AI 工具对比", "按真实场景比较 AI 工具，而不是只看参数。", data.comparisons, "compare"));

  urls.add(`${baseUrl}/tools/`);
  urls.add(`${baseUrl}/tasks/`);
  urls.add(`${baseUrl}/compare/`);

  for (const post of autoPosts) {
    const file = `posts/${postSlug(post)}/index.html`;
    await writePage(file, makePostPage(post));
    urls.add(`${baseUrl}/posts/${postSlug(post)}/`);
  }
  for (const tool of data.tools) {
    await writePage(`tools/${tool.slug}/index.html`, makeToolPage(tool, autoPosts));
    urls.add(`${baseUrl}/tools/${tool.slug}/`);
  }
  for (const task of data.tasks) {
    await writePage(`tasks/${task.slug}/index.html`, makeTaskPage(task, data.tools));
    urls.add(`${baseUrl}/tasks/${task.slug}/`);
  }
  for (const comparison of data.comparisons) {
    await writePage(`compare/${comparison.slug}/index.html`, makeComparisonPage(comparison, data.tools));
    urls.add(`${baseUrl}/compare/${comparison.slug}/`);
  }

  const tags = [...new Set(autoPosts.map(post => post.tag))];
  await writePage("tags/index.html", pageShell({
    title: "AI 工具标签",
    description: "按标签浏览 AI 工具情报。",
    canonical: `${baseUrl}/tags/`,
    content: `<main><h1>AI 工具标签</h1><div class="grid">${tags.map(tag => card(tag, `/tags/${slugify(tag)}/`, `${tag} 相关更新和中文判断。`)).join("")}</div></main>`
  }));
  urls.add(`${baseUrl}/tags/`);
  for (const tag of tags) {
    const related = autoPosts.filter(post => post.tag === tag);
    await writePage(`tags/${slugify(tag)}/index.html`, makeTagPage(tag, related));
    urls.add(`${baseUrl}/tags/${slugify(tag)}/`);
  }

  await writePage("weekly/index.html", makeWeeklyPage(autoPosts));
  await writePage("weekly/latest/index.html", makeWeeklyPage(autoPosts));
  urls.add(`${baseUrl}/weekly/`);
  urls.add(`${baseUrl}/weekly/latest/`);

  await writePage("rss.xml", rss(autoPosts));
  await writePage("sitemap.xml", sitemap([...urls]));
  await writePage("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  await writePage("_headers", `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);
  await writePage("llms.txt", `# ${siteName}\n\n${siteDescription}\n\n## 重点页面\n- ${baseUrl}/tools/\n- ${baseUrl}/tasks/\n- ${baseUrl}/compare/\n- ${baseUrl}/weekly/latest/\n\n## 内容说明\nHermes 每天抓取一手来源，生成中文标题、中文摘要、工具判断和原文链接。\n`);

  console.log(`site pages generated: ${urls.size}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
