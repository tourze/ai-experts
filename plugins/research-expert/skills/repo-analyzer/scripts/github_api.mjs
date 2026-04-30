#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

export class GitHubAPI {
  static BASE_URL = "https://api.github.com";

  constructor({ token = null, fetchImpl = globalThis.fetch } = {}) {
    if (!fetchImpl) {
      throw new Error("fetch is not available in this Node.js runtime");
    }
    this.fetchImpl = fetchImpl;
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Deep-Research-Bot/1.0",
    };
    if (token) {
      this.headers.Authorization = `token ${token}`;
    }
  }

  async get(endpoint, { params = null, accept = null } = {}) {
    const url = new URL(`${GitHubAPI.BASE_URL}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers = { ...this.headers };
    if (accept) {
      headers.Accept = accept;
    }

    const response = await this.fetchImpl(url, { headers });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
    }

    if ((accept ?? "").includes("application/vnd.github.raw")) {
      return response.text();
    }
    return response.json();
  }

  getRepoInfo(owner, repo) {
    return this.get(`/repos/${owner}/${repo}`);
  }

  async getReadme(owner, repo) {
    try {
      return await this.get(`/repos/${owner}/${repo}/readme`, {
        accept: "application/vnd.github.raw",
      });
    } catch (error) {
      return `[README not found: ${error.message}]`;
    }
  }

  async getTree(owner, repo, branch = "main", recursive = true) {
    const params = recursive ? { recursive: "1" } : {};
    try {
      return await this.get(`/repos/${owner}/${repo}/git/trees/${branch}`, { params });
    } catch (error) {
      if (branch === "main") {
        return this.get(`/repos/${owner}/${repo}/git/trees/master`, { params });
      }
      throw error;
    }
  }

  async getFileContent(owner, repo, path) {
    try {
      return await this.get(`/repos/${owner}/${repo}/contents/${path}`, {
        accept: "application/vnd.github.raw",
      });
    } catch (error) {
      return `[File not found: ${error.message}]`;
    }
  }

  getLanguages(owner, repo) {
    return this.get(`/repos/${owner}/${repo}/languages`);
  }

  getContributors(owner, repo, limit = 30) {
    return this.get(`/repos/${owner}/${repo}/contributors`, {
      params: { per_page: Math.min(limit, 100) },
    });
  }

  getRecentCommits(owner, repo, limit = 50, since = null) {
    const params = { per_page: Math.min(limit, 100) };
    if (since) {
      params.since = since;
    }
    return this.get(`/repos/${owner}/${repo}/commits`, { params });
  }

  getIssues(owner, repo, state = "all", limit = 30, labels = null) {
    const params = { state, per_page: Math.min(limit, 100) };
    if (labels) {
      params.labels = labels;
    }
    return this.get(`/repos/${owner}/${repo}/issues`, { params });
  }

  getPullRequests(owner, repo, state = "all", limit = 30) {
    return this.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state, per_page: Math.min(limit, 100) },
    });
  }

  getReleases(owner, repo, limit = 10) {
    return this.get(`/repos/${owner}/${repo}/releases`, {
      params: { per_page: Math.min(limit, 100) },
    });
  }

  getTags(owner, repo, limit = 20) {
    return this.get(`/repos/${owner}/${repo}/tags`, {
      params: { per_page: Math.min(limit, 100) },
    });
  }

  searchIssues(owner, repo, query, limit = 30) {
    return this.get("/search/issues", {
      params: {
        q: `repo:${owner}/${repo} ${query}`,
        per_page: Math.min(limit, 100),
      },
    });
  }

  getCommitActivity(owner, repo) {
    return this.get(`/repos/${owner}/${repo}/stats/commit_activity`);
  }

  getCodeFrequency(owner, repo) {
    return this.get(`/repos/${owner}/${repo}/stats/code_frequency`);
  }

  formatTree(treeData, maxDepth = 3) {
    if (!treeData.tree) {
      return "[Unable to parse tree]";
    }

    const lines = [];
    for (const item of treeData.tree) {
      const depth = (item.path.match(/\//g) ?? []).length;
      if (depth < maxDepth) {
        const indent = "  ".repeat(depth);
        const name = item.path.split("/").at(-1);
        lines.push(item.type === "tree" ? `${indent}${name}/` : `${indent}${name}`);
      }
    }
    return lines.slice(0, 100).join("\n");
  }

  async summarizeRepo(owner, repo) {
    const info = await this.getRepoInfo(owner, repo);
    const summary = {
      name: info.full_name,
      description: info.description,
      url: info.html_url,
      stars: info.stargazers_count,
      forks: info.forks_count,
      open_issues: info.open_issues_count,
      language: info.language,
      license: info.license ? info.license.spdx_id : null,
      created_at: info.created_at,
      updated_at: info.updated_at,
      pushed_at: info.pushed_at,
      default_branch: info.default_branch,
      topics: info.topics ?? [],
    };

    try {
      summary.languages = await this.getLanguages(owner, repo);
    } catch {
      summary.languages = {};
    }

    try {
      summary.contributor_count = (await this.getContributors(owner, repo, 100)).length;
    } catch {
      summary.contributor_count = "N/A";
    }

    try {
      const releases = await this.getReleases(owner, repo, 1);
      summary.latest_release = releases.length
        ? {
            tag: releases[0].tag_name,
            name: releases[0].name,
            date: releases[0].published_at,
          }
        : undefined;
    } catch {
      summary.latest_release = null;
    }

    return summary;
  }
}

function printUsage() {
  console.log("Usage: node github_api.mjs <owner> <repo> [command]");
  console.log("Commands: info, readme, tree, languages, contributors,");
  console.log("          commits, issues, prs, releases, tags, search-issues, summary");
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.length < 2) {
    printUsage();
    return 1;
  }

  const [owner, repo] = argv;
  const command = argv[2] ?? "summary";
  const api = new GitHubAPI({ token: env.GITHUB_TOKEN });

  const commands = {
    info: () => api.getRepoInfo(owner, repo),
    readme: () => api.getReadme(owner, repo),
    tree: async () => api.formatTree(await api.getTree(owner, repo)),
    languages: () => api.getLanguages(owner, repo),
    contributors: () => api.getContributors(owner, repo),
    commits: () => api.getRecentCommits(owner, repo),
    issues: () => api.getIssues(owner, repo),
    prs: () => api.getPullRequests(owner, repo),
    releases: () => api.getReleases(owner, repo),
    tags: () => api.getTags(owner, repo),
    "search-issues": () => api.searchIssues(owner, repo, argv.slice(3).join(" ").trim() || "is:issue"),
    summary: () => api.summarizeRepo(owner, repo),
  };

  if (!Object.hasOwn(commands, command)) {
    console.log(`Unknown command: ${command}`);
    return 1;
  }

  try {
    const result = await commands[command]();
    if (typeof result === "string") {
      console.log(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return 0;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
