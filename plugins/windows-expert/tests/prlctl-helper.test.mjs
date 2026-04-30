import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  if [ -n "\${PRLCTL_CAPTURE_EXEC_ARGS:-}" ]; then
    printf '%s\\n' "$*" >> "\${PRLCTL_CAPTURE_EXEC_ARGS}"
  fi
  if [ -n "\${PRLCTL_EXEC_STDOUT_B64:-}" ] || [ -n "\${PRLCTL_EXEC_STDERR_B64:-}" ]; then
    printf '%s\\n' "__PRLCTL_HELPER_STDOUT_B64_BEGIN__"
    printf '%s\\n' "\${PRLCTL_EXEC_STDOUT_B64:-}"
    printf '%s\\n' "__PRLCTL_HELPER_STDOUT_B64_END__"
    printf '%s\\n' "__PRLCTL_HELPER_STDERR_B64_BEGIN__"
    printf '%s\\n' "\${PRLCTL_EXEC_STDERR_B64:-}"
    printf '%s\\n' "__PRLCTL_HELPER_STDERR_B64_END__"
    printf '%s\\n' "__PRLCTL_HELPER_EXIT__:\${PRLCTL_EXEC_HELPER_EXIT:-0}"
    exit "\${PRLCTL_EXEC_PROCESS_EXIT:-0}"
  fi
  if [ -n "\${PRLCTL_EXEC_DOWNLOAD_SIZE:-}" ] && printf '%s' "$*" | grep -q "wc -c <"; then
    printf '%s\\n' "\${PRLCTL_EXEC_DOWNLOAD_SIZE}"
    exit "\${PRLCTL_EXEC_EXIT:-0}"
  fi
  if [ -n "\${PRLCTL_EXEC_DOWNLOAD_CHUNK_B64:-}" ] && printf '%s' "$*" | grep -q "dd if="; then
    printf '%s\\n' "\${PRLCTL_EXEC_DOWNLOAD_CHUNK_B64}"
    exit "\${PRLCTL_EXEC_EXIT:-0}"
  fi
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

function b64(value) {
  return Buffer.from(value, "utf-8").toString("base64");
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
    assert.equal(payload.command.at(-2), "-Command");
    assert.match(payload.command.at(-1), /__PRLCTL_HELPER_STDOUT_B64_BEGIN__/);
    assert.doesNotMatch(payload.command.at(-1), /whoami/);
  });
});

test("exec --shell raw 保留原始命令参数", () => {
  withStub((stubRoot) => {
    const result = runHelper(["exec", "Win11 Lab", "--shell", "raw", "--", "cmd.exe", "/c", "echo", "ok"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /cmd\.exe \/c echo ok/);
  });
});

test("exec --shell powershell 会解码 PowerShell envelope 中的中文输出", () => {
  withStub((stubRoot) => {
    const result = runHelper(["exec", "Win11 Lab", "--shell", "powershell", "--", "Write-Output 'ignored'"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
      PRLCTL_EXEC_STDOUT_B64: b64("QQ浏览器\n360极速浏览器\n"),
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "QQ浏览器\n360极速浏览器\n");
  });
});

test("exec --shell powershell 会保留 envelope 的 stderr 与退出码", () => {
  withStub((stubRoot) => {
    const result = runHelper(["exec", "Win11 Lab", "--shell", "powershell", "--", "exit 7"], {
      PATH: `${stubRoot}:${process.env.PATH}`,
      PRLCTL_LIST_JSON: vmList,
      PRLCTL_EXEC_STDOUT_B64: b64("ok\n"),
      PRLCTL_EXEC_STDERR_B64: b64("错误\n"),
      PRLCTL_EXEC_HELPER_EXIT: "7",
    });

    assert.equal(result.status, 7);
    assert.equal(result.stdout, "ok\n");
    assert.equal(result.stderr, "错误\n");
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

test("upload --dry-run 输出传输摘要且不执行客体命令", () => {
  withStub((stubRoot) => {
    const fileRoot = mkdtempSync(join(tmpdir(), "windows-expert-upload-"));
    const localPath = join(fileRoot, "sample.txt");
    writeFileSync(localPath, "hello upload", "utf-8");

    try {
      const result = runHelper(
        ["upload", "Win11 Lab", "--shell", "powershell", "--dry-run", "--", localPath, "C:\\Temp\\sample.txt"],
        {
          PATH: `${stubRoot}:${process.env.PATH}`,
          PRLCTL_LIST_JSON: vmList,
        },
      );

      assert.equal(result.status, 0, result.stderr);
      const payload = JSON.parse(result.stdout);
      assert.equal(payload.action, "upload");
      assert.equal(payload.bytes, 12);
      assert.equal(payload.chunks, 1);
      assert.equal(payload.guest_path, "C:\\Temp\\sample.txt");
    } finally {
      rmSync(fileRoot, { recursive: true, force: true });
    }
  });
});

test("upload --shell powershell 使用原始 PowerShell 命令避免输出 envelope 膨胀", () => {
  withStub((stubRoot) => {
    const fileRoot = mkdtempSync(join(tmpdir(), "windows-expert-upload-"));
    const localPath = join(fileRoot, "sample.ps1");
    const capturePath = join(fileRoot, "exec.args");
    writeFileSync(localPath, "Write-Output 'hello'\n".repeat(75), "utf-8");

    try {
      const result = runHelper(
        ["upload", "Win11 Lab", "--shell", "powershell", "--", localPath, "C:\\Temp\\sample.ps1"],
        {
          PATH: `${stubRoot}:${process.env.PATH}`,
          PRLCTL_LIST_JSON: vmList,
          PRLCTL_CAPTURE_EXEC_ARGS: capturePath,
        },
      );

      assert.equal(result.status, 0, result.stderr);
      const payload = JSON.parse(result.stdout);
      assert.equal(payload.action, "upload");
      assert.equal(payload.chunk_size, 1024);
      assert.equal(payload.chunks, 2);

      const captured = readFileSync(capturePath, "utf-8");
      assert.match(captured, /powershell\.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command/);
      assert.doesNotMatch(captured, /\$e=New-Object Text\.UTF8Encoding/);
      assert.doesNotMatch(captured, /__PRLCTL_HELPER_STDOUT_B64_BEGIN__/);
    } finally {
      rmSync(fileRoot, { recursive: true, force: true });
    }
  });
});

test("download --shell bash 会按 base64 分片写入本地文件", () => {
  withStub((stubRoot) => {
    const fileRoot = mkdtempSync(join(tmpdir(), "windows-expert-download-"));
    const localPath = join(fileRoot, "nested", "sample.txt");

    try {
      const result = runHelper(
        ["download", "Win11 Lab", "--shell", "bash", "--", "/tmp/sample.txt", localPath],
        {
          PATH: `${stubRoot}:${process.env.PATH}`,
          PRLCTL_LIST_JSON: vmList,
          PRLCTL_EXEC_DOWNLOAD_SIZE: "14",
          PRLCTL_EXEC_DOWNLOAD_CHUNK_B64: b64("hello download"),
        },
      );

      assert.equal(result.status, 0, result.stderr);
      const payload = JSON.parse(result.stdout);
      assert.equal(payload.action, "download");
      assert.equal(payload.bytes, 14);
      assert.equal(readFileSync(localPath, "utf-8"), "hello download");
    } finally {
      rmSync(fileRoot, { recursive: true, force: true });
    }
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
