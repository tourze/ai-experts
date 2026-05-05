import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/docs-expert");

test("Shared Office runtime exists", () => {
  for (const relativeFile of [
    "skills/_office_runtime/run_python_module.mjs",
    "skills/_office_runtime/pack.py",
    "skills/_office_runtime/unpack.py",
    "skills/_office_runtime/validate.py",
    "skills/_office_runtime/soffice.py",
    "skills/_office_runtime/helpers/merge_runs.py",
    "skills/_office_runtime/helpers/simplify_redlines.py",
    "skills/_office_runtime/validators/base.py",
    "skills/_office_runtime/validators/docx.py",
    "skills/_office_runtime/validators/pptx.py",
    "skills/_office_runtime/validators/redlining.py",
  ]) {
    assert.equal(existsSync(resolve(pluginRoot, relativeFile)), true, relativeFile);
  }
});
