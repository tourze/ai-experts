import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { run as runSyntaxGo } from "../hooks/post-tool-use/edit-write/syntax-go.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "go-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function payload(filePath) {
  return { tool_input: { file_path: filePath } };
}

function writeExecutable(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  chmodSync(filePath, 0o755);
}

async function withPath(dir, fn) {
  const originalPath = process.env.PATH;
  process.env.PATH = dir;
  try {
    return await fn();
  } finally {
    process.env.PATH = originalPath;
  }
}

test("syntax-go 在缺少 go.mod / go.work 时不会因 go vet 误拦截", async () => {
  await withTempDir(async (dir) => {
    const binDir = join(dir, "bin");
    const filePath = join(dir, "main.go");

    writeExecutable(
      join(binDir, "gofmt"),
      "#!/bin/sh\nexit 0\n",
    );
    writeExecutable(
      join(binDir, "go"),
      "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then\n  echo 'go version go1.22.0 linux/amd64'\n  exit 0\nfi\nif [ \"$1\" = \"vet\" ]; then\n  echo 'go: go.mod file not found in current directory or any parent directory; see go help modules' 1>&2\n  exit 1\nfi\nexit 0\n",
    );
    writeFileSync(filePath, "package main\n\nfunc main() {}\n", "utf8");

    await withPath(binDir, async () => {
      assert.equal(await runSyntaxGo(payload(filePath)), null);
    });
  });
});

test("syntax-go 在存在 go.mod 时会透出真实 go vet 报错", async () => {
  await withTempDir(async (dir) => {
    const binDir = join(dir, "bin");
    const filePath = join(dir, "main.go");

    writeExecutable(
      join(binDir, "gofmt"),
      "#!/bin/sh\nexit 0\n",
    );
    writeExecutable(
      join(binDir, "go"),
      "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then\n  echo 'go version go1.22.0 linux/amd64'\n  exit 0\nfi\nif [ \"$1\" = \"vet\" ]; then\n  echo './main.go:5:2: unreachable code' 1>&2\n  exit 1\nfi\nexit 0\n",
    );
    writeFileSync(join(dir, "go.mod"), "module example.com/test\n\ngo 1.22\n", "utf8");
    writeFileSync(filePath, "package main\n\nfunc main() {}\n", "utf8");

    await withPath(binDir, async () => {
      const result = await runSyntaxGo(payload(filePath));
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /go vet 报错/);
      assert.match(result?.reason ?? "", /unreachable code/);
    });
  });
});

test("syntax-go 的本地回退检查会拦截未闭合原始字符串", async () => {
  await withTempDir(async (dir) => {
    const emptyBinDir = join(dir, "empty-bin");
    const filePath = join(dir, "broken.go");

    writeFileSync(filePath, "package main\n\nfunc main() {\n\t_ = `oops\n}\n", "utf8");
    await withPath(emptyBinDir, async () => {
      const result = await runSyntaxGo(payload(filePath));
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /原始字符串未闭合/);
    });
  });
});
