import { defineProcedure } from "../sdk";

export const agileProductOwnerUserStoryGenerator = defineProcedure({
    id: "agile-product-owner-user-story-generator",
    entry: new URL("./sources/agile-product-owner/user_story_generator.ts", import.meta.url),
    description: "Script user_story_generator.mjs.",
    owners: { skillIds: ["agile-product-owner"] },
    target: "scripts/user_story_generator.mjs",
    runtime: "node",
  });
export const analyticsTrackingTrackingPlanGenerator = defineProcedure({
    id: "analytics-tracking-tracking-plan-generator",
    entry: new URL("./sources/analytics-tracking/tracking_plan_generator.ts", import.meta.url),
    description: "Script tracking_plan_generator.mjs.",
    owners: { skillIds: ["analytics-tracking"] },
    target: "scripts/tracking_plan_generator.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationAppLauncher = defineProcedure({
    id: "android-device-automation-app-launcher",
    entry: new URL("./sources/android-device-automation/app_launcher.ts", import.meta.url),
    description: "Script app_launcher.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/app_launcher.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationBuildAndTest = defineProcedure({
    id: "android-device-automation-build-and-test",
    entry: new URL("./sources/android-device-automation/build_and_test.ts", import.meta.url),
    description: "Script build_and_test.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/build_and_test.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationCommon = defineProcedure({
    id: "android-device-automation-common",
    entry: new URL("./sources/android-device-automation/common.ts", import.meta.url),
    description: "Script common.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/common.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationDiagnoseApp = defineProcedure({
    id: "android-device-automation-diagnose-app",
    entry: new URL("./sources/android-device-automation/diagnose_app.ts", import.meta.url),
    description: "Script diagnose_app.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/diagnose_app.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationEmuHealthCheck = defineProcedure({
    id: "android-device-automation-emu-health-check",
    entry: new URL("./sources/android-device-automation/emu_health_check.ts", import.meta.url),
    description: "Script emu_health_check.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/emu_health_check.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationEmulatorManage = defineProcedure({
    id: "android-device-automation-emulator-manage",
    entry: new URL("./sources/android-device-automation/emulator_manage.ts", import.meta.url),
    description: "Script emulator_manage.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/emulator_manage.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationGesture = defineProcedure({
    id: "android-device-automation-gesture",
    entry: new URL("./sources/android-device-automation/gesture.ts", import.meta.url),
    description: "Script gesture.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/gesture.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationKeyboard = defineProcedure({
    id: "android-device-automation-keyboard",
    entry: new URL("./sources/android-device-automation/keyboard.ts", import.meta.url),
    description: "Script keyboard.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/keyboard.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationLogMonitor = defineProcedure({
    id: "android-device-automation-log-monitor",
    entry: new URL("./sources/android-device-automation/log_monitor.ts", import.meta.url),
    description: "Script log_monitor.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/log_monitor.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationNavigator = defineProcedure({
    id: "android-device-automation-navigator",
    entry: new URL("./sources/android-device-automation/navigator.ts", import.meta.url),
    description: "Script navigator.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/navigator.mjs",
    runtime: "node",
  });
export const androidDeviceAutomationScreenMapper = defineProcedure({
    id: "android-device-automation-screen-mapper",
    entry: new URL("./sources/android-device-automation/screen_mapper.ts", import.meta.url),
    description: "Script screen_mapper.mjs.",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/screen_mapper.mjs",
    runtime: "node",
  });
export const appStoreOptimizationAbTestPlanner = defineProcedure({
    id: "app-store-optimization-ab-test-planner",
    entry: new URL("./sources/app-store-optimization/ab_test_planner.ts", import.meta.url),
    description: "Script ab_test_planner.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/ab_test_planner.mjs",
    runtime: "node",
  });
export const appStoreOptimizationAsoScorer = defineProcedure({
    id: "app-store-optimization-aso-scorer",
    entry: new URL("./sources/app-store-optimization/aso_scorer.ts", import.meta.url),
    description: "Script aso_scorer.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/aso_scorer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationCompetitorAnalyzer = defineProcedure({
    id: "app-store-optimization-competitor-analyzer",
    entry: new URL("./sources/app-store-optimization/competitor_analyzer.ts", import.meta.url),
    description: "Script competitor_analyzer.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/competitor_analyzer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationCollectReleaseChanges = defineProcedure({
    id: "app-store-optimization-collect-release-changes",
    entry: new URL("./sources/app-store-optimization/collect_release_changes.ts", import.meta.url),
    description: "Script collect_release_changes.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/collect_release_changes.mjs",
    runtime: "node",
  });
export const appStoreOptimizationKeywordAnalyzer = defineProcedure({
    id: "app-store-optimization-keyword-analyzer",
    entry: new URL("./sources/app-store-optimization/keyword_analyzer.ts", import.meta.url),
    description: "Script keyword_analyzer.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/keyword_analyzer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationLaunchChecklist = defineProcedure({
    id: "app-store-optimization-launch-checklist",
    entry: new URL("./sources/app-store-optimization/launch_checklist.ts", import.meta.url),
    description: "Script launch_checklist.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/launch_checklist.mjs",
    runtime: "node",
  });
export const appStoreOptimizationLocalizationHelper = defineProcedure({
    id: "app-store-optimization-localization-helper",
    entry: new URL("./sources/app-store-optimization/localization_helper.ts", import.meta.url),
    description: "Script localization_helper.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/localization_helper.mjs",
    runtime: "node",
  });
export const appStoreOptimizationMetadataOptimizer = defineProcedure({
    id: "app-store-optimization-metadata-optimizer",
    entry: new URL("./sources/app-store-optimization/metadata_optimizer.ts", import.meta.url),
    description: "Script metadata_optimizer.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/metadata_optimizer.mjs",
    runtime: "node",
  });
