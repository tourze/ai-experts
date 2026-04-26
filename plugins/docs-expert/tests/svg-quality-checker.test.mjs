import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkSvgContent,
  collectSvgFiles,
} from "../skills/pptx/scripts/svg_quality_checker.mjs";

const scriptPath = fileURLToPath(new URL("../skills/pptx/scripts/svg_quality_checker.mjs", import.meta.url));

test("svg quality checker accepts supported DrawingML subset", () => {
  const issues = checkSvgContent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <rect x="0" y="0" width="1600" height="900" fill="#FFFFFF"/>
  <text x="80" y="120" font-family="Calibri, Noto Sans SC" fill="#222222">Hello</text>
</svg>
`);
  assert.deepEqual(issues, []);
});

test("svg quality checker reports banned constructs", () => {
  const issues = checkSvgContent(`
<svg xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.5">
    <script>alert(1)</script>
    <rect class="card" fill="rgba(1,2,3,0.5)" width="100" height="100"/>
    <image href="https://example.com/a.png"/>
  </g>
</svg>
`);
  const errors = issues.filter((issue) => issue.level === "error").map((issue) => issue.message);
  assert.ok(errors.some((message) => message.includes("Missing viewBox")));
  assert.ok(errors.some((message) => message.includes("opacity on <g>")));
  assert.ok(errors.some((message) => message.includes("banned element <script>")));
  assert.ok(errors.some((message) => message.includes('banned attribute "class"')));
  assert.ok(errors.some((message) => message.includes("rgba() color in fill")));
  assert.ok(errors.some((message) => message.includes("external image URL")));
});

test("collectSvgFiles supports shallow directory mode", () => {
  const dir = mkdtempSync(join(tmpdir(), "svg-quality-"));
  writeFileSync(join(dir, "a.svg"), '<svg viewBox="0 0 1600 900"></svg>');
  writeFileSync(join(dir, "notes.txt"), "ignore");
  assert.deepEqual(collectSvgFiles([dir]).map((path) => path.endsWith("a.svg")), [true]);
});

test("svg_quality_checker.mjs CLI exits non-zero when any SVG fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "svg-quality-"));
  writeFileSync(join(dir, "pass.svg"), '<svg viewBox="0 0 1600 900"><rect width="1" height="1"/></svg>');
  writeFileSync(join(dir, "fail.svg"), '<svg><style>.x{fill:red}</style></svg>');
  const result = spawnSync(process.execPath, [scriptPath, dir], { encoding: "utf8" });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /fail\.svg: FAIL/);
  assert.match(result.stdout, /pass\.svg: PASS/);
  assert.match(result.stdout, /Summary: 1\/2 passed, 1\/2 failed/);
});
