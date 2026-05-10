import { androidReviewerAgent } from "./agents/android-reviewer/index";
import { architectureDesignerAgent } from "./agents/architecture-designer/index";
import { codebaseAnalystAgent } from "./agents/codebase-analyst/index";
import { refactorPlannerAgent } from "./agents/refactor-planner/index";
import { bugInvestigatorAgent } from "./agents/bug-investigator/index";
import { codeReviewerAgent } from "./agents/code-reviewer/index";
import { cppReviewerAgent } from "./agents/cpp-reviewer/index";
import { aiAppEngineerAgent } from "./agents/ai-app-engineer/index";
import { dataAnalystAgent } from "./agents/data-analyst/index";
import { dbLifecycleEngineerAgent } from "./agents/db-lifecycle-engineer/index";
import { ciPipelineFixerAgent } from "./agents/ci-pipeline-fixer/index";
import { incidentResponderAgent } from "./agents/incident-responder/index";
import { infrastructureEngineerAgent } from "./agents/infrastructure-engineer/index";
import { observabilityEngineerAgent } from "./agents/observability-engineer/index";
import { systemDiagnosticianAgent } from "./agents/system-diagnostician/index";
import { docReviewerAgent } from "./agents/doc-reviewer/index";
import { documentProducerAgent } from "./agents/document-producer/index";
import { researchIntelligenceAnalystAgent } from "./agents/research-intelligence-analyst/index";
import { designSystemArchitectAgent } from "./agents/design-system-architect/index";
import { frontendEngineerAgent } from "./agents/frontend-engineer/index";
import { uxReviewerAgent } from "./agents/ux-reviewer/index";
import { visualProducerAgent } from "./agents/visual-producer/index";
import { webPerfEngineerAgent } from "./agents/web-perf-engineer/index";
import { gitHistorianAgent } from "./agents/git-historian/index";
import { sessionFinalizerAgent } from "./agents/session-finalizer/index";
import { goEngineerAgent } from "./agents/go-engineer/index";
import { goReviewerAgent } from "./agents/go-reviewer/index";
import { iosSimulatorSmokeTesterAgent } from "./agents/ios-simulator-smoke-tester/index";
import { mobileReleaseReviewerAgent } from "./agents/mobile-release-reviewer/index";
import { swiftuiReviewerAgent } from "./agents/swiftui-reviewer/index";
import { javaEngineerAgent } from "./agents/java-engineer/index";
import { javaReviewerAgent } from "./agents/java-reviewer/index";
import { javascriptReviewerAgent } from "./agents/javascript-reviewer/index";
import { vueEngineerAgent } from "./agents/vue-engineer/index";
import { vueReviewerAgent } from "./agents/vue-reviewer/index";
import { acquisitionStrategistAgent } from "./agents/acquisition-strategist/index";
import { contentMarketingEngineAgent } from "./agents/content-marketing-engine/index";
import { conversionOptimizerAgent } from "./agents/conversion-optimizer/index";
import { marketingCampaignOrchestratorAgent } from "./agents/marketing-campaign-orchestrator/index";
import { socialGrowthPlannerAgent } from "./agents/social-growth-planner/index";
import { laravelEngineerAgent } from "./agents/laravel-engineer/index";
import { laravelReviewerAgent } from "./agents/laravel-reviewer/index";
import { phpReviewerAgent } from "./agents/php-reviewer/index";
import { symfonyEngineerAgent } from "./agents/symfony-engineer/index";
import { symfonyReviewerAgent } from "./agents/symfony-reviewer/index";
import { webmanReviewerAgent } from "./agents/webman-reviewer/index";
import { businessAnalystAgent } from "./agents/business-analyst/index";
import { competitiveStrategistAgent } from "./agents/competitive-strategist/index";
import { pmDeliveryCoachAgent } from "./agents/pm-delivery-coach/index";
import { problemDecomposerAgent } from "./agents/problem-decomposer/index";
import { productDiscovererAgent } from "./agents/product-discoverer/index";
import { startupAdvisorAgent } from "./agents/startup-advisor/index";
import { pythonEngineerAgent } from "./agents/python-engineer/index";
import { pythonReviewerAgent } from "./agents/python-reviewer/index";
import { nextjsReviewerAgent } from "./agents/nextjs-reviewer/index";
import { reactNativeEngineerAgent } from "./agents/react-native-engineer/index";
import { reactNativeReviewerAgent } from "./agents/react-native-reviewer/index";
import { reactReviewerAgent } from "./agents/react-reviewer/index";
import { rustEngineerAgent } from "./agents/rust-engineer/index";
import { rustReviewerAgent } from "./agents/rust-reviewer/index";
import { pentestOperatorAgent } from "./agents/pentest-operator/index";
import { securityAuditorAgent } from "./agents/security-auditor/index";
import { securityResearcherAgent } from "./agents/security-researcher/index";
import { threatModelerAgent } from "./agents/threat-modeler/index";
import { skillAuthorAgent } from "./agents/skill-author/index";
import { skillQualityAuditorAgent } from "./agents/skill-quality-auditor/index";
import { evalPostHocAnalyzerAgent } from "./agents/eval-post-hoc-analyzer/index";
import { evalBlindComparatorAgent } from "./agents/eval-blind-comparator/index";
import { evalGraderAgent } from "./agents/eval-grader/index";
import { speckitDriverAgent } from "./agents/speckit-driver/index";
import { tauriEngineerAgent } from "./agents/tauri-engineer/index";
import { tauriReviewerAgent } from "./agents/tauri-reviewer/index";
import { testGeneratorAgent } from "./agents/test-generator/index";
import { testQualityReviewerAgent } from "./agents/test-quality-reviewer/index";
import { strategicThinkerAgent } from "./agents/strategic-thinker/index";
import { nestjsReviewerAgent } from "./agents/nestjs-reviewer/index";
import { typescriptEngineerAgent } from "./agents/typescript-engineer/index";
import { typescriptReviewerAgent } from "./agents/typescript-reviewer/index";
import { microsoftStackReviewerAgent } from "./agents/microsoft-stack-reviewer/index";
import { windowsPlatformReviewerAgent } from "./agents/windows-platform-reviewer/index";