export const appStoreOptimizationReviewAnalyzer = defineProcedure({
    id: "app-store-optimization-review-analyzer",
    entry: new URL("./sources/app-store-optimization/review_analyzer.ts", import.meta.url),
    description: "Script review_analyzer.mjs.",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/review_analyzer.mjs",
    runtime: "node",
  });
export const architectureReviewerScanCodebase = defineProcedure({
    id: "architecture-reviewer-scan-codebase",
    entry: new URL("./sources/architecture-reviewer/scan_codebase.ts", import.meta.url),
    description: "Script scan_codebase.mjs.",
    owners: { skillIds: ["architecture-reviewer"] },
    target: "scripts/scan_codebase.mjs",
    runtime: "node",
  });
export const baoyuCompressImageMain = defineProcedure({
    id: "baoyu-compress-image-main",
    entry: new URL("./sources/baoyu-compress-image/main.ts", import.meta.url),
    description: "Script main.mjs.",
    owners: { skillIds: ["baoyu-compress-image"] },
    target: "scripts/main.mjs",
    runtime: "node",
  });
export const canvasDesignBaoyuArticleIllustratorBuildBatch = defineProcedure({
    id: "canvas-design-baoyu-article-illustrator-build-batch",
    entry: new URL("./sources/canvas-design/baoyu-article-illustrator-build-batch.ts", import.meta.url),
    description: "Script baoyu-article-illustrator-build-batch.mjs.",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/baoyu-article-illustrator-build-batch.mjs",
    runtime: "node",
  });
export const canvasDesignConceptToImageRenderToImage = defineProcedure({
    id: "canvas-design-concept-to-image-render-to-image",
    entry: new URL("./sources/canvas-design/concept-to-image-render_to_image.ts", import.meta.url),
    description: "Script concept-to-image-render_to_image.mjs.",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-image-render_to_image.mjs",
    runtime: "node",
  });
export const canvasDesignConceptToVideoAddAudio = defineProcedure({
    id: "canvas-design-concept-to-video-add-audio",
    entry: new URL("./sources/canvas-design/concept-to-video-add_audio.ts", import.meta.url),
    description: "Script concept-to-video-add_audio.mjs.",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-video-add_audio.mjs",
    runtime: "node",
  });
export const canvasDesignConceptToVideoRenderVideo = defineProcedure({
    id: "canvas-design-concept-to-video-render-video",
    entry: new URL("./sources/canvas-design/concept-to-video-render_video.ts", import.meta.url),
    description: "Script concept-to-video-render_video.mjs.",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-video-render_video.mjs",
    runtime: "node",
  });
export const codeReviewAssessCode = defineProcedure({
    id: "code-review-assess-code",
    entry: new URL("./sources/code-review/assess-code.ts", import.meta.url),
    description: "Script assess-code.mjs.",
    owners: { skillIds: ["code-review"] },
    target: "scripts/assess-code.mjs",
    runtime: "node",
  });
export const codeReviewAssessTests = defineProcedure({
    id: "code-review-assess-tests",
    entry: new URL("./sources/code-review/assess-tests.ts", import.meta.url),
    description: "Script assess-tests.mjs.",
    owners: { skillIds: ["code-review"] },
    target: "scripts/assess-tests.mjs",
    runtime: "node",
  });
export const complexityReducerComplexityReport = defineProcedure({
    id: "complexity-reducer-complexity-report",
    entry: new URL("./sources/complexity-reducer/complexity_report.ts", import.meta.url),
    description: "Script complexity_report.mjs.",
    owners: { skillIds: ["complexity-reducer"] },
    target: "scripts/complexity_report.mjs",
    runtime: "node",
  });
export const copywritingContentFilter = defineProcedure({
    id: "copywriting-content-filter",
    entry: new URL("./sources/copywriting/content_filter.ts", import.meta.url),
    description: "Script content_filter.mjs.",
    owners: { skillIds: ["copywriting"] },
    target: "scripts/content_filter.mjs",
    runtime: "node",
  });
export const dataAnalysisAnalyze = defineProcedure({
    id: "data-analysis-analyze",
    entry: new URL("./sources/data-analysis/analyze.ts", import.meta.url),
    description: "Script analyze.mjs.",
    owners: { skillIds: ["data-analysis"] },
    target: "scripts/analyze.mjs",
    runtime: "node",
  });
export const debugMethodologyDebugChecklist = defineProcedure({
    id: "debug-methodology-debug-checklist",
    entry: new URL("./sources/debug-methodology/debug-checklist.ts", import.meta.url),
    description: "根据问题标题生成六步调试检查清单骨架。",
    owners: { skillIds: ["debug-methodology"] },
    argsSchema: "DebugChecklistArgs",
    outputSchema: "MarkdownChecklist",
  });
export const financialAnalystBudgetVarianceAnalyzer = defineProcedure({
    id: "financial-analyst-budget-variance-analyzer",
    entry: new URL("./sources/financial-analyst/budget_variance_analyzer.ts", import.meta.url),
    description: "Script budget_variance_analyzer.mjs.",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/budget_variance_analyzer.mjs",
    runtime: "node",
  });
export const financialAnalystDcfValuation = defineProcedure({
    id: "financial-analyst-dcf-valuation",
    entry: new URL("./sources/financial-analyst/dcf_valuation.ts", import.meta.url),
    description: "Script dcf_valuation.mjs.",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/dcf_valuation.mjs",
    runtime: "node",
  });
