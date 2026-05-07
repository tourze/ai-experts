import {
  Platform,
  defineProcedure,
  defineProcedureArgs,
  defineProcedureOutput,
  type ProcedureDefinition,
} from "../sdk";

export type CliProcedureRequest = {
  args?: readonly string[];
};

export type RuntimeProcedureResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const cliProcedureArgs = defineProcedureArgs<CliProcedureRequest>({
  typeName: "CliProcedureRequest",
  fields: {
    args: {
      type: "string[]",
      required: false,
      description: "传给 procedure CLI 的 argv 参数。",
    },
  },
});

const runtimeProcedureOutput = defineProcedureOutput<RuntimeProcedureResult>({
  typeName: "RuntimeProcedureResult",
  fields: {
    exitCode: {
      type: "number",
      description: "子进程退出码。",
    },
    stdout: {
      type: "string",
      description: "procedure 标准输出。",
    },
    stderr: {
      type: "string",
      description: "procedure 标准错误。",
    },
  },
});

type CliProcedureDefinition = Omit<
  ProcedureDefinition<CliProcedureRequest, RuntimeProcedureResult>,
  "args" | "output"
> & Partial<Pick<ProcedureDefinition<CliProcedureRequest, RuntimeProcedureResult>, "args" | "output">>;

function defineCliProcedure(
  definition: CliProcedureDefinition,
): ProcedureDefinition<CliProcedureRequest, RuntimeProcedureResult> {
  return defineProcedure({
    args: cliProcedureArgs,
    output: runtimeProcedureOutput,
    ...definition,
  });
}

export const agileProductOwnerUserStoryGenerator = defineCliProcedure({
    id: "agile-product-owner-user-story-generator",
    entry: new URL("./sources/agile-product-owner/user_story_generator.ts", import.meta.url),
    description: "执行 user-story-generator procedure。",
    owners: { skillIds: ["agile-product-owner"] },
    target: "scripts/user_story_generator.mjs",
    runtime: "node",
  });
export const analyticsTrackingTrackingPlanGenerator = defineCliProcedure({
    id: "analytics-tracking-tracking-plan-generator",
    entry: new URL("./sources/analytics-tracking/tracking_plan_generator.ts", import.meta.url),
    description: "执行 tracking-plan-generator procedure。",
    owners: { skillIds: ["analytics-tracking"] },
    target: "scripts/tracking_plan_generator.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationAppLauncher = defineCliProcedure({
    id: "android-device-automation-app-launcher",
    entry: new URL("./sources/android-device-automation/app_launcher.ts", import.meta.url),
    description: "执行 app-launcher procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/app_launcher.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationBuildAndTest = defineCliProcedure({
    id: "android-device-automation-build-and-test",
    entry: new URL("./sources/android-device-automation/build_and_test.ts", import.meta.url),
    description: "执行 build-and-test procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/build_and_test.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationDiagnoseApp = defineCliProcedure({
    id: "android-device-automation-diagnose-app",
    entry: new URL("./sources/android-device-automation/diagnose_app.ts", import.meta.url),
    description: "执行 diagnose-app procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/diagnose_app.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationEmuHealthCheck = defineCliProcedure({
    id: "android-device-automation-emu-health-check",
    entry: new URL("./sources/android-device-automation/emu_health_check.ts", import.meta.url),
    description: "执行 emu-health-check procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/emu_health_check.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationEmulatorManage = defineCliProcedure({
    id: "android-device-automation-emulator-manage",
    entry: new URL("./sources/android-device-automation/emulator_manage.ts", import.meta.url),
    description: "执行 emulator-manage procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/emulator_manage.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationGesture = defineCliProcedure({
    id: "android-device-automation-gesture",
    entry: new URL("./sources/android-device-automation/gesture.ts", import.meta.url),
    description: "执行 gesture procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/gesture.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationKeyboard = defineCliProcedure({
    id: "android-device-automation-keyboard",
    entry: new URL("./sources/android-device-automation/keyboard.ts", import.meta.url),
    description: "执行 keyboard procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/keyboard.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationLogMonitor = defineCliProcedure({
    id: "android-device-automation-log-monitor",
    entry: new URL("./sources/android-device-automation/log_monitor.ts", import.meta.url),
    description: "执行 log-monitor procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/log_monitor.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationNavigator = defineCliProcedure({
    id: "android-device-automation-navigator",
    entry: new URL("./sources/android-device-automation/navigator.ts", import.meta.url),
    description: "执行 navigator procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/navigator.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationScreenMapper = defineCliProcedure({
    id: "android-device-automation-screen-mapper",
    entry: new URL("./sources/android-device-automation/screen_mapper.ts", import.meta.url),
    description: "执行 screen-mapper procedure。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/screen_mapper.mjs",
    runtime: "node",
  });
export const appStoreOptimizationAbTestPlanner = defineCliProcedure({
    id: "app-store-optimization-ab-test-planner",
    entry: new URL("./sources/app-store-optimization/ab_test_planner.ts", import.meta.url),
    description: "执行 ab-test-planner procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/ab_test_planner.mjs",
    runtime: "node",
  });
export const appStoreOptimizationAsoScorer = defineCliProcedure({
    id: "app-store-optimization-aso-scorer",
    entry: new URL("./sources/app-store-optimization/aso_scorer.ts", import.meta.url),
    description: "执行 aso-scorer procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/aso_scorer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationCompetitorAnalyzer = defineCliProcedure({
    id: "app-store-optimization-competitor-analyzer",
    entry: new URL("./sources/app-store-optimization/competitor_analyzer.ts", import.meta.url),
    description: "执行 competitor-analyzer procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/competitor_analyzer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationCollectReleaseChanges = defineCliProcedure({
    id: "app-store-optimization-collect-release-changes",
    entry: new URL("./sources/app-store-optimization/collect_release_changes.ts", import.meta.url),
    description: "执行 collect-release-changes procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/collect_release_changes.mjs",
    runtime: "node",
  });
