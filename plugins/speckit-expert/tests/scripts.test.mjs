import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/speckit-expert");
const node = process.execPath;

function makeTempProject(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "speckit-expert-")));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function bootstrapProject(cwd) {
  return execFileSync(node, [resolve(pluginRoot, "scripts/bootstrap-specify.mjs")], {
    cwd,
    encoding: "utf8",
  });
}

test("bootstrap uses its own plugin location and can be rerun from .specify", (t) => {
  const projectDir = makeTempProject(t);

  const output = bootstrapProject(projectDir);

  assert.match(output, /\[ok\] 已初始化/);
  assert.ok(existsSync(join(projectDir, ".specify/scripts/check-prerequisites.mjs")));
  assert.ok(existsSync(join(projectDir, ".specify/scripts/bootstrap-specify.mjs")));
  assert.ok(existsSync(join(projectDir, ".specify/templates/spec-template.md")));

  const rerunOutput = execFileSync(node, [join(projectDir, ".specify/scripts/bootstrap-specify.mjs")], {
    cwd: projectDir,
    encoding: "utf8",
  });
  assert.match(rerunOutput, /\[ok\] 已初始化/);
});

test("check-prerequisites does not invent specs/<branch> on ordinary branches", (t) => {
  const projectDir = makeTempProject(t);
  bootstrapProject(projectDir);

  const result = spawnSync(node, [join(projectDir, ".specify/scripts/check-prerequisites.mjs"), "--json", "--paths-only"], {
    cwd: projectDir,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /No current Spec Kit feature is configured/);
  assert.doesNotMatch(result.stdout, /specs\/(?:main|master)/);
});

test("feature scripts write and reuse .specify/feature.json from repo root", (t) => {
  const projectDir = makeTempProject(t);
  bootstrapProject(projectDir);
  const nestedDir = join(projectDir, "src/nested");
  mkdirSync(nestedDir, { recursive: true });

  const createOutput = execFileSync(
    node,
    [join(projectDir, ".specify/scripts/create-new-feature.mjs"), "--json", "--short-name", "Enterprise Audit", "Browser telemetry"],
    { cwd: nestedDir, encoding: "utf8" },
  );
  const created = JSON.parse(createOutput);
  const featureJson = JSON.parse(readFileSync(join(projectDir, ".specify/feature.json"), "utf8"));

  assert.equal(featureJson.feature_directory, ".specify/features/enterprise-audit");
  assert.equal(created.SLUG, "enterprise-audit");
  assert.equal(created.FEATURE_DIR, join(projectDir, ".specify/features/enterprise-audit"));
  assert.equal(existsSync(join(nestedDir, ".specify/feature.json")), false);

  const pathsOutput = execFileSync(
    node,
    [join(projectDir, ".specify/scripts/check-prerequisites.mjs"), "--json", "--paths-only"],
    { cwd: nestedDir, encoding: "utf8" },
  );
  const paths = JSON.parse(pathsOutput);

  assert.equal(paths.FEATURE_DIR, join(projectDir, ".specify/features/enterprise-audit"));
  assert.equal(paths.FEATURE_SPEC, join(projectDir, ".specify/features/enterprise-audit/spec.md"));
});

test("setup-plan writes plan.md into the configured feature directory", (t) => {
  const projectDir = makeTempProject(t);
  bootstrapProject(projectDir);

  execFileSync(
    node,
    [join(projectDir, ".specify/scripts/create-new-feature.mjs"), "--json", "--short-name", "Plan Target", "Generate a plan"],
    { cwd: projectDir, encoding: "utf8" },
  );

  const setupResult = spawnSync(node, [join(projectDir, ".specify/scripts/setup-plan.mjs"), "--json"], {
    cwd: projectDir,
    encoding: "utf8",
  });

  assert.equal(setupResult.status, 0, setupResult.stderr);
  const setup = JSON.parse(setupResult.stdout);

  assert.equal(setup.IMPL_PLAN, join(projectDir, ".specify/features/plan-target/plan.md"));
  assert.ok(existsSync(setup.IMPL_PLAN));
});
