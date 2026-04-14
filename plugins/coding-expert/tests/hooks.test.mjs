import test from "node:test";
import assert from "node:assert/strict";

import { run as runCommentDisciplinePrimer } from "../hooks/user-prompt-submit/comment-discipline-primer.mjs";

test("comment-discipline-primer 在注释纪律相关任务下注入 context", async () => {
  const result = await runCommentDisciplinePrimer({
    prompt: "这里有个 HACK workaround，需要把解除条件和调用方责任写清楚",
  });

  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /代码说“是什么”，注释说“为什么”/);
  assert.match(result?.reason ?? "", /HACK \/ WORKAROUND/);
  assert.match(result?.reason ?? "", /外部约束与契约/);
});

test("comment-discipline-primer 对普通实现任务不注入", async () => {
  const result = await runCommentDisciplinePrimer({
    prompt: "实现一个登录表单页面",
  });

  assert.equal(result, null);
});

test("comment-discipline-primer 对斜杠命令不注入", async () => {
  const result = await runCommentDisciplinePrimer({
    prompt: "/comment-discipline",
  });

  assert.equal(result, null);
});
