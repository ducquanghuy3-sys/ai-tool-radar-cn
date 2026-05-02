import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcesPath = path.join(root, "content", "sources.json");
const autoPostsPath = path.join(root, "content", "auto-posts.js");
const reviewQueuePath = path.join(root, "content", "review-queue.json");

const rejectPatterns = [
  /\btop\s+\d+\b/i,
  /\b\d+\s+(tips|tricks|prompts|secrets)\b/i,
  /\bbest\s+ai\s+tools\b/i,
  /coupon|discount|deal/i,
  /banner/i,
  /排名|榜单|优惠|折扣|邀请码/
];

const rejectTitles = new Set([
  "ai agents",
  "claude",
  "claude code",
  "claude code enterprise",
  "claude code security",
  "github copilot",
  "google deepmind",
  "gemini models",
  "developer tools",
  "gemini app",
  "notebooklm",
  "inside claude code",
  "try github copilot cli",
  "see what's new"
]);

const tagRules = [
  ["视觉生成", /video|design|creative|blender|adobe|canva|3d/i],
  ["Claude Code", /claude code|opus|sonnet|anthropic|claude/i],
  ["Codex", /codex|openai.+coding|coding agent/i],
  ["MCP", /\bmcp\b|model context protocol|connector|connectors/i],
  ["模型发布", /model|gpt|gemini|opus|sonnet|haiku|deepmind/i],
  ["成本优化", /pricing|billing|price|cost|credits|计费|价格|成本/i],
  ["AI 自动化", /agent|agents|automation|workflow|workspace|copilot/i],
  ["知识库", /rag|knowledge|memory|notebooklm|retrieval/i]
];

const titleTranslations = new Map([
  ["Copilot cloud agent starts 20% faster with Actions custom images", "Copilot 云端 Agent 启动提速 20%，可用自定义 Actions 镜像"],
  ["GitHub Copilot CLI for Beginners: Interactive v. non-interactive mode", "GitHub Copilot CLI 入门：交互模式和非交互模式怎么选"],
  ["GitHub Copilot is moving to usage-based billing", "GitHub Copilot 改成按用量计费，重度用户要重新算账"],
  ["Changes to GitHub Copilot Individual plans", "GitHub 调整 Copilot 个人计划，使用限制需要重新关注"],
  ["Updates to GitHub Copilot interaction data usage policy", "GitHub 更新 Copilot 交互数据使用政策，团队要重新确认数据边界"],
  ["Claude for Creative Work", "Claude 接入创意工具，设计、3D 和音视频流程开始连起来"],
  ["OpenAI models, Codex, and Managed Agents come to AWS", "OpenAI 模型、Codex 和 Managed Agents 接入 AWS"],
  ["Introducing workspace agents in ChatGPT", "ChatGPT 推出 Workspace Agents，团队可以共享工作流 Agent"],
  ["Introducing Claude Opus 4.7", "Claude Opus 4.7 发布，长任务和代码能力继续增强"],
  ["Introducing Claude Design by Anthropic Labs", "Anthropic 推出 Claude Design，开始进入设计工作流"]
]);

function stripTags(value) {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title) {
  return stripTags(title)
    .replace(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+(Announcements|Product|Research|Engineering|Company)\s+/i, "")
    .replace(/\s*[|｜-]\s*(OpenAI|Anthropic|GitHub Blog|Google).*$/i, "")
    .trim();
}

function scoreCandidate(source, title, url) {
  const haystack = `${title} ${url}`;
  const simpleTitle = title.toLowerCase().replace(/\s+/g, " ").trim();
  if (rejectTitles.has(simpleTitle)) return 0;
  if (rejectPatterns.some(pattern => pattern.test(haystack))) return 0;
  if (Array.isArray(source.allowUrlIncludes) && source.allowUrlIncludes.length) {
    const allowed = source.allowUrlIncludes.some(piece => url.includes(piece));
    if (!allowed) return 0;
  }
  const keywords = source.includeKeywords || [];
  const keywordMatches = keywords.filter(keyword => haystack.toLowerCase().includes(String(keyword).toLowerCase())).length;
  if (keywords.length && keywordMatches === 0) return 0;
  let score = Number(source.weight || 50);
  for (const keyword of keywords) {
    if (haystack.toLowerCase().includes(String(keyword).toLowerCase())) score += 16;
  }
  if (/release|launch|introducing|announcing|pricing|billing|sdk|agent|codex|claude|copilot/i.test(haystack)) score += 18;
  if (/\/news\/|\/index\/|github\.blog|openai\.com|anthropic\.com/.test(url)) score += 10;
  return score;
}

