import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/research-expert");

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
});

test("technology-search 可作为模块导入且能读取 sources.json", async () => {
  const mod = await import(resolve(pluginRoot, "skills/technology-search/scripts/search_news.mjs"));
  const loadSources = mod.loadSources ?? mod.default?.loadSources;
  const sources = loadSources();

  assert.ok(Array.isArray(sources));
  assert.ok(sources.length > 0);
});

test("technology-search Node wrapper 通过语法检查", () => {
  const result = spawnSync("node", [
    "--check",
    resolve(pluginRoot, "skills/technology-search/scripts/search-news.mjs"),
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("technology-search Node wrapper 保留缺少关键词的错误路径", () => {
  const result = spawnSync("node", [
    resolve(pluginRoot, "skills/technology-search/scripts/search-news.mjs"),
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required argument <keyword>/);
  assert.match(result.stderr, /search_news\.mjs <keyword>/);
});

test("研究插件声明的 Python requirements 文件存在", () => {
  assert.ok(existsSync(resolve(pluginRoot, "skills/site-analyze/requirements.txt")));
  assert.ok(existsSync(resolve(pluginRoot, "skills/web-content-fetcher/requirements.txt")));
});

test("site-analyze env probe Node wrapper 通过语法检查", () => {
  for (const script of [
    "skills/site-analyze/scripts/00_probe_env.mjs",
    "skills/site-analyze/scripts/04_whois.mjs",
    "skills/site-analyze/scripts/05_ping.mjs",
    "skills/site-analyze/scripts/06_robots.mjs",
    "skills/site-analyze/sub/whois/04_whois.mjs",
    "skills/site-analyze/sub/ping/05_ping.mjs",
    "skills/site-analyze/sub/robots/06_robots.mjs",
  ]) {
    const result = spawnSync("node", [
      "--check",
      resolve(pluginRoot, script),
    ], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("site-analyze ping parser 提取 ICMP 统计", async () => {
  const mod = await import(resolve(pluginRoot, "skills/site-analyze/scripts/05_ping.mjs"));
  const parsed = mod.parseIcmpOutput(`5 packets transmitted, 4 received, 20% packet loss, time 4004ms
rtt min/avg/max/mdev = 10.123/20.456/30.789/1.234 ms
`, "example.com", 5);

  assert.equal(parsed.method, "icmp");
  assert.equal(parsed.host, "example.com");
  assert.equal(parsed.count, 5);
  assert.equal(parsed.packet_loss_pct, 20);
  assert.equal(parsed.received, 4);
  assert.equal(parsed.rtt_min_ms, 10.123);
  assert.equal(parsed.rtt_avg_ms, 20.456);
  assert.equal(parsed.rtt_max_ms, 30.789);
  assert.equal(parsed.rtt_mdev_ms, 1.234);
});

test("site-analyze robots parser 保留连续 User-agent 规则组", async () => {
  const mod = await import(resolve(pluginRoot, "skills/site-analyze/scripts/06_robots.mjs"));
  const parsed = mod.parseRobotsTxt(`User-agent: *
User-agent: googlebot
Disallow: /private
Allow: /private/public
Crawl-delay: 2.5
Sitemap: https://example.com/sitemap.xml

User-agent: bingbot
Disallow: /
`);

  assert.deepEqual(parsed.rules["*"].disallow, ["/private"]);
  assert.deepEqual(parsed.rules.googlebot.allow, ["/private/public"]);
  assert.equal(parsed.crawl_delay["*"], 2.5);
  assert.equal(parsed.crawl_delay.googlebot, 2.5);
  assert.equal(parsed.assessments["*"], "partial");
  assert.equal(parsed.assessments.googlebot, "partial");
  assert.equal(parsed.assessments.bingbot, "blocked");
  assert.deepEqual(parsed.sitemaps, ["https://example.com/sitemap.xml"]);
  assert.equal(parsed.total_agents, 3);
});

test("site-analyze env probe 复用已有缓存且不触发网络探测", () => {
  const home = mkdtempSync(join(tmpdir(), "site-analyze-home-"));
  const envFile = join(home, ".site-analyzer-env.json");
  writeFileSync(envFile, '{"my_ip":"127.0.0.1","country":"local"}\n', "utf-8");

  try {
    const result = spawnSync("node", [
      resolve(pluginRoot, "skills/site-analyze/scripts/00_probe_env.mjs"),
    ], {
      encoding: "utf-8",
      env: { ...process.env, HOME: home },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Already probed/);
    assert.match(result.stdout, /"my_ip":"127\.0\.0\.1"/);
    assert.equal(result.stderr, "");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("site-analyze whois parser 提取域名与 IP 字段", async () => {
  const mod = await import(resolve(pluginRoot, "skills/site-analyze/scripts/04_whois.mjs"));
  const parsed = mod.parseWhois(`Registrar: Example Registrar
Creation Date: 2024-01-01T00:00:00Z
Domain Status: clientTransferProhibited
Domain Status: clientUpdateProhibited
Name Server: NS1.EXAMPLE.COM
Name Server: NS1.EXAMPLE.COM
OrgName: Example Network
CIDR: 203.0.113.0/24
country: US
`, "example.com");

  assert.equal(parsed.target, "example.com");
  assert.equal(parsed.registrar, "Example Registrar");
  assert.deepEqual(parsed.status, ["clientTransferProhibited", "clientUpdateProhibited"]);
  assert.deepEqual(parsed.name_servers, ["NS1.EXAMPLE.COM"]);
  assert.equal(parsed.orgname, "Example Network");
  assert.equal(parsed.cidr, "203.0.113.0/24");
  assert.equal(parsed.country, "US");
});