export const financialAnalystForecastBuilder = defineProcedure({
    id: "financial-analyst-forecast-builder",
    entry: new URL("./sources/financial-analyst/forecast_builder.ts", import.meta.url),
    description: "Script forecast_builder.mjs.",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/forecast_builder.mjs",
    runtime: "node",
  });
export const financialAnalystRatioCalculator = defineProcedure({
    id: "financial-analyst-ratio-calculator",
    entry: new URL("./sources/financial-analyst/ratio_calculator.ts", import.meta.url),
    description: "Script ratio_calculator.mjs.",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/ratio_calculator.mjs",
    runtime: "node",
  });
export const financialAnalystRatioInputValidation = defineProcedure({
    id: "financial-analyst-ratio-input-validation",
    entry: new URL("./sources/financial-analyst/ratio_input_validation.ts", import.meta.url),
    description: "Script ratio_input_validation.mjs.",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/ratio_input_validation.mjs",
    runtime: "node",
  });
export const ghFixCiInspectPrChecks = defineProcedure({
    id: "gh-fix-ci-inspect-pr-checks",
    entry: new URL("./sources/gh-fix-ci/inspect_pr_checks.ts", import.meta.url),
    description: "Script inspect_pr_checks.mjs.",
    owners: { skillIds: ["gh-fix-ci"] },
    target: "scripts/inspect_pr_checks.mjs",
    runtime: "node",
  });
export const helmChartScaffoldingValidateChart = defineProcedure({
    id: "helm-chart-scaffolding-validate-chart",
    entry: new URL("./sources/helm-chart-scaffolding/validate-chart.ts", import.meta.url),
    description: "Script validate-chart.mjs.",
    owners: { skillIds: ["helm-chart-scaffolding"] },
    target: "scripts/validate-chart.mjs",
    runtime: "node",
  });
export const i18nLocalizationI18nChecker = defineProcedure({
    id: "i18n-localization-i18n-checker",
    entry: new URL("./sources/i18n-localization/i18n_checker.ts", import.meta.url),
    description: "Script i18n_checker.mjs.",
    owners: { skillIds: ["i18n-localization"] },
    target: "scripts/i18n_checker.mjs",
    runtime: "node",
  });
