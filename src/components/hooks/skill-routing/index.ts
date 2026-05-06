import type { HookDefinition } from "../../sdk";
import { componentRoutingReminder } from "./component-routing-reminder";
import { skillNextStepGateHook } from "./skill-next-step-gate";
import { skillRoutingContextHook } from "./skill-routing-context";
import { skillRoutingReminderHook } from "./skill-routing-reminder";
import { skillTriggerTelemetryAdvisorReminderHook } from "./skill-trigger-telemetry-advisor-reminder";
import { skillUsageAuditHook } from "./skill-usage-audit";

export { componentRoutingReminder, skillNextStepGateHook, skillRoutingContextHook, skillRoutingReminderHook, skillTriggerTelemetryAdvisorReminderHook, skillUsageAuditHook };

export const skillRoutingHooks: readonly HookDefinition[] = [
  componentRoutingReminder,
  skillNextStepGateHook,
  skillRoutingContextHook,
  skillRoutingReminderHook,
  skillTriggerTelemetryAdvisorReminderHook,
  skillUsageAuditHook,
];
