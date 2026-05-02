import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runProtectedPaths } from "../hooks/pre-tool-use/edit-write/protected-paths.mjs";
import { run as runSyntaxDoctrineEntity } from "../hooks/post-tool-use/edit-write/syntax-doctrine-entity.mjs";
import { run as runSyntaxTwig } from "../hooks/post-tool-use/edit-write/syntax-twig.mjs";

function payload(filePath) {
  return { tool_input: { file_path: filePath } };
}

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "symfony-hooks-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function withPath(value, fn) {
  const originalPath = process.env.PATH;
  process.env.PATH = value;
  try {
    return await fn();
  } finally {
    process.env.PATH = originalPath;
  }
}

test("protected-paths 会拦截 Symfony 生成物和历史迁移文件", async () => {
  await withTempDir(async (dir) => {
    const blocked = await runProtectedPaths(payload(join(dir, "var", "cache", "dev", "app.cache")));
    assert.equal(blocked?.decision, "block");
    assert.match(blocked?.reason ?? "", /var\/cache/);

    const migration = await runProtectedPaths(payload(join(dir, "migrations", "Version20260414000000.php")));
    assert.equal(migration?.decision, "block");
    assert.match(migration?.reason ?? "", /迁移文件/);
  });
});

test("syntax-doctrine-entity 会拦截缺少 ORM 映射属性的实体", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "src", "Entity", "Product.php");
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `<?php

namespace App\\Entity;

use Doctrine\\ORM\\Mapping as ORM;

#[ORM\\Entity]
final class Product
{
    #[ORM\\Id]
    #[ORM\\Column]
    private int $id;

    private string $name;
}
`, "utf-8");

    const result = await runSyntaxDoctrineEntity(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /缺少 ORM 映射注解/);
    assert.match(result?.reason ?? "", /\$name/);
  });
});

test("syntax-twig 在缺少 lint 工具时回退到正则检查", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "templates", "broken.html.twig");
    const emptyBin = join(dir, "empty-bin");
    mkdirSync(dirname(filePath), { recursive: true });
    mkdirSync(emptyBin, { recursive: true });
    writeFileSync(filePath, "{% if user %}<div>{{ user.name }}</div>", "utf-8");

    await withPath(emptyBin, async () => {
      const result = await runSyntaxTwig(payload(filePath));
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /if\/endif 不配对/);
    });
  });
});