export const iconRetrievalSearch = defineProcedure({
    id: "icon-retrieval-search",
    entry: new URL("./sources/icon-retrieval/search.ts", import.meta.url),
    description: "Script search.mjs.",
    owners: { skillIds: ["icon-retrieval"] },
    target: "scripts/search.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillAccessibilityAudit = defineProcedure({
    id: "ios-simulator-skill-accessibility-audit",
    entry: new URL("./sources/ios-simulator-skill/accessibility_audit.ts", import.meta.url),
    description: "Script accessibility_audit.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/accessibility_audit.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillAppLauncher = defineProcedure({
    id: "ios-simulator-skill-app-launcher",
    entry: new URL("./sources/ios-simulator-skill/app_launcher.ts", import.meta.url),
    description: "Script app_launcher.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/app_launcher.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillAppStateCapture = defineProcedure({
    id: "ios-simulator-skill-app-state-capture",
    entry: new URL("./sources/ios-simulator-skill/app_state_capture.ts", import.meta.url),
    description: "Script app_state_capture.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/app_state_capture.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillBuildAndTest = defineProcedure({
    id: "ios-simulator-skill-build-and-test",
    entry: new URL("./sources/ios-simulator-skill/build_and_test.ts", import.meta.url),
    description: "Script build_and_test.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/build_and_test.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillClipboard = defineProcedure({
    id: "ios-simulator-skill-clipboard",
    entry: new URL("./sources/ios-simulator-skill/clipboard.ts", import.meta.url),
    description: "Script clipboard.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/clipboard.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillGesture = defineProcedure({
    id: "ios-simulator-skill-gesture",
    entry: new URL("./sources/ios-simulator-skill/gesture.ts", import.meta.url),
    description: "Script gesture.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/gesture.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillInteractionCommon = defineProcedure({
    id: "ios-simulator-skill-interaction-common",
    entry: new URL("./sources/ios-simulator-skill/interaction_common.ts", import.meta.url),
    description: "Script interaction_common.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/interaction_common.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillKeyboard = defineProcedure({
    id: "ios-simulator-skill-keyboard",
    entry: new URL("./sources/ios-simulator-skill/keyboard.ts", import.meta.url),
    description: "Script keyboard.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/keyboard.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillLogMonitor = defineProcedure({
    id: "ios-simulator-skill-log-monitor",
    entry: new URL("./sources/ios-simulator-skill/log_monitor.ts", import.meta.url),
    description: "Script log_monitor.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/log_monitor.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillNavigator = defineProcedure({
    id: "ios-simulator-skill-navigator",
    entry: new URL("./sources/ios-simulator-skill/navigator.ts", import.meta.url),
    description: "Script navigator.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/navigator.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillPrivacyManager = defineProcedure({
    id: "ios-simulator-skill-privacy-manager",
    entry: new URL("./sources/ios-simulator-skill/privacy_manager.ts", import.meta.url),
    description: "Script privacy_manager.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/privacy_manager.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillPushNotification = defineProcedure({
    id: "ios-simulator-skill-push-notification",
    entry: new URL("./sources/ios-simulator-skill/push_notification.ts", import.meta.url),
    description: "Script push_notification.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/push_notification.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillScreenMapper = defineProcedure({
    id: "ios-simulator-skill-screen-mapper",
    entry: new URL("./sources/ios-simulator-skill/screen_mapper.ts", import.meta.url),
    description: "Script screen_mapper.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/screen_mapper.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillScreenshotCommon = defineProcedure({
    id: "ios-simulator-skill-screenshot-common",
    entry: new URL("./sources/ios-simulator-skill/screenshot_common.ts", import.meta.url),
    description: "Script screenshot_common.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/screenshot_common.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimHealthCheck = defineProcedure({
    id: "ios-simulator-skill-sim-health-check",
    entry: new URL("./sources/ios-simulator-skill/sim_health_check.ts", import.meta.url),
    description: "Script sim_health_check.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/sim_health_check.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimList = defineProcedure({
    id: "ios-simulator-skill-sim-list",
    entry: new URL("./sources/ios-simulator-skill/sim_list.ts", import.meta.url),
    description: "Script sim_list.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/sim_list.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlBoot = defineProcedure({
    id: "ios-simulator-skill-simctl-boot",
    entry: new URL("./sources/ios-simulator-skill/simctl_boot.ts", import.meta.url),
    description: "Script simctl_boot.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_boot.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlCommon = defineProcedure({
    id: "ios-simulator-skill-simctl-common",
    entry: new URL("./sources/ios-simulator-skill/simctl_common.ts", import.meta.url),
    description: "Script simctl_common.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_common.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlCreate = defineProcedure({
    id: "ios-simulator-skill-simctl-create",
    entry: new URL("./sources/ios-simulator-skill/simctl_create.ts", import.meta.url),
    description: "Script simctl_create.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_create.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlDelete = defineProcedure({
    id: "ios-simulator-skill-simctl-delete",
    entry: new URL("./sources/ios-simulator-skill/simctl_delete.ts", import.meta.url),
    description: "Script simctl_delete.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_delete.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlErase = defineProcedure({
    id: "ios-simulator-skill-simctl-erase",
    entry: new URL("./sources/ios-simulator-skill/simctl_erase.ts", import.meta.url),
    description: "Script simctl_erase.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_erase.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimctlShutdown = defineProcedure({
    id: "ios-simulator-skill-simctl-shutdown",
    entry: new URL("./sources/ios-simulator-skill/simctl_shutdown.ts", import.meta.url),
    description: "Script simctl_shutdown.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_shutdown.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillSimulatorSelector = defineProcedure({
    id: "ios-simulator-skill-simulator-selector",
    entry: new URL("./sources/ios-simulator-skill/simulator_selector.ts", import.meta.url),
    description: "Script simulator_selector.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simulator_selector.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillStatusBar = defineProcedure({
    id: "ios-simulator-skill-status-bar",
    entry: new URL("./sources/ios-simulator-skill/status_bar.ts", import.meta.url),
    description: "Script status_bar.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/status_bar.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillTestRecorder = defineProcedure({
    id: "ios-simulator-skill-test-recorder",
    entry: new URL("./sources/ios-simulator-skill/test_recorder.ts", import.meta.url),
    description: "Script test_recorder.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/test_recorder.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillVisualDiff = defineProcedure({
    id: "ios-simulator-skill-visual-diff",
    entry: new URL("./sources/ios-simulator-skill/visual_diff.ts", import.meta.url),
    description: "Script visual_diff.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/visual_diff.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillXcodeBuilder = defineProcedure({
    id: "ios-simulator-skill-xcode-builder",
    entry: new URL("./sources/ios-simulator-skill/xcode/builder.ts", import.meta.url),
    description: "Script xcode/builder.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/xcode/builder.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillXcodeCache = defineProcedure({
    id: "ios-simulator-skill-xcode-cache",
    entry: new URL("./sources/ios-simulator-skill/xcode/cache.ts", import.meta.url),
    description: "Script xcode/cache.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/xcode/cache.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillXcodeConfig = defineProcedure({
    id: "ios-simulator-skill-xcode-config",
    entry: new URL("./sources/ios-simulator-skill/xcode/config.ts", import.meta.url),
    description: "Script xcode/config.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/xcode/config.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillXcodeIndex = defineProcedure({
    id: "ios-simulator-skill-xcode-index",
    entry: new URL("./sources/ios-simulator-skill/xcode/index.ts", import.meta.url),
    description: "Script xcode/index.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/xcode/index.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillXcodeReporter = defineProcedure({
    id: "ios-simulator-skill-xcode-reporter",
    entry: new URL("./sources/ios-simulator-skill/xcode/reporter.ts", import.meta.url),
    description: "Script xcode/reporter.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/xcode/reporter.mjs",
    runtime: "node",
  });
export const iosSimulatorSkillXcodeXcresult = defineProcedure({
    id: "ios-simulator-skill-xcode-xcresult",
    entry: new URL("./sources/ios-simulator-skill/xcode/xcresult.ts", import.meta.url),
    description: "Script xcode/xcresult.mjs.",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/xcode/xcresult.mjs",
    runtime: "node",
  });
export const markitdownBatchConvert = defineProcedure({
    id: "markitdown-batch-convert",
    entry: new URL("./sources/markitdown/batch_convert.ts", import.meta.url),
    description: "Script batch_convert.mjs.",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/batch_convert.mjs",
    runtime: "node",
  });
export const markitdownConvertLiterature = defineProcedure({
    id: "markitdown-convert-literature",
    entry: new URL("./sources/markitdown/convert_literature.ts", import.meta.url),
    description: "Script convert_literature.mjs.",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/convert_literature.mjs",
    runtime: "node",
  });
export const markitdownConvertWithAi = defineProcedure({
    id: "markitdown-convert-with-ai",
    entry: new URL("./sources/markitdown/convert_with_ai.ts", import.meta.url),
    description: "Script convert_with_ai.mjs.",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/convert_with_ai.mjs",
    runtime: "node",
  });
export const markitdownMarkitdownRuntime = defineProcedure({
    id: "markitdown-markitdown-runtime",
    entry: new URL("./sources/markitdown/markitdown_runtime.ts", import.meta.url),
    description: "Script markitdown_runtime.mjs.",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/markitdown_runtime.mjs",
    runtime: "node",
  });
