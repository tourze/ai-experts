import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const doctrineRef = resolve("plugins/symfony-expert/skills/doctrine-batch-processing/reference.md");
const twigRef = resolve("plugins/symfony-expert/skills/twig-components/reference.md");
const votersRef = resolve("plugins/symfony-expert/skills/symfony-voters/reference.md");
const messengerRef = resolve("plugins/symfony-expert/skills/symfony-messenger/reference.md");

test("参考文档不再包含本次修复的已知错误片段", () => {
  const doctrine = readFileSync(doctrineRef, "utf-8");
  const twig = readFileSync(twigRef, "utf-8");
  const voters = readFileSync(votersRef, "utf-8");
  const messenger = readFileSync(messengerRef, "utf-8");

  for (const [file, content] of [
    [doctrineRef, doctrine],
    [twigRef, twig],
    [votersRef, voters],
    [messengerRef, messenger],
  ]) {
    assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, `${file} 仍有占位符`);
  }

  assert.doesNotMatch(doctrine, /^\s*const BATCH_SIZE = 100;[\s\S]*self::BATCH_SIZE/m, "Doctrine 参考仍保留无效的全局常量/类常量混用");
  assert.match(doctrine, /\$batchSize = 100/);

  assert.doesNotMatch(twig, /type="submit"[\s\S]*data-live-action-param="submit"/, "Twig 组件表单示例仍可能触发原生提交与 LiveAction 冲突");
  assert.doesNotMatch(twig, /- rg --files/, "Twig 参考仍包含无关的验证命令");
  assert.doesNotMatch(twig, /异步流程的重试或部分失败行为/, "Twig 参考仍保留复制粘贴的错误失败模式");

  assert.doesNotMatch(voters, /异步流程的重试或部分失败行为/, "Voters 参考仍保留异步失败模式文案");
  assert.match(voters, /POST_EDIT/);

  assert.match(messenger, /failure_transport/);
  assert.match(messenger, /messenger:failed:retry/);
});