export const appStoreOptimizationKeywordAnalyzer = defineCliProcedure({
    id: "app-store-optimization-keyword-analyzer",
    entry: new URL("./sources/app-store-optimization/keyword_analyzer.ts", import.meta.url),
    description: "执行 keyword-analyzer procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/keyword_analyzer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationLaunchChecklist = defineCliProcedure({
    id: "app-store-optimization-launch-checklist",
    entry: new URL("./sources/app-store-optimization/launch_checklist.ts", import.meta.url),
    description: "执行 launch-checklist procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/launch_checklist.mjs",
    runtime: "node",
  });
export const appStoreOptimizationLocalizationHelper = defineCliProcedure({
    id: "app-store-optimization-localization-helper",
    entry: new URL("./sources/app-store-optimization/localization_helper.ts", import.meta.url),
    description: "执行 localization-helper procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/localization_helper.mjs",
    runtime: "node",
  });
export const appStoreOptimizationMetadataOptimizer = defineCliProcedure({
    id: "app-store-optimization-metadata-optimizer",
    entry: new URL("./sources/app-store-optimization/metadata_optimizer.ts", import.meta.url),
    description: "执行 metadata-optimizer procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/metadata_optimizer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationReviewAnalyzer = defineCliProcedure({
    id: "app-store-optimization-review-analyzer",
    entry: new URL("./sources/app-store-optimization/review_analyzer.ts", import.meta.url),
    description: "执行 review-analyzer procedure。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/review_analyzer.mjs",
    runtime: "node",
  });
export const architectureReviewerScanCodebase = defineCliProcedure({
    id: "architecture-reviewer-scan-codebase",
    entry: new URL("./sources/architecture-reviewer/scan_codebase.ts", import.meta.url),
    description: "执行 scan-codebase procedure。",
    owners: { skillIds: ["architecture-reviewer"] },
    target: "scripts/scan_codebase.mjs",
    runtime: "node",
  });
export const baoyuCompressImageMain = defineCliProcedure({
    id: "baoyu-compress-image-main",
    entry: new URL("./sources/baoyu-compress-image/main.ts", import.meta.url),
    description: "执行 main procedure。",
    owners: { skillIds: ["baoyu-compress-image"] },
    target: "scripts/main.mjs",
    runtime: "node",
  });
export const canvasDesignBaoyuArticleIllustratorBuildBatch = defineCliProcedure({
    id: "canvas-design-baoyu-article-illustrator-build-batch",
    entry: new URL("./sources/canvas-design/baoyu-article-illustrator-build-batch.ts", import.meta.url),
    description: "执行 baoyu-article-illustrator-build-batch procedure。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/baoyu-article-illustrator-build-batch.mjs",
    runtime: "node",
  });
export const canvasDesignConceptToImageRenderToImage = defineCliProcedure({
    id: "canvas-design-concept-to-image-render-to-image",
    entry: new URL("./sources/canvas-design/concept-to-image-render_to_image.ts", import.meta.url),
    description: "执行 concept-to-image-render-to-image procedure。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-image-render_to_image.mjs",
    runtime: "node",
  });
export const canvasDesignConceptToVideoAddAudio = defineCliProcedure({
    id: "canvas-design-concept-to-video-add-audio",
    entry: new URL("./sources/canvas-design/concept-to-video-add_audio.ts", import.meta.url),
    description: "执行 concept-to-video-add-audio procedure。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-video-add_audio.mjs",
    runtime: "node",
  });
export const canvasDesignConceptToVideoRenderVideo = defineCliProcedure({
    id: "canvas-design-concept-to-video-render-video",
    entry: new URL("./sources/canvas-design/concept-to-video-render_video.ts", import.meta.url),
    description: "执行 concept-to-video-render-video procedure。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-video-render_video.mjs",
    runtime: "node",
  });
export const codeReviewAssessCode = defineCliProcedure({
    id: "code-review-assess-code",
    entry: new URL("./sources/code-review/assess-code.ts", import.meta.url),
    description: "执行 assess-code procedure。",
    owners: { skillIds: ["code-review"] },
    target: "scripts/assess-code.mjs",
    runtime: "node",
  });
export const codeReviewAssessTests = defineCliProcedure({
    id: "code-review-assess-tests",
    entry: new URL("./sources/code-review/assess-tests.ts", import.meta.url),
    description: "执行 assess-tests procedure。",
    owners: { skillIds: ["code-review"] },
    target: "scripts/assess-tests.mjs",
    runtime: "node",
  });
export const complexityReducerComplexityReport = defineCliProcedure({
    id: "complexity-reducer-complexity-report",
    entry: new URL("./sources/complexity-reducer/complexity_report.ts", import.meta.url),
    description: "执行 complexity-report procedure。",
    owners: { skillIds: ["complexity-reducer"] },
    target: "scripts/complexity_report.mjs",
    runtime: "node",
  });
export const copywritingContentFilter = defineCliProcedure({
    id: "copywriting-content-filter",
    entry: new URL("./sources/copywriting/content_filter.ts", import.meta.url),
    description: "执行 content-filter procedure。",
    owners: { skillIds: ["copywriting"] },
    target: "scripts/content_filter.mjs",
    runtime: "node",
  });
export const dataAnalysisAnalyze = defineCliProcedure({
    id: "data-analysis-analyze",
    entry: new URL("./sources/data-analysis/analyze.ts", import.meta.url),
    description: "执行 analyze procedure。",
    owners: { skillIds: ["data-analysis"] },
    target: "scripts/analyze.mjs",
    runtime: "node",
  });
