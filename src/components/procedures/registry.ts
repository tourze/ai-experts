import { procedure as agileProductOwnerUserStoryGenerator } from "./sources/agile-product-owner/user_story_generator";
import { procedure as analyticsTrackingTrackingPlanGenerator } from "./sources/analytics-tracking/tracking_plan_generator";
import { procedure as androidDeviceAutomationAppLauncher } from "./sources/android-device-automation/app_launcher";
import { procedure as androidDeviceAutomationBuildAndTest } from "./sources/android-device-automation/build_and_test";
import { procedure as androidDeviceAutomationDiagnoseApp } from "./sources/android-device-automation/diagnose_app";
import { procedure as androidDeviceAutomationEmuHealthCheck } from "./sources/android-device-automation/emu_health_check";
import { procedure as androidDeviceAutomationEmulatorManage } from "./sources/android-device-automation/emulator_manage";
import { procedure as androidDeviceAutomationGesture } from "./sources/android-device-automation/gesture";
import { procedure as androidDeviceAutomationKeyboard } from "./sources/android-device-automation/keyboard";
import { procedure as androidDeviceAutomationLogMonitor } from "./sources/android-device-automation/log_monitor";
import { procedure as androidDeviceAutomationNavigator } from "./sources/android-device-automation/navigator";
import { procedure as androidDeviceAutomationScreenMapper } from "./sources/android-device-automation/screen_mapper";
import { procedure as appStoreOptimizationAbTestPlanner } from "./sources/app-store-optimization/ab_test_planner";
import { procedure as appStoreOptimizationAsoScorer } from "./sources/app-store-optimization/aso_scorer";
import { procedure as appStoreOptimizationCompetitorAnalyzer } from "./sources/app-store-optimization/competitor_analyzer";
import { procedure as appStoreOptimizationCollectReleaseChanges } from "./sources/app-store-optimization/collect_release_changes";
import { procedure as appStoreOptimizationKeywordAnalyzer } from "./sources/app-store-optimization/keyword_analyzer";
import { procedure as appStoreOptimizationLaunchChecklist } from "./sources/app-store-optimization/launch_checklist";
import { procedure as appStoreOptimizationLocalizationHelper } from "./sources/app-store-optimization/localization_helper";
import { procedure as appStoreOptimizationMetadataOptimizer } from "./sources/app-store-optimization/metadata_optimizer";
import { procedure as appStoreOptimizationReviewAnalyzer } from "./sources/app-store-optimization/review_analyzer";
import { procedure as architectureReviewerScanCodebase } from "./sources/architecture-reviewer/scan_codebase";
import { procedure as baoyuCompressImageMain } from "./sources/baoyu-compress-image/main";
import { procedure as canvasDesignBaoyuArticleIllustratorBuildBatch } from "./sources/canvas-design/baoyu-article-illustrator-build-batch";
import { procedure as canvasDesignConceptToImageRenderToImage } from "./sources/canvas-design/concept-to-image-render_to_image";
import { procedure as canvasDesignConceptToVideoAddAudio } from "./sources/canvas-design/concept-to-video-add_audio";
import { procedure as canvasDesignConceptToVideoRenderVideo } from "./sources/canvas-design/concept-to-video-render_video";
import { procedure as codeReviewAssessCode } from "./sources/code-review/assess-code";
import { procedure as codeReviewAssessTests } from "./sources/code-review/assess-tests";
import { procedure as complexityReducerComplexityReport } from "./sources/complexity-reducer/complexity_report";
import { procedure as copywritingContentFilter } from "./sources/copywriting/content_filter";
import { procedure as dataAnalysisAnalyze } from "./sources/data-analysis/analyze";
import { procedure as debugMethodologyDebugChecklist } from "./sources/debug-methodology/debug-checklist";
import { procedure as financialAnalystBudgetVarianceAnalyzer } from "./sources/financial-analyst/budget_variance_analyzer";
import { procedure as financialAnalystDcfValuation } from "./sources/financial-analyst/dcf_valuation";
import { procedure as financialAnalystForecastBuilder } from "./sources/financial-analyst/forecast_builder";
import { procedure as financialAnalystRatioCalculator } from "./sources/financial-analyst/ratio_calculator";
import { procedure as financialAnalystRatioInputValidation } from "./sources/financial-analyst/ratio_input_validation";
import { procedure as ghFixCiInspectPrChecks } from "./sources/gh-fix-ci/inspect_pr_checks";
import { procedure as helmChartScaffoldingValidateChart } from "./sources/helm-chart-scaffolding/validate-chart";
import { procedure as i18nLocalizationI18nChecker } from "./sources/i18n-localization/i18n_checker";
import { procedure as iconRetrievalSearch } from "./sources/icon-retrieval/search";
import { procedure as iosSimulatorSkillAccessibilityAudit } from "./sources/ios-simulator-skill/accessibility_audit";
import { procedure as iosSimulatorSkillAppLauncher } from "./sources/ios-simulator-skill/app_launcher";
import { procedure as iosSimulatorSkillAppStateCapture } from "./sources/ios-simulator-skill/app_state_capture";
import { procedure as iosSimulatorSkillBuildAndTest } from "./sources/ios-simulator-skill/build_and_test";
import { procedure as iosSimulatorSkillClipboard } from "./sources/ios-simulator-skill/clipboard";
import { procedure as iosSimulatorSkillGesture } from "./sources/ios-simulator-skill/gesture";
import { procedure as iosSimulatorSkillKeyboard } from "./sources/ios-simulator-skill/keyboard";
import { procedure as iosSimulatorSkillLogMonitor } from "./sources/ios-simulator-skill/log_monitor";
import { procedure as iosSimulatorSkillNavigator } from "./sources/ios-simulator-skill/navigator";
import { procedure as iosSimulatorSkillPrivacyManager } from "./sources/ios-simulator-skill/privacy_manager";
import { procedure as iosSimulatorSkillPushNotification } from "./sources/ios-simulator-skill/push_notification";
import { procedure as iosSimulatorSkillScreenMapper } from "./sources/ios-simulator-skill/screen_mapper";
import { procedure as iosSimulatorSkillSimHealthCheck } from "./sources/ios-simulator-skill/sim_health_check";
import { procedure as iosSimulatorSkillSimList } from "./sources/ios-simulator-skill/sim_list";
import { procedure as iosSimulatorSkillSimctlBoot } from "./sources/ios-simulator-skill/simctl_boot";
import { procedure as iosSimulatorSkillSimctlCreate } from "./sources/ios-simulator-skill/simctl_create";
import { procedure as iosSimulatorSkillSimctlDelete } from "./sources/ios-simulator-skill/simctl_delete";
import { procedure as iosSimulatorSkillSimctlErase } from "./sources/ios-simulator-skill/simctl_erase";
import { procedure as iosSimulatorSkillSimctlShutdown } from "./sources/ios-simulator-skill/simctl_shutdown";
import { procedure as iosSimulatorSkillSimulatorSelector } from "./sources/ios-simulator-skill/simulator_selector";
import { procedure as iosSimulatorSkillStatusBar } from "./sources/ios-simulator-skill/status_bar";
import { procedure as iosSimulatorSkillTestRecorder } from "./sources/ios-simulator-skill/test_recorder";
import { procedure as iosSimulatorSkillVisualDiff } from "./sources/ios-simulator-skill/visual_diff";
import { procedure as markitdownBatchConvert } from "./sources/markitdown/batch_convert";
import { procedure as markitdownConvertLiterature } from "./sources/markitdown/convert_literature";
import { procedure as markitdownConvertWithAi } from "./sources/markitdown/convert_with_ai";
import { procedure as mdToPdfKatexRender } from "./sources/md-to-pdf/katex_render";
import { procedure as mdToPdfMdToPdf } from "./sources/md-to-pdf/md_to_pdf";
import { procedure as mdToPdfSetup } from "./sources/md-to-pdf/setup";
import { procedure as modelFirstReasoningValidateModel } from "./sources/model-first-reasoning/validate-model";
import { procedure as modernWebDesignDesignAudit } from "./sources/modern-web-design/design_audit";
import { procedure as modernWebDesignPatternGenerator } from "./sources/modern-web-design/pattern_generator";
import { procedure as pdfCheckBoundingBoxes } from "./sources/pdf/check_bounding_boxes";
import { procedure as pdfCheckFillableFields } from "./sources/pdf/check_fillable_fields";
import { procedure as pdfConvertPdfToImages } from "./sources/pdf/convert_pdf_to_images";
import { procedure as pdfCreateValidationImage } from "./sources/pdf/create_validation_image";
import { procedure as pdfExtractFormFieldInfo } from "./sources/pdf/extract_form_field_info";
import { procedure as pdfExtractFormStructure } from "./sources/pdf/extract_form_structure";
import { procedure as pdfFillFillableFields } from "./sources/pdf/fill_fillable_fields";
import { procedure as pdfFillPdfFormWithAnnotations } from "./sources/pdf/fill_pdf_form_with_annotations";
import { procedure as preLandingReviewCollectDiff } from "./sources/pre-landing-review/collect_diff";
import { procedure as preLandingReviewRenderReport } from "./sources/pre-landing-review/render_report";
import { procedure as prlctlVmControlPrlctlHelper } from "./sources/prlctl-vm-control/prlctl_helper";
import { procedure as promptEngineeringPatternsOptimizePrompt } from "./sources/prompt-engineering-patterns/optimize-prompt";
import { procedure as remoteSshCommandInstallSshpass } from "./sources/remote-ssh-command/install-sshpass";
import { procedure as remoteSshCommandSshExec } from "./sources/remote-ssh-command/ssh-exec";
import { procedure as screenshotEnsureMacosPermissions } from "./sources/screenshot/ensure_macos_permissions";
import { procedure as screenshotMacosDisplayInfo } from "./sources/screenshot/macos_display_info";
import { procedure as screenshotMacosPermissions } from "./sources/screenshot/macos_permissions";
import { procedure as screenshotMacosWindowInfo } from "./sources/screenshot/macos_window_info";
import { procedure as screenshotTakeScreenshot } from "./sources/screenshot/take_screenshot";
import { procedure as screenshotTakeScreenshotWindows } from "./sources/screenshot/take_screenshot_windows";
import { procedure as securityOwnershipMapBuildOwnershipMap } from "./sources/security-ownership-map/build_ownership_map";
import { procedure as securityOwnershipMapCommunityMaintainers } from "./sources/security-ownership-map/community_maintainers";
import { procedure as securityOwnershipMapQueryOwnership } from "./sources/security-ownership-map/query_ownership";
import { procedure as securityOwnershipMapRunOwnershipMap } from "./sources/security-ownership-map/run_ownership_map";
import { procedure as shadcnUiVerifySetup } from "./sources/shadcn-ui/verify-setup";
import { procedure as skillActivationAnalyzerCsoAudit } from "./sources/skill-activation-analyzer/cso_audit";
import { procedure as skillCreatorAggregateBenchmark } from "./sources/skill-creator/aggregate_benchmark";
import { procedure as skillCreatorGenerateReport } from "./sources/skill-creator/generate_report";
import { procedure as skillCreatorGenerateReview } from "./sources/skill-creator/generate_review";
import { procedure as skillCreatorImproveDescription } from "./sources/skill-creator/improve_description";
import { procedure as skillCreatorPackageSkill } from "./sources/skill-creator/package_skill";
import { procedure as skillCreatorQuickValidate } from "./sources/skill-creator/quick_validate";
import { procedure as skillCreatorRunEval } from "./sources/skill-creator/run_eval";
import { procedure as skillCreatorRunLoop } from "./sources/skill-creator/run_loop";
import { procedure as skillsPruneAndSyncReadmeCurateSkills } from "./sources/skills-prune-and-sync-readme/curate_skills";
import { procedure as speckitBaselineBootstrapSpecify } from "./sources/speckit-baseline/bootstrap-specify";
import { procedure as speckitBaselineCheckPrerequisites } from "./sources/speckit-baseline/check-prerequisites";
import { procedure as speckitBaselineCreateNewFeature } from "./sources/speckit-baseline/create-new-feature";
import { procedure as speckitBaselineSetupPlan } from "./sources/speckit-baseline/setup-plan";
import { procedure as typescriptTypeSafetyExtractTsErrors } from "./sources/typescript-type-safety/extract-ts-errors";
import { procedure as uxResearcherDesignerPersonaGenerator } from "./sources/ux-researcher-designer/persona_generator";
import { procedure as webContentFetcherFetch } from "./sources/web-content-fetcher/fetch";
import { procedure as webPerformanceDiagnosisAnalyze } from "./sources/web-performance-diagnosis/analyze";
import { procedure as youtubeAnalysisAnalyzeVideo } from "./sources/youtube-analysis/analyze_video";
import { procedure as youtubeAnalysisFetchTranscript } from "./sources/youtube-analysis/fetch_transcript";
import { procedure as youtubeSearchSearchYoutube } from "./sources/youtube-search/search_youtube";

export {
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
};

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