export const mdToPdfKatexRender = defineProcedure({
    id: "md-to-pdf-katex-render",
    entry: new URL("./sources/md-to-pdf/katex_render.ts", import.meta.url),
    description: "Script katex_render.mjs.",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/katex_render.mjs",
    runtime: "node",
  });
export const mdToPdfMdToPdf = defineProcedure({
    id: "md-to-pdf-md-to-pdf",
    entry: new URL("./sources/md-to-pdf/md_to_pdf.ts", import.meta.url),
    description: "Script md_to_pdf.mjs.",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/md_to_pdf.mjs",
    runtime: "node",
  });
export const mdToPdfSetup = defineProcedure({
    id: "md-to-pdf-setup",
    entry: new URL("./sources/md-to-pdf/setup.ts", import.meta.url),
    description: "Script setup.mjs.",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/setup.mjs",
    runtime: "node",
  });
export const modelFirstReasoningValidateModel = defineProcedure({
    id: "model-first-reasoning-validate-model",
    entry: new URL("./sources/model-first-reasoning/validate-model.ts", import.meta.url),
    description: "Script validate-model.mjs.",
    owners: { skillIds: ["model-first-reasoning"] },
    target: "scripts/validate-model.mjs",
    runtime: "node",
  });
export const modernWebDesignDesignAudit = defineProcedure({
    id: "modern-web-design-design-audit",
    entry: new URL("./sources/modern-web-design/design_audit.ts", import.meta.url),
    description: "Script design_audit.mjs.",
    owners: { skillIds: ["modern-web-design"] },
    target: "scripts/design_audit.mjs",
    runtime: "node",
  });
export const modernWebDesignPatternGenerator = defineProcedure({
    id: "modern-web-design-pattern-generator",
    entry: new URL("./sources/modern-web-design/pattern_generator.ts", import.meta.url),
    description: "Script pattern_generator.mjs.",
    owners: { skillIds: ["modern-web-design"] },
    target: "scripts/pattern_generator.mjs",
    runtime: "node",
  });
export const pdfCheckBoundingBoxes = defineProcedure({
    id: "pdf-check-bounding-boxes",
    entry: new URL("./sources/pdf/check_bounding_boxes.ts", import.meta.url),
    description: "Script check_bounding_boxes.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/check_bounding_boxes.mjs",
    runtime: "node",
  });
export const pdfCheckFillableFields = defineProcedure({
    id: "pdf-check-fillable-fields",
    entry: new URL("./sources/pdf/check_fillable_fields.ts", import.meta.url),
    description: "Script check_fillable_fields.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/check_fillable_fields.mjs",
    runtime: "node",
  });
export const pdfConvertPdfToImages = defineProcedure({
    id: "pdf-convert-pdf-to-images",
    entry: new URL("./sources/pdf/convert_pdf_to_images.ts", import.meta.url),
    description: "Script convert_pdf_to_images.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/convert_pdf_to_images.mjs",
    runtime: "node",
  });
export const pdfCreateValidationImage = defineProcedure({
    id: "pdf-create-validation-image",
    entry: new URL("./sources/pdf/create_validation_image.ts", import.meta.url),
    description: "Script create_validation_image.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/create_validation_image.mjs",
    runtime: "node",
  });
export const pdfExtractFormFieldInfo = defineProcedure({
    id: "pdf-extract-form-field-info",
    entry: new URL("./sources/pdf/extract_form_field_info.ts", import.meta.url),
    description: "Script extract_form_field_info.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/extract_form_field_info.mjs",
    runtime: "node",
  });
export const pdfExtractFormStructure = defineProcedure({
    id: "pdf-extract-form-structure",
    entry: new URL("./sources/pdf/extract_form_structure.ts", import.meta.url),
    description: "Script extract_form_structure.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/extract_form_structure.mjs",
    runtime: "node",
  });
export const pdfFillFillableFields = defineProcedure({
    id: "pdf-fill-fillable-fields",
    entry: new URL("./sources/pdf/fill_fillable_fields.ts", import.meta.url),
    description: "Script fill_fillable_fields.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/fill_fillable_fields.mjs",
    runtime: "node",
  });
export const pdfFillPdfFormWithAnnotations = defineProcedure({
    id: "pdf-fill-pdf-form-with-annotations",
    entry: new URL("./sources/pdf/fill_pdf_form_with_annotations.ts", import.meta.url),
    description: "Script fill_pdf_form_with_annotations.mjs.",
    owners: { skillIds: ["pdf"] },
    target: "scripts/fill_pdf_form_with_annotations.mjs",
    runtime: "node",
  });
export const preLandingReviewCollectDiff = defineProcedure({
    id: "pre-landing-review-collect-diff",
    entry: new URL("./sources/pre-landing-review/collect_diff.ts", import.meta.url),
    description: "Script collect_diff.mjs.",
    owners: { skillIds: ["pre-landing-review"] },
    target: "scripts/collect_diff.mjs",
    runtime: "node",
  });
export const preLandingReviewRenderReport = defineProcedure({
    id: "pre-landing-review-render-report",
    entry: new URL("./sources/pre-landing-review/render_report.ts", import.meta.url),
    description: "Script render_report.mjs.",
    owners: { skillIds: ["pre-landing-review"] },
    target: "scripts/render_report.mjs",
    runtime: "node",
  });
export const prlctlVmControlFileTransfer = defineProcedure({
    id: "prlctl-vm-control-file-transfer",
    entry: new URL("./sources/prlctl-vm-control/file_transfer.ts", import.meta.url),
    description: "Script file_transfer.mjs.",
    owners: { skillIds: ["prlctl-vm-control"] },
    target: "scripts/file_transfer.mjs",
    runtime: "node",
  });