export const debugMethodologyDebugChecklist = defineCliProcedure({
    id: "debug-methodology-debug-checklist",
    entry: new URL("./sources/debug-methodology/debug-checklist.ts", import.meta.url),
    description: "根据问题标题生成六步调试检查清单骨架。",
    owners: { skillIds: ["debug-methodology"] },
    args: defineProcedureArgs<CliProcedureRequest>({
      typeName: "DebugChecklistArgs",
      fields: cliProcedureArgs.fields,
    }),
    output: defineProcedureOutput<RuntimeProcedureResult>({
      typeName: "MarkdownChecklist",
      fields: runtimeProcedureOutput.fields,
    }),
  });
export const financialAnalystBudgetVarianceAnalyzer = defineCliProcedure({
    id: "financial-analyst-budget-variance-analyzer",
    entry: new URL("./sources/financial-analyst/budget_variance_analyzer.ts", import.meta.url),
    description: "执行 budget-variance-analyzer procedure。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/budget_variance_analyzer.mjs",
    runtime: "node",
  });
export const financialAnalystDcfValuation = defineCliProcedure({
    id: "financial-analyst-dcf-valuation",
    entry: new URL("./sources/financial-analyst/dcf_valuation.ts", import.meta.url),
    description: "执行 dcf-valuation procedure。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/dcf_valuation.mjs",
    runtime: "node",
  });
export const financialAnalystForecastBuilder = defineCliProcedure({
    id: "financial-analyst-forecast-builder",
    entry: new URL("./sources/financial-analyst/forecast_builder.ts", import.meta.url),
    description: "执行 forecast-builder procedure。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/forecast_builder.mjs",
    runtime: "node",
  });
export const financialAnalystRatioCalculator = defineCliProcedure({
    id: "financial-analyst-ratio-calculator",
    entry: new URL("./sources/financial-analyst/ratio_calculator.ts", import.meta.url),
    description: "执行 ratio-calculator procedure。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/ratio_calculator.mjs",
    runtime: "node",
  });
export const financialAnalystRatioInputValidation = defineCliProcedure({
    id: "financial-analyst-ratio-input-validation",
    entry: new URL("./sources/financial-analyst/ratio_input_validation.ts", import.meta.url),
    description: "执行 ratio-input-validation procedure。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/ratio_input_validation.mjs",
    runtime: "node",
  });
export const ghFixCiInspectPrChecks = defineCliProcedure({
    id: "gh-fix-ci-inspect-pr-checks",
    entry: new URL("./sources/gh-fix-ci/inspect_pr_checks.ts", import.meta.url),
    description: "执行 inspect-pr-checks procedure。",
    owners: { skillIds: ["gh-fix-ci"] },
    target: "scripts/inspect_pr_checks.mjs",
    runtime: "node",
  });
export const helmChartScaffoldingValidateChart = defineCliProcedure({
    id: "helm-chart-scaffolding-validate-chart",
    entry: new URL("./sources/helm-chart-scaffolding/validate-chart.ts", import.meta.url),
    description: "执行 validate-chart procedure。",
    owners: { skillIds: ["helm-chart-scaffolding"] },
    target: "scripts/validate-chart.mjs",
    runtime: "node",
  });
export const i18nLocalizationI18nChecker = defineCliProcedure({
    id: "i18n-localization-i18n-checker",
    entry: new URL("./sources/i18n-localization/i18n_checker.ts", import.meta.url),
    description: "执行 i18n-checker procedure。",
    owners: { skillIds: ["i18n-localization"] },
    target: "scripts/i18n_checker.mjs",
    runtime: "node",
  });
