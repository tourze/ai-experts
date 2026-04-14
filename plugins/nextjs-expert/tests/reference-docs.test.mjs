import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const referenceFiles = [
  "plugins/nextjs-expert/skills/nextjs-developer/references/app-router.md",
  "plugins/nextjs-expert/skills/nextjs-developer/references/data-fetching.md",
  "plugins/nextjs-expert/skills/nextjs-developer/references/deployment.md",
  "plugins/nextjs-expert/skills/nextjs-developer/references/server-actions.md",
  "plugins/nextjs-expert/skills/nextjs-developer/references/server-components.md",
].map((file) => resolve(file));

test("参考文档不再包含本次修复的已知失效模式", () => {
  for (const file of referenceFiles) {
    const content = readFileSync(file, "utf-8");

    assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, `${file} 仍有占位符`);
    assert.doesNotMatch(content, /\buseFormState\b/, `${file} 仍引用过时的 useFormState`);
    assert.doesNotMatch(content, /\bexperimental_useOptimistic\b/, `${file} 仍引用 experimental_useOptimistic`);
    assert.doesNotMatch(content, /\bcookies\(\)\.(set|get)\(/, `${file} 仍使用未 await 的 cookies API`);
    assert.doesNotMatch(content, /(^|[^\.\w])refresh\(\)/m, `${file} 仍存在未定义的 refresh()`);
    assert.doesNotMatch(content, /\bServerSidebar\b/, `${file} 仍存在未定义的 ServerSidebar`);
    assert.doesNotMatch(content, /\btoggleTodo\b/, `${file} 仍存在错误的 action 引用`);
    assert.doesNotMatch(content, /params\s*}:\s*\{\s*params:\s*\{/, `${file} 仍存在同步 params 示例`);
  }
});

test("revalidateTag 示例统一使用当前推荐签名", () => {
  for (const file of referenceFiles) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n").filter((line) => line.includes("revalidateTag("));

    for (const line of lines) {
      assert.match(line, /revalidateTag\([^,]+,\s*'max'\)/, `${file} 中存在未带 profile 的 revalidateTag：${line.trim()}`);
    }
  }
});