export const componentAgents = [
  androidReviewerAgent,
  architectureDesignerAgent,
  codebaseAnalystAgent,
  refactorPlannerAgent,
  bugInvestigatorAgent,
  codeReviewerAgent,
  cppReviewerAgent,
  aiAppEngineerAgent,
  dataAnalystAgent,
  dbLifecycleEngineerAgent,
  ciPipelineFixerAgent,
  incidentResponderAgent,
  infrastructureEngineerAgent,
  observabilityEngineerAgent,
  systemDiagnosticianAgent,
  docReviewerAgent,
  documentProducerAgent,
  researchIntelligenceAnalystAgent,
  designSystemArchitectAgent,
  frontendEngineerAgent,
  uxReviewerAgent,
  visualProducerAgent,
  webPerfEngineerAgent,
  gitHistorianAgent,
  sessionFinalizerAgent,
  goEngineerAgent,
  goReviewerAgent,
  iosSimulatorSmokeTesterAgent,
  mobileReleaseReviewerAgent,
  swiftuiReviewerAgent,
  javaEngineerAgent,
  javaReviewerAgent,
  javascriptReviewerAgent,
  vueEngineerAgent,
  vueReviewerAgent,
  acquisitionStrategistAgent,
  contentMarketingEngineAgent,
  conversionOptimizerAgent,
  marketingCampaignOrchestratorAgent,
  socialGrowthPlannerAgent,
  laravelEngineerAgent,
  laravelReviewerAgent,
  phpReviewerAgent,
  symfonyEngineerAgent,
  symfonyReviewerAgent,
  webmanReviewerAgent,
  businessAnalystAgent,
  competitiveStrategistAgent,
  pmDeliveryCoachAgent,
  problemDecomposerAgent,
  productDiscovererAgent,
  startupAdvisorAgent,
  pythonEngineerAgent,
  pythonReviewerAgent,
  nextjsReviewerAgent,
  reactNativeEngineerAgent,
  reactNativeReviewerAgent,
  reactReviewerAgent,
  rustEngineerAgent,
  rustReviewerAgent,
  pentestOperatorAgent,
  securityAuditorAgent,
  securityResearcherAgent,
  threatModelerAgent,
  skillAuthorAgent,
  skillQualityAuditorAgent,
  evalPostHocAnalyzerAgent,
  evalBlindComparatorAgent,
  evalGraderAgent,
  speckitDriverAgent,
  tauriEngineerAgent,
  tauriReviewerAgent,
  testGeneratorAgent,
  testQualityReviewerAgent,
  strategicThinkerAgent,
  nestjsReviewerAgent,
  typescriptEngineerAgent,
  typescriptReviewerAgent,
  microsoftStackReviewerAgent,
  windowsPlatformReviewerAgent
];
