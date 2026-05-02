import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "site");
const baseUrl = process.env.SITE_URL || "https://example.com";
const siteName = "AI 工具雷达";
const siteDescription = "中文 AI 工具决策引擎：每日情报、工具档案、任务指南、对比页面和自动周报。";

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
    :root{--paper:#f7f8f3;--ink:#151515;--muted:#62655e;--line:#d7d9cf;--red:#c8352e;--teal:#0f766e;--white:#fffef8}
    *{box-sizing:border-box} body{margin:0;background:linear-gradient(90deg,rgba(21,21,21,.035) 1px,transparent 1px) 0 0/32px 32px,var(--paper);color:var(--ink);font-family:"Noto Serif CJK SC","Songti SC","SimSun",serif}
    a{color:inherit;text-decoration:none} .wrap{width:min(1120px,100%);margin:0 auto;padding:18px}
    header{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:10px 0}
    .brand{font-size:1.45rem;font-weight:900}.tagline{display:block;color:var(--muted);font:13px "Microsoft YaHei",sans-serif;margin-top:3px}
    nav{display:flex;gap:6px;flex-wrap:wrap} nav a,.pill{border:1px solid var(--line);background:var(--white);border-radius:6px;padding:6px 10px;font:13px "Microsoft YaHei",sans-serif}
    h1{font-size:2.45rem;line-height:1.15;margin:28px 0 12px} h2{font-size:1.35rem;border-bottom:2px solid var(--ink);padding-bottom:8px;margin:28px 0 12px}
    p,li{font-size:1rem;line-height:1.85}.muted{color:var(--muted);font-family:"Microsoft YaHei",sans-serif}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .card{border:1px solid var(--ink);background:var(--white);padding:14px;border-radius:6px}.card h3{margin:0 0 8px;font-size:1.08rem}.card p{margin:0;color:#333}
    .meta{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.source{word-break:break-all;color:var(--teal)}
    table{width:100%;border-collapse:collapse;background:var(--white)}td,th{border:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}th{background:#efefe7}
    footer{border-top:1px solid var(--ink);margin-top:34px;padding-top:12px;color:var(--muted);font:13px "Microsoft YaHei",sans-serif}
    @media(max-width:760px){header{grid-template-columns:1fr}.grid{grid-template-columns:1fr}h1{font-size:1.8rem}}
  </style>
  ${json}
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/">${siteName}<span class="tagline">帮中文用户判断该用什么 AI 工具</span></a>
      <nav>
        <a href="/">首页</a>
        <a href="/tools/">工具</a>
        <a href="/tasks/">任务</a>
        <a href="/compare/">对比</a>
        <a href="/weekly/">周报</a>
        <a href="/tags/">标签</a>
      </nav>
    </header>
    ${content}
    <footer>由 Hermes 自动更新。所有页面保留原始来源链接，中文判断用于帮助读者决策。</footer>
  </div>
</body>
</html>`;
}

function card(title, href, text, extra = "") {
  return `<a class="card" href="${href}"><h3>${esc(title)}</h3><p>${esc(text)}</p>${extra}</a>`;
}

function postSlug(post) {
  return `${slugify(post.title)}-${post.id.replace(/^auto-/, "").slice(0, 18)}`;
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
    <div class="grid">${posts.map(post => card(post.title, `/posts/${postSlug(post)}/`, post.summary, `<div class="meta"><span class="pill">${esc(post.source)}</span></div>`)).join("")}</div>
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
    <div class="grid">${posts.slice(0, 9).map(post => card(post.title, `/posts/${postSlug(post)}/`, post.summary)).join("")}</div>
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
    <h1>中文 AI 工具决策引擎</h1>
    <p>${siteDescription}</p>
    <h2>今日情报</h2>
    <div class="grid">${posts.slice(0, 9).map(post => card(post.title, `/posts/${postSlug(post)}/`, post.summary, `<div class="meta"><span class="pill">${esc(post.tag)}</span></div>`)).join("")}</div>
    <h2>按任务找工具</h2>
    <div class="grid">${data.tasks.map(task => card(task.title, `/tasks/${task.slug}/`, task.summary)).join("")}</div>
    <h2>工具档案</h2>
    <div class="grid">${data.tools.map(tool => card(tool.name, `/tools/${tool.slug}/`, tool.summary)).join("")}</div>
  </main>`;
  return pageShell({ title: "中文 AI 工具决策引擎", description: siteDescription, canonical: `${baseUrl}/`, content });
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