export const prlctlVmControlPowershellOutput = defineProcedure({
    id: "prlctl-vm-control-powershell-output",
    entry: new URL("./sources/prlctl-vm-control/powershell_output.ts", import.meta.url),
    description: "Script powershell_output.mjs.",
    owners: { skillIds: ["prlctl-vm-control"] },
    target: "scripts/powershell_output.mjs",
    runtime: "node",
  });
export const prlctlVmControlPrlctlHelper = defineProcedure({
    id: "prlctl-vm-control-prlctl-helper",
    entry: new URL("./sources/prlctl-vm-control/prlctl_helper.ts", import.meta.url),
    description: "Script prlctl_helper.mjs.",
    owners: { skillIds: ["prlctl-vm-control"] },
    target: "scripts/prlctl_helper.mjs",
    runtime: "node",
  });
export const promptEngineeringPatternsOptimizePrompt = defineProcedure({
    id: "prompt-engineering-patterns-optimize-prompt",
    entry: new URL("./sources/prompt-engineering-patterns/optimize-prompt.ts", import.meta.url),
    description: "Script optimize-prompt.mjs.",
    owners: { skillIds: ["prompt-engineering-patterns"] },
    target: "scripts/optimize-prompt.mjs",
    runtime: "node",
  });
export const remoteSshCommandInstallSshpass = defineProcedure({
    id: "remote-ssh-command-install-sshpass",
    entry: new URL("./sources/remote-ssh-command/install-sshpass.ts", import.meta.url),
    description: "Script install-sshpass.mjs.",
    owners: { skillIds: ["remote-ssh-command"] },
    target: "scripts/install-sshpass.mjs",
    runtime: "node",
  });
export const remoteSshCommandSshExec = defineProcedure({
    id: "remote-ssh-command-ssh-exec",
    entry: new URL("./sources/remote-ssh-command/ssh-exec.ts", import.meta.url),
    description: "Script ssh-exec.mjs.",
    owners: { skillIds: ["remote-ssh-command"] },
    target: "scripts/ssh-exec.mjs",
    runtime: "node",
  });
export const screenshotEnsureMacosPermissions = defineProcedure({
    id: "screenshot-ensure-macos-permissions",
    entry: new URL("./sources/screenshot/ensure_macos_permissions.ts", import.meta.url),
    description: "Script ensure_macos_permissions.mjs.",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/ensure_macos_permissions.mjs",
    runtime: "node",
  });
export const screenshotMacosDisplayInfo = defineProcedure({
    id: "screenshot-macos-display-info",
    entry: new URL("./sources/screenshot/macos_display_info.ts", import.meta.url),
    description: "Script macos_display_info.mjs.",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_display_info.mjs",
    runtime: "node",
  });
export const screenshotMacosPermissions = defineProcedure({
    id: "screenshot-macos-permissions",
    entry: new URL("./sources/screenshot/macos_permissions.ts", import.meta.url),
    description: "Script macos_permissions.mjs.",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_permissions.mjs",
    runtime: "node",
  });
export const screenshotMacosWindowInfo = defineProcedure({
    id: "screenshot-macos-window-info",
    entry: new URL("./sources/screenshot/macos_window_info.ts", import.meta.url),
    description: "Script macos_window_info.mjs.",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_window_info.mjs",
    runtime: "node",
  });
export const screenshotTakeScreenshot = defineProcedure({
    id: "screenshot-take-screenshot",
    entry: new URL("./sources/screenshot/take_screenshot.ts", import.meta.url),
    description: "Script take_screenshot.mjs.",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/take_screenshot.mjs",
    runtime: "node",
  });
export const screenshotTakeScreenshotWindows = defineProcedure({
    id: "screenshot-take-screenshot-windows",
    entry: new URL("./sources/screenshot/take_screenshot_windows.ts", import.meta.url),
    description: "Script take_screenshot_windows.mjs.",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/take_screenshot_windows.mjs",
    runtime: "node",
  });
export const securityOwnershipMapBuildOwnershipMap = defineProcedure({
    id: "security-ownership-map-build-ownership-map",
    entry: new URL("./sources/security-ownership-map/build_ownership_map.ts", import.meta.url),
    description: "Script build_ownership_map.mjs.",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/build_ownership_map.mjs",
    runtime: "node",
  });
export const securityOwnershipMapCommunityMaintainers = defineProcedure({
    id: "security-ownership-map-community-maintainers",
    entry: new URL("./sources/security-ownership-map/community_maintainers.ts", import.meta.url),
    description: "Script community_maintainers.mjs.",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/community_maintainers.mjs",
    runtime: "node",
  });
export const securityOwnershipMapQueryOwnership = defineProcedure({
    id: "security-ownership-map-query-ownership",
    entry: new URL("./sources/security-ownership-map/query_ownership.ts", import.meta.url),
    description: "Script query_ownership.mjs.",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/query_ownership.mjs",
    runtime: "node",
  });
export const securityOwnershipMapRunOwnershipMap = defineProcedure({
    id: "security-ownership-map-run-ownership-map",
    entry: new URL("./sources/security-ownership-map/run_ownership_map.ts", import.meta.url),
    description: "Script run_ownership_map.mjs.",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/run_ownership_map.mjs",
    runtime: "node",
  });
export const shadcnUiVerifySetup = defineProcedure({
    id: "shadcn-ui-verify-setup",
    entry: new URL("./sources/shadcn-ui/verify-setup.ts", import.meta.url),
    description: "Script verify-setup.mjs.",
    owners: { skillIds: ["shadcn-ui"] },
    target: "scripts/verify-setup.mjs",
    runtime: "node",
  });