function tagFor(candidate, fallback) {
  const haystack = `${candidate.title} ${candidate.url}`;
  const match = tagRules.find(([, pattern]) => pattern.test(haystack));
  return match ? match[0] : fallback || "Agents";
}

function summaryFor(candidate) {
  const tag = candidate.tag;
  if (tag === "成本优化") return "这条会影响团队预算和工具选择，适合尽早看清计费口径，再决定是否调整使用方式。";
  if (tag === "MCP") return "这条和工具连接、工作流接入有关，适合判断 AI 工具是否能进入真实生产流程。";
  if (tag === "Codex" || tag === "Claude Code") return "这条和 AI 编程工具的能力边界有关，适合开发者和团队负责人评估是否更新工作流。";
  if (tag === "模型发布") return "这条涉及模型能力变化，重点看它会影响哪些具体任务，而不是只看参数和榜单。";
  if (tag === "视觉生成") return "这条进入创意和设计流程，适合关注图像、视频、3D 或内容生产的人。";
  return "这条和 Agent、自动化或团队流程有关，适合判断能不能在一周内试用或改造成自己的流程。";
}

function chineseTitleFor(candidate, tag) {
  const exact = titleTranslations.get(candidate.title);
  if (exact) return exact;

  const title = candidate.title;
  const domain = new URL(candidate.url).hostname.replace(/^www\./, "");
  if (/usage-based billing|billing|pricing|credits/i.test(title)) {
    return `${title.replace(/GitHub /i, "GitHub ").replace(/Copilot/i, "Copilot")}：计费方式变化，重度用户需要重新算账`;
  }
  if (/CLI/i.test(title) && /Copilot/i.test(title)) {
    return "GitHub Copilot CLI 新内容：适合命令行用户关注";
  }
  if (/cloud agent|agent/i.test(title) && /Copilot/i.test(title)) {
    return "GitHub Copilot Agent 更新：云端执行速度和工作流继续优化";
  }
  if (/Claude/i.test(title) && /creative|design|blender|adobe|canva/i.test(`${title} ${candidate.url}`)) {
    return "Claude 进入创意工具链，设计和 3D 工作流值得关注";
  }
  if (/OpenAI/i.test(title) && /AWS|Bedrock/i.test(`${title} ${candidate.url}`)) {
    return "OpenAI 能力进入 AWS，企业部署路径更清晰";
  }
  if (tag === "成本优化") return `${domain} 发布计费变化，AI 工具预算要重新评估`;
  if (tag === "MCP") return `${domain} 出现新的工具连接线索，值得看它怎么接入工作流`;
  if (tag === "视觉生成") return `${domain} 发布创意工作流更新，设计和内容团队可关注`;
  if (tag === "Claude Code") return `${domain} 发布 Claude 相关更新，重点看真实工作流影响`;
  if (tag === "Codex") return `${domain} 发布 Codex 相关更新，适合开发者评估`;
  return `${domain} 发布 AI 工具更新，适合判断是否纳入日常流程`;
}

function chineseWhyFor(candidate, tag) {
  const title = candidate.title;
  if (/usage-based billing|billing|pricing|credits/i.test(title)) {
    return "这会直接影响个人和团队的 AI 工具成本。Agent 工作越长、调用越多，预算管理就越不能只看月费。";
  }
  if (/interaction data|data usage policy/i.test(title)) {
    return "这关系到工具会如何使用交互数据。团队采用 Copilot 前，需要重新确认数据边界和内部合规要求。";
  }
  if (/Individual plans/i.test(title)) {
    return "这会影响个人用户的使用额度和升级判断。重度用户需要重新看限制、价格和替代方案。";
  }
  if (/cloud agent|custom images/i.test(title)) {
    return "这说明 Copilot Agent 正在往更稳定的云端执行环境走。对团队来说，启动速度和运行环境可控性都会影响真实使用体验。";
  }
  if (/CLI/i.test(title) && /Copilot/i.test(title)) {
    return "命令行 Agent 的价值不只在补全命令，而在能否进入脚本、排错和自动化流程。这篇适合做入门判断。";
  }
  if (/Creative Work|creative|Blender|Adobe|Canva/i.test(title)) {
    return "这说明 AI 工具正在进入设计、3D、音视频等专业软件，而不只是聊天窗口。中文创意团队可以开始关注连接器生态。";
  }
  return summaryFor({ ...candidate, tag });
}

