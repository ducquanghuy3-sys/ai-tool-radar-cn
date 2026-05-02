import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const autoPublishScript = path.join(root, "tools", "auto-publish.mjs");
const buildSiteScript = path.join(root, "tools", "build-site.mjs");
const autoPostsPath = path.join(root, "content", "auto-posts.js");
const reviewQueuePath = path.join(root, "content", "review-queue.json");
const reportJsPath = path.join(root, "content", "hermes-report.js");
const reportJsonPath = path.join(root, "content", "hermes-report.json");

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: root,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) resolve();
      else reject(new Error(`Hermes stopped with exit code ${code}`));
    });
  });
}

function parseAutoPosts(value) {
  return JSON.parse(value.replace(/^window\.AUTO_POSTS\s*=\s*/, "").replace(/;\s*$/, ""));
}

async function writeHermesReport() {
  const autoPosts = parseAutoPosts(await readFile(autoPostsPath, "utf8"));
  const reviewQueue = JSON.parse(await readFile(reviewQueuePath, "utf8"));
  const report = {
    agent: "Hermes",
    ranAt: new Date().toISOString(),
    status: "ok",
    publishedCount: autoPosts.length,
    reviewCount: reviewQueue.length,
    publishedTitles: autoPosts.map(item => item.title),
    reviewTitles: reviewQueue.slice(0, 12).map(item => item.chineseTitle || item.title),
    stages: [
      "抓取来源",
      "过滤低质量内容",
      "生成中文标题和判断",
      "自动发布高置信内容",
      "把不确定内容放进待审",
      "生成静态网站页面"
    ]
  };

  await writeFile(reportJsonPath, JSON.stringify(report, null, 2), "utf8");
  await writeFile(reportJsPath, `window.HERMES_REPORT = ${JSON.stringify(report, null, 2)};\n`, "utf8");
  return report;
}

async function main() {
  console.log("Hermes started: crawl, analyze, localize, publish");
  await runNodeScript(autoPublishScript);
  await runNodeScript(buildSiteScript);
  const report = await writeHermesReport();
  console.log(`Hermes finished: published=${report.publishedCount} review=${report.reviewCount}`);
}

main().catch(async error => {
  const report = {
    agent: "Hermes",
    ranAt: new Date().toISOString(),
    status: "error",
    error: error.message,
    publishedCount: 0,
    reviewCount: 0,
    publishedTitles: [],
    reviewTitles: [],
    stages: ["抓取来源", "分析失败"]
  };

  await writeFile(reportJsPath, `window.HERMES_REPORT = ${JSON.stringify(report, null, 2)};\n`, "utf8").catch(() => {});
  await writeFile(reportJsonPath, JSON.stringify(report, null, 2), "utf8").catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