export const iconRetrievalSearch = defineCliProcedure({
    id: "icon-retrieval-search",
    entry: new URL("./sources/icon-retrieval/search.ts", import.meta.url),
    description: "执行 search procedure。",
    owners: { skillIds: ["icon-retrieval"] },
    target: "scripts/search.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillAccessibilityAudit = defineCliProcedure({
    id: "ios-simulator-skill-accessibility-audit",
    entry: new URL("./sources/ios-simulator-skill/accessibility_audit.ts", import.meta.url),
    description: "执行 accessibility-audit procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/accessibility_audit.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillAppLauncher = defineCliProcedure({
    id: "ios-simulator-skill-app-launcher",
    entry: new URL("./sources/ios-simulator-skill/app_launcher.ts", import.meta.url),
    description: "执行 app-launcher procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/app_launcher.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillAppStateCapture = defineCliProcedure({
    id: "ios-simulator-skill-app-state-capture",
    entry: new URL("./sources/ios-simulator-skill/app_state_capture.ts", import.meta.url),
    description: "执行 app-state-capture procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/app_state_capture.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillBuildAndTest = defineCliProcedure({
    id: "ios-simulator-skill-build-and-test",
    entry: new URL("./sources/ios-simulator-skill/build_and_test.ts", import.meta.url),
    description: "执行 build-and-test procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/build_and_test.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillClipboard = defineCliProcedure({
    id: "ios-simulator-skill-clipboard",
    entry: new URL("./sources/ios-simulator-skill/clipboard.ts", import.meta.url),
    description: "执行 clipboard procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/clipboard.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillGesture = defineCliProcedure({
    id: "ios-simulator-skill-gesture",
    entry: new URL("./sources/ios-simulator-skill/gesture.ts", import.meta.url),
    description: "执行 gesture procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/gesture.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillKeyboard = defineCliProcedure({
    id: "ios-simulator-skill-keyboard",
    entry: new URL("./sources/ios-simulator-skill/keyboard.ts", import.meta.url),
    description: "执行 keyboard procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/keyboard.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillLogMonitor = defineCliProcedure({
    id: "ios-simulator-skill-log-monitor",
    entry: new URL("./sources/ios-simulator-skill/log_monitor.ts", import.meta.url),
    description: "执行 log-monitor procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/log_monitor.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillNavigator = defineCliProcedure({
    id: "ios-simulator-skill-navigator",
    entry: new URL("./sources/ios-simulator-skill/navigator.ts", import.meta.url),
    description: "执行 navigator procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/navigator.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillPrivacyManager = defineCliProcedure({
    id: "ios-simulator-skill-privacy-manager",
    entry: new URL("./sources/ios-simulator-skill/privacy_manager.ts", import.meta.url),
    description: "执行 privacy-manager procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/privacy_manager.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillPushNotification = defineCliProcedure({
    id: "ios-simulator-skill-push-notification",
    entry: new URL("./sources/ios-simulator-skill/push_notification.ts", import.meta.url),
    description: "执行 push-notification procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/push_notification.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillScreenMapper = defineCliProcedure({
    id: "ios-simulator-skill-screen-mapper",
    entry: new URL("./sources/ios-simulator-skill/screen_mapper.ts", import.meta.url),
    description: "执行 screen-mapper procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/screen_mapper.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimHealthCheck = defineCliProcedure({
    id: "ios-simulator-skill-sim-health-check",
    entry: new URL("./sources/ios-simulator-skill/sim_health_check.ts", import.meta.url),
    description: "执行 sim-health-check procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/sim_health_check.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimList = defineCliProcedure({
    id: "ios-simulator-skill-sim-list",
    entry: new URL("./sources/ios-simulator-skill/sim_list.ts", import.meta.url),
    description: "执行 sim-list procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/sim_list.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlBoot = defineCliProcedure({
    id: "ios-simulator-skill-simctl-boot",
    entry: new URL("./sources/ios-simulator-skill/simctl_boot.ts", import.meta.url),
    description: "执行 simctl-boot procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_boot.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlCreate = defineCliProcedure({
    id: "ios-simulator-skill-simctl-create",
    entry: new URL("./sources/ios-simulator-skill/simctl_create.ts", import.meta.url),
    description: "执行 simctl-create procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_create.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlDelete = defineCliProcedure({
    id: "ios-simulator-skill-simctl-delete",
    entry: new URL("./sources/ios-simulator-skill/simctl_delete.ts", import.meta.url),
    description: "执行 simctl-delete procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_delete.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlErase = defineCliProcedure({
    id: "ios-simulator-skill-simctl-erase",
    entry: new URL("./sources/ios-simulator-skill/simctl_erase.ts", import.meta.url),
    description: "执行 simctl-erase procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_erase.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlShutdown = defineCliProcedure({
    id: "ios-simulator-skill-simctl-shutdown",
    entry: new URL("./sources/ios-simulator-skill/simctl_shutdown.ts", import.meta.url),
    description: "执行 simctl-shutdown procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_shutdown.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimulatorSelector = defineCliProcedure({
    id: "ios-simulator-skill-simulator-selector",
    entry: new URL("./sources/ios-simulator-skill/simulator_selector.ts", import.meta.url),
    description: "执行 simulator-selector procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simulator_selector.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillStatusBar = defineCliProcedure({
    id: "ios-simulator-skill-status-bar",
    entry: new URL("./sources/ios-simulator-skill/status_bar.ts", import.meta.url),
    description: "执行 status-bar procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/status_bar.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillTestRecorder = defineCliProcedure({
    id: "ios-simulator-skill-test-recorder",
    entry: new URL("./sources/ios-simulator-skill/test_recorder.ts", import.meta.url),
    description: "执行 test-recorder procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/test_recorder.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillVisualDiff = defineCliProcedure({
    id: "ios-simulator-skill-visual-diff",
    entry: new URL("./sources/ios-simulator-skill/visual_diff.ts", import.meta.url),
    description: "执行 visual-diff procedure。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/visual_diff.mjs",
    runtime: "node",
  });
export const markitdownBatchConvert = defineCliProcedure({
    id: "markitdown-batch-convert",
    entry: new URL("./sources/markitdown/batch_convert.ts", import.meta.url),
    description: "执行 batch-convert procedure。",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/batch_convert.mjs",
    runtime: "node",
  });
export const markitdownConvertLiterature = defineCliProcedure({
    id: "markitdown-convert-literature",
    entry: new URL("./sources/markitdown/convert_literature.ts", import.meta.url),
    description: "执行 convert-literature procedure。",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/convert_literature.mjs",
    runtime: "node",
  });
export const markitdownConvertWithAi = defineCliProcedure({
    id: "markitdown-convert-with-ai",
    entry: new URL("./sources/markitdown/convert_with_ai.ts", import.meta.url),
    description: "执行 convert-with-ai procedure。",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/convert_with_ai.mjs",
    runtime: "node",
  });
export const mdToPdfKatexRender = defineCliProcedure({
    id: "md-to-pdf-katex-render",
    entry: new URL("./sources/md-to-pdf/katex_render.ts", import.meta.url),
    description: "执行 katex-render procedure。",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/katex_render.mjs",
    runtime: "node",
  });
export const mdToPdfMdToPdf = defineCliProcedure({
    id: "md-to-pdf-md-to-pdf",
    entry: new URL("./sources/md-to-pdf/md_to_pdf.ts", import.meta.url),
    description: "执行 md-to-pdf procedure。",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/md_to_pdf.mjs",
    runtime: "node",
  });
export const mdToPdfSetup = defineCliProcedure({
    id: "md-to-pdf-setup",
    entry: new URL("./sources/md-to-pdf/setup.ts", import.meta.url),
    description: "执行 setup procedure。",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/setup.mjs",
    runtime: "node",
  });