export const skillActivationAnalyzerCsoAudit = defineProcedure({
    id: "skill-activation-analyzer-cso-audit",
    entry: new URL("./sources/skill-activation-analyzer/cso_audit.ts", import.meta.url),
    description: "Script cso_audit.mjs.",
    owners: { skillIds: ["skill-activation-analyzer"] },
    target: "scripts/cso_audit.mjs",
    runtime: "node",
  });
export const skillCreatorAggregateBenchmark = defineProcedure({
    id: "skill-creator-aggregate-benchmark",
    entry: new URL("./sources/skill-creator/aggregate_benchmark.ts", import.meta.url),
    description: "Script aggregate_benchmark.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/aggregate_benchmark.mjs",
    runtime: "node",
  });
export const skillCreatorGenerateReport = defineProcedure({
    id: "skill-creator-generate-report",
    entry: new URL("./sources/skill-creator/generate_report.ts", import.meta.url),
    description: "Script generate_report.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/generate_report.mjs",
    runtime: "node",
  });
export const skillCreatorGenerateReview = defineProcedure({
    id: "skill-creator-generate-review",
    entry: new URL("./sources/skill-creator/generate_review.ts", import.meta.url),
    description: "Script generate_review.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/generate_review.mjs",
    runtime: "node",
  });
export const skillCreatorImproveDescription = defineProcedure({
    id: "skill-creator-improve-description",
    entry: new URL("./sources/skill-creator/improve_description.ts", import.meta.url),
    description: "Script improve_description.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/improve_description.mjs",
    runtime: "node",
  });
export const skillCreatorPackageSkill = defineProcedure({
    id: "skill-creator-package-skill",
    entry: new URL("./sources/skill-creator/package_skill.ts", import.meta.url),
    description: "Script package_skill.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/package_skill.mjs",
    runtime: "node",
  });
export const skillCreatorQuickValidate = defineProcedure({
    id: "skill-creator-quick-validate",
    entry: new URL("./sources/skill-creator/quick_validate.ts", import.meta.url),
    description: "Script quick_validate.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/quick_validate.mjs",
    runtime: "node",
  });
export const skillCreatorRunEval = defineProcedure({
    id: "skill-creator-run-eval",
    entry: new URL("./sources/skill-creator/run_eval.ts", import.meta.url),
    description: "Script run_eval.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/run_eval.mjs",
    runtime: "node",
  });
export const skillCreatorRunLoop = defineProcedure({
    id: "skill-creator-run-loop",
    entry: new URL("./sources/skill-creator/run_loop.ts", import.meta.url),
    description: "Script run_loop.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/run_loop.mjs",
    runtime: "node",
  });
export const skillCreatorUtils = defineProcedure({
    id: "skill-creator-utils",
    entry: new URL("./sources/skill-creator/utils.ts", import.meta.url),
    description: "Script utils.mjs.",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/utils.mjs",
    runtime: "node",
  });
export const skillsPruneAndSyncReadmeCurateSkills = defineProcedure({
    id: "skills-prune-and-sync-readme-curate-skills",
    entry: new URL("./sources/skills-prune-and-sync-readme/curate_skills.ts", import.meta.url),
    description: "Script curate_skills.mjs.",
    owners: { skillIds: ["skills-prune-and-sync-readme"] },
    target: "scripts/curate_skills.mjs",
    runtime: "node",
  });
export const skillsPruneAndSyncReadmeSimilarityGroups = defineProcedure({
    id: "skills-prune-and-sync-readme-similarity-groups",
    entry: new URL("./sources/skills-prune-and-sync-readme/similarity_groups.ts", import.meta.url),
    description: "Script similarity_groups.mjs.",
    owners: { skillIds: ["skills-prune-and-sync-readme"] },
    target: "scripts/similarity_groups.mjs",
    runtime: "node",
  });
export const skillsPruneAndSyncReadmeTestCurateSkills = defineProcedure({
    id: "skills-prune-and-sync-readme-test-curate-skills",
    entry: new URL("./sources/skills-prune-and-sync-readme/test_curate_skills.ts", import.meta.url),
    description: "Script test_curate_skills.mjs.",
    owners: { skillIds: ["skills-prune-and-sync-readme"] },
    target: "scripts/test_curate_skills.mjs",
    runtime: "node",
  });
export const speckitBaselineBootstrapSpecify = defineProcedure({
    id: "speckit-baseline-bootstrap-specify",
    entry: new URL("./sources/speckit-baseline/bootstrap-specify.ts", import.meta.url),
    description: "Script bootstrap-specify.mjs.",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/bootstrap-specify.mjs",
    runtime: "node",
  });
export const speckitBaselineCheckPrerequisites = defineProcedure({
    id: "speckit-baseline-check-prerequisites",
    entry: new URL("./sources/speckit-baseline/check-prerequisites.ts", import.meta.url),
    description: "Script check-prerequisites.mjs.",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/check-prerequisites.mjs",
    runtime: "node",
  });
export const speckitBaselineCommon = defineProcedure({
    id: "speckit-baseline-common",
    entry: new URL("./sources/speckit-baseline/common.ts", import.meta.url),
    description: "Script common.mjs.",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/common.mjs",
    runtime: "node",
  });
export const speckitBaselineCreateNewFeature = defineProcedure({
    id: "speckit-baseline-create-new-feature",
    entry: new URL("./sources/speckit-baseline/create-new-feature.ts", import.meta.url),
    description: "Script create-new-feature.mjs.",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/create-new-feature.mjs",
    runtime: "node",
  });
export const speckitBaselineSetupPlan = defineProcedure({
    id: "speckit-baseline-setup-plan",
    entry: new URL("./sources/speckit-baseline/setup-plan.ts", import.meta.url),
    description: "Script setup-plan.mjs.",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/setup-plan.mjs",
    runtime: "node",
  });
