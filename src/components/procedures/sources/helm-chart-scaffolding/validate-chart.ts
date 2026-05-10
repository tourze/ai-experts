#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export const procedure = defineCliProcedure({
  id: "helm-chart-scaffolding-validate-chart",
  entry: procedureEntry(import.meta.url),
  description:
    "校验 Helm Chart 的目录结构、Chart.yaml 元数据、模板渲染和 dry-run 安装，涵盖安全最佳实践和资源定义检查。",
  owners: { skillIds: ["helm-chart-scaffolding"] },
  target: "scripts/validate-chart.mjs",
  runtime: "node",
  params: [
    {
      flag: "[chart_dir]",
      type: "路径",
      description: "要校验的 Helm Chart 目录（默认 .）",
      required: false,
    },
  ],

  exampleArgs: { args: ["."] },
});

const RELEASE_NAME = "test-release";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const RED = "\x1b[0;31m";
const NC = "\x1b[0m";
function success(message: any): any {
  console.log(`${GREEN}✓${NC} ${message}`);
}
function warning(message: any): any {
  console.log(`${YELLOW}⚠${NC} ${message}`);
}
function error(message: any): any {
  console.log(`${RED}✗${NC} ${message}`);
}
function commandExists(command: any): any {
  const checker = process.platform === "win32" ? "where" : "which";
  return spawnSync(checker, [command], { stdio: "ignore" }).status === 0;
}
function run(command: any, args: any, options: any = {}): any {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}
function runHelm(args: any, options: any = {}): any {
  return run("helm", args, options);
}
function readChartField(chartYaml: any, field: any): any {
  const match = chartYaml.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}
function contains(manifests: any, value: any): any {
  return manifests.includes(value);
}
function printHeader(): any {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Helm Chart Validation");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
}
export function main(argv: readonly string[]): any {
  const chartDir = argv[0] || ".";
  printHeader();
  if (!commandExists("helm")) {
    error("Helm is not installed");
    return 1;
  }
  console.log(`📦 Chart directory: ${chartDir}`);
  console.log("");
  console.log("1️⃣  Checking chart structure...");
  if (!existsSync(join(chartDir, "Chart.yaml"))) {
    error("Chart.yaml not found");
    return 1;
  }
  success("Chart.yaml exists");
  if (!existsSync(join(chartDir, "values.yaml"))) {
    error("values.yaml not found");
    return 1;
  }
  success("values.yaml exists");
  if (!existsSync(join(chartDir, "templates"))) {
    error("templates/ directory not found");
    return 1;
  }
  success("templates/ directory exists");
  console.log("");
  console.log("2️⃣  Linting chart...");
  if (runHelm(["lint", chartDir], { stdio: "inherit" }).status === 0) {
    success("Chart passed lint");
  } else {
    error("Chart failed lint");
    return 1;
  }
  console.log("");
  console.log("3️⃣  Validating Chart.yaml...");
  const chartYaml = readFileSync(join(chartDir, "Chart.yaml"), "utf8");
  const chartName = readChartField(chartYaml, "name");
  const chartVersion = readChartField(chartYaml, "version");
  const appVersion = readChartField(chartYaml, "appVersion");
  if (!chartName) {
    error("Chart name not found");
    return 1;
  }
  success(`Chart name: ${chartName}`);
  if (!chartVersion) {
    error("Chart version not found");
    return 1;
  }
  success(`Chart version: ${chartVersion}`);
  if (!appVersion) {
    warning("App version not specified");
  } else {
    success(`App version: ${appVersion}`);
  }
  console.log("");
  console.log("4️⃣  Testing template rendering...");
  let template = runHelm(["template", RELEASE_NAME, chartDir]);
  if (template.status === 0) {
    success("Templates rendered successfully");
  } else {
    error("Template rendering failed");
    process.stdout.write(template.stdout || "");
    process.stderr.write(template.stderr || "");
    return 1;
  }
  console.log("");
  console.log("5️⃣  Testing dry-run installation...");
  const dryRun = runHelm([
    "install",
    RELEASE_NAME,
    chartDir,
    "--dry-run=client",
    "--debug",
  ]);
  if (dryRun.status === 0) {
    success("Dry-run installation successful");
  } else {
    error("Dry-run installation failed");
    process.stdout.write(dryRun.stdout || "");
    process.stderr.write(dryRun.stderr || "");
    return 1;
  }
  console.log("");
  console.log("6️⃣  Checking generated resources...");
  template = runHelm(["template", RELEASE_NAME, chartDir]);
  const manifests = template.stdout || "";
  if (contains(manifests, "kind: Deployment")) success("Deployment found");
  else warning("No Deployment found");
  if (contains(manifests, "kind: Service")) success("Service found");
  else warning("No Service found");
  if (contains(manifests, "kind: ServiceAccount"))
    success("ServiceAccount found");
  else warning("No ServiceAccount found");
  console.log("");
  console.log("7️⃣  Checking security best practices...");
  if (contains(manifests, "runAsNonRoot: true"))
    success("Running as non-root user");
  else warning("Not explicitly running as non-root");
  if (contains(manifests, "readOnlyRootFilesystem: true"))
    success("Using read-only root filesystem");
  else warning("Not using read-only root filesystem");
  if (contains(manifests, "allowPrivilegeEscalation: false"))
    success("Privilege escalation disabled");
  else warning("Privilege escalation not explicitly disabled");
  console.log("");
  console.log("8️⃣  Checking resource configuration...");
  if (contains(manifests, "resources:")) {
    if (contains(manifests, "limits:")) success("Resource limits defined");
    else warning("No resource limits defined");
    if (contains(manifests, "requests:")) success("Resource requests defined");
    else warning("No resource requests defined");
  } else {
    warning("No resources defined");
  }
  console.log("");
  console.log("9️⃣  Checking health probes...");
  if (contains(manifests, "livenessProbe:"))
    success("Liveness probe configured");
  else warning("No liveness probe found");
  if (contains(manifests, "readinessProbe:"))
    success("Readiness probe configured");
  else warning("No readiness probe found");
  console.log("");
  if (/^dependencies:/m.test(chartYaml)) {
    console.log("🔟 Checking dependencies...");
    if (runHelm(["dependency", "list", chartDir]).status === 0) {
      success("Dependencies valid");
      if (existsSync(join(chartDir, "Chart.lock"))) {
        success("Chart.lock file present");
      } else {
        warning("Chart.lock file missing (run 'helm dependency update')");
      }
    } else {
      error("Dependencies check failed");
      return 1;
    }
    console.log("");
  }
  const schemaPath = join(chartDir, "values.schema.json");
  if (existsSync(schemaPath)) {
    console.log("1️⃣1️⃣ Validating values schema...");
    success("values.schema.json present");
    try {
      JSON.parse(readFileSync(schemaPath, "utf8"));
      success("values.schema.json is valid JSON");
    } catch {
      error("values.schema.json contains invalid JSON");
      return 1;
    }
    console.log("");
  }
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Validation Complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log(`Chart: ${chartName}`);
  console.log(`Version: ${chartVersion}`);
  if (appVersion) {
    console.log(`App Version: ${appVersion}`);
  }
  console.log("");
  success("All validations passed!");
  console.log("");
  console.log("Next steps:");
  console.log(`  • helm package ${chartDir}`);
  console.log(`  • helm install my-release ${chartDir}`);
  console.log("  • helm test my-release");
  console.log("");
  return 0;
}