export const modelFirstReasoningValidateModel = defineCliProcedure({
    id: "model-first-reasoning-validate-model",
    entry: new URL("./sources/model-first-reasoning/validate-model.ts", import.meta.url),
    description: "执行 validate-model procedure。",
    owners: { skillIds: ["model-first-reasoning"] },
    target: "scripts/validate-model.mjs",
    runtime: "node",
  });
export const modernWebDesignDesignAudit = defineCliProcedure({
    id: "modern-web-design-design-audit",
    entry: new URL("./sources/modern-web-design/design_audit.ts", import.meta.url),
    description: "执行 design-audit procedure。",
    owners: { skillIds: ["modern-web-design"] },
    target: "scripts/design_audit.mjs",
    runtime: "node",
  });
export const modernWebDesignPatternGenerator = defineCliProcedure({
    id: "modern-web-design-pattern-generator",
    entry: new URL("./sources/modern-web-design/pattern_generator.ts", import.meta.url),
    description: "执行 pattern-generator procedure。",
    owners: { skillIds: ["modern-web-design"] },
    target: "scripts/pattern_generator.mjs",
    runtime: "node",
  });
export const pdfCheckBoundingBoxes = defineCliProcedure({
    id: "pdf-check-bounding-boxes",
    entry: new URL("./sources/pdf/check_bounding_boxes.ts", import.meta.url),
    description: "执行 check-bounding-boxes procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/check_bounding_boxes.mjs",
    runtime: "node",
  });
export const pdfCheckFillableFields = defineCliProcedure({
    id: "pdf-check-fillable-fields",
    entry: new URL("./sources/pdf/check_fillable_fields.ts", import.meta.url),
    description: "执行 check-fillable-fields procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/check_fillable_fields.mjs",
    runtime: "node",
  });
export const pdfConvertPdfToImages = defineCliProcedure({
    id: "pdf-convert-pdf-to-images",
    entry: new URL("./sources/pdf/convert_pdf_to_images.ts", import.meta.url),
    description: "执行 convert-pdf-to-images procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/convert_pdf_to_images.mjs",
    runtime: "node",
  });
export const pdfCreateValidationImage = defineCliProcedure({
    id: "pdf-create-validation-image",
    entry: new URL("./sources/pdf/create_validation_image.ts", import.meta.url),
    description: "执行 create-validation-image procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/create_validation_image.mjs",
    runtime: "node",
  });
export const pdfExtractFormFieldInfo = defineCliProcedure({
    id: "pdf-extract-form-field-info",
    entry: new URL("./sources/pdf/extract_form_field_info.ts", import.meta.url),
    description: "执行 extract-form-field-info procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/extract_form_field_info.mjs",
    runtime: "node",
  });
export const pdfExtractFormStructure = defineCliProcedure({
    id: "pdf-extract-form-structure",
    entry: new URL("./sources/pdf/extract_form_structure.ts", import.meta.url),
    description: "执行 extract-form-structure procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/extract_form_structure.mjs",
    runtime: "node",
  });
export const pdfFillFillableFields = defineCliProcedure({
    id: "pdf-fill-fillable-fields",
    entry: new URL("./sources/pdf/fill_fillable_fields.ts", import.meta.url),
    description: "执行 fill-fillable-fields procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/fill_fillable_fields.mjs",
    runtime: "node",
  });
export const pdfFillPdfFormWithAnnotations = defineCliProcedure({
    id: "pdf-fill-pdf-form-with-annotations",
    entry: new URL("./sources/pdf/fill_pdf_form_with_annotations.ts", import.meta.url),
    description: "执行 fill-pdf-form-with-annotations procedure。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/fill_pdf_form_with_annotations.mjs",
    runtime: "node",
  });
export const preLandingReviewCollectDiff = defineCliProcedure({
    id: "pre-landing-review-collect-diff",
    entry: new URL("./sources/pre-landing-review/collect_diff.ts", import.meta.url),
    description: "执行 collect-diff procedure。",
    owners: { skillIds: ["pre-landing-review"] },
    target: "scripts/collect_diff.mjs",
    runtime: "node",
  });
export const preLandingReviewRenderReport = defineCliProcedure({
    id: "pre-landing-review-render-report",
    entry: new URL("./sources/pre-landing-review/render_report.ts", import.meta.url),
    description: "执行 render-report procedure。",
    owners: { skillIds: ["pre-landing-review"] },
    target: "scripts/render_report.mjs",
    runtime: "node",
  });
export const prlctlVmControlPrlctlHelper = defineCliProcedure({
    id: "prlctl-vm-control-prlctl-helper",
    entry: new URL("./sources/prlctl-vm-control/prlctl_helper.ts", import.meta.url),
    description: "执行 prlctl-helper procedure。",
    owners: { skillIds: ["prlctl-vm-control"] },
    target: "scripts/prlctl_helper.mjs",
    runtime: "node",
  });
export const promptEngineeringPatternsOptimizePrompt = defineCliProcedure({
    id: "prompt-engineering-patterns-optimize-prompt",
    entry: new URL("./sources/prompt-engineering-patterns/optimize-prompt.ts", import.meta.url),
    description: "执行 optimize-prompt procedure。",
    owners: { skillIds: ["prompt-engineering-patterns"] },
    target: "scripts/optimize-prompt.mjs",
    runtime: "node",
  });
export const remoteSshCommandInstallSshpass = defineCliProcedure({
    id: "remote-ssh-command-install-sshpass",
    entry: new URL("./sources/remote-ssh-command/install-sshpass.ts", import.meta.url),
    description: "执行 install-sshpass procedure。",
    owners: { skillIds: ["remote-ssh-command"] },
    target: "scripts/install-sshpass.mjs",
    runtime: "node",
  });
export const remoteSshCommandSshExec = defineCliProcedure({
    id: "remote-ssh-command-ssh-exec",
    entry: new URL("./sources/remote-ssh-command/ssh-exec.ts", import.meta.url),
    description: "执行 ssh-exec procedure。",
    owners: { skillIds: ["remote-ssh-command"] },
    target: "scripts/ssh-exec.mjs",
    runtime: "node",
  });
