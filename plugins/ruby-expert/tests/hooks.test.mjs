import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runDebugGuard } from "../hooks/post-tool-use/edit-write/debug-statement-guard.mjs";
import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";
import { run as runFileBudgetGuard } from "../hooks/post-tool-use/edit-write/file-budget-guard.mjs";
import { run as runSyntaxRuby } from "../hooks/post-tool-use/edit-write/syntax-ruby.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "ruby-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function payload(filePath, extraToolInput = {}) {
  return {
    tool_input: {
      file_path: filePath,
      ...extraToolInput,
    },
  };
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

test("encoding-guard 会检查 .ruby-version 这类点文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, ".ruby-version");
    writeFileSync(filePath, Buffer.from([0xef, 0xbb, 0xbf, 0x33, 0x2e, 0x33]));

    const result = await runEncodingGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-8 BOM/);
  });
});

test("syntax-ruby 在 ruby -c 报错时会阻塞", async () => {
  await withTempDir(async (dir) => {
    const binDir = join(dir, "bin");
    const filePath = join(dir, "broken.rb");
    writeFileSync(filePath, "class Demo\n  def call\n    puts 'oops'\n", "utf8");

    writeExecutable(
      join(binDir, "ruby"),
      "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then\n  echo 'ruby 3.3.0'\n  exit 0\nfi\nif [ \"$1\" = \"-c\" ]; then\n  echo \"$2:3: syntax error, unexpected end-of-input\" 1>&2\n  exit 1\nfi\nexit 0\n",
    );

    await withPath(binDir, async () => {
      const result = await runSyntaxRuby(payload(filePath));
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /syntax error/);
    });
  });
});

test("debug-statement-guard 会阻止新增 binding.pry", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "user.rb");
    const content = "class User\n  def call\n    binding.pry\n  end\nend\n";
    writeFileSync(filePath, content, "utf8");

    const result = await runDebugGuard(payload(filePath, {
      old_string: "",
      new_string: content,
    }));

    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /binding\.pry/);
  });
});

test("debug-statement-guard 会跳过 _spec.rb 测试文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "user_spec.rb");
    const content = "RSpec.describe User do\n  it 'debugs' do\n    puts 'debug'\n  end\nend\n";
    writeFileSync(filePath, content, "utf8");

    const result = await runDebugGuard(payload(filePath, {
      old_string: "",
      new_string: content,
    }));

    assert.equal(result, null);
  });
});

test("file-budget-guard 不会把末尾换行误算成额外一行", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "budget.rb");
    const content = `${Array.from({ length: 500 }, (_, i) => "value = " + i).join("\n")}\n`;
    writeFileSync(filePath, content, "utf8");

    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});
