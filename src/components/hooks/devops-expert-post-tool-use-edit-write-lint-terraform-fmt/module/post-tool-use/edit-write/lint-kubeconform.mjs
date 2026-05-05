/**
 * kubeconform — Kubernetes manifest 静态校验
 *
 * 匹配策略（两阶段，避免误伤非 k8s 的 yaml）：
 * 1. 扩展名过滤 *.yml / *.yaml（快速排除非 YAML）
 * 2. 内容嗅探：必须同时包含行首 `apiVersion:` 和 `kind:`
 *    - GitHub Actions workflow（.github/workflows/）    → 只有 jobs/steps，无 apiVersion → 不触发
 *    - docker-compose.yml                              → 有 services，无 apiVersion/kind → 不触发
 *    - ansible playbook                                → 有 hosts/tasks，无 apiVersion/kind → 不触发
 *    - k8s manifest / CRD / kustomization              → 有 apiVersion+kind → 触发
 * 3. 跳过 Go 模板文件（含 `{{...}}`）：Helm/Kustomize 模板不是合法 YAML，
 *    kubeconform 会在模板语法上误报，直接跳过让 helm lint 处理
 *
 * 调用 kubeconform 校验 schema 符合 k8s API。
 * report 模式：输出警告但不 block，与 lint-actionlint 策略一致。
 * kubeconform 未安装时静默跳过。
 *
 * 未来如需添加其他 k8s 检查（kube-score / kubesec / polaris），
 * 应作为新的 checkX() 函数加入本文件，保持 lint-shellcheck 式的
 * 单文件多检查结构，不要再像 lint-hadolint 那样拆分。
 */
import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt } from "./_utils.mjs";

function matchesByPath(filePath) {
  return matchExt(filePath, [".yml", ".yaml"]);
}

function isK8sManifest(content) {
  // Helm/Kustomize 模板：kubeconform 无法处理，跳过
  if (/\{\{.*?\}\}/.test(content)) return false;
  // k8s manifest 签名：行首的 apiVersion 和 kind 必须同时存在
  return (
    /^apiVersion:\s*\S/m.test(content) && /^kind:\s*\S/m.test(content)
  );
}

function runKubeconform(filePath) {
  if (!hasCommand("kubeconform")) return null;
  try {
    execFileSync(cmd("kubeconform"), [filePath], {
      stdio: "pipe",
      timeout: 15000,
    });
    return null;
  } catch (err) {
    const output =
      (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() || null;
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matchesByPath(filePath)) return null;

  // 内容嗅探前先读文件，复用给后续可能新增的 check 函数
  const content = readFileSync(filePath, "utf-8");
  if (!isK8sManifest(content)) return null;

  // kubeconform schema 校验（report 级别）
  const output = runKubeconform(filePath);
  if (output) {
    return {
      decision: "report",
      reason: `[kubeconform] ${output}`,
    };
  }

  return null;
}