export const screenshotEnsureMacosPermissions = defineCliProcedure({
    id: "screenshot-ensure-macos-permissions",
    entry: new URL("./sources/screenshot/ensure_macos_permissions.ts", import.meta.url),
    description: "执行 ensure-macos-permissions procedure。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/ensure_macos_permissions.mjs",
    runtime: "node",
  });
export const screenshotMacosDisplayInfo = defineCliProcedure({
    id: "screenshot-macos-display-info",
    entry: new URL("./sources/screenshot/macos_display_info.ts", import.meta.url),
    description: "执行 macos-display-info procedure。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_display_info.mjs",
    runtime: "node",
  });
export const screenshotMacosPermissions = defineCliProcedure({
    id: "screenshot-macos-permissions",
    entry: new URL("./sources/screenshot/macos_permissions.ts", import.meta.url),
    description: "执行 macos-permissions procedure。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_permissions.mjs",
    runtime: "node",
  });
export const screenshotMacosWindowInfo = defineCliProcedure({
    id: "screenshot-macos-window-info",
    entry: new URL("./sources/screenshot/macos_window_info.ts", import.meta.url),
    description: "执行 macos-window-info procedure。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_window_info.mjs",
    runtime: "node",
  });
export const screenshotTakeScreenshot = defineCliProcedure({
    id: "screenshot-take-screenshot",
    entry: new URL("./sources/screenshot/take_screenshot.ts", import.meta.url),
    description: "执行 take-screenshot procedure。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/take_screenshot.mjs",
    runtime: "node",
  });
export const screenshotTakeScreenshotWindows = defineCliProcedure({
    id: "screenshot-take-screenshot-windows",
    entry: new URL("./sources/screenshot/take_screenshot_windows.ts", import.meta.url),
    description: "执行 take-screenshot-windows procedure。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/take_screenshot_windows.mjs",
    runtime: "node",
  });
export const securityOwnershipMapBuildOwnershipMap = defineCliProcedure({
    id: "security-ownership-map-build-ownership-map",
    entry: new URL("./sources/security-ownership-map/build_ownership_map.ts", import.meta.url),
    description: "执行 build-ownership-map procedure。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/build_ownership_map.mjs",
    runtime: "node",
  });
export const securityOwnershipMapCommunityMaintainers = defineCliProcedure({
    id: "security-ownership-map-community-maintainers",
    entry: new URL("./sources/security-ownership-map/community_maintainers.ts", import.meta.url),
    description: "执行 community-maintainers procedure。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/community_maintainers.mjs",
    runtime: "node",
  });
export const securityOwnershipMapQueryOwnership = defineCliProcedure({
    id: "security-ownership-map-query-ownership",
    entry: new URL("./sources/security-ownership-map/query_ownership.ts", import.meta.url),
    description: "执行 query-ownership procedure。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/query_ownership.mjs",
    runtime: "node",
  });
export const securityOwnershipMapRunOwnershipMap = defineCliProcedure({
    id: "security-ownership-map-run-ownership-map",
    entry: new URL("./sources/security-ownership-map/run_ownership_map.ts", import.meta.url),
    description: "执行 run-ownership-map procedure。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/run_ownership_map.mjs",
    runtime: "node",
  });
export const shadcnUiVerifySetup = defineCliProcedure({
    id: "shadcn-ui-verify-setup",
    entry: new URL("./sources/shadcn-ui/verify-setup.ts", import.meta.url),
    description: "执行 verify-setup procedure。",
    owners: { skillIds: ["shadcn-ui"] },
    target: "scripts/verify-setup.mjs",
    runtime: "node",
  });
export const skillActivationAnalyzerCsoAudit = defineCliProcedure({
    id: "skill-activation-analyzer-cso-audit",
    entry: new URL("./sources/skill-activation-analyzer/cso_audit.ts", import.meta.url),
    description: "执行 cso-audit procedure。",
    owners: { skillIds: ["skill-activation-analyzer"] },
    target: "scripts/cso_audit.mjs",
    runtime: "node",
  });
export const skillCreatorAggregateBenchmark = defineCliProcedure({
    id: "skill-creator-aggregate-benchmark",
    entry: new URL("./sources/skill-creator/aggregate_benchmark.ts", import.meta.url),
    description: "执行 aggregate-benchmark procedure。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/aggregate_benchmark.mjs",
    runtime: "node",
  });
export const skillCreatorGenerateReport = defineCliProcedure({
    id: "skill-creator-generate-report",
    entry: new URL("./sources/skill-creator/generate_report.ts", import.meta.url),
    description: "执行 generate-report procedure。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/generate_report.mjs",
    runtime: "node",
  });
export const skillCreatorGenerateReview = defineCliProcedure({
    id: "skill-creator-generate-review",
    entry: new URL("./sources/skill-creator/generate_review.ts", import.meta.url),
    description: "执行 generate-review procedure。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/generate_review.mjs",
    runtime: "node",
  });
export const skillCreatorImproveDescription = defineCliProcedure({
    id: "skill-creator-improve-description",
    entry: new URL("./sources/skill-creator/improve_description.ts", import.meta.url),
    description: "执行 improve-description procedure。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/improve_description.mjs",
    runtime: "node",
  });
export const skillCreatorPackageSkill = defineCliProcedure({
    id: "skill-creator-package-skill",
    entry: new URL("./sources/skill-creator/package_skill.ts", import.meta.url),
    description: "执行 package-skill procedure。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/package_skill.mjs",
    runtime: "node",
  });
