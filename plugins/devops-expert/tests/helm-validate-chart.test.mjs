import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/devops-expert");
const script = resolve(pluginRoot, "skills/helm-chart-scaffolding/scripts/validate-chart.mjs");

function writeHelmStub(root) {
  const helmPath = join(root, "helm");
  writeFileSync(
    helmPath,
    `#!/bin/sh
set -eu
case "$1" in
  lint)
    exit 0
    ;;
  template)
    cat <<'MANIFEST'
kind: Deployment
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
      containers:
        - name: app
          securityContext:
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
          resources:
            limits:
              cpu: 100m
            requests:
              cpu: 50m
          livenessProbe:
            httpGet:
              path: /healthz
          readinessProbe:
            httpGet:
              path: /ready
---
kind: Service
---
kind: ServiceAccount
MANIFEST
    ;;
  install)
    exit 0
    ;;
  dependency)
    exit 0
    ;;
  *)
    echo "unexpected helm call: $*" >&2
    exit 99
    ;;
esac
`,
    "utf-8",
  );
  chmodSync(helmPath, 0o755);
}

function writeChart(root, extraChartYaml = "") {
  mkdirSync(join(root, "templates"), { recursive: true });
  writeFileSync(
    join(root, "Chart.yaml"),
    `apiVersion: v2
name: demo
version: 0.1.0
appVersion: "1.2.3"
${extraChartYaml}`,
    "utf-8",
  );
  writeFileSync(join(root, "values.yaml"), "{}\n", "utf-8");
}

test("validate-chart.mjs 通过语法检查", () => {
  const result = spawnSync(process.execPath, ["--check", script], { encoding: "utf-8" });
  assert.equal(result.status, 0, result.stderr);
});

test("validate-chart.mjs 缺少 helm 时返回明确错误", () => {
  const chartRoot = mkdtempSync(join(tmpdir(), "helm-chart-"));
  writeChart(chartRoot);

  try {
    const result = spawnSync(process.execPath, [script, chartRoot], {
      encoding: "utf-8",
      env: { ...process.env, PATH: "" },
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Helm is not installed/);
  } finally {
    rmSync(chartRoot, { recursive: true, force: true });
  }
});

test("validate-chart.mjs 校验 chart 结构和 stub helm 输出", () => {
  const root = mkdtempSync(join(tmpdir(), "helm-validate-"));
  const binRoot = join(root, "bin");
  const chartRoot = join(root, "chart");
  mkdirSync(binRoot, { recursive: true });
  mkdirSync(chartRoot, { recursive: true });
  writeHelmStub(binRoot);
  writeChart(chartRoot);
  writeFileSync(join(chartRoot, "values.schema.json"), '{"type":"object"}\n', "utf-8");

  try {
    const result = spawnSync(process.execPath, [script, chartRoot], {
      encoding: "utf-8",
      env: {
        ...process.env,
        PATH: `${binRoot}:${process.env.PATH}`,
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Chart passed lint/);
    assert.match(result.stdout, /Templates rendered successfully/);
    assert.match(result.stdout, /Deployment found/);
    assert.match(result.stdout, /values\.schema\.json is valid JSON/);
    assert.match(result.stdout, /All validations passed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
