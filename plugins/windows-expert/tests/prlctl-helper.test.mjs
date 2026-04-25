import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/windows-expert");
const scriptPath = resolve(pluginRoot, "skills/prlctl-vm-control/scripts/prlctl_helper.mjs");

function createPrlctlStub(root) {
  const stubPath = join(root, "prlctl");
  writeFileSync(
    stubPath,
    `#!/bin/sh
set -eu
command_name="\${1:-}"

if [ "$command_name" = "list" ] && [ "\${2:-}" = "-a" ] && [ "\${3:-}" = "-j" ]; then
  printf '%s' "\${PRLCTL_LIST_JSON:-[]}"
  exit "\${PRLCTL_LIST_EXIT:-0}"
fi

if [ "$command_name" = "list" ] && [ "\${2:-}" = "-i" ] && [ "\${3:-}" = "-j" ]; then
  printf '%s' "\${PRLCTL_INFO_JSON:-[]}"
  exit "\${PRLCTL_INFO_EXIT:-0}"
fi

if [ "$command_name" = "snapshot-list" ]; then
  printf '%s' "\${PRLCTL_SNAPSHOT_JSON:-[]}"
  exit "\${PRLCTL_SNAPSHOT_EXIT:-0}"
fi

if [ "$command_name" = "exec" ]; then
  shift
  printf '%s\\n' "$*"
  exit "\${PRLCTL_EXEC_EXIT:-0}"
fi

case "$command_name" in
  start|stop|restart|reset|suspend|resume)
    printf '%s\\n' "$command_name $*"
    exit "\${PRLCTL_POWER_EXIT:-0}"
    ;;
esac

printf '%s\\n' "unexpected prlctl call: $*" >&2
exit 99
`,
    "utf-8",
  );
  chmodSync(stubPath, 0o755);
}

function withStub(fn) {
  const root = mkdtempSync(join(tmpdir(), "windows-expert-prlctl-"));
  createPrlctlStub(root);

  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runHelper(args, env = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: pluginRoot,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

const vmList = JSON.stringify([
  {
    uuid: "11111111-1111-1111-1111-111111111111",
    name: "Win11 Lab",
    status: "running",
    ip_configured: "10.0.0.10",
  },
  {
    uuid: "22222222-2222-2222-2222-222222222222",
    name: "Win11 QA",
    status: "stopped",
    ip_configured: "",
  },
]);

test("list --json 能输出解析后的虚拟机列表", () => {
  withStub((stubRoot) => {
    const result = runHelper(["list", "--json"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
    });

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.length, 2);
    assert.equal(payload[0].name, "Win11 Lab");
  });
});

test("resolve 对不唯一的选择器返回候选列表", () => {
  withStub((stubRoot) => {
    const result = runHelper(["resolve", "Win11"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /虚拟机选择器不唯一/);
    assert.match(result.stderr, /Win11 Lab/);
    assert.match(result.stderr, /Win11 QA/);
  });
});

test("info 对非法 JSON 返回明确错误", () => {
  withStub((stubRoot) => {
    const result = runHelper(["info", "Win11 Lab"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
      PRLCTL_INFO_JSON: "{not-json",
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /返回的 JSON 无法解析/);
  });
});

test("exec --dry-run 会展开 shell 包装命令", () => {
  withStub((stubRoot) => {
    const result = runHelper(["exec", "Win11 Lab", "--shell", "powershell", "--dry-run", "--", "whoami"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
    });

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.vm.name, "Win11 Lab");
    assert.deepEqual(payload.command.slice(-2), ["-Command", "whoami"]);
  });
});

test("exec 拒绝混用 --current-user 与 --user", () => {
  withStub((stubRoot) => {
    const result = runHelper(
      ["exec", "Win11 Lab", "--current-user", "--user", "alice", "--password-env", "VM_PASS", "--", "whoami"],
      {
        PATH: `${stubRoot}:${process.env.PATH}`,
        PRLCTL_LIST_JSON: vmList,
        VM_PASS: "secret",
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /`--current-user` 与 `--user` 不能同时使用/);
  });
});

test("缺少 prlctl 时返回清晰错误而不是 traceback", () => {
  const result = runHelper(["list"], {
    PATH: "",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /找不到 `prlctl`/);
  assert.doesNotMatch(result.stderr, /Traceback/);
});
