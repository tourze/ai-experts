#!/usr/bin/env node
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

function robotUrls(domain) {
  if (!domain.startsWith("http")) {
    return [`https://${domain}/robots.txt`, `http://${domain}/robots.txt`];
  }
  const parsed = new URL(domain);
  return [`${parsed.protocol}//${parsed.host}/robots.txt`];
}

async function fetchWithRedirects(url, options = {}) {
  const redirectChain = [];
  let currentUrl = url;
  for (let redirects = 0; redirects <= (options.maxRedirects ?? 10); redirects += 1) {
    const response = await fetch(currentUrl, {
      headers: HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });

    if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
      redirectChain.push(currentUrl);
      currentUrl = new URL(response.headers.get("location"), currentUrl).href;
      continue;
    }

    const content = Buffer.from(await response.arrayBuffer());
    return {
      url,
      final_url: currentUrl,
      status_code: response.status,
      content_type: response.headers.get("content-type") ?? "",
      content_length: content.length,
      text: response.status === 200 ? content.toString("utf-8") : null,
      redirect_chain: redirectChain,
    };
  }
  throw new Error("too many redirects");
}

export async function fetchRobots(domain, options = {}) {
  const urlsToTry = robotUrls(domain);
  let lastError = null;

  for (const url of urlsToTry) {
    try {
      return await fetchWithRedirects(url, options);
    } catch (error) {
      lastError = error.message;
    }
  }

  return { url: urlsToTry[0], error: lastError ?? "unknown" };
}

export function parseRobotsTxt(text) {
  if (!text) {
    return {};
  }

  const rules = {};
  const sitemaps = [];
  const currentAgents = [];
  const crawlDelay = {};
  let currentBlockHasRules = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes(":")) {
      continue;
    }

    const [rawKey, ...valueParts] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = valueParts.join(":").trim();

    if (key === "user-agent") {
      if (currentBlockHasRules) {
        currentAgents.length = 0;
        currentBlockHasRules = false;
      }
      if (value) {
        currentAgents.push(value);
      }
      for (const agent of currentAgents) {
        if (!rules[agent]) {
          rules[agent] = { allow: [], disallow: [] };
        }
      }
    } else if (key === "allow") {
      currentBlockHasRules = true;
      for (const agent of currentAgents) {
        if (rules[agent]) {
          rules[agent].allow.push(value);
        }
      }
    } else if (key === "disallow") {
      currentBlockHasRules = true;
      for (const agent of currentAgents) {
        if (rules[agent]) {
          rules[agent].disallow.push(value);
        }
      }
    } else if (key === "sitemap") {
      sitemaps.push(value);
    } else if (key === "crawl-delay") {
      currentBlockHasRules = true;
      for (const agent of currentAgents) {
        const delay = Number.parseFloat(value);
        if (!Number.isNaN(delay)) {
          crawlDelay[agent] = delay;
        }
      }
    }
  }

  const assessments = {};
  for (const [agent, agentRules] of Object.entries(rules)) {
    const disallows = agentRules.disallow ?? [];
    const allows = agentRules.allow ?? [];
    if (disallows.includes("/") && !allows.length) {
      assessments[agent] = "blocked";
    } else if (disallows.length) {
      assessments[agent] = "partial";
    } else {
      assessments[agent] = "allowed";
    }
  }

  return {
    rules,
    sitemaps,
    crawl_delay: crawlDelay,
    assessments,
    total_agents: Object.keys(rules).length,
  };
}

export function summarize(parsed) {
  const assessments = parsed.assessments ?? {};
  const rules = parsed.rules ?? {};
  const sitemaps = parsed.sitemaps ?? [];
  const crawlDelay = parsed.crawl_delay ?? {};
  const lines = [];

  for (const agent of ["*", "googlebot", "bingbot", "baiduspider", "yandexbot"]) {
    if (assessments[agent]) {
      const status = assessments[agent];
      const emoji = status === "allowed" ? "✅" : status === "blocked" ? "🚫" : "⚠️";
      const agentRules = rules[agent];
      const delay = crawlDelay[agent] || "";
      const delayText = delay ? `  crawl-delay=${delay}` : "";
      lines.push(`  ${emoji} ${agent}: ${status}${delayText}`);
      if (agentRules.disallow.length) {
        const disallowSummary = agentRules.disallow.slice(0, 5).join(", ");
        const suffix = agentRules.disallow.length > 5 ? "..." : "";
        lines.push(`     Disallow(${agentRules.disallow.length}): ${disallowSummary}${suffix}`);
      }
    }
  }

  if (sitemaps.length) {
    lines.push(`\n  Sitemaps (${sitemaps.length}): ${sitemaps.slice(0, 3).join(", ")}`);
  }

  return lines.join("\n");
}

export async function run(domain, { asJson = false } = {}) {
  const fetchResult = await fetchRobots(domain);
  const result = {
    domain,
    fetch: fetchResult,
  };

  if (fetchResult.text) {
    const parsed = parseRobotsTxt(fetchResult.text);
    result.parsed = parsed;
    result.summary = summarize(parsed);
  } else if (fetchResult.status_code) {
    result.note = `HTTP ${fetchResult.status_code} - no robots.txt content`;
  } else {
    result.note = `Fetch failed: ${fetchResult.error ?? "unknown"}`;
  }

  if (asJson) {
    const output = { ...result, fetch: { ...result.fetch } };
    delete output.fetch.text;
    console.log(JSON.stringify(output, null, 2));
  } else {
    const status = fetchResult.status_code ?? "ERR";
    const finalUrl = fetchResult.final_url ?? fetchResult.url ?? "?";
    console.log(`\n=== robots.txt: ${domain} ===`);
    console.log(`  URL: ${finalUrl}  [HTTP ${status}]`);
    if (fetchResult.redirect_chain?.length) {
      console.log(`  重定向: ${fetchResult.redirect_chain.join(" -> ")}`);
    }
    if (result.summary) {
      console.log("\n爬虫规则摘要:");
      console.log(result.summary);
    } else if (result.note) {
      console.log(`  ${result.note}`);
    }
    console.log();
  }

  return result;
}

export async function main(argv = process.argv.slice(2)) {
  const args = { domain: null, json: false };
  for (const arg of argv) {
    if (arg === "--json") {
      args.json = true;
    } else if (!args.domain) {
      args.domain = arg;
    } else {
      console.error(`Unexpected argument: ${arg}`);
      return 1;
    }
  }
  if (!args.domain) {
    console.error("Usage: node 06_robots.mjs <domain_or_url> [--json]");
    return 1;
  }

  try {
    await run(args.domain, { asJson: args.json });
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
