import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/docs-expert");
const skills = ["docx", "pptx", "xlsx"];
const officeFiles = [
  "scripts/office/pack.py",
  "scripts/office/unpack.py",
  "scripts/office/validate.py",
  "scripts/office/soffice.py",
  "scripts/office/helpers/__init__.py",
  "scripts/office/helpers/merge_runs.py",
  "scripts/office/helpers/simplify_redlines.py",
  "scripts/office/validators/__init__.py",
  "scripts/office/validators/base.py",
  "scripts/office/validators/docx.py",
  "scripts/office/validators/pptx.py",
  "scripts/office/validators/redlining.py",
];

test("Office runtime wrappers point to shared implementation", () => {
  for (const skill of skills) {
    for (const relativeFile of officeFiles) {
      const file = resolve(pluginRoot, "skills", skill, relativeFile);
      const content = readFileSync(file, "utf-8");
      assert.match(content, /_office_runtime/, file);
    }
  }
});

test("Shared Office runtime exists", () => {
  for (const relativeFile of [
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
