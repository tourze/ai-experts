import { androidAccessibilitySkill } from "./skills/android-accessibility/index";
import { androidArchitectureSkill } from "./skills/android-architecture/index";
import { androidCoroutinesSkill } from "./skills/android-coroutines/index";
import { androidDesignGuidelinesSkill } from "./skills/android-design-guidelines/index";
import { androidDeviceAutomationSkill } from "./skills/android-device-automation/index";
import { androidRedexSkill } from "./skills/android-redex/index";
import { androidTestingSkill } from "./skills/android-testing/index";
import { agentOrchestrationSkill } from "./skills/agent-orchestration/index";
import { apiTraceReaderSkill } from "./skills/api-trace-reader/index";
import { architectureDecisionRecordsSkill } from "./skills/architecture-decision-records/index";
import { architectureDesignWorkflowSkill } from "./skills/architecture-design-workflow/index";
import { architectureReviewerSkill } from "./skills/architecture-reviewer/index";
import { backendToFrontendHandoffDocsSkill } from "./skills/backend-to-frontend-handoff-docs/index";
import { brainstormingBeforeCodingSkill } from "./skills/brainstorming-before-coding/index";
import { codebaseArchitectureAnalysisSkill } from "./skills/codebase-architecture-analysis/index";
import { concurrencyPatternsSkill } from "./skills/concurrency-patterns/index";
import { crossPlatformAdapterPatternsSkill } from "./skills/cross-platform-adapter-patterns/index";
import { errorHandlingPatternsSkill } from "./skills/error-handling-patterns/index";
import { featureDevSkill } from "./skills/feature-dev/index";
import { hierarchicalMatchingSystemsSkill } from "./skills/hierarchical-matching-systems/index";
import { planReviewSkill } from "./skills/plan-review/index";
import { pragmaticProgrammerSkill } from "./skills/pragmatic-programmer/index";
import { protocolFreezingPatternsSkill } from "./skills/protocol-freezing-patterns/index";
import { refactorPlanningMethodSkill } from "./skills/refactor-planning-method/index";
import { refactoringPatternsSkill } from "./skills/refactoring-patterns/index";
import { softwareDesignSkill } from "./skills/software-design/index";
import { systemDesignSkill } from "./skills/system-design/index";
import { taskDecomposerSkill } from "./skills/task-decomposer/index";
import { techDebtSkill } from "./skills/tech-debt/index";
import { chromeDevtoolsSkill } from "./skills/chrome-devtools/index";
import { codeEngineerAgentFrameworkSkill } from "./skills/code-engineer-agent-framework/index";
import { codeReviewAgentFrameworkSkill } from "./skills/code-review-agent-framework/index";
import { codeReviewSkill } from "./skills/code-review/index";
import { complexityReducerSkill } from "./skills/complexity-reducer/index";
import { debugMethodologySkill } from "./skills/debug-methodology/index";
import { memorySafetyPatternsSkill } from "./skills/memory-safety-patterns/index";
import { refactoringChecklistSkill } from "./skills/refactoring-checklist/index";
import { subagentDrivenDevelopmentSkill } from "./skills/subagent-driven-development/index";
import { dataAnalysisSkill } from "./skills/data-analysis/index";
import { dataStorytellingSkill } from "./skills/data-storytelling/index";
import { dataVisualizationSkill } from "./skills/data-visualization/index";
import { embeddingStrategiesSkill } from "./skills/embedding-strategies/index";
import { llmAppDesignPipelineSkill } from "./skills/llm-app-design-pipeline/index";
import { llmAppDiagnosisFrameworkSkill } from "./skills/llm-app-diagnosis-framework/index";
import { llmEvaluationSkill } from "./skills/llm-evaluation/index";
import { modelFirstReasoningSkill } from "./skills/model-first-reasoning/index";
import { promptEngineeringPatternsSkill } from "./skills/prompt-engineering-patterns/index";
import { ragAuditorSkill } from "./skills/rag-auditor/index";
import { similaritySearchPatternsSkill } from "./skills/similarity-search-patterns/index";
import { statisticalAnalysisSkill } from "./skills/statistical-analysis/index";
import { vectorIndexTuningSkill } from "./skills/vector-index-tuning/index";
import { dbHaReplicationSkill } from "./skills/db-ha-replication/index";
import { dbSchemaDesignSkill } from "./skills/db-schema-design/index";
import { mysqlTransactionLockingSkill } from "./skills/mysql-transaction-locking/index";
import { pgsqlPartitioningSkill } from "./skills/pgsql-partitioning/index";
import { pgsqlRowLevelSecuritySkill } from "./skills/pgsql-row-level-security/index";
import { redisCachingPatternsSkill } from "./skills/redis-caching-patterns/index";
import { redisClusterHaSkill } from "./skills/redis-cluster-ha/index";
import { redisDataModelingSkill } from "./skills/redis-data-modeling/index";
import { redisPitfallDiagnosticsSkill } from "./skills/redis-pitfall-diagnostics/index";
import { sqlReviewOptimizationSkill } from "./skills/sql-review-optimization/index";
import { archLinuxTriageSkill } from "./skills/arch-linux-triage/index";
import { dockerEssentialsSkill } from "./skills/docker-essentials/index";
import { ghFixCiSkill } from "./skills/gh-fix-ci/index";
import { gitlabCiPatternsSkill } from "./skills/gitlab-ci-patterns/index";
import { helmChartScaffoldingSkill } from "./skills/helm-chart-scaffolding/index";
import { incidentResponseSkill } from "./skills/incident-response/index";
import { linuxShellScriptingSkill } from "./skills/linux-shell-scripting/index";
import { logAnalyzerSkill } from "./skills/log-analyzer/index";
import { monitoringObservabilitySkill } from "./skills/monitoring-observability/index";
import { networkTroubleshooterSkill } from "./skills/network-troubleshooter/index";
import { openapiSpecGenerationSkill } from "./skills/openapi-spec-generation/index";
import { remoteSshCommandSkill } from "./skills/remote-ssh-command/index";
import { systemDiagnosticsSkill } from "./skills/system-diagnostics/index";
import { comparativeAnalysisSkill } from "./skills/comparative-analysis/index";
import { consultingAnalysisSkill } from "./skills/consulting-analysis/index";
import { deepCodeReadSkill } from "./skills/deep-code-read/index";
import { deepResearchSkill } from "./skills/deep-research/index";
import { docCoauthoringSkill } from "./skills/doc-coauthoring/index";
import { markdownMermaidWritingSkill } from "./skills/markdown-mermaid-writing/index";
import { markitdownSkill } from "./skills/markitdown/index";
import { mdToPdfSkill } from "./skills/md-to-pdf/index";
import { obsidianBasesSkill } from "./skills/obsidian-bases/index";
import { pdfSkill } from "./skills/pdf/index";
import { pptGenerateSkill } from "./skills/ppt-generate/index";
import { proposalWriterSkill } from "./skills/proposal-writer/index";
import { readmeBlueprintGeneratorSkill } from "./skills/readme-blueprint-generator/index";
import { researchNoteWrapSkill } from "./skills/research-note-wrap/index";
import { tutorialBuilderSkill } from "./skills/tutorial-builder/index";
import { userGuideWritingSkill } from "./skills/user-guide-writing/index";
import { webContentFetcherSkill } from "./skills/web-content-fetcher/index";
import { algoVisualizationSkill } from "./skills/algo-visualization/index";
import { baoyuCompressImageSkill } from "./skills/baoyu-compress-image/index";
import { bundleOptimizationSkill } from "./skills/bundle-optimization/index";
import { canvasDesignSkill } from "./skills/canvas-design/index";
import { designSystemPatternsSkill } from "./skills/design-system-patterns/index";
import { figmaImplementDesignSkill } from "./skills/figma-implement-design/index";
import { frontendDesignReviewSkill } from "./skills/frontend-design-review/index";
import { i18nLocalizationSkill } from "./skills/i18n-localization/index";
import { iconRetrievalSkill } from "./skills/icon-retrieval/index";
import { industryDesignPresetsSkill } from "./skills/industry-design-presets/index";
import { interactionDesignSkill } from "./skills/interaction-design/index";
import { miniprogramDevelopmentSkill } from "./skills/miniprogram-development/index";
import { modernWebDesignSkill } from "./skills/modern-web-design/index";
import { responsiveDesignSkill } from "./skills/responsive-design/index";
import { screenshotSkill } from "./skills/screenshot/index";
import { shadcnUiSkill } from "./skills/shadcn-ui/index";
import { uxHeuristicsSkill } from "./skills/ux-heuristics/index";
import { uxResearcherDesignerSkill } from "./skills/ux-researcher-designer/index";
import { uxWritingSkill } from "./skills/ux-writing/index";
import { webPerformanceDiagnosisSkill } from "./skills/web-performance-diagnosis/index";
import { authorContributionsSkill } from "./skills/author-contributions/index";
import { commitSkill } from "./skills/commit/index";
import { engineeringRetroSkill } from "./skills/engineering-retro/index";
import { finishingBranchSkill } from "./skills/finishing-branch/index";
import { gitAdvancedWorkflowsSkill } from "./skills/git-advanced-workflows/index";
import { githubRepoSearchSkill } from "./skills/github-repo-search/index";
import { sessionFinalizationWorkflowSkill } from "./skills/session-finalization-workflow/index";
import { svnWorkflowSkill } from "./skills/svn-workflow/index";
import { goCliSkill } from "./skills/go-cli/index";
import { goCodeStyleSkill } from "./skills/go-code-style/index";
import { goConcurrencyPatternsSkill } from "./skills/go-concurrency-patterns/index";
import { goDataStructuresSkill } from "./skills/go-data-structures/index";
import { goDatabaseSkill } from "./skills/go-database/index";
import { goDesignPatternsSkill } from "./skills/go-design-patterns/index";
import { goErrorHandlingSkill } from "./skills/go-error-handling/index";
import { goGrpcSkill } from "./skills/go-grpc/index";
import { goLintSkill } from "./skills/go-lint/index";
import { goObservabilitySkill } from "./skills/go-observability/index";
import { goPerformanceSkill } from "./skills/go-performance/index";
import { goSecuritySkill } from "./skills/go-security/index";
import { goStructsInterfacesSkill } from "./skills/go-structs-interfaces/index";
import { goTestingPatternsSkill } from "./skills/go-testing-patterns/index";
import { goTroubleshootingSkill } from "./skills/go-troubleshooting/index";
import { appStoreOptimizationSkill } from "./skills/app-store-optimization/index";
import { appleAppstoreReviewerSkill } from "./skills/apple-appstore-reviewer/index";
import { iosHigDesignSkill } from "./skills/ios-hig-design/index";
import { iosSimulatorSkillSkill } from "./skills/ios-simulator-skill/index";
import { liquidGlassDesignSkill } from "./skills/liquid-glass-design/index";
import { macosDesignGuidelinesSkill } from "./skills/macos-design-guidelines/index";
import { swiftConcurrencyExpertSkill } from "./skills/swift-concurrency-expert/index";
import { swiftuiPerformanceAuditSkill } from "./skills/swiftui-performance-audit/index";
import { swiftuiUiPatternsSkill } from "./skills/swiftui-ui-patterns/index";
import { arthasCpuHighSkill } from "./skills/arthas-cpu-high/index";
import { arthasSpringcontextIssuesResolveSkill } from "./skills/arthas-springcontext-issues-resolve/index";
import { graalvmNativeImageSkill } from "./skills/graalvm-native-image/index";
import { gradleBuildPerformanceSkill } from "./skills/gradle-build-performance/index";
import { javaJunitSkill } from "./skills/java-junit/index";
import { springBootLayeringSkill } from "./skills/spring-boot-layering/index";
import { javascriptTypescriptJestSkill } from "./skills/javascript-typescript-jest/index";
import { modernJavascriptPatternsSkill } from "./skills/modern-javascript-patterns/index";
import { vueExpertJsSkill } from "./skills/vue-expert-js/index";
import { analyticsTrackingSkill } from "./skills/analytics-tracking/index";
import { brandHealthSkill } from "./skills/brand-health/index";
import { contentStrategySkill } from "./skills/content-strategy/index";
import { copywritingSkill } from "./skills/copywriting/index";
import { croMethodologySkill } from "./skills/cro-methodology/index";
import { customerLifecycleSkill } from "./skills/customer-lifecycle/index";
import { customerResearchSkill } from "./skills/customer-research/index";
import { douyinViralContentSkill } from "./skills/douyin-viral-content/index";
import { fanOperationsSkill } from "./skills/fan-operations/index";
import { leadChannelOptimizerSkill } from "./skills/lead-channel-optimizer/index";
import { leadResearchAssistantSkill } from "./skills/lead-research-assistant/index";
import { marketingPlanSkill } from "./skills/marketing-plan/index";
import { paidAdsSkill } from "./skills/paid-ads/index";
import { redesignMyLandingpageSkill } from "./skills/redesign-my-landingpage/index";
import { revopsSkill } from "./skills/revops/index";
import { salesEnablementSkill } from "./skills/sales-enablement/index";
import { seoSkill } from "./skills/seo/index";
import { stpSegmentationSkill } from "./skills/stp-segmentation/index";
import { xiaohongshuCommercialGrowthSkill } from "./skills/xiaohongshu-commercial-growth/index";
import { youtubeAnalysisSkill } from "./skills/youtube-analysis/index";
import { youtubeSearchSkill } from "./skills/youtube-search/index";
import { doctrineBatchProcessingSkill } from "./skills/doctrine-batch-processing/index";
import { doctrineEntityPatternsSkill } from "./skills/doctrine-entity-patterns/index";
import { laravelPatternsSkill } from "./skills/laravel-patterns/index";
import { laravelSecuritySkill } from "./skills/laravel-security/index";
import { laravelTddSkill } from "./skills/laravel-tdd/index";
import { laravelVerificationSkill } from "./skills/laravel-verification/index";
import { phpXFeaturesSkill } from "./skills/php-8x-features/index";
import { phpAsyncPatternsSkill } from "./skills/php-async-patterns/index";
import { phpDesignPatternsSkill } from "./skills/php-design-patterns/index";
import { phpErrorHandlingSkill } from "./skills/php-error-handling/index";
import { phpGeneratorsMemorySkill } from "./skills/php-generators-memory/index";
import { phpTestingSkill } from "./skills/php-testing/index";
import { phpTypeSafetySkill } from "./skills/php-type-safety/index";
import { symfonyBundleArchitectureSkill } from "./skills/symfony-bundle-architecture/index";
import { symfonyMessengerSkill } from "./skills/symfony-messenger/index";
import { symfonyUxSkill } from "./skills/symfony-ux/index";
import { symfonyVotersSkill } from "./skills/symfony-voters/index";
import { twigComponentsSkill } from "./skills/twig-components/index";
import { webmanCustomProcessesSkill } from "./skills/webman-custom-processes/index";
import { webmanNamingConventionsSkill } from "./skills/webman-naming-conventions/index";
import { webmanPluginDevelopmentSkill } from "./skills/webman-plugin-development/index";
import { webmanWebsocketPatternsSkill } from "./skills/webman-websocket-patterns/index";
import { agileProductOwnerSkill } from "./skills/agile-product-owner/index";
import { bcgMatrixSkill } from "./skills/bcg-matrix/index";
import { businessHealthDiagnosticSkill } from "./skills/business-health-diagnostic/index";
import { businessModelSkill } from "./skills/business-model/index";
import { competitiveIntelligenceSkill } from "./skills/competitive-intelligence/index";
import { createPrdSkill } from "./skills/create-prd/index";
import { customerJourneyMapSkill } from "./skills/customer-journey-map/index";
import { designingGrowthLoopsSkill } from "./skills/designing-growth-loops/index";
import { estimateCalibratorSkill } from "./skills/estimate-calibrator/index";
import { evaluatingNewTechnologySkill } from "./skills/evaluating-new-technology/index";
import { financialAnalystSkill } from "./skills/financial-analyst/index";
import { fundraiseAdvisorSkill } from "./skills/fundraise-advisor/index";
import { funnelArchitectSkill } from "./skills/funnel-architect/index";
import { marketSizingAnalysisSkill } from "./skills/market-sizing-analysis/index";
import { meetingInsightsAnalyzerSkill } from "./skills/meeting-insights-analyzer/index";
import { opportunitySolutionTreeSkill } from "./skills/opportunity-solution-tree/index";
import { orgCanvasSkill } from "./skills/org-canvas/index";
import { pestelAnalysisSkill } from "./skills/pestel-analysis/index";
import { planningUnderUncertaintySkill } from "./skills/planning-under-uncertainty/index";
import { portersFiveForcesSkill } from "./skills/porters-five-forces/index";
import { prfaqSkill } from "./skills/prfaq/index";
import { pricingStrategySkill } from "./skills/pricing-strategy/index";
import { processOptimizationSkill } from "./skills/process-optimization/index";
import { productDesignCriticSkill } from "./skills/product-design-critic/index";
import { raciMatrixSkill } from "./skills/raci-matrix/index";
import { runningDecisionProcessesSkill } from "./skills/running-decision-processes/index";
import { startupIcpDefinerSkill } from "./skills/startup-icp-definer/index";
import { startupViabilityChecklistSkill } from "./skills/startup-viability-checklist/index";
import { structuredBusinessAnalysisFrameworkSkill } from "./skills/structured-business-analysis-framework/index";
import { structuredProblemDecompositionSkill } from "./skills/structured-problem-decomposition/index";
import { swotAnalysisSkill } from "./skills/swot-analysis/index";
import { systemsThinkingSkill } from "./skills/systems-thinking/index";
import { asyncPythonPatternsSkill } from "./skills/async-python-patterns/index";
import { pythonBackgroundJobsSkill } from "./skills/python-background-jobs/index";
import { pythonDesignPatternsSkill } from "./skills/python-design-patterns/index";
import { pythonErrorHandlingSkill } from "./skills/python-error-handling/index";
import { pythonObservabilitySkill } from "./skills/python-observability/index";
import { pythonPerformanceOptimizationSkill } from "./skills/python-performance-optimization/index";
import { pythonTestingPatternsSkill } from "./skills/python-testing-patterns/index";
import { pythonTypeSafetySkill } from "./skills/python-type-safety/index";
import { uvPackageManagerSkill } from "./skills/uv-package-manager/index";
import { detoxMobileTestSkill } from "./skills/detox-mobile-test/index";
import { nextjsDeveloperSkill } from "./skills/nextjs-developer/index";
import { reactComposableComponentsSkill } from "./skills/react-composable-components/index";
import { reactHooksSkill } from "./skills/react-hooks/index";
import { reactNativeDesignSkill } from "./skills/react-native-design/index";
import { reactNativeJsPerformanceSkill } from "./skills/react-native-js-performance/index";
import { reactNativeMetroConfigSkill } from "./skills/react-native-metro-config/index";
import { reactNativePlatformForkSkill } from "./skills/react-native-platform-fork/index";
import { reactNativeTurbomoduleSkill } from "./skills/react-native-turbomodule/index";
import { reactPerformanceSkill } from "./skills/react-performance/index";
import { reactServerComponentsSkill } from "./skills/react-server-components/index";
import { rustAsyncPatternsSkill } from "./skills/rust-async-patterns/index";
import { rustCargoWorkspaceSkill } from "./skills/rust-cargo-workspace/index";
import { rustDocumentationSkill } from "./skills/rust-documentation/index";
import { rustErrorHandlingSkill } from "./skills/rust-error-handling/index";
import { rustFfiBindingsSkill } from "./skills/rust-ffi-bindings/index";
import { rustOwnershipIdiomsSkill } from "./skills/rust-ownership-idioms/index";
import { rustPerformanceSkill } from "./skills/rust-performance/index";
import { rustProcMacroPatternsSkill } from "./skills/rust-proc-macro-patterns/index";
import { rustSerdePatternsSkill } from "./skills/rust-serde-patterns/index";
import { rustTestingSkill } from "./skills/rust-testing/index";
import { rustTokioRuntimeTuningSkill } from "./skills/rust-tokio-runtime-tuning/index";
import { rustTypeDesignSkill } from "./skills/rust-type-design/index";
import { androidApkAuditSkill } from "./skills/android-apk-audit/index";
import { binaryAnalysisPatternsSkill } from "./skills/binary-analysis-patterns/index";
import { chipsecSkill } from "./skills/chipsec/index";
import { ethicalHackingMethodologySkill } from "./skills/ethical-hacking-methodology/index";
import { fridaDynamicAnalysisSkill } from "./skills/frida-dynamic-analysis/index";
import { frontendDynamicCodeProtectionSkill } from "./skills/frontend-dynamic-code-protection/index";
import { idapythonScriptingSkill } from "./skills/idapython-scripting/index";
import { iosBinaryAnalysisSkill } from "./skills/ios-binary-analysis/index";
import { iosSecretScanSkill } from "./skills/ios-secret-scan/index";
import { memoryForensicsSkill } from "./skills/memory-forensics/index";
import { owaspAuthDataAuditSkill } from "./skills/owasp-auth-data-audit/index";
import { owaspInjectionAuditSkill } from "./skills/owasp-injection-audit/index";
import { owaspXssMisconfigAuditSkill } from "./skills/owasp-xss-misconfig-audit/index";
import { protocolReverseEngineeringSkill } from "./skills/protocol-reverse-engineering/index";
import { securityOwnershipMapSkill } from "./skills/security-ownership-map/index";
import { securityThreatModelSkill } from "./skills/security-threat-model/index";
import { unicornEmulationSkill } from "./skills/unicorn-emulation/index";
import { wiresharkAnalysisSkill } from "./skills/wireshark-analysis/index";
import { benchmarkResultAnalyzerSkill } from "./skills/benchmark-result-analyzer/index";
import { blindOutputComparatorSkill } from "./skills/blind-output-comparator/index";
import { findSkillsSkill } from "./skills/find-skills/index";
import { skillActivationAnalyzerSkill } from "./skills/skill-activation-analyzer/index";
import { skillCreatorSkill } from "./skills/skill-creator/index";
import { skillEvalGraderSkill } from "./skills/skill-eval-grader/index";
import { skillEvaluatorSkill } from "./skills/skill-evaluator/index";
import { skillEvolverSkill } from "./skills/skill-evolver/index";
import { skillsPruneAndSyncReadmeSkill } from "./skills/skills-prune-and-sync-readme/index";
import { triggerTelemetryAdvisorSkill } from "./skills/trigger-telemetry-advisor/index";
import { specDrivenDeliverySkill } from "./skills/spec-driven-delivery/index";
import { speckitAnalyzeSkill } from "./skills/speckit-analyze/index";
import { speckitBaselineSkill } from "./skills/speckit-baseline/index";
import { speckitCheckerSkill } from "./skills/speckit-checker/index";
import { speckitChecklistSkill } from "./skills/speckit-checklist/index";
import { speckitClarifySkill } from "./skills/speckit-clarify/index";
import { speckitConstitutionSkill } from "./skills/speckit-constitution/index";
import { speckitDiffSkill } from "./skills/speckit-diff/index";
import { speckitImplementSkill } from "./skills/speckit-implement/index";
import { speckitPlanSkill } from "./skills/speckit-plan/index";
import { speckitQuizmeSkill } from "./skills/speckit-quizme/index";
import { speckitReviewerSkill } from "./skills/speckit-reviewer/index";
import { speckitSpecifySkill } from "./skills/speckit-specify/index";
import { speckitStatusSkill } from "./skills/speckit-status/index";
import { speckitTasksSkill } from "./skills/speckit-tasks/index";
import { speckitTaskstoissuesSkill } from "./skills/speckit-taskstoissues/index";
import { speckitValidateSkill } from "./skills/speckit-validate/index";
import { tauriBuildPackagingSkill } from "./skills/tauri-build-packaging/index";
import { tauriIpcPatternsSkill } from "./skills/tauri-ipc-patterns/index";
import { tauriPluginDevelopmentSkill } from "./skills/tauri-plugin-development/index";
import { tauriReactIntegrationSkill } from "./skills/tauri-react-integration/index";
import { tauriV2Skill } from "./skills/tauri-v2/index";
import { benchmarkRunnerSkill } from "./skills/benchmark-runner/index";
import { preLandingReviewSkill } from "./skills/pre-landing-review/index";
import { testDrivenDevelopmentSkill } from "./skills/test-driven-development/index";
import { testQualityReviewSkill } from "./skills/test-quality-review/index";
import { testingPatternsSkill } from "./skills/testing-patterns/index";
import { testingStrategySkill } from "./skills/testing-strategy/index";
import { webappTestingSkill } from "./skills/webapp-testing/index";
import { consciousnessCouncilSkill } from "./skills/consciousness-council/index";
import { crossPollinationEngineSkill } from "./skills/cross-pollination-engine/index";
import { evidenceQualityFrameworkSkill } from "./skills/evidence-quality-framework/index";
import { firstPrinciplesDecomposerSkill } from "./skills/first-principles-decomposer/index";
import { fishboneDiagramSkill } from "./skills/fishbone-diagram/index";
import { grillMeSkill } from "./skills/grill-me/index";
import { mckinseyStepSkill } from "./skills/mckinsey-7-step/index";
import { pdcaCycleSkill } from "./skills/pdca-cycle/index";
import { priorityJudgeSkill } from "./skills/priority-judge/index";
import { scientificBrainstormingSkill } from "./skills/scientific-brainstorming/index";
import { scpAnalysisSkill } from "./skills/scp-analysis/index";
import { thinkingPartnerSkill } from "./skills/thinking-partner/index";
import { whatIfOracleSkill } from "./skills/what-if-oracle/index";
import { nestjsLayeringPatternsSkill } from "./skills/nestjs-layering-patterns/index";
import { typescriptTypeSafetySkill } from "./skills/typescript-type-safety/index";
import { microsoftDocsSkill } from "./skills/microsoft-docs/index";
import { prlctlVmControlSkill } from "./skills/prlctl-vm-control/index";
import { windowsKernelSecuritySkill } from "./skills/windows-kernel-security/index";
import { windowsUiAutomationSkill } from "./skills/windows-ui-automation/index";
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

