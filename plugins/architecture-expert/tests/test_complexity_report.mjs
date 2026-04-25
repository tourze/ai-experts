import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const script = join(root, "skills", "code-refiner", "scripts", "complexity_report.mjs");

function runReport(source) {
  const tempDir = mkdtempSync(join(tmpdir(), "architecture-complexity-"));
  const sample = join(tempDir, "sample.py");

  try {
    writeFileSync(sample, source, "utf-8");
    const output = execFileSync("node", [script, sample, "--format", "json"], {
      encoding: "utf-8",
    });
    return JSON.parse(output)[0].functions;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

test("nested function metrics do not pollute outer function", () => {
  const functions = runReport(`
def outer(flag):
    def inner(items):
        for item in items:
            if item:
                return item
        return None

    if flag:
        return inner([1, 2, 3])
    return None
`);

  const outer = functions.find((func) => func.name === "outer");
  const inner = functions.find((func) => func.name === "inner");

  assert.equal(outer.branch_count, 1);
  assert.equal(outer.max_nesting_depth, 1);
  assert.equal(inner.branch_count, 2);
  assert.equal(inner.max_nesting_depth, 2);
});

test("triple-quoted sample strings are not treated as real functions", () => {
  const functions = runReport(`
def real_function():
    sample = """
def fake_function(flag):
    if flag:
        return 1
"""
    return sample
`);

  assert.deepEqual(
    functions.map((func) => func.name),
    ["real_function"],
  );
});
