import type { HookDefinition } from "../../sdk";
import { commentDisciplinePrimerHook } from "./comment-discipline-primer";
import { completionStatusProtocolHook } from "./completion-status-protocol";
import { confusionProtocolHook } from "./confusion-protocol";
import { debugMethodologyPrimerHook } from "./debug-methodology-primer";
import { docsVisualStructurePrimerHook } from "./docs-visual-structure-primer";
import { feedbackDetectorHook } from "./feedback-detector";
import { frontendVisualBriefConcretizerPrimerHook } from "./frontend-visual-brief-concretizer-primer";
import { investigationPrimerHook } from "./investigation-primer";
import { overEngineeringPrimerHook } from "./over-engineering-primer";

export { commentDisciplinePrimerHook, completionStatusProtocolHook, confusionProtocolHook, debugMethodologyPrimerHook, docsVisualStructurePrimerHook, feedbackDetectorHook, frontendVisualBriefConcretizerPrimerHook, investigationPrimerHook, overEngineeringPrimerHook };

export const promptGuidanceHooks: readonly HookDefinition[] = [
  commentDisciplinePrimerHook,
  completionStatusProtocolHook,
  confusionProtocolHook,
  debugMethodologyPrimerHook,
  docsVisualStructurePrimerHook,
  feedbackDetectorHook,
  frontendVisualBriefConcretizerPrimerHook,
  investigationPrimerHook,
  overEngineeringPrimerHook,
];
