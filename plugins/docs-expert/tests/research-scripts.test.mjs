import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/docs-expert");

test("web-content-fetcher Node wrapper 通过语法检查", () => {
  const result = spawnSync("node", [
    "--check",
    resolve(pluginRoot, "skills/web-content-fetcher/scripts/fetch.mjs"),
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("web-content-fetcher 从本地 HTML 提取正文并保留懒加载图片", async () => {
  const mod = await import(resolve(pluginRoot, "skills/web-content-fetcher/scripts/fetch.mjs"));
  const markdown = mod.htmlToMarkdown(`
    <article>
      <h1>标题</h1>
      <p>这是一段正文，包含 <a href="https://example.com">链接</a>。</p>
      <img data-src="https://example.com/a.png" src="data:image/gif;base64,x" alt="示例图">
    </article>
  `);

  assert.match(markdown, /# 标题/);
  assert.match(markdown, /\[链接\]\(https:\/\/example\.com\)/);
  assert.match(markdown, /!\[示例图\]\(https:\/\/example\.com\/a\.png\)/);
});

test("web-content-fetcher CLI JSON 输出正文元数据", () => {
  const body = "<article><h1>Local Article</h1><p>" + "content ".repeat(80) + "</p></article>";
  const result = spawnSync("node", [
    resolve(pluginRoot, "skills/web-content-fetcher/scripts/fetch.mjs"),
    `data:text/html,${encodeURIComponent(body)}`,
    "--json",
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mode, "fast");
  assert.equal(parsed.selector, "article");
  assert.match(parsed.content, /# Local Article/);
});