function audienceFor(tag) {
  if (tag === "成本优化") return ["AI 工具重度用户", "团队预算负责人", "需要管理 Copilot 或 Agent 成本的人"];
  if (tag === "视觉生成") return ["设计师", "内容团队", "3D、视频或创意工具用户"];
  if (tag === "Claude Code" || tag === "Codex") return ["开发者", "研发团队负责人", "AI 编程工具用户"];
  if (tag === "MCP") return ["Agent 工具开发者", "自动化流程负责人", "想接入内部工具的人"];
  return ["AI 工具重度用户", "团队流程负责人", "需要跟踪一手变化的人"];
}

function chineseEdit(candidate, tag) {
  return {
    title: chineseTitleFor(candidate, tag),
    summary: chineseWhyFor(candidate, tag),
    audience: audienceFor(tag)
  };
}

function extractLinks(source, html) {
  const links = [];
  const seen = new Set();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    let url;
    try {
      url = new URL(match[1], source.url).toString();
    } catch {
      continue;
    }
    if (!url.startsWith("http")) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const title = normalizeTitle(match[2]);
    if (title.length < 8 || title.length > 120) continue;
    const score = scoreCandidate(source, title, url);
    if (!score) continue;
    links.push({ title, url, source: source.name, sourceUrl: source.url, score });
  }
  return links;
}

function toPost(candidate, index) {
  const domain = new URL(candidate.url).hostname.replace(/^www\./, "");
  const tag = tagFor(candidate, candidate.defaultTag);
  const cn = chineseEdit(candidate, tag);
  const idSeed = `${domain}-${candidate.title}`.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").slice(0, 90);
  return {
    id: `auto-${idSeed || index}`,
    title: cn.title,
    originalTitle: candidate.title,
    url: candidate.url,
    source: domain,
    tag,
    type: "自动发布",
    score: Math.min(520, candidate.score),
    comments: 0,
    hoursAgo: 0,
    editor: "自动中文编辑",
    summary: cn.summary,
    audience: cn.audience,
    commentsSample: [["自动中文编辑", `原题：${candidate.title}。来源：${candidate.source}。已自动改写为中文标题和中文判断。`]]
  };
}

async function main() {
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  const published = [];
  const review = [];
  const seenUrls = new Set();

  for (const source of sources) {
    let html = "";
    try {
      const response = await fetch(source.url, {
        headers: {
          "user-agent": "AI-Tool-Radar-CN/0.1 (+local editorial bot)"
        }
      });
      html = await response.text();
    } catch (error) {
      review.push({
        title: `${source.name} 抓取失败`,
        url: source.url,
        source: source.name,
        reason: error.message
      });
      continue;
    }

    const candidates = extractLinks(source, html)
      .filter(candidate => !seenUrls.has(candidate.url))
      .sort((a, b) => b.score - a.score)
      .slice(0, source.mode === "auto" ? 5 : 8);

    for (const candidate of candidates) {
      seenUrls.add(candidate.url);
      const enriched = { ...candidate, defaultTag: source.defaultTag };
      if (source.mode === "auto" && candidate.score >= 100) {
        published.push(enriched);
      } else {
        const reviewTag = tagFor(enriched, enriched.defaultTag);
        const cn = chineseEdit(enriched, reviewTag);
        review.push({ ...enriched, tag: reviewTag, chineseTitle: cn.title, chineseSummary: cn.summary, reason: "需要人工判断是否适合中文读者" });
      }
    }
  }

  await mkdir(path.dirname(autoPostsPath), { recursive: true });
  const posts = published
    .sort((a, b) => b.score - a.score)
    .slice(0, 24)
    .map(toPost);

  await writeFile(autoPostsPath, `window.AUTO_POSTS = ${JSON.stringify(posts, null, 2)};\n`, "utf8");
  await writeFile(reviewQueuePath, JSON.stringify(review.slice(0, 60), null, 2), "utf8");

  console.log(`published=${posts.length} review=${review.length}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
