import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");

function writeExecutable(path, content) {
  writeFileSync(path, content, "utf-8");
  chmodSync(path, 0o755);
}

test("install.sh enables Codex plugins without jq", () => {
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

    const output = execFileSync("/bin/bash", ["scripts/install.sh", "--install"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
      encoding: "utf-8",
      stdio: "pipe",
    });

    const config = readFileSync(join(codexHome, "config.toml"), "utf-8");
    const hooks = readFileSync(join(codexHome, "hooks.json"), "utf-8");
    const codexMemoryTarget = join(codexHome, "AGENTS.md");
    assert.match(output, /Skill eval coverage:/);
    assert.match(output, /Codex CLI: done/);
    assert.match(config, /\[plugins\."react-native-expert@ai-experts"\]/);
    assert.match(hooks, /"Bash"/);
    assert.match(hooks, new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/plugins/`));
    assert.equal(lstatSync(codexMemoryTarget).isSymbolicLink(), true);
    assert.equal(readlinkSync(codexMemoryTarget), join(repoRoot, "MEMORY.md"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.sh works when called outside the repository root", () => {
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

    const output = execFileSync("/bin/bash", [join(repoRoot, "scripts/install.sh"), "--install"], {
      cwd: outsideCwd,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /Codex CLI: done/);
    assert.match(readFileSync(join(codexHome, "hooks.json"), "utf-8"), /"Bash"/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.sh preserves unmanaged Codex hooks during install and uninstall", () => {
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

    execFileSync("/bin/bash", ["scripts/install.sh", "--install"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
      encoding: "utf-8",
      stdio: "pipe",
    });

    const installedHooks = readFileSync(join(codexHome, "hooks.json"), "utf-8");
    assert.match(installedHooks, new RegExp(customCommand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(installedHooks, new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/plugins/`));

    execFileSync("/bin/bash", ["scripts/install.sh", "--uninstall"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
      encoding: "utf-8",
      stdio: "pipe",
    });

    const uninstalledHooks = readFileSync(join(codexHome, "hooks.json"), "utf-8");
    assert.match(uninstalledHooks, new RegExp(customCommand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(uninstalledHooks, new RegExp(`${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/plugins/`));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.sh --uninstall removes managed Codex memory link", () => {
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

    execFileSync("/bin/bash", ["scripts/install.sh", "--uninstall"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.equal(existsSync(join(codexHome, "AGENTS.md")), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("install.sh --reinstall completes even if codex marketplace add fails", () => {
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

    const output = execFileSync("/bin/bash", ["scripts/install.sh", "--reinstall"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
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
