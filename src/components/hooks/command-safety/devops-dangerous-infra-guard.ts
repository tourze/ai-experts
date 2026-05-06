import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

export const devopsDangerousInfraGuardHook = defineHook({
  id: "devops-dangerous-infra-guard",
  description: "拦截 terraform destroy、kubectl delete ns 等高危基础设施命令。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./devops-dangerous-infra-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * dangerous-infra-guard（PreToolUse — Bash）
 *
 * 拦截高风险基础设施命令：kubectl 批量删除、terraform destroy、
 * Docker 批量清理、Helm 卸载与云 CLI 破坏性操作。
 * 新增规则只需在 PATTERNS 中加一条。
 */

const PATTERNS: readonly (readonly [RegExp, string])[] = [
  // ── Kubernetes ──
  [
    /\bkubectl\s+delete\s+(namespace|ns)\b/i,
    "kubectl delete namespace 会删除命名空间及其中全部资源",
  ],
  [
    /\bkubectl\s+delete\b.*\s--all\b/,
    "kubectl delete --all 会批量删除指定类型的全部资源",
  ],

  // ── Terraform ──
  [
    /\bterraform\s+destroy\b/,
    "terraform destroy 会销毁 Terraform 管理的全部基础设施",
  ],
  [
    /\bterraform\s+apply\b.*\s-auto-approve\b/,
    "terraform apply -auto-approve 跳过确认直接执行变更",
  ],

  // ── Docker ──
  [
    /\bdocker\s+system\s+prune\b.*\s-a\b/,
    "docker system prune -a 会删除所有未使用的镜像、容器和网络",
  ],
  [
    /\bdocker\s+(?:rm|remove)\s+-f\s+\$\(/,
    "docker rm -f $(...) 批量强制删除容器",
  ],
  [
    /\bdocker[-\s]compose\s+down\b.*\s-v\b/,
    "docker-compose down -v 会同时删除数据卷（数据不可恢复）",
  ],

  // ── Helm ──
  [
    /\bhelm\s+uninstall\b/,
    "helm uninstall 会删除 release 及其全部 Kubernetes 资源",
  ],

  // ── AWS ──
  [
    /\baws\s+s3\s+rb\b/,
    "aws s3 rb 会删除 S3 存储桶",
  ],
  [
    /\baws\s+s3\s+rm\b.*\s--recursive\b/,
    "aws s3 rm --recursive 会递归删除存储桶中全部对象",
  ],

  // ── GCP ──
  [
    /\bgcloud\s+projects\s+delete\b/,
    "gcloud projects delete 会删除整个 GCP 项目",
  ],

  // ── Azure ──
  [
    /\baz\s+group\s+delete\b/,
    "az group delete 会删除资源组及其中全部资源",
  ],
];

export async function run(payload: LegacyHookPayload) {
  const command = payload?.tool_input?.command || "";

  for (const [pattern, reason] of PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: [
          "[Dangerous Infra Command] 已拦截高危基础设施命令",
          "",
          `原因：${reason}`,
          `命令：${command}`,
          "",
          "如确需执行，必须先得到用户明确授权。",
        ].join("\n"),
      };
    }
  }
  return null;
}
