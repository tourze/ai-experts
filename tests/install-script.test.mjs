import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");
const installScript = join(repoRoot, "scripts/install.mjs");
const syncMcpScript = join(repoRoot, "scripts/sync-mcp.mjs");

function writeExecutable(path, content) {
  writeFileSync(path, content, "utf-8");
  chmodSync(path, 0o755);
}

function isolatedEnv(overrides = {}) {
  const env = { ...process.env };
  delete env.Z_AI_API_KEY;
  delete env.Z_AI_MODE;
  return {
    ...env,
    AI_EXPERTS_ENV_FILE: join(tmpdir(), "ai-experts-test-missing.env"),
    ...overrides,
  };
}

test("install.mjs enables Codex plugins without jq", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-install-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");
    writeExecutable(join(binDir, "jq"), "#!/usr/bin/env bash\nexit 127\n");

    const output = execFileSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const config = readFileSync(join(codexHome, "config.toml"), "utf-8");
    const hooks = readFileSync(join(codexHome, "hooks.json"), "utf-8");
    const codexMemoryTarget = join(codexHome, "AGENTS.md");
    assert.match(output, /Skill eval coverage:/);
    assert.match(output, /Codex CLI: done/);
    assert.match(config, /codex_hooks\s*=\s*true/);
    assert.match(hooks, /"Bash"/);
    assert.match(hooks, new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/hooks/dispatch\\.mjs`));
    assert.equal(lstatSync(codexMemoryTarget).isSymbolicLink(), true);
    assert.equal(readlinkSync(codexMemoryTarget), join(repoRoot, "MEMORY.md"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs works when called outside the repository root", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-install-cwd-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  const outsideCwd = join(tmp, "outside");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    mkdirSync(outsideCwd);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");

    const output = execFileSync(process.execPath, [installScript, "--install"], {
      cwd: outsideCwd,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /Codex CLI: done/);
    assert.match(readFileSync(join(codexHome, "hooks.json"), "utf-8"), /"Bash"/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs preserves unmanaged Codex hooks during install and uninstall", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-install-hooks-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  const customCommand = "node /custom/hooks/dispatch.mjs user-prompt-submit";

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");
    writeFileSync(
      join(codexHome, "hooks.json"),
      `${JSON.stringify({
        hooks: {
          UserPromptSubmit: [
            {
              matcher: ".*",
              hooks: [{ type: "command", command: customCommand }],
            },
          ],
        },
      }, null, 2)}\n`,
      "utf-8",
    );

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");

    execFileSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const installedHooks = readFileSync(join(codexHome, "hooks.json"), "utf-8");
    assert.match(installedHooks, new RegExp(customCommand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(installedHooks, new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/hooks/dispatch\\.mjs`));

    execFileSync(process.execPath, [installScript, "--uninstall"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const uninstalledHooks = readFileSync(join(codexHome, "hooks.json"), "utf-8");
    assert.match(uninstalledHooks, new RegExp(customCommand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(uninstalledHooks, new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/hooks/dispatch\\.mjs`));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs --uninstall removes managed Codex memory link", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-uninstall-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");
    writeFileSync(join(codexHome, "hooks.json"), "{}", "utf-8");
    symlinkSync(join(repoRoot, "MEMORY.md"), join(codexHome, "AGENTS.md"));

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");

    execFileSync(process.execPath, [installScript, "--uninstall"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.equal(existsSync(join(codexHome, "AGENTS.md")), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// ── 新增覆盖 ──────────────────────────────────────────
// 以下 4 条用例补足之前缺口：
//   1. --dry-run 路径不留产物
//   2. cc 端 install 走完整 sandbox（之前 5 条用例全是 codex 端）
//   3. safeStep 单端失败仍跑另一端，并以非零 exitCode 汇报
//   4. (隐式) hasCmd 同时为假的硬退出路径已由 main() switch case 覆盖
//
// cc 端 sandbox 通过 CLAUDE_SETTINGS_PATH / CC_TARGET / CC_AGENTS_TARGET /
// CLAUDE_MEMORY_TARGET env 注入，避开真实 ~/.claude。

test("install.mjs --dry-run 不创建任何用户级产物", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-dryrun-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  const claudeHome = join(tmp, "claude-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    mkdirSync(claudeHome);

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");
    writeExecutable(
      join(binDir, "claude"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ]; then echo '[]'; fi\nexit 0\n",
    );

    execFileSync(process.execPath, [installScript, "--install", "--dry-run"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        CODEX_TARGET: join(codexHome, "skills"),
        CLAUDE_SETTINGS_PATH: join(claudeHome, "settings.json"),
        CLAUDE_MCP_CONFIG_PATH: join(claudeHome, ".claude.json"),
        CC_TARGET: join(claudeHome, "skills"),
        CC_AGENTS_TARGET: join(claudeHome, "agents"),
        CLAUDE_MEMORY_TARGET: join(claudeHome, "CLAUDE.md"),
        CODEX_MEMORY_TARGET: join(codexHome, "AGENTS.md"),
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    // dry-run 必须 NOT 创建：settings.json / hooks.json / config.toml /
    // skills 目录条目 / memory symlink。
    assert.equal(existsSync(join(claudeHome, "settings.json")), false, "dry-run 不应创建 settings.json");
    assert.equal(existsSync(join(claudeHome, ".claude.json")), false, "dry-run 不应创建 .claude.json MCP 配置");
    assert.equal(existsSync(join(claudeHome, "CLAUDE.md")), false, "dry-run 不应创建 CLAUDE.md memory link");
    assert.equal(existsSync(join(codexHome, "AGENTS.md")), false, "dry-run 不应创建 AGENTS.md memory link");
    assert.equal(existsSync(join(codexHome, "hooks.json")), false, "dry-run 不应创建 hooks.json");
    // config.toml 在 sandbox 中预先不存在，dry-run 不应主动创建
    assert.equal(existsSync(join(codexHome, "config.toml")), false, "dry-run 不应创建 config.toml");
    // skills 目录可能因为 mkdirSync 在 dry-run 路径外建好（取决于实现），
    // 但内部不应有 symlink 条目。
    if (existsSync(join(claudeHome, "skills"))) {
      assert.equal(readdirSync(join(claudeHome, "skills")).length, 0, "dry-run 不应在 cc skills 目录下创建符号链接");
    }
    if (existsSync(join(codexHome, "skills"))) {
      assert.equal(readdirSync(join(codexHome, "skills")).length, 0, "dry-run 不应在 codex skills 目录下创建符号链接");
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs cc 端 install 走完整 sandbox（settings.json / agents / memory link）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-cc-"));
  const binDir = join(tmp, "bin");
  const claudeHome = join(tmp, "claude-home");

  try {
    mkdirSync(binDir);
    mkdirSync(claudeHome);

    symlinkSync(process.execPath, join(binDir, "node"));
    // 故意不放 codex 二进制：触发 cc 单端路径
    writeExecutable(
      join(binDir, "claude"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ]; then echo '[]'; fi\nexit 0\n",
    );

    const settingsPath = join(claudeHome, "settings.json");
    const claudeMcpConfigPath = join(claudeHome, ".claude.json");
    const memoryPath = join(claudeHome, "CLAUDE.md");

    const output = execFileSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CLAUDE_SETTINGS_PATH: settingsPath,
        CLAUDE_MCP_CONFIG_PATH: claudeMcpConfigPath,
        CC_TARGET: join(claudeHome, "skills"),
        CC_AGENTS_TARGET: join(claudeHome, "agents"),
        CLAUDE_MEMORY_TARGET: memoryPath,
        // 故意不设 CODEX_*，让 codex 端走 hasCmd 跳过路径
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /Claude Code: done/);
    assert.doesNotMatch(output, /Codex CLI: done/);

    // settings.json 应被写入并包含 dispatcher 路径
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    assert.ok(settings.hooks, "cc settings.json 必须含 hooks 段");
    const flatCommands = Object.values(settings.hooks)
      .flat()
      .flatMap((entry) => entry.hooks)
      .map((h) => h.command);
    const dispatcherRegex = new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/hooks/dispatch\\.mjs`);
    assert.ok(flatCommands.some((c) => dispatcherRegex.test(c)), "cc hooks 必须指向根 dispatcher");

    // memory link 必须建立且指向仓库 MEMORY.md
    assert.equal(lstatSync(memoryPath).isSymbolicLink(), true);
    assert.equal(readlinkSync(memoryPath), join(repoRoot, "MEMORY.md"));

    // agents / skills 软链应已建立（数量 > 0）
    assert.ok(readdirSync(join(claudeHome, "agents")).length > 0, "cc agents 目录应非空");
    assert.ok(readdirSync(join(claudeHome, "skills")).length > 0, "cc skills 目录应非空");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs cc 端 install 保留 settings.json 的非托管字段与第三方 hook", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-cc-merge-"));
  const binDir = join(tmp, "bin");
  const claudeHome = join(tmp, "claude-home");
  const customCommand = "node /custom/dispatch.mjs user-prompt-submit";

  try {
    mkdirSync(binDir);
    mkdirSync(claudeHome);
    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(
      join(binDir, "claude"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ]; then echo '[]'; fi\nexit 0\n",
    );

    const settingsPath = join(claudeHome, "settings.json");
    const claudeMcpConfigPath = join(claudeHome, ".claude.json");
    writeFileSync(
      settingsPath,
      JSON.stringify({
        permissions: { allow: ["Read"] },
        hooks: {
          UserPromptSubmit: [
            { matcher: ".*", hooks: [{ type: "command", command: customCommand }] },
          ],
        },
      }, null, 2) + "\n",
      "utf-8",
    );

    execFileSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CLAUDE_SETTINGS_PATH: settingsPath,
        CLAUDE_MCP_CONFIG_PATH: claudeMcpConfigPath,
        CC_TARGET: join(claudeHome, "skills"),
        CC_AGENTS_TARGET: join(claudeHome, "agents"),
        CLAUDE_MEMORY_TARGET: join(claudeHome, "CLAUDE.md"),
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const after = JSON.parse(readFileSync(settingsPath, "utf-8"));
    assert.deepEqual(after.permissions, { allow: ["Read"] }, "非 hooks 字段必须保留");
    const userHooks = after.hooks.UserPromptSubmit
      .flatMap((entry) => entry.hooks)
      .map((h) => h.command);
    assert.ok(userHooks.includes(customCommand), "用户自定义 hook 必须保留");
    assert.ok(
      userHooks.some((c) => c.includes(`${repoRoot}/hooks/dispatch.mjs`)),
      "managed dispatcher 必须被追加",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs safeStep：单端失败不阻塞另一端，进程以 exitCode=1 退出", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-safestep-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  const claudeHome = join(tmp, "claude-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    mkdirSync(claudeHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");
    // 让 cc 端 cleanup-legacy 失败：claude plugin list 返回非法 JSON 不会让
    // cleanup 失败（best-effort 吞），所以改为让 settings.json 路径指向一个
    // 非可写的位置（指向一个文件而非目录）。最稳的失败注入：
    // 通过 CLAUDE_SETTINGS_PATH 指向一个不允许写的路径（一个已存在的目录）
    // —— sync-hooks 会尝试 atomicWriteFile 然后报错。
    const blockingDir = join(claudeHome, "settings.json");
    mkdirSync(blockingDir); // 占用为目录，使 writeFileSync 失败

    writeExecutable(
      join(binDir, "claude"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ]; then echo '[]'; fi\nexit 0\n",
    );

    const r = spawnSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        CODEX_TARGET: join(codexHome, "skills"),
        CLAUDE_SETTINGS_PATH: blockingDir, // 把 cc settings 路径占用为目录，
                                            // 触发 sync-hooks 在 atomicWriteFile rename 时
                                            // EISDIR 失败，从而验证 safeStep 错误隔离。
        CLAUDE_MCP_CONFIG_PATH: join(claudeHome, ".claude.json"),
        CC_TARGET: join(claudeHome, "skills"),
        CC_AGENTS_TARGET: join(claudeHome, "agents"),
        CLAUDE_MEMORY_TARGET: join(claudeHome, "CLAUDE.md"),
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
    });

    // exitCode 必须非 0：cc 端失败被收集
    assert.notEqual(r.status, 0, "cc 端失败必须让 exitCode 非 0");
    // 但 codex 端必须仍然跑完
    assert.match(r.stdout + r.stderr, /Codex CLI: done/, "cc 失败不应阻塞 codex 端");
    // 错误汇总应可见
    assert.match(r.stdout + r.stderr, /安装过程出现.*失败步骤|Claude Code 安装/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs --reinstall completes even if codex marketplace add fails", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-reinstall-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");
    symlinkSync(join(tmp, "legacy-ai-infra-agents.md"), join(codexHome, "AGENTS.md"));

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(
      join(binDir, "codex"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"marketplace\" ] && [ \"$2\" = \"add\" ]; then\n  exit 1\nfi\nexit 0\n",
    );

    const output = execFileSync(process.execPath, [installScript, "--reinstall"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const codexMemoryTarget = join(codexHome, "AGENTS.md");
    assert.match(output, /Skill eval coverage:/);
    assert.match(output, /Codex CLI: uninstalled/);
    assert.match(output, /Codex CLI: done/);
    assert.equal(lstatSync(codexMemoryTarget).isSymbolicLink(), true);
    assert.equal(readlinkSync(codexMemoryTarget), join(repoRoot, "MEMORY.md"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs 从 .env.local 自动配置 Z.AI MCP", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-zai-mcp-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  const claudeHome = join(tmp, "claude-home");
  const envFile = join(tmp, ".env.local");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    mkdirSync(claudeHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");
    writeFileSync(envFile, "Z_AI_API_KEY=test-key\nZ_AI_MODE=ZHIPU\n", "utf-8");

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");
    writeExecutable(
      join(binDir, "claude"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ]; then echo '[]'; fi\nexit 0\n",
    );

    const claudeMcpConfigPath = join(claudeHome, ".claude.json");
    const output = execFileSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        AI_EXPERTS_ENV_FILE: envFile,
        CODEX_HOME: codexHome,
        CODEX_TARGET: join(codexHome, "skills"),
        CLAUDE_SETTINGS_PATH: join(claudeHome, "settings.json"),
        CLAUDE_MCP_CONFIG_PATH: claudeMcpConfigPath,
        CC_TARGET: join(claudeHome, "skills"),
        CC_AGENTS_TARGET: join(claudeHome, "agents"),
        CLAUDE_MEMORY_TARGET: join(claudeHome, "CLAUDE.md"),
        CODEX_MEMORY_TARGET: join(codexHome, "AGENTS.md"),
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /同步插件 MCP/);

    const claudeConfig = JSON.parse(readFileSync(claudeMcpConfigPath, "utf-8"));
    assert.deepEqual(Object.keys(claudeConfig.mcpServers).sort(), [
      "chrome-devtools",
      "github",
      "markitdown",
      "playwright",
      "sequential-thinking",
      "web-reader",
      "web-search-prime",
      "zai-mcp-server",
      "zread",
    ]);
    assert.equal(claudeConfig.mcpServers["zai-mcp-server"].env.Z_AI_API_KEY, "test-key");
    assert.equal(claudeConfig.mcpServers["zai-mcp-server"].env.Z_AI_MODE, "ZHIPU");
    assert.equal(claudeConfig.mcpServers["web-search-prime"].headers.Authorization, "Bearer test-key");
    assert.equal(claudeConfig.mcpServers.github.url, "https://api.githubcopilot.com/mcp/");
    assert.deepEqual(claudeConfig.mcpServers.markitdown.args, ["markitdown-mcp"]);
    assert.deepEqual(claudeConfig.mcpServers.playwright.args, ["@playwright/mcp@latest"]);
    assert.deepEqual(claudeConfig.mcpServers["chrome-devtools"].args, ["-y", "chrome-devtools-mcp@latest"]);
    assert.deepEqual(claudeConfig.mcpServers["sequential-thinking"].args, ["-y", "@modelcontextprotocol/server-sequential-thinking"]);

    const codexConfig = readFileSync(join(codexHome, "config.toml"), "utf-8");
    assert.match(codexConfig, /\[mcp_servers\.zai-mcp-server\]/);
    assert.match(codexConfig, /Z_AI_API_KEY = "test-key"/);
    assert.match(codexConfig, /\[mcp_servers\.web-search-prime\]/);
    assert.match(codexConfig, /http_headers = \{ Authorization = "Bearer test-key" \}/);
    assert.match(codexConfig, /\[mcp_servers\.web-reader\]/);
    assert.match(codexConfig, /\[mcp_servers\.zread\]/);
    assert.match(codexConfig, /\[mcp_servers\.github\]/);
    assert.match(codexConfig, /url = "https:\/\/api\.githubcopilot\.com\/mcp\/"/);
    assert.match(codexConfig, /\[mcp_servers\.markitdown\]/);
    assert.match(codexConfig, /command = "uvx"/);
    assert.match(codexConfig, /args = \["markitdown-mcp"\]/);
    assert.match(codexConfig, /\[mcp_servers\.playwright\]/);
    assert.match(codexConfig, /@playwright\/mcp@latest/);
    assert.match(codexConfig, /\[mcp_servers\.chrome-devtools\]/);
    assert.match(codexConfig, /chrome-devtools-mcp@latest/);
    assert.match(codexConfig, /\[mcp_servers\.sequential-thinking\]/);
    assert.match(codexConfig, /@modelcontextprotocol\/server-sequential-thinking/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.mjs 未配置 Z_AI_API_KEY 时移除托管 Z.AI MCP 且保留用户 MCP", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-zai-mcp-remove-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  const claudeHome = join(tmp, "claude-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    mkdirSync(claudeHome);
    writeFileSync(
      join(codexHome, "config.toml"),
      `model = "gpt-5.4"

[mcp_servers.custom]
url = "https://example.com/mcp"

[mcp_servers.web-reader]
url = "https://old.example/mcp"
http_headers = { Authorization = "Bearer old" }
`,
      "utf-8",
    );
    const claudeMcpConfigPath = join(claudeHome, ".claude.json");
    writeFileSync(
      claudeMcpConfigPath,
      JSON.stringify({
        mcpServers: {
          custom: { type: "http", url: "https://example.com/mcp" },
          "web-reader": { type: "http", url: "https://old.example/mcp" },
        },
      }, null, 2) + "\n",
      "utf-8",
    );

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");
    writeExecutable(
      join(binDir, "claude"),
      "#!/usr/bin/env bash\nif [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ]; then echo '[]'; fi\nexit 0\n",
    );

    execFileSync(process.execPath, [installScript, "--install"], {
      cwd: repoRoot,
      env: isolatedEnv({
        CODEX_HOME: codexHome,
        CODEX_TARGET: join(codexHome, "skills"),
        CLAUDE_SETTINGS_PATH: join(claudeHome, "settings.json"),
        CLAUDE_MCP_CONFIG_PATH: claudeMcpConfigPath,
        CC_TARGET: join(claudeHome, "skills"),
        CC_AGENTS_TARGET: join(claudeHome, "agents"),
        CLAUDE_MEMORY_TARGET: join(claudeHome, "CLAUDE.md"),
        CODEX_MEMORY_TARGET: join(codexHome, "AGENTS.md"),
        PATH: `${binDir}:/usr/bin:/bin`,
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const claudeConfig = JSON.parse(readFileSync(claudeMcpConfigPath, "utf-8"));
    assert.equal(claudeConfig.mcpServers.custom.url, "https://example.com/mcp");
    assert.deepEqual(claudeConfig.mcpServers["chrome-devtools"].args, ["-y", "chrome-devtools-mcp@latest"]);
    assert.equal(claudeConfig.mcpServers.github.url, "https://api.githubcopilot.com/mcp/");
    assert.deepEqual(claudeConfig.mcpServers.markitdown.args, ["markitdown-mcp"]);
    assert.deepEqual(claudeConfig.mcpServers.playwright.args, ["@playwright/mcp@latest"]);
    assert.deepEqual(claudeConfig.mcpServers["sequential-thinking"].args, ["-y", "@modelcontextprotocol/server-sequential-thinking"]);
    assert.equal(claudeConfig.mcpServers["web-reader"], undefined);
    assert.equal(claudeConfig.mcpServers["web-search-prime"], undefined);
    assert.equal(claudeConfig.mcpServers["zai-mcp-server"], undefined);
    assert.equal(claudeConfig.mcpServers.zread, undefined);

    const codexConfig = readFileSync(join(codexHome, "config.toml"), "utf-8");
    assert.match(codexConfig, /\[mcp_servers\.custom\]/);
    assert.match(codexConfig, /\[mcp_servers\.chrome-devtools\]/);
    assert.match(codexConfig, /\[mcp_servers\.github\]/);
    assert.match(codexConfig, /\[mcp_servers\.markitdown\]/);
    assert.match(codexConfig, /\[mcp_servers\.playwright\]/);
    assert.match(codexConfig, /\[mcp_servers\.sequential-thinking\]/);
    assert.doesNotMatch(codexConfig, /\[mcp_servers\.web-reader\]/);
    assert.doesNotMatch(codexConfig, /\[mcp_servers\.web-search-prime\]/);
    assert.doesNotMatch(codexConfig, /\[mcp_servers\.zai-mcp-server\]/);
    assert.doesNotMatch(codexConfig, /\[mcp_servers\.zread\]/);
    assert.doesNotMatch(codexConfig, /old\.example/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("sync-mcp 缺少环境变量时按 server 跳过，不阻断其他 MCP", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-sync-mcp-skip-"));
  const pluginsRoot = join(tmp, "plugins");
  const pluginRoot = join(pluginsRoot, "demo-expert");
  const codexHome = join(tmp, "codex-home");
  const claudeMcpConfigPath = join(tmp, ".claude.json");

  try {
    mkdirSync(pluginRoot, { recursive: true });
    mkdirSync(codexHome);
    writeFileSync(
      join(pluginRoot, ".mcp.json"),
      JSON.stringify({
        mcpServers: {
          "configured-mcp": {
            type: "http",
            url: "https://example.com/${MCP_PATH:-mcp}",
            headers: {
              Authorization: "Bearer ${PRESENT_KEY}",
            },
          },
          "missing-mcp": {
            type: "http",
            url: "https://missing.example/mcp",
            headers: {
              Authorization: "Bearer ${MISSING_KEY}",
            },
          },
        },
      }, null, 2) + "\n",
      "utf-8",
    );
    writeFileSync(
      claudeMcpConfigPath,
      JSON.stringify({
        mcpServers: {
          custom: { type: "http", url: "https://custom.example/mcp" },
          "missing-mcp": { type: "http", url: "https://old.example/mcp" },
        },
      }, null, 2) + "\n",
      "utf-8",
    );
    writeFileSync(
      join(codexHome, "config.toml"),
      `model = "gpt-5.4"

[mcp_servers.custom]
url = "https://custom.example/mcp"

[mcp_servers.missing-mcp]
url = "https://old.example/mcp"
`,
      "utf-8",
    );

    const output = execFileSync(process.execPath, [syncMcpScript, "--target=all"], {
      cwd: repoRoot,
      env: isolatedEnv({
        AI_EXPERTS_PLUGINS_DIR: pluginsRoot,
        CLAUDE_MCP_CONFIG_PATH: claudeMcpConfigPath,
        CODEX_HOME: codexHome,
        PRESENT_KEY: "present-key",
        MISSING_KEY: "",
      }),
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /synced 1\/2 plugin MCP servers/);
    assert.match(output, /skipped 1: missing-mcp\(MISSING_KEY\)/);

    const claudeConfig = JSON.parse(readFileSync(claudeMcpConfigPath, "utf-8"));
    assert.ok(claudeConfig.mcpServers["configured-mcp"], "可配置 MCP 应写入 Claude 配置");
    assert.equal(claudeConfig.mcpServers["configured-mcp"].headers.Authorization, "Bearer present-key");
    assert.equal(claudeConfig.mcpServers["configured-mcp"].url, "https://example.com/mcp");
    assert.ok(claudeConfig.mcpServers.custom, "用户 MCP 应保留");
    assert.equal(claudeConfig.mcpServers["missing-mcp"], undefined, "缺少 env 的托管 MCP 应被跳过/移除");

    const codexConfig = readFileSync(join(codexHome, "config.toml"), "utf-8");
    assert.match(codexConfig, /\[mcp_servers\.configured-mcp\]/);
    assert.match(codexConfig, /Authorization = "Bearer present-key"/);
    assert.match(codexConfig, /\[mcp_servers\.custom\]/);
    assert.doesNotMatch(codexConfig, /\[mcp_servers\.missing-mcp\]/);
    assert.doesNotMatch(codexConfig, /old\.example/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