export const typescriptTypeSafetyExtractTsErrors = defineProcedure({
    id: "typescript-type-safety-extract-ts-errors",
    entry: new URL("./sources/typescript-type-safety/extract-ts-errors.ts", import.meta.url),
    description: "把 tsc 输出按文件和错误码归组，便于先定位上游合同错误。",
    owners: { skillIds: ["typescript-type-safety"] },
    argsSchema: "ExtractTsErrorsArgs",
    outputSchema: "ExtractTsErrorsSummary",
  });
export const uxResearcherDesignerPersonaGenerator = defineProcedure({
    id: "ux-researcher-designer-persona-generator",
    entry: new URL("./sources/ux-researcher-designer/persona_generator.ts", import.meta.url),
    description: "Script persona_generator.mjs.",
    owners: { skillIds: ["ux-researcher-designer"] },
    target: "scripts/persona_generator.mjs",
    runtime: "node",
  });
export const webContentFetcherFetch = defineProcedure({
    id: "web-content-fetcher-fetch",
    entry: new URL("./sources/web-content-fetcher/fetch.ts", import.meta.url),
    description: "Script fetch.mjs.",
    owners: { skillIds: ["web-content-fetcher"] },
    target: "scripts/fetch.mjs",
    runtime: "node",
  });
export const webPerformanceDiagnosisAnalyze = defineProcedure({
    id: "web-performance-diagnosis-analyze",
    entry: new URL("./sources/web-performance-diagnosis/analyze.ts", import.meta.url),
    description: "Script analyze.mjs.",
    owners: { skillIds: ["web-performance-diagnosis"] },
    target: "scripts/analyze.mjs",
    runtime: "node",
  });
export const youtubeAnalysisAnalyzeVideo = defineProcedure({
    id: "youtube-analysis-analyze-video",
    entry: new URL("./sources/youtube-analysis/analyze_video.ts", import.meta.url),
    description: "Script analyze_video.mjs.",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/analyze_video.mjs",
    runtime: "node",
  });
export const youtubeAnalysisFetchTranscript = defineProcedure({
    id: "youtube-analysis-fetch-transcript",
    entry: new URL("./sources/youtube-analysis/fetch_transcript.ts", import.meta.url),
    description: "Script fetch_transcript.mjs.",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/fetch_transcript.mjs",
    runtime: "node",
  });
export const youtubeAnalysisUtils = defineProcedure({
    id: "youtube-analysis-utils",
    entry: new URL("./sources/youtube-analysis/utils.ts", import.meta.url),
    description: "Script utils.mjs.",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/utils.mjs",
    runtime: "node",
  });
export const youtubeSearchSearchYoutube = defineProcedure({
    id: "youtube-search-search-youtube",
    entry: new URL("./sources/youtube-search/search_youtube.ts", import.meta.url),
    description: "Script search_youtube.mjs.",
    owners: { skillIds: ["youtube-search"] },
    target: "scripts/search_youtube.mjs",
    runtime: "node",
  });

export const componentProcedures = [
  agileProductOwnerUserStoryGenerator,
  analyticsTrackingTrackingPlanGenerator,
  androidDeviceAutomationAppLauncher,
  androidDeviceAutomationBuildAndTest,
  androidDeviceAutomationCommon,
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
  iosSimulatorSkillInteractionCommon,
  iosSimulatorSkillKeyboard,
  iosSimulatorSkillLogMonitor,
  iosSimulatorSkillNavigator,
  iosSimulatorSkillPrivacyManager,
  iosSimulatorSkillPushNotification,
  iosSimulatorSkillScreenMapper,
  iosSimulatorSkillScreenshotCommon,
  iosSimulatorSkillSimHealthCheck,
  iosSimulatorSkillSimList,
  iosSimulatorSkillSimctlBoot,
  iosSimulatorSkillSimctlCommon,
  iosSimulatorSkillSimctlCreate,
  iosSimulatorSkillSimctlDelete,
  iosSimulatorSkillSimctlErase,
  iosSimulatorSkillSimctlShutdown,
  iosSimulatorSkillSimulatorSelector,
  iosSimulatorSkillStatusBar,
  iosSimulatorSkillTestRecorder,
  iosSimulatorSkillVisualDiff,
  iosSimulatorSkillXcodeBuilder,
  iosSimulatorSkillXcodeCache,
  iosSimulatorSkillXcodeConfig,
  iosSimulatorSkillXcodeIndex,
  iosSimulatorSkillXcodeReporter,
  iosSimulatorSkillXcodeXcresult,
  markitdownBatchConvert,
  markitdownConvertLiterature,
  markitdownConvertWithAi,
  markitdownMarkitdownRuntime,
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
  prlctlVmControlFileTransfer,
  prlctlVmControlPowershellOutput,
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
  skillCreatorUtils,
  skillsPruneAndSyncReadmeCurateSkills,
  skillsPruneAndSyncReadmeSimilarityGroups,
  skillsPruneAndSyncReadmeTestCurateSkills,
  speckitBaselineBootstrapSpecify,
  speckitBaselineCheckPrerequisites,
  speckitBaselineCommon,
  speckitBaselineCreateNewFeature,
  speckitBaselineSetupPlan,
  typescriptTypeSafetyExtractTsErrors,
  uxResearcherDesignerPersonaGenerator,
  webContentFetcherFetch,
  webPerformanceDiagnosisAnalyze,
  youtubeAnalysisAnalyzeVideo,
  youtubeAnalysisFetchTranscript,
  youtubeAnalysisUtils,
  youtubeSearchSearchYoutube,
] as const;