export const componentSkills = [
  androidAccessibilitySkill,
  androidArchitectureSkill,
  androidCoroutinesSkill,
  androidDesignGuidelinesSkill,
  androidDeviceAutomationSkill,
  androidRedexSkill,
  androidTestingSkill,
  agentOrchestrationSkill,
  apiTraceReaderSkill,
  architectureDecisionRecordsSkill,
  architectureDesignWorkflowSkill,
  architectureReviewerSkill,
  backendToFrontendHandoffDocsSkill,
  brainstormingBeforeCodingSkill,
  codebaseArchitectureAnalysisSkill,
  concurrencyPatternsSkill,
  crossPlatformAdapterPatternsSkill,
  errorHandlingPatternsSkill,
  featureDevSkill,
  hierarchicalMatchingSystemsSkill,
  planReviewSkill,
  pragmaticProgrammerSkill,
  protocolFreezingPatternsSkill,
  refactorPlanningMethodSkill,
  refactoringPatternsSkill,
  softwareDesignSkill,
  systemDesignSkill,
  taskDecomposerSkill,
  techDebtSkill,
  chromeDevtoolsSkill,
  codeEngineerAgentFrameworkSkill,
  codeReviewAgentFrameworkSkill,
  codeReviewSkill,
  complexityReducerSkill,
  debugMethodologySkill,
  memorySafetyPatternsSkill,
  refactoringChecklistSkill,
  subagentDrivenDevelopmentSkill,
  dataAnalysisSkill,
  dataStorytellingSkill,
  dataVisualizationSkill,
  embeddingStrategiesSkill,
  llmAppDesignPipelineSkill,
  llmAppDiagnosisFrameworkSkill,
  llmEvaluationSkill,
  modelFirstReasoningSkill,
  promptEngineeringPatternsSkill,
  ragAuditorSkill,
  similaritySearchPatternsSkill,
  statisticalAnalysisSkill,
  vectorIndexTuningSkill,
  dbHaReplicationSkill,
  dbSchemaDesignSkill,
  mysqlTransactionLockingSkill,
  pgsqlPartitioningSkill,
  pgsqlRowLevelSecuritySkill,
  redisCachingPatternsSkill,
  redisClusterHaSkill,
  redisDataModelingSkill,
  redisPitfallDiagnosticsSkill,
  sqlReviewOptimizationSkill,
  archLinuxTriageSkill,
  dockerEssentialsSkill,
  ghFixCiSkill,
  gitlabCiPatternsSkill,
  helmChartScaffoldingSkill,
  incidentResponseSkill,
  linuxShellScriptingSkill,
  logAnalyzerSkill,
  monitoringObservabilitySkill,
  networkTroubleshooterSkill,
  openapiSpecGenerationSkill,
  remoteSshCommandSkill,
  systemDiagnosticsSkill,
  comparativeAnalysisSkill,
  consultingAnalysisSkill,
  deepCodeReadSkill,
  deepResearchSkill,
  docCoauthoringSkill,
  markdownMermaidWritingSkill,
  markitdownSkill,
  mdToPdfSkill,
  obsidianBasesSkill,
  pdfSkill,
  pptGenerateSkill,
  proposalWriterSkill,
  readmeBlueprintGeneratorSkill,
  researchNoteWrapSkill,
  tutorialBuilderSkill,
  userGuideWritingSkill,
  webContentFetcherSkill,
  algoVisualizationSkill,
  baoyuCompressImageSkill,
  bundleOptimizationSkill,
  canvasDesignSkill,
  designSystemPatternsSkill,
  figmaImplementDesignSkill,
  frontendDesignReviewSkill,
  i18nLocalizationSkill,
  iconRetrievalSkill,
  industryDesignPresetsSkill,
  interactionDesignSkill,
  miniprogramDevelopmentSkill,
  modernWebDesignSkill,
  responsiveDesignSkill,
  screenshotSkill,
  shadcnUiSkill,
  uxHeuristicsSkill,
  uxResearcherDesignerSkill,
  uxWritingSkill,
  webPerformanceDiagnosisSkill,
  authorContributionsSkill,
  commitSkill,
  engineeringRetroSkill,
  finishingBranchSkill,
  gitAdvancedWorkflowsSkill,
  githubRepoSearchSkill,
  sessionFinalizationWorkflowSkill,
  svnWorkflowSkill,
  goCliSkill,
  goCodeStyleSkill,
  goConcurrencyPatternsSkill,
  goDataStructuresSkill,
  goDatabaseSkill,
  goDesignPatternsSkill,
  goErrorHandlingSkill,
  goGrpcSkill,
  goLintSkill,
  goObservabilitySkill,
  goPerformanceSkill,
  goSecuritySkill,
  goStructsInterfacesSkill,
  goTestingPatternsSkill,
  goTroubleshootingSkill,
  appStoreOptimizationSkill,
  appleAppstoreReviewerSkill,
  iosHigDesignSkill,
  iosSimulatorSkillSkill,
  liquidGlassDesignSkill,
  macosDesignGuidelinesSkill,
  swiftConcurrencyExpertSkill,
  swiftuiPerformanceAuditSkill,
  swiftuiUiPatternsSkill,
  arthasCpuHighSkill,
  arthasSpringcontextIssuesResolveSkill,
  graalvmNativeImageSkill,
  gradleBuildPerformanceSkill,
  javaJunitSkill,
  springBootLayeringSkill,
  javascriptTypescriptJestSkill,
  modernJavascriptPatternsSkill,
  vueExpertJsSkill,
  analyticsTrackingSkill,
  brandHealthSkill,
  contentStrategySkill,
  copywritingSkill,
  croMethodologySkill,
  customerLifecycleSkill,
  customerResearchSkill,
  douyinViralContentSkill,
  fanOperationsSkill,
  leadChannelOptimizerSkill,
  leadResearchAssistantSkill,
  marketingPlanSkill,
  paidAdsSkill,
  redesignMyLandingpageSkill,
  revopsSkill,
  salesEnablementSkill,
  seoSkill,
  stpSegmentationSkill,
  xiaohongshuCommercialGrowthSkill,
  youtubeAnalysisSkill,
  youtubeSearchSkill,
  doctrineBatchProcessingSkill,
  doctrineEntityPatternsSkill,
  laravelPatternsSkill,
  laravelSecuritySkill,
  laravelTddSkill,
  laravelVerificationSkill,
  phpXFeaturesSkill,
  phpAsyncPatternsSkill,
  phpDesignPatternsSkill,
  phpErrorHandlingSkill,
  phpGeneratorsMemorySkill,
  phpTestingSkill,
  phpTypeSafetySkill,
  symfonyBundleArchitectureSkill,
  symfonyMessengerSkill,
  symfonyUxSkill,
  symfonyVotersSkill,
  twigComponentsSkill,
  webmanCustomProcessesSkill,
  webmanNamingConventionsSkill,
  webmanPluginDevelopmentSkill,
  webmanWebsocketPatternsSkill,
  agileProductOwnerSkill,
  bcgMatrixSkill,
  businessHealthDiagnosticSkill,
  businessModelSkill,
  competitiveIntelligenceSkill,
  createPrdSkill,
  customerJourneyMapSkill,
  designingGrowthLoopsSkill,
  estimateCalibratorSkill,
  evaluatingNewTechnologySkill,
  financialAnalystSkill,
  fundraiseAdvisorSkill,
  funnelArchitectSkill,
  marketSizingAnalysisSkill,
  meetingInsightsAnalyzerSkill,
  opportunitySolutionTreeSkill,
  orgCanvasSkill,
  pestelAnalysisSkill,
  planningUnderUncertaintySkill,
  portersFiveForcesSkill,
  prfaqSkill,
  pricingStrategySkill,
  processOptimizationSkill,
  productDesignCriticSkill,
  raciMatrixSkill,
  runningDecisionProcessesSkill,
  startupIcpDefinerSkill,
  startupViabilityChecklistSkill,
  structuredBusinessAnalysisFrameworkSkill,
  structuredProblemDecompositionSkill,
  swotAnalysisSkill,
  systemsThinkingSkill,
  asyncPythonPatternsSkill,
  pythonBackgroundJobsSkill,
  pythonDesignPatternsSkill,
  pythonErrorHandlingSkill,
  pythonObservabilitySkill,
  pythonPerformanceOptimizationSkill,
  pythonTestingPatternsSkill,
  pythonTypeSafetySkill,
  uvPackageManagerSkill,
  detoxMobileTestSkill,
  nextjsDeveloperSkill,
  reactComposableComponentsSkill,
  reactHooksSkill,
  reactNativeDesignSkill,
  reactNativeJsPerformanceSkill,
  reactNativeMetroConfigSkill,
  reactNativePlatformForkSkill,
  reactNativeTurbomoduleSkill,
  reactPerformanceSkill,
  reactServerComponentsSkill,
  rustAsyncPatternsSkill,
  rustCargoWorkspaceSkill,
  rustDocumentationSkill,
  rustErrorHandlingSkill,
  rustFfiBindingsSkill,
  rustOwnershipIdiomsSkill,
  rustPerformanceSkill,
  rustProcMacroPatternsSkill,
  rustSerdePatternsSkill,
  rustTestingSkill,
  rustTokioRuntimeTuningSkill,
  rustTypeDesignSkill,
  androidApkAuditSkill,
  binaryAnalysisPatternsSkill,
  chipsecSkill,
  ethicalHackingMethodologySkill,
  fridaDynamicAnalysisSkill,
  frontendDynamicCodeProtectionSkill,
  idapythonScriptingSkill,
  iosBinaryAnalysisSkill,
  iosSecretScanSkill,
  memoryForensicsSkill,
  owaspAuthDataAuditSkill,
  owaspInjectionAuditSkill,
  owaspXssMisconfigAuditSkill,
  protocolReverseEngineeringSkill,
  securityOwnershipMapSkill,
  securityThreatModelSkill,
  unicornEmulationSkill,
  wiresharkAnalysisSkill,
  benchmarkResultAnalyzerSkill,
  blindOutputComparatorSkill,
  findSkillsSkill,
  skillActivationAnalyzerSkill,
  skillCreatorSkill,
  skillEvalGraderSkill,
  skillEvaluatorSkill,
  skillEvolverSkill,
  skillsPruneAndSyncReadmeSkill,
  triggerTelemetryAdvisorSkill,
  specDrivenDeliverySkill,
  speckitAnalyzeSkill,
  speckitBaselineSkill,
  speckitCheckerSkill,
  speckitChecklistSkill,
  speckitClarifySkill,
  speckitConstitutionSkill,
  speckitDiffSkill,
  speckitImplementSkill,
  speckitPlanSkill,
  speckitQuizmeSkill,
  speckitReviewerSkill,
  speckitSpecifySkill,
  speckitStatusSkill,
  speckitTasksSkill,
  speckitTaskstoissuesSkill,
  speckitValidateSkill,
  tauriBuildPackagingSkill,
  tauriIpcPatternsSkill,
  tauriPluginDevelopmentSkill,
  tauriReactIntegrationSkill,
  tauriV2Skill,
  benchmarkRunnerSkill,
  preLandingReviewSkill,
  testDrivenDevelopmentSkill,
  testQualityReviewSkill,
  testingPatternsSkill,
  testingStrategySkill,
  webappTestingSkill,
  consciousnessCouncilSkill,
  crossPollinationEngineSkill,
  evidenceQualityFrameworkSkill,
  firstPrinciplesDecomposerSkill,
  fishboneDiagramSkill,
  grillMeSkill,
  mckinseyStepSkill,
  pdcaCycleSkill,
  priorityJudgeSkill,
  scientificBrainstormingSkill,
  scpAnalysisSkill,
  thinkingPartnerSkill,
  whatIfOracleSkill,
  nestjsLayeringPatternsSkill,
  typescriptTypeSafetySkill,
  microsoftDocsSkill,
  prlctlVmControlSkill,
  windowsKernelSecuritySkill,
  windowsUiAutomationSkill
];

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
