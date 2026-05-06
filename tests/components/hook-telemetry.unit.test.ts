import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "vitest";
import { repoRoot } from "./test-helpers";

test("hook telemetry records stable component names and reminder cooldown", async () => {
  const telemetryDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-telemetry-"));
  const workspaceDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-workspace-"));
  const previousTelemetryDir = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR;
  const previousTelemetryWorkspace = process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;

  process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR = telemetryDir;
  process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE = workspaceDir;

  try {
    const cacheKey = `?test=${Date.now()}`;
    const auditTelemetry = await import(
      `${pathToFileURL(join(repoRoot, "src/components/hooks/_shared/audit-telemetry.ts")).href}${cacheKey}`
    );
    const reminder = await import(
      `${pathToFileURL(join(
        repoRoot,
        "src/components/hooks/skill-routing/skill-trigger-telemetry-advisor-reminder.ts",
      )).href}${cacheKey}`
    );

    const payload = {
      cwd: workspaceDir,
      session_id: "test-session",
      transcript_path: null,
      prompt: "请继续审计这些 hook 并修复所有发现的问题",
    };

    for (let index = 0; index < 3; index += 1) {
      auditTelemetry.recordAuditTelemetry(payload, {
        hook: "skill-usage-audit.mjs",
        event: "stop",
        decision: "audit",
        audit_type: "skill_usage",
        missing_route: true,
        routed_but_not_used: false,
        skills_recommended: [],
        skills_used: [],
      });
    }

    const first = await reminder.run(payload);
    assert.equal(first?.decision, "context");
    assert.match(first.reason, /Trigger Telemetry Advisor Reminder/);

    const second = await reminder.run(payload);
    assert.equal(second, null);

    const entries = auditTelemetry.readRecentTelemetryEntries(payload);
    const reminderEntry = entries.find((entry: any) => entry.audit_type === "trigger_telemetry_advisor_reminder");
    assert.equal(reminderEntry.component, "hooks");
    assert.equal(entries.some((entry: any) => Object.hasOwn(entry, "plugin")), false);
  } finally {
    if (previousTelemetryDir === undefined) delete process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR;
    else process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR = previousTelemetryDir;

    if (previousTelemetryWorkspace === undefined) delete process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;
    else process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE = previousTelemetryWorkspace;

    rmSync(telemetryDir, { recursive: true, force: true });
    rmSync(workspaceDir, { recursive: true, force: true });
  }
});