export const skillCreatorQuickValidate = defineCliProcedure({
    id: "skill-creator-quick-validate",
    entry: new URL("./sources/skill-creator/quick_validate.ts", import.meta.url),
    description: "执行 quick-validate procedure。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/quick_validate.mjs",
    runtime: "node",
  });
export const skillCreatorRunEval = defineCliProcedure({
    id: "skill-creator-run-eval",
    entry: new URL("./sources/skill-creator/run_eval.ts", import.meta.url),
    description: "执行 run-eval procedure。",
    owners: { skillIds: ["skill-creator"] },
    platforms: [Platform.Claude],
    target: "scripts/run_eval.mjs",
    runtime: "node",
  });
export const skillCreatorRunLoop = defineCliProcedure({
    id: "skill-creator-run-loop",
    entry: new URL("./sources/skill-creator/run_loop.ts", import.meta.url),
    description: "执行 run-loop procedure。",
    owners: { skillIds: ["skill-creator"] },
    platforms: [Platform.Claude],
    target: "scripts/run_loop.mjs",
    runtime: "node",
  });
export const skillsPruneAndSyncReadmeCurateSkills = defineCliProcedure({
    id: "skills-prune-and-sync-readme-curate-skills",
    entry: new URL("./sources/skills-prune-and-sync-readme/curate_skills.ts", import.meta.url),
    description: "执行 curate-skills procedure。",
    owners: { skillIds: ["skills-prune-and-sync-readme"] },
    target: "scripts/curate_skills.mjs",
    runtime: "node",
  });
export const skillsPruneAndSyncReadmeTestCurateSkills = defineCliProcedure({
    id: "skills-prune-and-sync-readme-test-curate-skills",
    entry: new URL("./sources/skills-prune-and-sync-readme/test_curate_skills.ts", import.meta.url),
    description: "执行 test-curate-skills procedure。",
    owners: { skillIds: ["skills-prune-and-sync-readme"] },
    target: "scripts/test_curate_skills.mjs",
    runtime: "node",
  });
export const speckitBaselineBootstrapSpecify = defineCliProcedure({
    id: "speckit-baseline-bootstrap-specify",
    entry: new URL("./sources/speckit-baseline/bootstrap-specify.ts", import.meta.url),
    description: "执行 bootstrap-specify procedure。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/bootstrap-specify.mjs",
    runtime: "node",
  });
export const speckitBaselineCheckPrerequisites = defineCliProcedure({
    id: "speckit-baseline-check-prerequisites",
    entry: new URL("./sources/speckit-baseline/check-prerequisites.ts", import.meta.url),
    description: "执行 check-prerequisites procedure。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/check-prerequisites.mjs",
    runtime: "node",
  });
export const speckitBaselineCreateNewFeature = defineCliProcedure({
    id: "speckit-baseline-create-new-feature",
    entry: new URL("./sources/speckit-baseline/create-new-feature.ts", import.meta.url),
    description: "执行 create-new-feature procedure。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/create-new-feature.mjs",
    runtime: "node",
  });
export const speckitBaselineSetupPlan = defineCliProcedure({
    id: "speckit-baseline-setup-plan",
    entry: new URL("./sources/speckit-baseline/setup-plan.ts", import.meta.url),
    description: "执行 setup-plan procedure。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/setup-plan.mjs",
    runtime: "node",
  });
export const typescriptTypeSafetyExtractTsErrors = defineCliProcedure({
    id: "typescript-type-safety-extract-ts-errors",
    entry: new URL("./sources/typescript-type-safety/extract-ts-errors.ts", import.meta.url),
    description: "把 tsc 输出按文件和错误码归组，便于先定位上游合同错误。",
    owners: { skillIds: ["typescript-type-safety"] },
    args: defineProcedureArgs<CliProcedureRequest>({
      typeName: "ExtractTsErrorsArgs",
      fields: cliProcedureArgs.fields,
    }),
    output: defineProcedureOutput<RuntimeProcedureResult>({
      typeName: "ExtractTsErrorsSummary",
      fields: runtimeProcedureOutput.fields,
    }),
  });
export const uxResearcherDesignerPersonaGenerator = defineCliProcedure({
    id: "ux-researcher-designer-persona-generator",
    entry: new URL("./sources/ux-researcher-designer/persona_generator.ts", import.meta.url),
    description: "执行 persona-generator procedure。",
    owners: { skillIds: ["ux-researcher-designer"] },
    target: "scripts/persona_generator.mjs",
    runtime: "node",
  });
export const webContentFetcherFetch = defineCliProcedure({
    id: "web-content-fetcher-fetch",
    entry: new URL("./sources/web-content-fetcher/fetch.ts", import.meta.url),
    description: "执行 fetch procedure。",
    owners: { skillIds: ["web-content-fetcher"] },
    target: "scripts/fetch.mjs",
    runtime: "node",
  });
export const webPerformanceDiagnosisAnalyze = defineCliProcedure({
    id: "web-performance-diagnosis-analyze",
    entry: new URL("./sources/web-performance-diagnosis/analyze.ts", import.meta.url),
    description: "执行 analyze procedure。",
    owners: { skillIds: ["web-performance-diagnosis"] },
    target: "scripts/analyze.mjs",
    runtime: "node",
  });
export const youtubeAnalysisAnalyzeVideo = defineCliProcedure({
    id: "youtube-analysis-analyze-video",
    entry: new URL("./sources/youtube-analysis/analyze_video.ts", import.meta.url),
    description: "执行 analyze-video procedure。",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/analyze_video.mjs",
    runtime: "node",
  });
export const youtubeAnalysisFetchTranscript = defineCliProcedure({
    id: "youtube-analysis-fetch-transcript",
    entry: new URL("./sources/youtube-analysis/fetch_transcript.ts", import.meta.url),
    description: "执行 fetch-transcript procedure。",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/fetch_transcript.mjs",
    runtime: "node",
  });
