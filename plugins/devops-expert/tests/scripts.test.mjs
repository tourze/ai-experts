import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/devops-expert");

const nodeScripts = [
  "skills/gh-address-comments/scripts/fetch_comments.mjs",
  "skills/gh-fix-ci/scripts/inspect_pr_checks.mjs",
  "skills/remote-ssh-command/scripts/install-sshpass.mjs",
  "skills/remote-ssh-command/scripts/ssh-exec.mjs",
];

test("DevOps Node scripts pass syntax checks", () => {
  for (const script of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, script)], {
      encoding: "utf-8",
    });
    assert.equal(result.status, 0, `${script}\n${result.stderr}`);
  }
});

test("fetch_comments.mjs builds GraphQL args without null cursor variables", async () => {
  const mod = await import(resolve(pluginRoot, "skills/gh-address-comments/scripts/fetch_comments.mjs"));
  const args = mod.buildGraphqlArgs("octo", "repo", 42, {
    commentsCursor: "C1",
    reviewsCursor: null,
    threadsCursor: "T1",
  });

  assert.deepEqual(args.slice(0, 5), ["gh", "api", "graphql", "-F", "query=@-"]);
  assert.ok(args.includes("owner=octo"));
  assert.ok(args.includes("repo=repo"));
  assert.ok(args.includes("number=42"));
  assert.ok(args.includes("commentsCursor=C1"));
  assert.ok(args.includes("threadsCursor=T1"));
  assert.equal(args.some((arg) => arg.startsWith("reviewsCursor=")), false);
});

test("inspect_pr_checks.mjs extracts action run and job ids", async () => {
  const mod = await import(resolve(pluginRoot, "skills/gh-fix-ci/scripts/inspect_pr_checks.mjs"));
  const url = "https://github.com/o/r/actions/runs/123456/job/7890";

  assert.equal(mod.extractRunId(url), "123456");
  assert.equal(mod.extractJobId(url), "7890");
  assert.equal(mod.extractRunId("https://checks.example/build/1"), null);
});

test("inspect_pr_checks.mjs parses fallback fields and snippets failures", async () => {
  const mod = await import(resolve(pluginRoot, "skills/gh-fix-ci/scripts/inspect_pr_checks.mjs"));

  assert.deepEqual(mod.parseAvailableFields(`error
Available fields:
name
state
bucket
`), ["name", "state", "bucket"]);

  const snippet = mod.extractFailureSnippet("one\ntwo\nERROR: boom\nfour\nfive", 3, 1);
  assert.equal(snippet, "two\nERROR: boom");
  assert.equal(mod.isFailing({ bucket: "fail" }), true);
  assert.equal(mod.isFailing({ conclusion: "success", state: "completed" }), false);
});

test("ssh-exec.mjs parses password config and builds sshpass invocation", async () => {
  const mod = await import(resolve(pluginRoot, "skills/remote-ssh-command/scripts/ssh-exec.mjs"));
  const config = mod.parseHostConfig({
    host: "1.2.3.4",
    user: "root",
    auth: {
      type: "password",
      password: "secret",
    },
  });

  assert.deepEqual(config, {
    host: "1.2.3.4",
    port: 22,
    user: "root",
    timeoutSeconds: 120,
    auth: {
      type: "password",
      password: "secret",
    },
  });

  const invocation = mod.buildSshpassInvocation(config, "systemctl status nginx | cat");
  assert.equal(invocation.command, "sshpass");
  assert.ok(invocation.args.includes("StrictHostKeyChecking=accept-new"));
  assert.ok(invocation.args.includes("root@1.2.3.4"));
  assert.ok(invocation.args.includes("systemctl status nginx | cat"));
  assert.equal(invocation.args.includes("secret"), false);
  assert.equal(invocation.env.SSHPASS, "secret");
});

test("ssh-exec.mjs enforces ~/.host config path and writes JSONL history", async () => {
  const mod = await import(resolve(pluginRoot, "skills/remote-ssh-command/scripts/ssh-exec.mjs"));
  const home = mkdtempSync(join(tmpdir(), "remote-ssh-command-home-"));

  try {
    const hostDir = join(home, ".host");
    mkdirSync(hostDir);
    const configPath = join(hostDir, "1.2.3.4.json");
    const outsidePath = join(home, "outside.json");
    writeFileSync(configPath, "{}", "utf-8");
    writeFileSync(outsidePath, "{}", "utf-8");

    assert.equal(mod.resolveHostConfigPath(configPath, home), realpathSync(configPath));
    assert.throws(() => mod.resolveHostConfigPath(outsidePath, home), /under ~\/\.host/);

    const historyPath = mod.historyPathForConfig(configPath);
    const entry = mod.buildHistoryEntry(
      { host: "1.2.3.4", user: "root" },
      "tail -f /var/log/syslog",
      new Date("2026-04-30T12:00:00.000Z"),
      { exitCode: 124, durationMs: 120000, timedOut: true },
    );
    mod.appendHistory(historyPath, entry);

    const lines = readFileSync(historyPath, "utf-8").trim().split("\n");
    assert.equal(lines.length, 1);
    assert.deepEqual(JSON.parse(lines[0]), {
      timestamp: "2026-04-30T12:00:00.000Z",
      host: "1.2.3.4",
      user: "root",
      command: "tail -f /var/log/syslog",
      exitCode: null,
      durationMs: 120000,
      timedOut: true,
    });
    assert.equal(statSync(historyPath).mode & 0o777, 0o600);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("install-sshpass.mjs resolves platform install plans", async () => {
  const mod = await import(resolve(pluginRoot, "skills/remote-ssh-command/scripts/install-sshpass.mjs"));
  const checker = (commands) => (command) => commands.has(command);

  assert.deepEqual(
    mod.resolveInstallPlan({
      platform: "darwin",
      hasCommand: checker(new Set(["brew"])),
      isRoot: false,
    }),
    {
      command: "brew",
      args: ["install", "hudochenkov/sshpass/sshpass"],
      manualCommand: "brew install hudochenkov/sshpass/sshpass",
    },
  );

  assert.deepEqual(
    mod.resolveInstallPlan({
      platform: "linux",
      hasCommand: checker(new Set(["apt-get", "sudo"])),
      isRoot: false,
    }),
    {
      command: "sudo",
      args: ["apt-get", "install", "sshpass"],
      manualCommand: "sudo apt-get install sshpass",
    },
  );

  assert.deepEqual(
    mod.resolveInstallPlan({
      platform: "linux",
      hasCommand: checker(new Set(["pacman"])),
      isRoot: true,
    }),
    {
      command: "pacman",
      args: ["-S", "sshpass"],
      manualCommand: "pacman -S sshpass",
    },
  );
});