export const youtubeSearchSearchYoutube = defineCliProcedure({
    id: "youtube-search-search-youtube",
    entry: new URL("./sources/youtube-search/search_youtube.ts", import.meta.url),
    description: "执行 search-youtube procedure。",
    owners: { skillIds: ["youtube-search"] },
    target: "scripts/search_youtube.mjs",
    runtime: "node",
  });

export const componentProcedures = [
  agileProductOwnerUserStoryGenerator,
  analyticsTrackingTrackingPlanGenerator,
  androidDeviceAutomationAppLauncher,
  androidDeviceAutomationBuildAndTest,
  androidDeviceAutomationDiagnoseApp,
  androidDeviceAutomationEmuHealthCheck,
  androidDeviceAutomationEmulatorManage,
  androidDeviceAutomationGesture,
  androidDeviceAutomationKeyboard,
  androidDeviceAutomationLogMonitor,
  androidDeviceAutomationNavigator,
  androidDeviceAutomationScreenMapper,
  appStoreOptimizationAbTestPlanner,
  appStoreOptimizationAsoScorer,
  appStoreOptimizationCompetitorAnalyzer,
  appStoreOptimizationCollectReleaseChanges,
  appStoreOptimizationKeywordAnalyzer,
  appStoreOptimizationLaunchChecklist,
  appStoreOptimizationLocalizationHelper,
  appStoreOptimizationMetadataOptimizer,
  appStoreOptimizationReviewAnalyzer,
  architectureReviewerScanCodebase,
  baoyuCompressImageMain,
  canvasDesignBaoyuArticleIllustratorBuildBatch,
  canvasDesignConceptToImageRenderToImage,
  canvasDesignConceptToVideoAddAudio,
  canvasDesignConceptToVideoRenderVideo,
  codeReviewAssessCode,
  codeReviewAssessTests,
  complexityReducerComplexityReport,
  copywritingContentFilter,
  dataAnalysisAnalyze,
  debugMethodologyDebugChecklist,
  financialAnalystBudgetVarianceAnalyzer,
  financialAnalystDcfValuation,
  financialAnalystForecastBuilder,
  financialAnalystRatioCalculator,
  financialAnalystRatioInputValidation,
  ghFixCiInspectPrChecks,
  helmChartScaffoldingValidateChart,
  i18nLocalizationI18nChecker,
  iconRetrievalSearch,
  iosSimulatorSkillAccessibilityAudit,
  iosSimulatorSkillAppLauncher,
  iosSimulatorSkillAppStateCapture,
  iosSimulatorSkillBuildAndTest,
  iosSimulatorSkillClipboard,
  iosSimulatorSkillGesture,
  iosSimulatorSkillKeyboard,
  iosSimulatorSkillLogMonitor,
  iosSimulatorSkillNavigator,
  iosSimulatorSkillPrivacyManager,
  iosSimulatorSkillPushNotification,
  iosSimulatorSkillScreenMapper,
  iosSimulatorSkillSimHealthCheck,
  iosSimulatorSkillSimList,
  iosSimulatorSkillSimctlBoot,
  iosSimulatorSkillSimctlCreate,
  iosSimulatorSkillSimctlDelete,
  iosSimulatorSkillSimctlErase,
  iosSimulatorSkillSimctlShutdown,
  iosSimulatorSkillSimulatorSelector,
  iosSimulatorSkillStatusBar,
  iosSimulatorSkillTestRecorder,
  iosSimulatorSkillVisualDiff,
  markitdownBatchConvert,
  markitdownConvertLiterature,
  markitdownConvertWithAi,
  mdToPdfKatexRender,
  mdToPdfMdToPdf,
  mdToPdfSetup,
  modelFirstReasoningValidateModel,
  modernWebDesignDesignAudit,
  modernWebDesignPatternGenerator,
  pdfCheckBoundingBoxes,
  pdfCheckFillableFields,
  pdfConvertPdfToImages,
  pdfCreateValidationImage,
  pdfExtractFormFieldInfo,
  pdfExtractFormStructure,
  pdfFillFillableFields,
  pdfFillPdfFormWithAnnotations,
  preLandingReviewCollectDiff,
  preLandingReviewRenderReport,
  prlctlVmControlPrlctlHelper,
  promptEngineeringPatternsOptimizePrompt,
  remoteSshCommandInstallSshpass,
  remoteSshCommandSshExec,
  screenshotEnsureMacosPermissions,
  screenshotMacosDisplayInfo,
  screenshotMacosPermissions,
  screenshotMacosWindowInfo,
  screenshotTakeScreenshot,
  screenshotTakeScreenshotWindows,
  securityOwnershipMapBuildOwnershipMap,
  securityOwnershipMapCommunityMaintainers,
  securityOwnershipMapQueryOwnership,
  securityOwnershipMapRunOwnershipMap,
  shadcnUiVerifySetup,
  skillActivationAnalyzerCsoAudit,
  skillCreatorAggregateBenchmark,
  skillCreatorGenerateReport,
  skillCreatorGenerateReview,
  skillCreatorImproveDescription,
  skillCreatorPackageSkill,
  skillCreatorQuickValidate,
  skillCreatorRunEval,
  skillCreatorRunLoop,
  skillsPruneAndSyncReadmeCurateSkills,
  skillsPruneAndSyncReadmeTestCurateSkills,
  speckitBaselineBootstrapSpecify,
  speckitBaselineCheckPrerequisites,
  speckitBaselineCreateNewFeature,
  speckitBaselineSetupPlan,
  typescriptTypeSafetyExtractTsErrors,
  uxResearcherDesignerPersonaGenerator,
  webContentFetcherFetch,
  webPerformanceDiagnosisAnalyze,
  youtubeAnalysisAnalyzeVideo,
  youtubeAnalysisFetchTranscript,
  youtubeSearchSearchYoutube,
] as const;
