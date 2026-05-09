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
    description: "根据 Epic 和容量生成用户故事 Backlog 或 Sprint 计划，输出故事编号、标题、验收标准、INVEST 检查和优先级。",
    owners: { skillIds: ["agile-product-owner"] },
    target: "scripts/user_story_generator.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["sprint", "30"] },});
export const analyticsTrackingTrackingPlanGenerator = defineCliProcedure({
    id: "analytics-tracking-tracking-plan-generator",
    entry: new URL("./sources/analytics-tracking/tracking_plan_generator.ts", import.meta.url),
    description: "根据业务类型、关键页面、转化动作和付费渠道生成事件分类法、GTM 标签配置和 GA4 自定义维度建议。",
    owners: { skillIds: ["analytics-tracking"] },
    target: "scripts/tracking_plan_generator.mjs",
    runtime: "node",
    params: [
      { flag: "--json", type: "", description: "以 JSON 格式输出完整配置，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--json"] },});
export const androidDeviceAutomationAppLauncher = defineCliProcedure({
    id: "android-device-automation-app-launcher",
    entry: new URL("./sources/android-device-automation/app_launcher.ts", import.meta.url),
    description: "控制 Android 应用生命周期：启动、终止、安装、卸载、列出已安装包、查询运行状态。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/app_launcher.mjs",
    runtime: "node",
    params: [
      { flag: "--launch", type: "字符串", description: "要启动的应用包名", required: false },
      { flag: "--activity", type: "字符串", description: "启动指定 Activity（需配合 --launch）", required: false },
      { flag: "--terminate", type: "字符串", description: "强制停止指定应用", required: false },
      { flag: "--install", type: "路径", description: "安装 APK 文件", required: false },
      { flag: "--uninstall", type: "字符串", description: "卸载指定应用", required: false },
      { flag: "--list", type: "", description: "列出所有已安装包", required: false },
      { flag: "--state", type: "字符串", description: "查询应用是否在运行", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
      { flag: "--json", type: "", description: "结构化 JSON 输出（预留）", required: false },
    ],
  
  exampleArgs: { args: ["--launch", "com.example.app"] },});
export const androidDeviceAutomationBuildAndTest = defineCliProcedure({
    id: "android-device-automation-build-and-test",
    entry: new URL("./sources/android-device-automation/build_and_test.ts", import.meta.url),
    description: "构建和测试 Android Gradle 项目：查找 gradlew、执行 Gradle task、收集输出。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/build_and_test.mjs",
    runtime: "node",
    params: [
      { flag: "--task", type: "字符串", description: "要执行的 Gradle task", required: false },
      { flag: "--test", type: "", description: "覆盖为 connectedAndroidTest，传此标志即启用", required: false },
      { flag: "--clean", type: "", description: "执行前先 clean，传此标志即启用", required: false },
      { flag: "--verbose", type: "", description: "显示完整 Gradle 输出，传此标志即启用", required: false },
      { flag: "--json", type: "", description: "结构化 JSON 输出（预留）", required: false },
    ],
  
  exampleArgs: { args: ["--task", "assembleDebug"] },});
export const androidDeviceAutomationDiagnoseApp = defineCliProcedure({
    id: "android-device-automation-diagnose-app",
    entry: new URL("./sources/android-device-automation/diagnose_app.ts", import.meta.url),
    description: "采集 Android 应用诊断包：logcat、dumpsys、截图、UI 层级 XML，输出到指定目录并生成 summary.json。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/diagnose_app.mjs",
    runtime: "node",
    params: [
      { flag: "--package", type: "字符串", description: "要诊断的应用包名（必填）", required: true },
      { flag: "--activity", type: "字符串", description: "启动的 Activity", required: false },
      { flag: "--out", type: "路径", description: "输出目录路径", required: false },
      { flag: "--grep", type: "字符串", description: "仅保留匹配此模式的 logcat 行", required: false },
      { flag: "--tail", type: "数字", description: "logcat 行数窗口", required: false },
      { flag: "--wait-ms", type: "数字", description: "启动后等待时间（毫秒）", required: false },
      { flag: "--force-stop", type: "", description: "启动前强制停止应用，传此标志即启用", required: false },
      { flag: "--no-clear-logcat", type: "", description: "不清除 logcat，传此标志即启用", required: false },
      { flag: "--no-launch", type: "", description: "跳过启动，仅采集当前状态，传此标志即启用", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
    ],
  
  exampleArgs: { args: ["--package", "com.example.app", "--grep", "ERROR"] },});
export const androidDeviceAutomationEmuHealthCheck = defineCliProcedure({
    id: "android-device-automation-emu-health-check",
    entry: new URL("./sources/android-device-automation/emu_health_check.ts", import.meta.url),
    description: "检查 Android 开发环境就绪状态：ANDROID_HOME、ADB、模拟器、Java、已连接设备，逐项输出通过/失败/警告。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/emu_health_check.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const androidDeviceAutomationEmulatorManage = defineCliProcedure({
    id: "android-device-automation-emulator-manage",
    entry: new URL("./sources/android-device-automation/emulator_manage.ts", import.meta.url),
    description: "管理 Android 虚拟设备（AVD）：列出可用 AVD、按名启动、按序列号关闭。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/emulator_manage.mjs",
    runtime: "node",
    params: [
      { flag: "--list", type: "", description: "列出所有可用 AVD", required: false },
      { flag: "--boot", type: "字符串", description: "按名启动 AVD", required: false },
      { flag: "--shutdown", type: "字符串", description: "按序列号关闭模拟器", required: false },
      { flag: "--json", type: "", description: "结构化 JSON 输出（预留）", required: false },
    ],
  
  exampleArgs: { args: ["--list"] },});
export const androidDeviceAutomationGesture = defineCliProcedure({
    id: "android-device-automation-gesture",
    entry: new URL("./sources/android-device-automation/gesture.ts", import.meta.url),
    description: "在 Android 设备上执行滑动/滚动手势：根据屏幕尺寸计算坐标，支持上下左右四个方向。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/gesture.mjs",
    runtime: "node",
    params: [
      { flag: "--swipe", type: "up|down|left|right", description: "滑动方向", required: false },
      { flag: "--scroll", type: "up|down|left|right", description: "滚动方向（与 --swipe 等价）", required: false },
      { flag: "--duration", type: "数字", description: "手势持续时间（毫秒）", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
    ],
  
  exampleArgs: { args: ["--swipe", "up"] },});
export const androidDeviceAutomationKeyboard = defineCliProcedure({
    id: "android-device-automation-keyboard",
    entry: new URL("./sources/android-device-automation/keyboard.ts", import.meta.url),
    description: "向 Android 设备发送按键事件或文本输入：支持命名键（home/back/enter/音量等）和原始键码。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/keyboard.mjs",
    runtime: "node",
    params: [
      { flag: "--key", type: "key-name|keycode", description: "命名键（home/back/enter/delete/power/volume_up/volume_down 等）或数字键码", required: false },
      { flag: "--text", type: "字符串", description: "要输入的文本", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
    ],
  
  exampleArgs: { args: ["--key", "home"] },});
export const androidDeviceAutomationLogMonitor = defineCliProcedure({
    id: "android-device-automation-log-monitor",
    entry: new URL("./sources/android-device-automation/log_monitor.ts", import.meta.url),
    description: "流式输出 Android logcat 日志：支持按包名（自动解析 PID）、tag、优先级和 grep 模式过滤，运行直到 Ctrl+C。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/log_monitor.mjs",
    runtime: "node",
    params: [
      { flag: "--package", type: "字符串", description: "按包名过滤（自动解析 PID）", required: false },
      { flag: "--tag", type: "字符串", description: "按日志 tag 过滤", required: false },
      { flag: "--priority", type: "V|D|I|W|E|F", description: "最低日志优先级", required: false },
      { flag: "--grep", type: "字符串", description: "Node 侧行级 grep 过滤", required: false },
      { flag: "--clear", type: "", description: "启动前清除日志，传此标志即启用", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
    ],
  
  exampleArgs: { args: ["--package", "com.example.app", "--priority", "W"] },});
export const androidDeviceAutomationNavigator = defineCliProcedure({
    id: "android-device-automation-navigator",
    entry: new URL("./sources/android-device-automation/navigator.ts", import.meta.url),
    description: "在 Android 屏幕上查找 UI 元素（按文本/resource-id/类名）并执行点击或文本输入。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/navigator.mjs",
    runtime: "node",
    params: [
      { flag: "--find-text", type: "字符串", description: "按文本或 content-desc 查找元素", required: false },
      { flag: "--find-id", type: "字符串", description: "按 resource-id 子串查找元素", required: false },
      { flag: "--find-class", type: "字符串", description: "按类名子串查找元素", required: false },
      { flag: "--index", type: "数字", description: "多匹配时的元素索引", required: false },
      { flag: "--tap", type: "", description: "点击找到的元素中心，传此标志即启用", required: false },
      { flag: "--enter-text", type: "字符串", description: "向找到的元素输入文本", required: false },
      { flag: "--tap-at", type: "x,y", description: "直接点击屏幕坐标（如 500,800）", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
    ],
  
  exampleArgs: { args: ["--find-text", "Settings", "--tap"] },});
export const androidDeviceAutomationScreenMapper = defineCliProcedure({
    id: "android-device-automation-screen-mapper",
    entry: new URL("./sources/android-device-automation/screen_mapper.ts", import.meta.url),
    description: "转储并解析当前 Android 屏幕 UI 层级：输出按钮、文本字段、可交互元素的分类摘要，支持 JSON 输出。",
    owners: { skillIds: ["android-device-automation"] },
    target: "scripts/screen_mapper.mjs",
    runtime: "node",
    params: [
      { flag: "--json", type: "", description: "输出完整 JSON 分析结果，传此标志即启用", required: false },
      { flag: "--verbose", type: "", description: "详细输出（预留）", required: false },
      { flag: "--serial", type: "字符串", description: "目标设备序列号", required: false },
    ],
  
  exampleArgs: { args: ["--json"] },});
export const appStoreOptimizationAbTestPlanner = defineCliProcedure({
    id: "app-store-optimization-ab-test-planner",
    entry: new URL("./sources/app-store-optimization/ab_test_planner.ts", import.meta.url),
    description: "设计元数据和视觉素材的 A/B 测试方案，包括样本量估算、统计显著性和测试跟踪。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/ab_test_planner.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 testType、variantA、variantB、hypothesis、baselineConversion 的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "ab_test_input.json"] },});
export const appStoreOptimizationAsoScorer = defineCliProcedure({
    id: "app-store-optimization-aso-scorer",
    entry: new URL("./sources/app-store-optimization/aso_scorer.ts", import.meta.url),
    description: "综合评估 ASO 健康分，覆盖元数据质量、评分评论、关键词表现和转化指标四个维度。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/aso_scorer.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 metadata、ratings、keywordPerformance、conversion 的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "aso_score_input.json"] },});
export const appStoreOptimizationCompetitorAnalyzer = defineCliProcedure({
    id: "app-store-optimization-competitor-analyzer",
    entry: new URL("./sources/app-store-optimization/competitor_analyzer.ts", import.meta.url),
    description: "分析竞品 ASO 策略，包括标题、描述、关键词、评分对比和差距识别。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/competitor_analyzer.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 category、competitorsData、platform 的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "competitor_input.json"] },});
export const appStoreOptimizationCollectReleaseChanges = defineCliProcedure({
    id: "app-store-optimization-collect-release-changes",
    entry: new URL("./sources/app-store-optimization/collect_release_changes.ts", import.meta.url),
    description: "从 Git 历史收集最近一个 tag 到当前版本的提交记录和文件改动清单。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/collect_release_changes.mjs",
    runtime: "node",
    params: [
      { flag: "[sinceRef]", type: "字符串", description: "起始 Git 引用（tag/commit），默认最近 tag", required: false },
      { flag: "[untilRef]", type: "字符串", description: "截止 Git 引用，默认 HEAD", required: false },
    ],
  
  exampleArgs: { args: ["v1.0", "HEAD"] },});
export const appStoreOptimizationKeywordAnalyzer = defineCliProcedure({
    id: "app-store-optimization-keyword-analyzer",
    entry: new URL("./sources/app-store-optimization/keyword_analyzer.ts", import.meta.url),
    description: "分析关键词搜索量、竞争度、相关性和长尾机会，为 ASO 关键词策略提供数据支持。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/keyword_analyzer.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 keywordsData 数组的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "keyword_input.json"] },});
export const appStoreOptimizationLaunchChecklist = defineCliProcedure({
    id: "app-store-optimization-launch-checklist",
    entry: new URL("./sources/app-store-optimization/launch_checklist.ts", import.meta.url),
    description: "生成 App Store / Google Play 预发布检查清单、合规校验和上线时间线规划。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/launch_checklist.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 platform、appInfo、launchDate 的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "launch_checklist_input.json"] },});
export const appStoreOptimizationLocalizationHelper = defineCliProcedure({
    id: "app-store-optimization-localization-helper",
    entry: new URL("./sources/app-store-optimization/localization_helper.ts", import.meta.url),
    description: "规划多语言 ASO 策略，包含目标市场推荐、翻译校验、关键词适配和 ROI 分析。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/localization_helper.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 currentMarket、budgetLevel、monthlyDownloads 的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "localization_input.json"] },});
export const appStoreOptimizationMetadataOptimizer = defineCliProcedure({
    id: "app-store-optimization-metadata-optimizer",
    entry: new URL("./sources/app-store-optimization/metadata_optimizer.ts", import.meta.url),
    description: "优化 App Store / Google Play 元数据：标题、描述、关键词字段，支持平台字符限制校验。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/metadata_optimizer.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 platform、appInfo、targetKeywords 的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "metadata_input.json"] },});
export const appStoreOptimizationReviewAnalyzer = defineCliProcedure({
    id: "app-store-optimization-review-analyzer",
    entry: new URL("./sources/app-store-optimization/review_analyzer.ts", import.meta.url),
    description: "分析用户评论情感、常见主题、问题分类、功能请求和情感趋势。",
    owners: { skillIds: ["app-store-optimization"] },
    target: "scripts/review_analyzer.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "包含 appName、reviews 数组的 JSON 输入文件", required: false },
    ],
  
  exampleArgs: { args: ["--input", "review_input.json"] },});
export const architectureReviewerScanCodebase = defineCliProcedure({
    id: "architecture-reviewer-scan-codebase",
    entry: new URL("./sources/architecture-reviewer/scan_codebase.ts", import.meta.url),
    description: "扫描指定代码库目录，生成结构指纹、架构指标、基础设施文件、安全信号和文档完备性报告。",
    owners: { skillIds: ["architecture-reviewer"] },
    target: "scripts/scan_codebase.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["."] },});
export const baoyuCompressImageMain = defineCliProcedure({
    id: "baoyu-compress-image-main",
    entry: new URL("./sources/baoyu-compress-image/main.ts", import.meta.url),
    description: "压缩图片或批量转换图片格式：支持 webp/png/jpeg 输出，自动选择系统工具或 sharp 后端。",
    owners: { skillIds: ["baoyu-compress-image"] },
    target: "scripts/main.mjs",
    runtime: "node",
    params: [
      { flag: "--output", type: "路径", description: "输出文件路径（仅单文件输入可用）", required: false },
      { flag: "--format", type: "webp|png|jpeg", description: "输出格式（默认 webp）", required: false },
      { flag: "--quality", type: "数字", description: "压缩质量（默认 80）", required: false },
      { flag: "--keep", type: "", description: "保留原始文件", required: false },
      { flag: "--recursive", type: "", description: "递归处理子目录", required: false },
      { flag: "--json", type: "", description: "JSON 格式输出，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["input.png", "--format", "webp", "--quality", "80"] },});
export const canvasDesignBaoyuArticleIllustratorBuildBatch = defineCliProcedure({
    id: "canvas-design-baoyu-article-illustrator-build-batch",
    entry: new URL("./sources/canvas-design/baoyu-article-illustrator-build-batch.ts", import.meta.url),
    description: "从文章大纲 markdown 和提示词目录批量生成文章插图 baoyu-imagine 任务配置文件。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/baoyu-article-illustrator-build-batch.mjs",
    runtime: "node",
    params: [
      { flag: "--outline", type: "路径", description: "大纲 markdown 文件路径", required: true },
      { flag: "--prompts", type: "路径", description: "提示词目录路径", required: true },
      { flag: "--output", type: "路径", description: "输出 batch.json 路径", required: true },
      { flag: "--images-dir", type: "路径", description: "生成图片的输出目录", required: false },
      { flag: "--provider", type: "字符串", description: "baoyu-imagine 任务提供商（默认 replicate）", required: false },
      { flag: "--model", type: "字符串", description: "baoyu-imagine 任务模型（默认 google/nano-banana-pro）", required: false },
      { flag: "--ar", type: "数字", description: "图片宽高比（默认 16:9）", required: false },
      { flag: "--quality", type: "数字", description: "图片质量（默认 2k）", required: false },
      { flag: "--jobs", type: "数字", description: "推荐 worker 数量", required: false },
    ],
  
  exampleArgs: { args: ["--outline", "outline.md", "--prompts", "prompts", "--output", "batch.json", "--images-dir", "attachments"] },});
export const canvasDesignConceptToImageRenderToImage = defineCliProcedure({
    id: "canvas-design-concept-to-image-render-to-image",
    entry: new URL("./sources/canvas-design/concept-to-image-render_to_image.ts", import.meta.url),
    description: "使用 Playwright 将 HTML 文件渲染为 PNG 截图或矢量 SVG 文件，支持自定义视口尺寸、缩放和 CSS 选择器。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-image-render_to_image.mjs",
    runtime: "node",
    params: [
      { flag: "--width", type: "数字", description: "视口宽度（默认 1920）", required: false },
      { flag: "--height", type: "数字", description: "视口高度（默认 1080）", required: false },
      { flag: "--scale", type: "数字", description: "PNG 设备缩放因子（默认 2）", required: false },
      { flag: "--selector", type: "字符串", description: "目标元素 CSS 选择器（默认 .canvas）", required: false },
      { flag: "--full-page", type: "", description: "截图整页而非元素（PNG only，布尔标志）", required: false },
    ],
  
  exampleArgs: { args: ["input.html", "output.png", "--width", "1920", "--height", "1080", "--scale", "2"] },});
export const canvasDesignConceptToVideoAddAudio = defineCliProcedure({
    id: "canvas-design-concept-to-video-add-audio",
    entry: new URL("./sources/canvas-design/concept-to-video-add_audio.ts", import.meta.url),
    description: "使用 ffmpeg 为 Manim 渲染视频叠加音频轨道，支持音量调节、淡入淡出和音频裁剪。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-video-add_audio.mjs",
    runtime: "node",
    params: [
      { flag: "--output", type: "路径", description: "输出视频文件路径", required: true },
      { flag: "--volume", type: "数字", description: "音频音量倍率（默认 1.0）", required: false },
      { flag: "--fade-in", type: "数字", description: "淡入时长（秒）", required: false },
      { flag: "--fade-out", type: "数字", description: "淡出时长（秒）", required: false },
      { flag: "--trim-to-video", type: "", description: "裁剪音频以匹配视频长度，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["video.mp4", "audio.mp3", "--output", "final.mp4", "--volume", "0.8", "--fade-in", "1", "--trim-to-video"] },});
export const canvasDesignConceptToVideoRenderVideo = defineCliProcedure({
    id: "canvas-design-concept-to-video-render-video",
    entry: new URL("./sources/canvas-design/concept-to-video-render_video.ts", import.meta.url),
    description: "使用 Manim 渲染 Python 场景文件为视频（mp4/gif/webm），支持质量预设和自定义输出路径。",
    owners: { skillIds: ["canvas-design"] },
    target: "scripts/concept-to-video-render_video.mjs",
    runtime: "node",
    params: [
      { flag: "--quality", type: "low|medium|high|4k", description: "渲染质量预设（默认 high）", required: false },
      { flag: "--format", type: "mp4|gif|webm", description: "输出格式（默认 mp4）", required: false },
      { flag: "--output", type: "路径", description: "输出文件路径", required: false },
      { flag: "--media-dir", type: "路径", description: "Manim 媒体输出目录", required: false },
    ],
  
  exampleArgs: { args: ["scene.py", "MyScene", "--quality", "high", "--format", "mp4"] },});
export const codeReviewAssessCode = defineCliProcedure({
    id: "code-review-assess-code",
    entry: new URL("./sources/code-review/assess-code.ts", import.meta.url),
    description: "对指定文件或目录执行粗暴诚实代码评估（Linus 模式），检查正确性、性能、错误处理、并发、可测试性和可维护性。",
    owners: { skillIds: ["code-review"] },
    target: "scripts/assess-code.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["src/"] },});
export const codeReviewAssessTests = defineCliProcedure({
    id: "code-review-assess-tests",
    entry: new URL("./sources/code-review/assess-tests.ts", import.meta.url),
    description: "对指定测试目录执行粗暴诚实测试评估（Ramsay 模式），检查覆盖率、边界用例、可读性、速度、稳定性和隔离性。",
    owners: { skillIds: ["code-review"] },
    target: "scripts/assess-tests.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["tests/"] },});
export const complexityReducerComplexityReport = defineCliProcedure({
    id: "complexity-reducer-complexity-report",
    entry: new URL("./sources/complexity-reducer/complexity_report.ts", import.meta.url),
    description: "分析指定文件或目录中代码的认知复杂度：函数级嵌套深度、分支数、参数数和认知复杂度评分，支持 JSON 或 Markdown 输出。",
    owners: { skillIds: ["complexity-reducer"] },
    target: "scripts/complexity_report.mjs",
    runtime: "node",
    params: [
      { flag: "--format", type: "json|markdown", description: "输出格式（默认 json）", required: false },
      { flag: "[target]", type: "路径", description: "要分析的代码文件或目录（必填）", required: true },
    ],
  
  exampleArgs: { args: ["src/", "--format", "json"] },});
export const copywritingContentFilter = defineCliProcedure({
    id: "copywriting-content-filter",
    entry: new URL("./sources/copywriting/content_filter.ts", import.meta.url),
    description: "检测营销文案中的广告词、危险指令、操纵性语言和自定义黑名单内容，返回风险评分与屏蔽建议。",
    owners: { skillIds: ["copywriting"] },
    target: "scripts/content_filter.mjs",
    runtime: "node",
    params: [
      { flag: "--platform", type: "字符串", description: "目标平台名称（默认 social-platform）", required: false },
      { flag: "--text", type: "字符串", description: "待检测文案内容", required: false },
      { flag: "--input-file", type: "路径", description: "从文件读取待检测内容", required: false },
      { flag: "--blocklist", type: "路径", description: "自定义黑名单文件路径", required: false },
      { flag: "--json", type: "", description: "JSON 格式输出，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--text", "这是一段待检测文案", "--platform", "social-platform"] },});
export const dataAnalysisAnalyze = defineCliProcedure({
    id: "data-analysis-analyze",
    entry: new URL("./sources/data-analysis/analyze.ts", import.meta.url),
    description: "加载 CSV/XLSX 文件为内存表，支持 inspect 表结构、SQL 查询、统计汇总和导出为 CSV/JSON/MD。",
    owners: { skillIds: ["data-analysis"] },
    target: "scripts/analyze.mjs",
    runtime: "node",
    params: [
      { flag: "--files", type: "路径", description: "要加载的 CSV/XLSX 文件路径（支持多个）", required: true },
      { flag: "--action", type: "inspect|query|summary", description: "执行动作：inspect 查看结构、query SQL 查询、summary 统计汇总", required: true },
      { flag: "--sql", type: "字符串", description: "SQL 查询语句（action=query 时必填）", required: false },
      { flag: "--table", type: "字符串", description: "目标表名（action=summary 时必填）", required: false },
      { flag: "--output-file", type: "路径", description: "导出结果文件路径（仅 .csv/.json/.md）", required: false },
    ],
  
  exampleArgs: { args: ["--files", "data.csv", "--action", "inspect"] },});
export const debugMethodologyDebugChecklist = defineCliProcedure({
    id: "debug-methodology-debug-checklist",
    entry: new URL("./sources/debug-methodology/debug-checklist.ts", import.meta.url),
    description: "根据问题标题生成六步调试检查清单骨架。",
    owners: { skillIds: ["debug-methodology"] },
    params: [
      { flag: "--title", type: "字符串", description: "问题标题", required: false },
      { flag: "--symptom", type: "字符串", description: "问题现象描述", required: false },
    ],
    output: defineProcedureOutput<RuntimeProcedureResult>({
      typeName: "MarkdownChecklist",
      fields: runtimeProcedureOutput.fields,
    }),
  
  exampleArgs: { args: ["--title", "fixture-checklist"] },});
export const financialAnalystBudgetVarianceAnalyzer = defineCliProcedure({
    id: "financial-analyst-budget-variance-analyzer",
    entry: new URL("./sources/financial-analyst/budget_variance_analyzer.ts", import.meta.url),
    description: "分析实际 vs 预算 vs 上年同期偏差，按重要性阈值过滤、有利/不利分类，支持部门/类别明细汇总。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/budget_variance_analyzer.mjs",
    runtime: "node",
    params: [
      { flag: "--format", type: "text|json", description: "输出格式（默认 text）", required: false },
      { flag: "--threshold-pct", type: "数字", description: "重要性阈值百分比（默认 10.0）", required: false },
      { flag: "--threshold-amt", type: "数字", description: "重要性阈值金额（默认 50000.0）", required: false },
      { flag: "[input-file]", type: "路径", description: "包含 actual/budget/prior 数据的 JSON 输入文件（必填）", required: true },
    ],
  
  exampleArgs: { args: ["assets/budget_variance_sample.json", "--threshold-pct", "5", "--threshold-amt", "25000"] },});
export const financialAnalystDcfValuation = defineCliProcedure({
    id: "financial-analyst-dcf-valuation",
    entry: new URL("./sources/financial-analyst/dcf_valuation.ts", import.meta.url),
    description: "折现现金流企业价值与股权价值估值，含 WACC 计算、终值估算和双变量敏感性分析。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/dcf_valuation.mjs",
    runtime: "node",
    params: [
      { flag: "--format", type: "text|json", description: "输出格式（默认 text）", required: false },
      { flag: "--projection-years", type: "数字", description: "预测年数（默认从输入 assumptions.projection_years 读取，否则 5）", required: false },
    ],
  
  exampleArgs: { args: ["assets/dcf_valuation_sample.json", "--projection-years", "7"] },});
export const financialAnalystForecastBuilder = defineCliProcedure({
    id: "financial-analyst-forecast-builder",
    entry: new URL("./sources/financial-analyst/forecast_builder.ts", import.meta.url),
    description: "驱动因子驱动收入预测与 13 周滚动现金流预测，支持多情景建模和线性回归趋势分析。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/forecast_builder.mjs",
    runtime: "node",
    params: [
      { flag: "--format", type: "text|json", description: "输出格式（默认 text）", required: false },
      { flag: "--scenarios", type: "字符串", description: "情景列表，如 base,bull,bear（默认 base,bull,bear）", required: false },
    ],
  
  exampleArgs: { args: ["assets/forecast_sample.json", "--scenarios", "base,bull,bear"] },});
export const financialAnalystRatioCalculator = defineCliProcedure({
    id: "financial-analyst-ratio-calculator",
    entry: new URL("./sources/financial-analyst/ratio_calculator.ts", import.meta.url),
    description: "计算并解读五大类财务比率：盈利能力、流动性、杠杆、效率和估值，含同业基准评分。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/ratio_calculator.mjs",
    runtime: "node",
    params: [
      { flag: "--format", type: "text|json", description: "输出格式（默认 text）", required: false },
      { flag: "--category", type: "profitability|liquidity|leverage|efficiency|valuation", description: "限定计算单一类别比率", required: false },
    ],
  
  exampleArgs: { args: ["assets/ratio_analysis_sample.json", "--category", "profitability"] },});
export const financialAnalystRatioInputValidation = defineCliProcedure({
    id: "financial-analyst-ratio-input-validation",
    entry: new URL("./sources/financial-analyst/ratio_input_validation.ts", import.meta.url),
    description: "校验财务比率计算所需的输入字段完整性，确保 income_statement/balance_sheet/cash_flow/market_data 中必要字段存在且为有限数值。",
    owners: { skillIds: ["financial-analyst"] },
    target: "scripts/ratio_input_validation.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "输入 JSON 文件路径（也可通过 AI_EXPERTS_PROCEDURE_REQUEST_JSON 环境变量传入）", required: false },
      { flag: "--category", type: "profitability|liquidity|leverage|efficiency|valuation", description: "指定校验单一类别的字段", required: false },
    ],
  
  exampleArgs: { args: ["--input", "assets/ratio_analysis_sample.json", "--category", "profitability"] },});
export const ghFixCiInspectPrChecks = defineCliProcedure({
    id: "gh-fix-ci-inspect-pr-checks",
    entry: new URL("./sources/gh-fix-ci/inspect_pr_checks.ts", import.meta.url),
    description: "检查指定 GitHub PR 的 CI 检查状态，提取失败检查的日志片段和运行元数据，支持 JSON 输出。",
    owners: { skillIds: ["gh-fix-ci"] },
    target: "scripts/inspect_pr_checks.mjs",
    runtime: "node",
    params: [
      { flag: "--repo", type: "路径", description: "Git 仓库路径（默认 .）", required: false },
      { flag: "--pr", type: "数字", description: "PR 编号（默认从当前分支检测）", required: false },
      { flag: "--max-lines", type: "数字", description: "最大输出行数（默认 160）", required: false },
      { flag: "--context", type: "数字", description: "失败标记上下文行数（默认 30）", required: false },
      { flag: "--json", type: "", description: "JSON 格式输出，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--pr", "123", "--max-lines", "160"] },});
export const helmChartScaffoldingValidateChart = defineCliProcedure({
    id: "helm-chart-scaffolding-validate-chart",
    entry: new URL("./sources/helm-chart-scaffolding/validate-chart.ts", import.meta.url),
    description: "校验 Helm Chart 的目录结构、Chart.yaml 元数据、模板渲染和 dry-run 安装，涵盖安全最佳实践和资源定义检查。",
    owners: { skillIds: ["helm-chart-scaffolding"] },
    target: "scripts/validate-chart.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["."] },});
export const i18nLocalizationI18nChecker = defineCliProcedure({
    id: "i18n-localization-i18n-checker",
    entry: new URL("./sources/i18n-localization/i18n_checker.ts", import.meta.url),
    description: "扫描项目源码中的硬编码文案、检查 locale 翻译文件完整性和跨语言键一致性，发现缺失翻译和冗余键。",
    owners: { skillIds: ["i18n-localization"] },
    target: "scripts/i18n_checker.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["."] },});
export const iconRetrievalSearch = defineCliProcedure({
    id: "icon-retrieval-search",
    entry: new URL("./sources/icon-retrieval/search.ts", import.meta.url),
    description: "根据搜索词从远程 API 检索 SVG 图标，返回包含 SVG 原始内容的候选列表。",
    owners: { skillIds: ["icon-retrieval"] },
    target: "scripts/search.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["security shield", "3"] },});
export const iosSimulatorSkillAccessibilityAudit = defineCliProcedure({
    id: "ios-simulator-skill-accessibility-audit",
    entry: new URL("./sources/ios-simulator-skill/accessibility_audit.ts", import.meta.url),
    description: "审计 iOS 模拟器屏幕无障碍性：扫描交互元素缺失标签、提示和标识符，输出严重度分级的发现问题。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/accessibility_audit.mjs",
    runtime: "node",
    params: [
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
      { flag: "--output", type: "路径", description: "将 JSON 报告保存到文件", required: false },
      { flag: "--verbose", type: "", description: "包含所有问题详情，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--udid", "<device-udid>", "--verbose"] },});
export const iosSimulatorSkillAppLauncher = defineCliProcedure({
    id: "ios-simulator-skill-app-launcher",
    entry: new URL("./sources/ios-simulator-skill/app_launcher.ts", import.meta.url),
    description: "控制 iOS 应用生命周期：启动、终止、重启、安装、卸载、打开 URL、列出已安装应用、查询运行状态。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/app_launcher.mjs",
    runtime: "node",
    params: [
      { flag: "--launch", type: "字符串", description: "要启动的应用 bundle ID", required: false },
      { flag: "--terminate", type: "字符串", description: "强制终止指定应用", required: false },
      { flag: "--restart", type: "字符串", description: "重新启动指定应用", required: false },
      { flag: "--install", type: "路径", description: "安装 .app 包", required: false },
      { flag: "--uninstall", type: "字符串", description: "卸载指定应用", required: false },
      { flag: "--open-url", type: "字符串", description: "在模拟器中打开 URL", required: false },
      { flag: "--list", type: "", description: "列出所有已安装应用", required: false },
      { flag: "--state", type: "字符串", description: "查询应用运行状态", required: false },
      { flag: "--wait-for-debugger", type: "", description: "启动时等待调试器附加，传此标志即启用", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--launch", "com.example.app"] },});
export const iosSimulatorSkillAppStateCapture = defineCliProcedure({
    id: "ios-simulator-skill-app-state-capture",
    entry: new URL("./sources/ios-simulator-skill/app_state_capture.ts", import.meta.url),
    description: "采集 iOS 模拟器应用全状态：截图、无障碍树、应用日志和设备信息，输出到指定目录并生成 summary。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/app_state_capture.mjs",
    runtime: "node",
    params: [
      { flag: "--app-bundle-id", type: "字符串", description: "应用 bundle ID，用于日志过滤", required: false },
      { flag: "--output", type: "路径", description: "输出目录路径", required: false },
      { flag: "--log-lines", type: "数字", description: "要捕获的日志行数", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
      { flag: "--inline", type: "", description: "以 base64 返回截图，传此标志即启用", required: false },
      { flag: "--size", type: "字符串", description: "截图尺寸：full, half, quarter, thumb", required: false },
      { flag: "--app-name", type: "字符串", description: "应用名称，用于语义化截图命名", required: false },
    ],
  
  exampleArgs: { args: ["--app-bundle-id", "com.example.app", "--output", "./state-capture"] },});
export const iosSimulatorSkillBuildAndTest = defineCliProcedure({
    id: "ios-simulator-skill-build-and-test",
    entry: new URL("./sources/ios-simulator-skill/build_and_test.ts", import.meta.url),
    description: "构建和测试 Xcode 项目：自动查找 xcodeproj/workspace、执行构建/测试 task、通过 xcresult 渐进式披露错误详情。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/build_and_test.mjs",
    runtime: "node",
    params: [
      { flag: "--project", type: "路径", description: ".xcodeproj 文件路径", required: false },
      { flag: "--workspace", type: "路径", description: ".xcworkspace 文件路径", required: false },
      { flag: "--scheme", type: "字符串", description: "构建 scheme（自动检测）", required: false },
      { flag: "--configuration", type: "字符串", description: "构建配置（默认 Debug）", required: false },
      { flag: "--simulator", type: "字符串", description: "模拟器名称", required: false },
      { flag: "--clean", type: "", description: "构建前先 clean，传此标志即启用", required: false },
      { flag: "--test", type: "", description: "运行测试", required: false },
      { flag: "--suite", type: "字符串", description: "指定测试套件", required: false },
      { flag: "--get-errors", type: "字符串", description: "从 xcresult 获取错误详情", required: false },
      { flag: "--get-warnings", type: "字符串", description: "从 xcresult 获取警告详情", required: false },
      { flag: "--get-log", type: "字符串", description: "从 xcresult 获取构建日志", required: false },
      { flag: "--get-all", type: "字符串", description: "从 xcresult 获取全部详情", required: false },
      { flag: "--list-xcresults", type: "", description: "列出最近的 xcresult 包", required: false },
      { flag: "--verbose", type: "", description: "显示详细输出，传此标志即启用", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--project", "MyApp.xcodeproj", "--test"] },});
export const iosSimulatorSkillClipboard = defineCliProcedure({
    id: "ios-simulator-skill-clipboard",
    entry: new URL("./sources/ios-simulator-skill/clipboard.ts", import.meta.url),
    description: "向 iOS 模拟器剪贴板写入文本，支持测试场景追踪和期望行为标记。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/clipboard.mjs",
    runtime: "node",
    params: [
      { flag: "--copy", type: "字符串", description: "要复制到剪贴板的文本（必填）", required: true },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
      { flag: "--test-name", type: "字符串", description: "测试场景名称用于追踪", required: false },
      { flag: "--expected", type: "字符串", description: "粘贴后的预期行为", required: false },
    ],
  
  exampleArgs: { args: ["--copy", "test@example.com"] },});
export const iosSimulatorSkillGesture = defineCliProcedure({
    id: "ios-simulator-skill-gesture",
    entry: new URL("./sources/ios-simulator-skill/gesture.ts", import.meta.url),
    description: "在 iOS 模拟器上执行手势操作：滑动、滚动、长按、捏合和下拉刷新，支持截图坐标转换。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/gesture.mjs",
    runtime: "node",
    params: [
      { flag: "--swipe", type: "up|down|left|right", description: "滑动方向", required: false },
      { flag: "--swipe-from", type: "x,y", description: "自定义滑动起点坐标", required: false },
      { flag: "--swipe-to", type: "x,y", description: "自定义滑动终点坐标", required: false },
      { flag: "--scroll", type: "up|down", description: "滚动方向", required: false },
      { flag: "--scroll-amount", type: "数字", description: "滚动次数（默认 3）", required: false },
      { flag: "--long-press", type: "x,y", description: "长按坐标", required: false },
      { flag: "--duration", type: "数字", description: "长按持续时间（默认 2.0）", required: false },
      { flag: "--pinch", type: "in|out", description: "捏合手势方向", required: false },
      { flag: "--refresh", type: "", description: "执行下拉刷新，传此标志即启用", required: false },
      { flag: "--screenshot-coords", type: "", description: "将坐标解释为截图坐标，传此标志即启用", required: false },
      { flag: "--screenshot-width", type: "数字", description: "截图宽度", required: false },
      { flag: "--screenshot-height", type: "数字", description: "截图高度", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--swipe", "up"] },});
export const iosSimulatorSkillKeyboard = defineCliProcedure({
    id: "ios-simulator-skill-keyboard",
    entry: new URL("./sources/ios-simulator-skill/keyboard.ts", import.meta.url),
    description: "向 iOS 模拟器发送按键事件和文本输入：支持命名键、组合键、硬件按钮、清除文本和关闭键盘。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/keyboard.mjs",
    runtime: "node",
    params: [
      { flag: "--type", type: "字符串", description: "向当前焦点输入文本", required: false },
      { flag: "--slow", type: "", description: "逐字符慢速输入，传此标志即启用", required: false },
      { flag: "--key", type: "字符串", description: "发送特殊键（return/delete/tab/space/方向键等）", required: false },
      { flag: "--key-sequence", type: "字符串", description: "发送逗号分隔的按键序列", required: false },
      { flag: "--count", type: "数字", description: "按键次数（默认 1）", required: false },
      { flag: "--button", type: "字符串", description: "按下硬件按钮（home/lock/volume-up/volume-down/power/screenshot）", required: false },
      { flag: "--clear", type: "", description: "清除当前文本字段，传此标志即启用", required: false },
      { flag: "--dismiss", type: "", description: "关闭键盘", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--key", "home"] },});
export const iosSimulatorSkillLogMonitor = defineCliProcedure({
    id: "ios-simulator-skill-log-monitor",
    entry: new URL("./sources/ios-simulator-skill/log_monitor.ts", import.meta.url),
    description: "监控 iOS 模拟器日志流：按应用 bundle ID 过滤、分级收集错误/警告/信息、支持 follow 模式和持续时间限制。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/log_monitor.mjs",
    runtime: "node",
    params: [
      { flag: "--app", type: "字符串", description: "按应用 bundle ID 过滤日志", required: false },
      { flag: "--device-udid", type: "字符串", description: "目标设备 UDID（默认 booted）", required: false },
      { flag: "--severity", type: "数字", description: "逗号分隔的严重级别（error,warning,info,debug）", required: false },
      { flag: "--follow", type: "", description: "持续跟随模式，传此标志即启用", required: false },
      { flag: "--duration", type: "数字", description: "捕获持续时间（如 30s、5m、1h）", required: false },
      { flag: "--last", type: "数字", description: "显示最近指定时长的日志", required: false },
      { flag: "--output", type: "路径", description: "输出目录路径", required: false },
      { flag: "--verbose", type: "", description: "显示详细输出，传此标志即启用", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--app", "com.example.app", "--duration", "30s"] },});
export const iosSimulatorSkillNavigator = defineCliProcedure({
    id: "ios-simulator-skill-navigator",
    entry: new URL("./sources/ios-simulator-skill/navigator.ts", import.meta.url),
    description: "基于无障碍树导航 iOS 应用界面：按文本、类型或标识符查找元素，支持点击和文本输入。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/navigator.mjs",
    runtime: "node",
    params: [
      { flag: "--find-text", type: "字符串", description: "按文本模糊匹配查找元素", required: false },
      { flag: "--find-exact", type: "字符串", description: "按精确文本查找元素", required: false },
      { flag: "--find-type", type: "字符串", description: "元素类型（Button/TextField/Link 等）", required: false },
      { flag: "--find-id", type: "字符串", description: "无障碍标识符", required: false },
      { flag: "--index", type: "数字", description: "多匹配时的元素索引（默认 0）", required: false },
      { flag: "--tap", type: "", description: "点击找到的元素，传此标志即启用", required: false },
      { flag: "--tap-at", type: "x,y", description: "直接点击屏幕坐标", required: false },
      { flag: "--enter-text", type: "字符串", description: "向找到的 TextField 输入文本", required: false },
      { flag: "--screenshot-coords", type: "", description: "将点击坐标解释为截图坐标，传此标志即启用", required: false },
      { flag: "--screenshot-width", type: "数字", description: "截图宽度", required: false },
      { flag: "--screenshot-height", type: "数字", description: "截图高度", required: false },
      { flag: "--list", type: "", description: "列出当前屏幕上的可点击元素", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--find-text", "Settings", "--tap"] },});
export const iosSimulatorSkillPrivacyManager = defineCliProcedure({
    id: "ios-simulator-skill-privacy-manager",
    entry: new URL("./sources/ios-simulator-skill/privacy_manager.ts", import.meta.url),
    description: "管理 iOS 模拟器应用隐私权限：授予、撤销或重置相机、麦克风、位置、通讯录等系统服务权限。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/privacy_manager.mjs",
    runtime: "node",
    params: [
      { flag: "--bundle-id", type: "字符串", description: "应用 bundle ID（必填）", required: true },
      { flag: "--grant", type: "字符串", description: "授予逗号分隔的服务权限", required: false },
      { flag: "--revoke", type: "字符串", description: "撤销逗号分隔的服务权限", required: false },
      { flag: "--reset", type: "字符串", description: "重置逗号分隔的服务权限", required: false },
      { flag: "--list", type: "", description: "列出支持的服务权限", required: false },
      { flag: "--scenario", type: "字符串", description: "测试场景名称", required: false },
      { flag: "--step", type: "数字", description: "步骤编号", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--bundle-id", "com.example.app", "--grant", "camera"] },});
export const iosSimulatorSkillPushNotification = defineCliProcedure({
    id: "ios-simulator-skill-push-notification",
    entry: new URL("./sources/ios-simulator-skill/push_notification.ts", import.meta.url),
    description: "向 iOS 模拟器发送模拟推送通知：支持简单标题/正文/角标和自定义 JSON payload。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/push_notification.mjs",
    runtime: "node",
    params: [
      { flag: "--bundle-id", type: "字符串", description: "目标应用 bundle ID（必填）", required: true },
      { flag: "--title", type: "字符串", description: "通知标题", required: false },
      { flag: "--body", type: "字符串", description: "通知正文", required: false },
      { flag: "--badge", type: "数字", description: "角标数字", required: false },
      { flag: "--no-sound", type: "", description: "不播放通知声音", required: false },
      { flag: "--payload", type: "字符串", description: "自定义 JSON payload 文件路径或内联 JSON", required: false },
      { flag: "--test-name", type: "字符串", description: "测试场景名称", required: false },
      { flag: "--expected", type: "字符串", description: "通知发送后的预期行为", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--bundle-id", "com.example.app", "--title", "Hello", "--body", "Test"] },});
export const iosSimulatorSkillScreenMapper = defineCliProcedure({
    id: "ios-simulator-skill-screen-mapper",
    entry: new URL("./sources/ios-simulator-skill/screen_mapper.ts", import.meta.url),
    description: "分析 iOS 模拟器当前屏幕 UI 层级：按类型统计可交互元素，支持详细分类和导航提示。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/screen_mapper.mjs",
    runtime: "node",
    params: [
      { flag: "--verbose", type: "", description: "显示详细元素分类，传此标志即启用", required: false },
      { flag: "--json", type: "", description: "输出原始 JSON 分析结果，传此标志即启用", required: false },
      { flag: "--hints", type: "", description: "包含导航提示，传此标志即启用", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--json"] },});
export const iosSimulatorSkillSimHealthCheck = defineCliProcedure({
    id: "ios-simulator-skill-sim-health-check",
    entry: new URL("./sources/ios-simulator-skill/sim_health_check.ts", import.meta.url),
    description: "检查 iOS 模拟器开发环境就绪状态：Xcode CLT、simctl、IDB、Node.js、可用模拟器和已启动设备。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/sim_health_check.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const iosSimulatorSkillSimList = defineCliProcedure({
    id: "ios-simulator-skill-sim-list",
    entry: new URL("./sources/ios-simulator-skill/sim_list.ts", import.meta.url),
    description: "列出 iOS 模拟器列表并渐进式披露详情：概要统计、推荐型号、按类型/runtime 过滤和缓存管理。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/sim_list.mjs",
    runtime: "node",
    params: [
      { flag: "--get-details", type: "字符串", description: "从缓存中获取完整模拟器列表", required: false },
      { flag: "--suggest", type: "", description: "获取模拟器推荐，传此标志即启用", required: false },
      { flag: "--device-type", type: "字符串", description: "按设备类型过滤", required: false },
      { flag: "--runtime", type: "字符串", description: "按 iOS 版本过滤", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--suggest"] },});
export const iosSimulatorSkillSimctlBoot = defineCliProcedure({
    id: "ios-simulator-skill-simctl-boot",
    entry: new URL("./sources/ios-simulator-skill/simctl_boot.ts", import.meta.url),
    description: "启动 iOS 模拟器：支持单设备启动、全部启动、按类型启动，并可等待完全就绪。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_boot.mjs",
    runtime: "node",
    params: [
      { flag: "--udid", type: "字符串", description: "设备 UDID 或名称", required: false },
      { flag: "--name", type: "字符串", description: "设备名称", required: false },
      { flag: "--wait-ready", type: "", description: "等待设备完全就绪，传此标志即启用", required: false },
      { flag: "--timeout", type: "数字", description: "等候就绪超时秒数（默认 120）", required: false },
      { flag: "--all", type: "", description: "启动所有可用模拟器，传此标志即启用", required: false },
      { flag: "--type", type: "字符串", description: "启动指定类型的所有模拟器", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--udid", "booted"] },});
export const iosSimulatorSkillSimctlCreate = defineCliProcedure({
    id: "ios-simulator-skill-simctl-create",
    entry: new URL("./sources/ios-simulator-skill/simctl_create.ts", import.meta.url),
    description: "动态创建 iOS 模拟器：选择设备类型和 iOS 版本，支持列出可用设备类型和 runtime。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_create.mjs",
    runtime: "node",
    params: [
      { flag: "--device", type: "字符串", description: "设备类型（如 iPhone 16 Pro）", required: false },
      { flag: "--runtime", type: "字符串", description: "iOS 版本（默认最新）", required: false },
      { flag: "--name", type: "字符串", description: "自定义模拟器名称", required: false },
      { flag: "--list-devices", type: "", description: "列出可用设备类型", required: false },
      { flag: "--list-runtimes", type: "", description: "列出可用 iOS runtime", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--device", "iPhone 16 Pro", "--runtime", "18.0"] },});
export const iosSimulatorSkillSimctlDelete = defineCliProcedure({
    id: "ios-simulator-skill-simctl-delete",
    entry: new URL("./sources/ios-simulator-skill/simctl_delete.ts", import.meta.url),
    description: "永久删除 iOS 模拟器：支持单设备删除、全部删除、按类型删除和清理旧版本。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_delete.mjs",
    runtime: "node",
    params: [
      { flag: "--udid", type: "字符串", description: "设备 UDID 或名称", required: false },
      { flag: "--name", type: "字符串", description: "设备名称", required: false },
      { flag: "--yes", type: "", description: "跳过确认提示，传此标志即启用", required: false },
      { flag: "--all", type: "", description: "删除所有模拟器", required: false },
      { flag: "--type", type: "字符串", description: "删除指定类型的所有模拟器", required: false },
      { flag: "--old", type: "数字", description: "每种类型保留 N 个最新，删除其余", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--old", "3"] },});
export const iosSimulatorSkillSimctlErase = defineCliProcedure({
    id: "ios-simulator-skill-simctl-erase",
    entry: new URL("./sources/ios-simulator-skill/simctl_erase.ts", import.meta.url),
    description: "擦除 iOS 模拟器（恢复出厂设置）：支持单设备擦除、全部擦除、按类型擦除和已启动设备擦除。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_erase.mjs",
    runtime: "node",
    params: [
      { flag: "--udid", type: "字符串", description: "设备 UDID 或名称", required: false },
      { flag: "--name", type: "字符串", description: "设备名称", required: false },
      { flag: "--verify", type: "", description: "等待擦除验证，传此标志即启用", required: false },
      { flag: "--timeout", type: "数字", description: "验证超时秒数（默认 30）", required: false },
      { flag: "--all", type: "", description: "擦除所有模拟器", required: false },
      { flag: "--type", type: "字符串", description: "擦除指定类型的所有模拟器", required: false },
      { flag: "--booted", type: "", description: "擦除所有已启动模拟器", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--udid", "<device-udid>"] },});
export const iosSimulatorSkillSimctlShutdown = defineCliProcedure({
    id: "ios-simulator-skill-simctl-shutdown",
    entry: new URL("./sources/ios-simulator-skill/simctl_shutdown.ts", import.meta.url),
    description: "关闭 iOS 模拟器：支持单设备关闭、全部关闭和按类型关闭，可选验证等待。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simctl_shutdown.mjs",
    runtime: "node",
    params: [
      { flag: "--udid", type: "字符串", description: "设备 UDID 或名称", required: false },
      { flag: "--name", type: "字符串", description: "设备名称", required: false },
      { flag: "--verify", type: "", description: "等待关闭验证，传此标志即启用", required: false },
      { flag: "--timeout", type: "数字", description: "验证超时秒数（默认 30）", required: false },
      { flag: "--all", type: "", description: "关闭所有已启动模拟器", required: false },
      { flag: "--type", type: "字符串", description: "关闭指定类型的所有已启动模拟器", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--all"] },});
export const iosSimulatorSkillSimulatorSelector = defineCliProcedure({
    id: "ios-simulator-skill-simulator-selector",
    entry: new URL("./sources/ios-simulator-skill/simulator_selector.ts", import.meta.url),
    description: "智能推荐 iOS 模拟器：根据常用型号、iOS 版本、启动状态和上次使用记录评分排序。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/simulator_selector.mjs",
    runtime: "node",
    params: [
      { flag: "--suggest", type: "", description: "获取推荐模拟器列表，传此标志即启用", required: false },
      { flag: "--list", type: "", description: "列出所有可用模拟器", required: false },
      { flag: "--boot", type: "字符串", description: "按 UDID 启动模拟器", required: false },
      { flag: "--json", type: "", description: "输出为 JSON，传此标志即启用", required: false },
      { flag: "--count", type: "数字", description: "推荐数量（默认 4）", required: false },
    ],
  
  exampleArgs: { args: ["--suggest"] },});
export const iosSimulatorSkillStatusBar = defineCliProcedure({
    id: "ios-simulator-skill-status-bar",
    entry: new URL("./sources/ios-simulator-skill/status_bar.ts", import.meta.url),
    description: "覆盖 iOS 模拟器状态栏：支持预设（clean/testing/low-battery/airplane）和自定义时间、网络、电池。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/status_bar.mjs",
    runtime: "node",
    params: [
      { flag: "--preset", type: "字符串", description: "预设：clean, testing, low-battery, airplane", required: false },
      { flag: "--time", type: "字符串", description: "覆盖状态栏时间", required: false },
      { flag: "--data-network", type: "字符串", description: "数据网络：none, 1x, 3g, 4g, 5g, lte, lte-a", required: false },
      { flag: "--wifi-mode", type: "字符串", description: "WiFi 模式：active, searching, failed", required: false },
      { flag: "--battery-state", type: "字符串", description: "电池状态：charging, charged, discharging", required: false },
      { flag: "--battery-level", type: "数字", description: "电池电量 0-100", required: false },
      { flag: "--clear", type: "", description: "清除状态栏覆盖，传此标志即启用", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
    ],
  
  exampleArgs: { args: ["--preset", "clean"] },});
export const iosSimulatorSkillTestRecorder = defineCliProcedure({
    id: "ios-simulator-skill-test-recorder",
    entry: new URL("./sources/ios-simulator-skill/test_recorder.ts", import.meta.url),
    description: "录制 iOS 模拟器测试执行过程：按步骤截图、采集无障碍树、生成测试报告和 metadata。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/test_recorder.mjs",
    runtime: "node",
    params: [
      { flag: "--test-name", type: "字符串", description: "正在录制的测试名称（必填）", required: true },
      { flag: "--output", type: "路径", description: "测试产物输出目录", required: false },
      { flag: "--udid", type: "字符串", description: "目标设备 UDID", required: false },
      { flag: "--inline", type: "", description: "以 base64 返回截图，传此标志即启用", required: false },
      { flag: "--size", type: "字符串", description: "截图尺寸：full, half, quarter, thumb", required: false },
      { flag: "--app-name", type: "字符串", description: "应用名称，用于语义化截图命名", required: false },
    ],
  
  exampleArgs: { args: ["--test-name", "login-flow", "--size", "half"] },});
export const iosSimulatorSkillVisualDiff = defineCliProcedure({
    id: "ios-simulator-skill-visual-diff",
    entry: new URL("./sources/ios-simulator-skill/visual_diff.ts", import.meta.url),
    description: "比较两张截图之间的视觉差异：内置 PNG 解析，输出差值百分比、diff 图和并排对比图。",
    owners: { skillIds: ["ios-simulator-skill"] },
    target: "scripts/visual_diff.mjs",
    runtime: "node",
    params: [
      { flag: "--output", type: "路径", description: "diff 产物输出目录", required: false },
      { flag: "--threshold", type: "数字", description: "可接受的差值阈值（默认 0.01）", required: false },
      { flag: "--details", type: "", description: "显示详细 JSON 输出，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["baseline.png", "current.png", "--threshold", "0.01"] },});
export const markitdownBatchConvert = defineCliProcedure({
    id: "markitdown-batch-convert",
    entry: new URL("./sources/markitdown/batch_convert.ts", import.meta.url),
    description: "批量转换目录中的 Office/图片/HTML/音频等文件为 Markdown，支持并发和递归遍历。",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/batch_convert.mjs",
    runtime: "node",
    params: [
      { flag: "--extensions", type: "字符串", description: "要转换的文件扩展名列表（如 .pdf .docx .pptx）", required: false },
      { flag: "--recursive", type: "", description: "递归搜索子目录", required: false },
      { flag: "--workers", type: "数字", description: "并行 worker 数量（默认 4）", required: false },
      { flag: "--verbose", type: "", description: "输出详细日志，传此标志即启用", required: false },
      { flag: "--plugins", type: "", description: "启用 MarkItDown 插件，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["input_dir", "output_dir", "--recursive", "--extensions", ".pdf", ".docx"] },});
export const markitdownConvertLiterature = defineCliProcedure({
    id: "markitdown-convert-literature",
    entry: new URL("./sources/markitdown/convert_literature.ts", import.meta.url),
    description: "批量转换学术 PDF 文献为带元数据的 Markdown，支持按年份归档和生成索引目录。",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/convert_literature.mjs",
    runtime: "node",
    params: [
      { flag: "--organize-by-year", type: "", description: "按年份归档到子目录，传此标志即启用", required: false },
      { flag: "--create-index", type: "", description: "生成 INDEX.md 和 catalog.json，传此标志即启用", required: false },
      { flag: "--recursive", type: "", description: "递归搜索子目录", required: false },
    ],
  
  exampleArgs: { args: ["papers_dir", "output_dir", "--organize-by-year", "--create-index"] },});
export const markitdownConvertWithAi = defineCliProcedure({
    id: "markitdown-convert-with-ai",
    entry: new URL("./sources/markitdown/convert_with_ai.ts", import.meta.url),
    description: "使用 AI 模型（OpenRouter）为文档/图片生成增强描述，支持多种提示模板和自定义模型。",
    owners: { skillIds: ["markitdown"] },
    target: "scripts/convert_with_ai.mjs",
    runtime: "node",
    params: [
      { flag: "--api-key", type: "字符串", description: "OpenRouter API key（也可通过 OPENROUTER_API_KEY 环境变量设置）", required: false },
      { flag: "--model", type: "字符串", description: "AI 模型名称（默认 anthropic/claude-opus-4.5）", required: false },
      { flag: "--prompt-type", type: "scientific|presentation|general|data_viz|medical", description: "提示模板类型", required: false },
      { flag: "--custom-prompt", type: "字符串", description: "自定义提示文本", required: false },
      { flag: "--list-prompts", type: "", description: "列出所有可用提示模板并退出", required: false },
    ],
  
  exampleArgs: { args: ["input.docx", "output.md", "--prompt-type", "scientific"] },});
export const mdToPdfKatexRender = defineCliProcedure({
    id: "md-to-pdf-katex-render",
    entry: new URL("./sources/md-to-pdf/katex_render.ts", import.meta.url),
    description: "服务端 KaTeX 数学公式渲染：将 HTML 中 pandoc 生成的 <span class='math'>LaTeX 替换为 KaTeX 渲染后的 HTML。",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/katex_render.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["input.html", "output.html"] },});
export const mdToPdfMdToPdf = defineCliProcedure({
    id: "md-to-pdf-md-to-pdf",
    entry: new URL("./sources/md-to-pdf/md_to_pdf.ts", import.meta.url),
    description: "将 Markdown 通过 pandoc + KaTeX + Mermaid + Playwright 渲染为高清 PDF，支持自定义 CSS、页边距和页码。",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/md_to_pdf.mjs",
    runtime: "node",
    params: [
      { flag: "--format", type: "A4|Letter|Legal|A3", description: "页面格式（默认 A4）", required: false },
      { flag: "--margin", type: "value|top,right,bottom,left", description: "页边距（默认 0.75in）", required: false },
      { flag: "--no-mermaid", type: "", description: "跳过 Mermaid 图表渲染，传此标志即启用", required: false },
      { flag: "--no-math", type: "", description: "跳过 KaTeX 数学公式渲染，传此标志即启用", required: false },
      { flag: "--css", type: "路径", description: "额外自定义 CSS 文件", required: false },
      { flag: "--landscape", type: "", description: "横向排版，传此标志即启用", required: false },
      { flag: "--header-footer", type: "", description: "显示页码页脚，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["input.md", "output.pdf", "--format", "A4", "--header-footer"] },});
export const mdToPdfSetup = defineCliProcedure({
    id: "md-to-pdf-setup",
    entry: new URL("./sources/md-to-pdf/setup.ts", import.meta.url),
    description: "检查 md-to-pdf 渲染管线的系统依赖（pandoc、mmdc、katex、playwright、Chrome），可选择自动安装缺失项。",
    owners: { skillIds: ["md-to-pdf"] },
    target: "scripts/setup.mjs",
    runtime: "node",
    params: [
      { flag: "--install", type: "", description: "自动安装缺失的依赖项，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--install"] },});
export const modelFirstReasoningValidateModel = defineCliProcedure({
    id: "model-first-reasoning-validate-model",
    entry: new URL("./sources/model-first-reasoning/validate-model.ts", import.meta.url),
    description: "校验 model.json 的结构完整性：检查必需键、字段类型、动作/约束/需求跟踪和测试 oracles 的子字段，输出校验失败项与未知项计数。",
    owners: { skillIds: ["model-first-reasoning"] },
    target: "scripts/validate-model.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["model.json"] },});
export const modernWebDesignDesignAudit = defineCliProcedure({
    id: "modern-web-design-design-audit",
    entry: new URL("./sources/modern-web-design/design_audit.ts", import.meta.url),
    description: "审计 HTML 文件的可访问性、性能、SEO、响应式设计和现代 CSS 实践，生成评分报告。",
    owners: { skillIds: ["modern-web-design"] },
    target: "scripts/design_audit.mjs",
    runtime: "node",
    params: [
      { flag: "--file", type: "路径", description: "待审计的 HTML 文件路径", required: false },
      { flag: "--report", type: "路径", description: "审计报告输出路径", required: false },
    ],
  
  exampleArgs: { args: ["--file", "index.html", "--report", "audit-report.txt"] },});
export const modernWebDesignPatternGenerator = defineCliProcedure({
    id: "modern-web-design-pattern-generator",
    entry: new URL("./sources/modern-web-design/pattern_generator.ts", import.meta.url),
    description: "生成现代 Web 设计模式（hero/card/navigation/form 等）的完整 HTML 代码。",
    owners: { skillIds: ["modern-web-design"] },
    target: "scripts/pattern_generator.mjs",
    runtime: "node",
    params: [
      { flag: "--list", type: "", description: "列出所有可用设计模式并退出", required: false },
      { flag: "--pattern", type: "字符串", description: "设计模式名称", required: false },
      { flag: "--output", type: "路径", description: "输出文件路径", required: false },
    ],
  
  exampleArgs: { args: ["--pattern", "hero", "--output", "hero.html"] },});
export const pdfCheckBoundingBoxes = defineCliProcedure({
    id: "pdf-check-bounding-boxes",
    entry: new URL("./sources/pdf/check_bounding_boxes.ts", import.meta.url),
    description: "校验视觉型 PDF 表单中标签框与录入框的 bounding box 是否重叠或高度不足。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/check_bounding_boxes.mjs",
    runtime: "node",
    params: [
      { flag: "<fields.json>", type: "路径", description: "fields JSON 文件路径", required: true },
    ],
  
  exampleArgs: { args: ["fields.json"] },});
export const pdfCheckFillableFields = defineCliProcedure({
    id: "pdf-check-fillable-fields",
    entry: new URL("./sources/pdf/check_fillable_fields.ts", import.meta.url),
    description: "检测 PDF 是否包含可填写 AcroForm 字段，区分可填写表单与视觉型表单。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/check_fillable_fields.mjs",
    runtime: "node",
    params: [
      { flag: "<input.pdf>", type: "路径", description: "输入 PDF 文件路径", required: true },
    ],
  
  exampleArgs: { args: ["input.pdf"] },});
export const pdfConvertPdfToImages = defineCliProcedure({
    id: "pdf-convert-pdf-to-images",
    entry: new URL("./sources/pdf/convert_pdf_to_images.ts", import.meta.url),
    description: "使用 @pdfme/converter 将 PDF 各页渲染为 PNG 图片，自动缩放以适应页面尺寸。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/convert_pdf_to_images.mjs",
    runtime: "node",
    params: [
      { flag: "<input.pdf>", type: "路径", description: "输入 PDF 文件路径", required: true },
      { flag: "<output-dir>", type: "路径", description: "输出图片目录路径", required: true },
    ],
  
  exampleArgs: { args: ["input.pdf", "output_images/"] },});
export const pdfCreateValidationImage = defineCliProcedure({
    id: "pdf-create-validation-image",
    entry: new URL("./sources/pdf/create_validation_image.ts", import.meta.url),
    description: "在指定页面图片上叠加 bounding box 框线（红色=录入框，蓝色=标签框）生成校验图。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/create_validation_image.mjs",
    runtime: "node",
    params: [
      { flag: "<page-number>", type: "数字", description: "页码（从 1 开始）", required: true },
      { flag: "<fields.json>", type: "路径", description: "fields JSON 文件路径", required: true },
      { flag: "<input-image>", type: "路径", description: "输入页面图片路径", required: true },
      { flag: "<output-image>", type: "路径", description: "输出校验图片路径", required: true },
    ],
  
  exampleArgs: { args: ["1", "fields.json", "page_1.png", "page_1_validated.png"] },});
export const pdfExtractFormFieldInfo = defineCliProcedure({
    id: "pdf-extract-form-field-info",
    entry: new URL("./sources/pdf/extract_form_field_info.ts", import.meta.url),
    description: "使用 pdf-lib 提取 PDF 可填写表单字段详细信息：类型、页码、位置、选项值。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/extract_form_field_info.mjs",
    runtime: "node",
    params: [
      { flag: "<input.pdf>", type: "路径", description: "输入 PDF 文件路径", required: true },
      { flag: "<output.json>", type: "路径", description: "输出字段信息 JSON 文件路径", required: true },
    ],
  
  exampleArgs: { args: ["input.pdf", "fields.json"] },});
export const pdfExtractFormStructure = defineCliProcedure({
    id: "pdf-extract-form-structure",
    entry: new URL("./sources/pdf/extract_form_structure.ts", import.meta.url),
    description: "使用 pdfjs-dist 分析视觉型 PDF 表单结构：文本标签、水平分隔线、复选框和行边界。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/extract_form_structure.mjs",
    runtime: "node",
    params: [
      { flag: "<input.pdf>", type: "路径", description: "输入 PDF 文件路径", required: true },
      { flag: "<output.json>", type: "路径", description: "输出结构 JSON 文件路径", required: true },
    ],
  
  exampleArgs: { args: ["input.pdf", "structure.json"] },});
export const pdfFillFillableFields = defineCliProcedure({
    id: "pdf-fill-fillable-fields",
    entry: new URL("./sources/pdf/fill_fillable_fields.ts", import.meta.url),
    description: "根据字段值 JSON 回填 PDF 可填写表单，支持文本框、复选框、单选组和下拉选择。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/fill_fillable_fields.mjs",
    runtime: "node",
    params: [
      { flag: "<input.pdf>", type: "路径", description: "输入 PDF 文件路径", required: true },
      { flag: "<fields.json>", type: "路径", description: "字段值 JSON 文件路径（含 field_id、page、value）", required: true },
      { flag: "<output.pdf>", type: "路径", description: "输出 PDF 文件路径", required: true },
    ],
  
  exampleArgs: { args: ["input.pdf", "field_values.json", "output.pdf"] },});
export const pdfFillPdfFormWithAnnotations = defineCliProcedure({
    id: "pdf-fill-pdf-form-with-annotations",
    entry: new URL("./sources/pdf/fill_pdf_form_with_annotations.ts", import.meta.url),
    description: "在视觉型 PDF 表单上根据 bounding box 坐标写入文本批注，支持自定义字体和颜色。",
    owners: { skillIds: ["pdf"] },
    target: "scripts/fill_pdf_form_with_annotations.mjs",
    runtime: "node",
    params: [
      { flag: "<input.pdf>", type: "路径", description: "输入 PDF 文件路径", required: true },
      { flag: "<fields.json>", type: "路径", description: "字段定义 JSON 文件路径（含 bounding box、字体、颜色）", required: true },
      { flag: "<output.pdf>", type: "路径", description: "输出 PDF 文件路径", required: true },
    ],
  
  exampleArgs: { args: ["input.pdf", "fields.json", "output.pdf"] },});
export const preLandingReviewCollectDiff = defineCliProcedure({
    id: "pre-landing-review-collect-diff",
    entry: new URL("./sources/pre-landing-review/collect_diff.ts", import.meta.url),
    description: "收集 base...HEAD 的 git diff 元信息（文件列表、行数统计），输出结构化 JSON。",
    owners: { skillIds: ["pre-landing-review"] },
    target: "scripts/collect_diff.mjs",
    runtime: "node",
    params: [
      { flag: "--base", type: "字符串", description: "基准分支或 git ref（默认 origin/main）", required: false },
      { flag: "--cwd", type: "路径", description: "Git 仓库工作目录", required: false },
    ],
  
  exampleArgs: { args: ["--base", "origin/main"] },});
export const preLandingReviewRenderReport = defineCliProcedure({
    id: "pre-landing-review-render-report",
    entry: new URL("./sources/pre-landing-review/render_report.ts", import.meta.url),
    description: "把结构化 findings JSON 渲染为标准落地前审查 Markdown 报告（阻断项、建议项、门禁结论）。",
    owners: { skillIds: ["pre-landing-review"] },
    target: "scripts/render_report.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "findings JSON 文件路径（默认从 stdin 读取）", required: false },
    ],
  
  exampleArgs: { args: ["--input", "findings.json"] },});
export const prlctlVmControlPrlctlHelper = defineCliProcedure({
    id: "prlctl-vm-control-prlctl-helper",
    entry: new URL("./sources/prlctl-vm-control/prlctl_helper.ts", import.meta.url),
    description: "Parallels Desktop 虚拟机统一管理入口：支持 list/resolve/status/info/exec/upload/download/power/snapshots 子命令，管理虚拟机生命周期、执行客体命令、传输文件。",
    owners: { skillIds: ["prlctl-vm-control"] },
    target: "scripts/prlctl_helper.mjs",
    runtime: "node",
    params: [
      { flag: "--json", type: "", description: "JSON 格式输出", required: false },
      { flag: "--status", type: "字符串", description: "按状态过滤虚拟机列表", required: false },
      { flag: "--shell", type: "字符串", description: "客体 shell 类型：raw/powershell/cmd/bash/sh", required: false },
      { flag: "--current-user", type: "", description: "以当前登录用户身份执行客体命令", required: false },
      { flag: "--user", type: "字符串", description: "指定客体用户名（需配合 --password-env）", required: false },
      { flag: "--password-env", type: "字符串", description: "存放密码的环境变量名", required: false },
      { flag: "--resolve-paths", type: "", description: "解析客体路径中的符号链接", required: false },
      { flag: "--advanced-terminal", type: "", description: "使用高级终端模式", required: false },
      { flag: "--dry-run", type: "", description: "仅打印将执行的命令而不实际执行", required: false },
      { flag: "--option", type: "字符串", description: "传递给 prlctl 的额外选项（需配合 power 子命令）", required: false },
    ],
  
  exampleArgs: { args: ["list", "--json"] },});
export const promptEngineeringPatternsOptimizePrompt = defineCliProcedure({
    id: "prompt-engineering-patterns-optimize-prompt",
    entry: new URL("./sources/prompt-engineering-patterns/optimize-prompt.ts", import.meta.url),
    description: "Prompt 优化演示脚本：使用内置示例对 prompt 变体进行精度、延迟、token 消耗的评估和迭代优化，输出优化结果 JSON。",
    owners: { skillIds: ["prompt-engineering-patterns"] },
    target: "scripts/optimize-prompt.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const remoteSshCommandInstallSshpass = defineCliProcedure({
    id: "remote-ssh-command-install-sshpass",
    entry: new URL("./sources/remote-ssh-command/install-sshpass.ts", import.meta.url),
    description: "自动检测并安装 sshpass 工具：根据操作系统和包管理器自动选择安装方式（brew/apt/dnf/yum/pacman），支持 sudo 提权。",
    owners: { skillIds: ["remote-ssh-command"] },
    target: "scripts/install-sshpass.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const remoteSshCommandSshExec = defineCliProcedure({
    id: "remote-ssh-command-ssh-exec",
    entry: new URL("./sources/remote-ssh-command/ssh-exec.ts", import.meta.url),
    description: "通过 SSH 在远端机器执行命令：从 ~/.host/ 读取主机 JSON 配置，命令从 stdin 读取，支持超时控制和执行历史记录。",
    owners: { skillIds: ["remote-ssh-command"] },
    target: "scripts/ssh-exec.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["~/.host/my-server.json"] },});
export const screenshotEnsureMacosPermissions = defineCliProcedure({
    id: "screenshot-ensure-macos-permissions",
    entry: new URL("./sources/screenshot/ensure_macos_permissions.ts", import.meta.url),
    description: "检查和请求 macOS 屏幕录制权限：自动检测权限状态，必要时提示用户授予权限。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/ensure_macos_permissions.mjs",
    runtime: "node",
  });
export const screenshotMacosDisplayInfo = defineCliProcedure({
    id: "screenshot-macos-display-info",
    entry: new URL("./sources/screenshot/macos_display_info.ts", import.meta.url),
    description: "获取 macOS 显示器信息：分辨率、排列方式和缩放因子。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_display_info.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const screenshotMacosPermissions = defineCliProcedure({
    id: "screenshot-macos-permissions",
    entry: new URL("./sources/screenshot/macos_permissions.ts", import.meta.url),
    description: "检查 macOS 屏幕录制权限状态，可选通过 --request 主动触发系统权限弹窗。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_permissions.mjs",
    runtime: "node",
    params: [
      { flag: "--request", type: "", description: "主动触发系统权限弹窗，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--request"] },});
export const screenshotMacosWindowInfo = defineCliProcedure({
    id: "screenshot-macos-window-info",
    entry: new URL("./sources/screenshot/macos_window_info.ts", import.meta.url),
    description: "获取 macOS 窗口信息：按应用名、窗口名过滤，列出可用窗口及其 ID 和位置。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/macos_window_info.mjs",
    runtime: "node",
    params: [
      { flag: "--list", type: "", description: "列出所有窗口", required: false },
      { flag: "--frontmost", type: "", description: "仅输出最前窗口，传此标志即启用", required: false },
      { flag: "--app", type: "字符串", description: "按应用名过滤窗口", required: false },
      { flag: "--window-name", type: "字符串", description: "按窗口名过滤", required: false },
    ],
  
  exampleArgs: { args: ["--list"] },});
export const screenshotTakeScreenshot = defineCliProcedure({
    id: "screenshot-take-screenshot",
    entry: new URL("./sources/screenshot/take_screenshot.ts", import.meta.url),
    description: "跨平台截图主入口：支持 macOS screencapture、Linux import 和 Windows 截图，按 mode/path/region/window-id 选择目标和输出。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/take_screenshot.mjs",
    runtime: "node",
    params: [
      { flag: "--mode", type: "default|temp", description: "截图模式：default 存入系统默认目录，temp 存入临时目录", required: false },
      { flag: "--path", type: "路径", description: "指定输出文件路径（与 --mode 互斥）", required: false },
      { flag: "--format", type: "png|jpgNN", description: "输出图片格式与质量（如 png、jpg85）", required: false },
      { flag: "--region", type: "x,y,w,h", description: "截取指定像素区域", required: false },
      { flag: "--window-id", type: "数字", description: "截取指定窗口 ID", required: false },
      { flag: "--active-window", type: "", description: "截取当前活动窗口，传此标志即启用", required: false },
      { flag: "--app", type: "字符串", description: "macOS 应用名，截取该应用窗口", required: false },
      { flag: "--window-name", type: "字符串", description: "macOS 窗口名过滤", required: false },
      { flag: "--list-windows", type: "", description: "列出可用窗口信息", required: false },
      { flag: "--interactive", type: "", description: "使用交互式选区，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--mode", "temp"] },});
export const screenshotTakeScreenshotWindows = defineCliProcedure({
    id: "screenshot-take-screenshot-windows",
    entry: new URL("./sources/screenshot/take_screenshot_windows.ts", import.meta.url),
    description: "Windows 平台截图：使用 PowerShell 屏幕捕获，支持 mode、path 和 region 参数。",
    owners: { skillIds: ["screenshot"] },
    target: "scripts/take_screenshot_windows.mjs",
    runtime: "node",
    params: [
      { flag: "--path", type: "路径", description: "输出文件路径或目录", required: false },
      { flag: "--mode", type: "default|temp", description: "输出模式（默认 default）", required: false },
      { flag: "--format", type: "png|jpg|jpeg|bmp", description: "输出图片格式（默认 png）", required: false },
      { flag: "--region", type: "x,y,w,h", description: "截取指定像素区域", required: false },
      { flag: "--active-window", type: "", description: "截取前台窗口，传此标志即启用", required: false },
      { flag: "--window-handle", type: "数字", description: "截取指定原生窗口句柄", required: false },
    ],
  
  exampleArgs: { args: ["--path", "screenshot.png"] },});
export const securityOwnershipMapBuildOwnershipMap = defineCliProcedure({
    id: "security-ownership-map-build-ownership-map",
    entry: new URL("./sources/security-ownership-map/build_ownership_map.ts", import.meta.url),
    description: "基于 git 历史构建安全所有权图谱：分析敏感代码归属、bus factor、共改关系和社区结构，输出 CSV/JSON/GraphML。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/build_ownership_map.mjs",
    runtime: "node",
    params: [
      { flag: "--repo", type: "路径", description: "Git 仓库路径（默认 .）", required: false },
      { flag: "--out", type: "路径", description: "输出目录（默认 ownership-map-out）", required: false },
      { flag: "--since", type: "字符串", description: "起始日期（如 2024-01-01）", required: false },
      { flag: "--until", type: "字符串", description: "结束日期", required: false },
      { flag: "--identity", type: "author|committer", description: "身份归因字段（默认 author）", required: false },
      { flag: "--date-field", type: "author|committer", description: "日期字段（默认 author）", required: false },
      { flag: "--include-merges", type: "", description: "包含合并提交，传此标志即启用", required: false },
      { flag: "--emit-commits", type: "", description: "输出 commits.jsonl，传此标志即启用", required: false },
      { flag: "--sensitive-config", type: "路径", description: "敏感规则配置文件路径", required: false },
      { flag: "--owner-threshold", type: "数字", description: "隐藏 owner 判定阈值（默认 0.5）", required: false },
      { flag: "--bus-factor-threshold", type: "数字", description: "bus factor 告警阈值（默认 1）", required: false },
      { flag: "--stale-days", type: "数字", description: "孤儿代码判定天数（默认 365）", required: false },
      { flag: "--no-cochange", type: "", description: "跳过共改关系分析，传此标志即启用", required: false },
      { flag: "--no-communities", type: "", description: "跳过社区检测，传此标志即启用", required: false },
      { flag: "--graphml", type: "", description: "输出 GraphML 格式，传此标志即启用", required: false },
      { flag: "--half-life-days", type: "数字", description: "减半周期天数（默认 180.0）", required: false },
      { flag: "--min-touches", type: "数字", description: "最少触及次数（默认 1）", required: false },
      { flag: "--author-exclude-regex", type: "字符串", description: "排除匹配正则的作者（可重复）", required: false },
      { flag: "--no-default-author-excludes", type: "", description: "不使用默认的作者排除规则，传此标志即启用", required: false },
      { flag: "--cochange-max-files", type: "数字", description: "共改最大文件数（默认 50）", required: false },
      { flag: "--cochange-min-count", type: "数字", description: "共改最少出现次数（默认 2）", required: false },
      { flag: "--cochange-min-jaccard", type: "数字", description: "共改最小 Jaccard 系数（默认 0.05）", required: false },
      { flag: "--cochange-exclude", type: "字符串", description: "排除匹配正则的共改文件（可重复）", required: false },
      { flag: "--no-default-cochange-excludes", type: "", description: "不使用默认的共改排除规则，传此标志即启用", required: false },
      { flag: "--max-community-files", type: "数字", description: "社区分析最大文件数（默认 50）", required: false },
      { flag: "--community-top-owners", type: "数字", description: "每个社区显示的最多 owner 数（默认 5）", required: false },
    ],
  
  exampleArgs: { args: ["--repo", ".", "--out", "ownership-out", "--since", "2024-01-01"] },});
export const securityOwnershipMapCommunityMaintainers = defineCliProcedure({
    id: "security-ownership-map-community-maintainers",
    entry: new URL("./sources/security-ownership-map/community_maintainers.ts", import.meta.url),
    description: "快速运行所有权分析（简化参数），重点关注社区维护者检测和共改关系。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/community_maintainers.mjs",
    runtime: "node",
    params: [
      { flag: "--repo", type: "路径", description: "Git 仓库路径（默认 .）", required: false },
      { flag: "--out", type: "路径", description: "输出目录（默认 ownership-map-out）", required: false },
      { flag: "--since", type: "字符串", description: "起始日期", required: false },
      { flag: "--until", type: "字符串", description: "结束日期", required: false },
      { flag: "--identity", type: "author|committer", description: "身份归因字段（默认 author）", required: false },
      { flag: "--date-field", type: "author|committer", description: "日期字段（默认 author）", required: false },
      { flag: "--include-merges", type: "", description: "包含合并提交，传此标志即启用", required: false },
      { flag: "--author-exclude-regex", type: "字符串", description: "排除匹配正则的作者（可重复）", required: false },
      { flag: "--sensitive-config", type: "路径", description: "敏感规则配置文件路径", required: false },
      { flag: "--no-cochange", type: "", description: "跳过共改关系分析，传此标志即启用", required: false },
      { flag: "--no-communities", type: "", description: "跳过社区检测，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--repo", ".", "--since", "2024-01-01"] },});
export const securityOwnershipMapQueryOwnership = defineCliProcedure({
    id: "security-ownership-map-query-ownership",
    entry: new URL("./sources/security-ownership-map/query_ownership.ts", import.meta.url),
    description: "查询所有权分析结果：支持 people/files/person/file/cochange/tag/summary/communities/community 子命令。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/query_ownership.mjs",
    runtime: "node",
    params: [
      { flag: "--data-dir", type: "路径", description: "所有权分析输出目录（默认 ownership-map-out）", required: false },
    ],
  
  exampleArgs: { args: ["--data-dir", "ownership-out", "summary"] },});
export const securityOwnershipMapRunOwnershipMap = defineCliProcedure({
    id: "security-ownership-map-run-ownership-map",
    entry: new URL("./sources/security-ownership-map/run_ownership_map.ts", import.meta.url),
    description: "快速运行所有权分析（简化参数）：构建所有权图谱并输出 summary/people/files/edges CSV。",
    owners: { skillIds: ["security-ownership-map"] },
    target: "scripts/run_ownership_map.mjs",
    runtime: "node",
    params: [
      { flag: "--repo", type: "路径", description: "Git 仓库路径（默认 .）", required: false },
      { flag: "--out", type: "路径", description: "输出目录（默认 ownership-map-out）", required: false },
      { flag: "--since", type: "字符串", description: "起始日期", required: false },
      { flag: "--until", type: "字符串", description: "结束日期", required: false },
      { flag: "--identity", type: "author|committer", description: "身份归因字段（默认 author）", required: false },
      { flag: "--date-field", type: "author|committer", description: "日期字段（默认 author）", required: false },
      { flag: "--include-merges", type: "", description: "包含合并提交，传此标志即启用", required: false },
      { flag: "--emit-commits", type: "", description: "输出 commits.jsonl，传此标志即启用", required: false },
      { flag: "--no-default-author-excludes", type: "", description: "不使用默认的作者排除规则，传此标志即启用", required: false },
      { flag: "--graphml", type: "", description: "输出 GraphML 格式，传此标志即启用", required: false },
      { flag: "--sensitive-config", type: "路径", description: "敏感规则配置文件路径", required: false },
      { flag: "--no-cochange", type: "", description: "跳过共改关系分析，传此标志即启用", required: false },
      { flag: "--no-communities", type: "", description: "跳过社区检测，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--repo", ".", "--since", "2024-01-01"] },});
export const shadcnUiVerifySetup = defineCliProcedure({
    id: "shadcn-ui-verify-setup",
    entry: new URL("./sources/shadcn-ui/verify-setup.ts", import.meta.url),
    description: "验证 shadcn/ui 项目配置完整性：检查 components.json、Tailwind 配置、路径别名、CSS 变量、cn() 工具函数和推荐依赖。",
    owners: { skillIds: ["shadcn-ui"] },
    target: "scripts/verify-setup.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const skillActivationAnalyzerCsoAudit = defineCliProcedure({
    id: "skill-activation-analyzer-cso-audit",
    entry: new URL("./sources/skill-activation-analyzer/cso_audit.ts", import.meta.url),
    description: "批量审查 skill frontmatter description 文本质量：检测 workflow_leak、output_leak、missing_trigger、tool_leak、too_long、too_short 等违规项，按严重度分级输出审计报告。",
    owners: { skillIds: ["skill-activation-analyzer"] },
    target: "scripts/cso_audit.mjs",
    runtime: "node",
    params: [
      { flag: "--skills-dir", type: "路径", description: "skills 目录路径", required: false },
      { flag: "--json", type: "", description: "JSON 格式输出", required: false },
      { flag: "--severity", type: "字符串", description: "最低违规严重度：critical/high/medium/low", required: false },
    ],
  
  exampleArgs: { args: ["--severity", "medium"] },});
export const skillCreatorAggregateBenchmark = defineCliProcedure({
    id: "skill-creator-aggregate-benchmark",
    entry: new URL("./sources/skill-creator/aggregate_benchmark.ts", import.meta.url),
    description: "汇总 eval 运行结果生成 benchmark JSON 和 Markdown 报告：统计 pass rate、耗时、token 消耗及 vs baseline 的 delta 对比。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/aggregate_benchmark.mjs",
    runtime: "node",
    params: [
      { flag: "[benchmarkDir]", type: "路径", description: "包含 eval runs 的 benchmark 目录路径（必填）", required: true },
      { flag: "--skill-name", type: "字符串", description: "Skill 名称，用于报告标题", required: false },
      { flag: "--skill-path", type: "路径", description: "Skill 路径，用于报告元数据", required: false },
      { flag: "--output", type: "路径", description: "输出 benchmark JSON 文件路径（默认 benchmark_dir/benchmark.json）", required: false },
    ],
  
  exampleArgs: { args: ["path/to/benchmark-dir", "--skill-name", "my-skill"] },});
export const skillCreatorGenerateReport = defineCliProcedure({
    id: "skill-creator-generate-report",
    entry: new URL("./sources/skill-creator/generate_report.ts", import.meta.url),
    description: "将 description optimization 的 results JSON 渲染为 HTML 报告：展示每轮 iteration 的 description 和每个 train/test query 的触发情况（PASS/FAIL）。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/generate_report.mjs",
    runtime: "node",
    params: [
      { flag: "[input]", type: "path|stdin", description: "results JSON 文件路径，或 - 表示从 stdin 读取（必填）", required: true },
      { flag: "--output", type: "路径", description: "输出 HTML 文件路径（默认输出到 stdout）", required: false },
      { flag: "--skill-name", type: "字符串", description: "Skill 名称，用于报告标题", required: false },
    ],
  
  exampleArgs: { args: ["results.json", "-o", "report.html"] },});
export const skillCreatorGenerateReview = defineCliProcedure({
    id: "skill-creator-generate-review",
    entry: new URL("./sources/skill-creator/generate_review.ts", import.meta.url),
    description: "启动 eval 结果审查 HTTP viewer 或生成静态 HTML：展示 runs 的 outputs、grading、benchmark 和 feedback，支持交互式评分和上一轮 feedback 对比。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/generate_review.mjs",
    runtime: "node",
    params: [
      { flag: "[workspace]", type: "路径", description: "Eval workspace 目录路径（必填）", required: true },
      { flag: "--static", type: "路径", description: "输出静态 viewer HTML 文件路径（不启动 HTTP 服务器）", required: false },
      { flag: "--skill-name", type: "字符串", description: "Skill 名称，用于 viewer 标题", required: false },
      { flag: "--port", type: "数字", description: "HTTP 服务端口（默认 3117）", required: false },
      { flag: "--previous-workspace", type: "路径", description: "上一轮 iteration 的 workspace 目录，加载之前的 feedback", required: false },
      { flag: "--benchmark", type: "路径", description: "Benchmark JSON 文件路径，嵌入 viewer 展示", required: false },
    ],
  
  exampleArgs: { args: ["path/to/workspace", "--static", "review.html"] },});
export const skillCreatorImproveDescription = defineCliProcedure({
    id: "skill-creator-improve-description",
    entry: new URL("./sources/skill-creator/improve_description.ts", import.meta.url),
    description: "调用 LLM 分析 eval 失败记录，生成改进后的 skill frontmatter description：支持历史上下文和 1024 字符超限自动重写。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/improve_description.mjs",
    runtime: "node",
    params: [
      { flag: "--eval-results", type: "路径", description: "Eval results JSON 文件路径（必填）", required: true },
      { flag: "--skill-path", type: "路径", description: "Skill 目录路径（必填）", required: true },
      { flag: "--model", type: "字符串", description: "LLM 模型名称（必填）", required: true },
      { flag: "--history", type: "路径", description: "历史 description 改进记录 JSON 文件路径", required: false },
      { flag: "--verbose", type: "", description: "输出详细日志，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--eval-results", "results.json", "--skill-path", "skills/my-skill", "--model", "claude-sonnet-4-20250514"] },});
export const skillCreatorPackageSkill = defineCliProcedure({
    id: "skill-creator-package-skill",
    entry: new URL("./sources/skill-creator/package_skill.ts", import.meta.url),
    description: "校验并打包 skill 目录为可分发的 .skill ZIP 文件：验证 frontmatter 完整性，排除 evals/、__pycache__、node_modules 和系统文件。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/package_skill.mjs",
    runtime: "node",
    params: [
      { flag: "[skillPath]", type: "路径", description: "待打包的 skill 目录路径（必填）", required: true },
      { flag: "[outputDir]", type: "路径", description: "输出目录路径（默认当前目录）", required: false },
    ],
  
  exampleArgs: { args: ["skills/my-skill", "./dist"] },});
export const skillCreatorQuickValidate = defineCliProcedure({
    id: "skill-creator-quick-validate",
    entry: new URL("./sources/skill-creator/quick_validate.ts", import.meta.url),
    description: "快速校验 skill 目录的 SKILL.md YAML frontmatter：检查必需字段（name、description）、kebab-case 格式、字符长度限制和非法 key。",
    owners: { skillIds: ["skill-creator"] },
    target: "scripts/quick_validate.mjs",
    runtime: "node",
    params: [
      { flag: "[skillPath]", type: "路径", description: "待校验的 skill 目录路径（必填）", required: true },
    ],
  
  exampleArgs: { args: ["skills/my-skill"] },});
export const skillCreatorRunEval = defineCliProcedure({
    id: "skill-creator-run-eval",
    entry: new URL("./sources/skill-creator/run_eval.ts", import.meta.url),
    description: "运行 skill description 触发评估：对每个 eval query 启动 Claude 子进程，检测是否触发了对应 skill，支持并发和多次运行。",
    owners: { skillIds: ["skill-creator"] },
    platforms: [Platform.Claude],
    target: "scripts/run_eval.mjs",
    runtime: "node",
    params: [
      { flag: "--eval-set", type: "路径", description: "Eval cases YAML/JSON 文件路径（必填）", required: true },
      { flag: "--skill-path", type: "路径", description: "Skill 目录路径（必填）", required: true },
      { flag: "--description", type: "字符串", description: "覆盖测试用的 description（默认从 SKILL.md 读取）", required: false },
      { flag: "--model", type: "字符串", description: "Claude 模型名称", required: false },
      { flag: "--num-workers", type: "数字", description: "并发 worker 数量（默认 10）", required: false },
      { flag: "--timeout", type: "数字", description: "每个 query 的超时秒数（默认 30）", required: false },
      { flag: "--runs-per-query", type: "数字", description: "每个 query 的重复运行次数（默认 3）", required: false },
      { flag: "--trigger-threshold", type: "数字", description: "触发判定阈值 0-1（默认 0.5）", required: false },
      { flag: "--verbose", type: "", description: "输出详细日志，传此标志即启用", required: false },
    ],
  
  exampleArgs: { args: ["--eval-set", "evals/cases.yaml", "--skill-path", "skills/my-skill"] },});
export const skillCreatorRunLoop = defineCliProcedure({
    id: "skill-creator-run-loop",
    entry: new URL("./sources/skill-creator/run_loop.ts", import.meta.url),
    description: "自动优化 skill description 的完整迭代循环：拆分 train/test eval set、运行 eval、调用 LLM 改进 description、生成 live report，直到全部通过或达最大轮数。",
    owners: { skillIds: ["skill-creator"] },
    platforms: [Platform.Claude],
    target: "scripts/run_loop.mjs",
    runtime: "node",
    params: [
      { flag: "--eval-set", type: "路径", description: "Eval cases YAML/JSON 文件路径（必填）", required: true },
      { flag: "--skill-path", type: "路径", description: "Skill 目录路径（必填）", required: true },
      { flag: "--model", type: "字符串", description: "改进用的 LLM 模型名称（必填）", required: true },
      { flag: "--description", type: "字符串", description: "覆盖初始 description（默认从 SKILL.md 读取）", required: false },
      { flag: "--num-workers", type: "数字", description: "并发 worker 数量（默认 10）", required: false },
      { flag: "--timeout", type: "数字", description: "每个 query 的超时秒数（默认 30）", required: false },
      { flag: "--max-iterations", type: "数字", description: "最大迭代轮数（默认 5）", required: false },
      { flag: "--runs-per-query", type: "数字", description: "每个 query 的重复运行次数（默认 3）", required: false },
      { flag: "--trigger-threshold", type: "数字", description: "触发判定阈值 0-1（默认 0.5）", required: false },
      { flag: "--holdout", type: "数字", description: "Test set 比例 0-1（默认 0.4）", required: false },
      { flag: "--verbose", type: "", description: "输出详细日志，传此标志即启用", required: false },
      { flag: "--report", type: "path|auto|none", description: "Live report 输出路径（默认 auto，none 禁用）", required: false },
      { flag: "--results-dir", type: "路径", description: "结果保存目录", required: false },
    ],
  
  exampleArgs: { args: ["--eval-set", "evals/cases.yaml", "--skill-path", "skills/my-skill", "--model", "claude-sonnet-4-20250514"] },});
export const skillsPruneAndSyncReadmeCurateSkills = defineCliProcedure({
    id: "skills-prune-and-sync-readme-curate-skills",
    entry: new URL("./sources/skills-prune-and-sync-readme/curate_skills.ts", import.meta.url),
    description: "审计、治理和同步仓库 skill 组件：audit 子命令分析低质量/重复/冲突/相似分组；prune 子命令按确认名单删除 skill；sync-readme 子命令更新 README Skill 清单。",
    owners: { skillIds: ["skills-prune-and-sync-readme"] },
    target: "scripts/curate_skills.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["audit", "--format", "json"] },});
export const speckitBaselineBootstrapSpecify = defineCliProcedure({
    id: "speckit-baseline-bootstrap-specify",
    entry: new URL("./sources/speckit-baseline/bootstrap-specify.ts", import.meta.url),
    description: "初始化 .specify 工作目录：从 skill assets 复制模板资源，生成脚本包装器，为 Spec-Driven Development 工作流准备基础设施。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/bootstrap-specify.mjs",
    runtime: "node",
  
  exampleArgs: { args: [] },});
export const speckitBaselineCheckPrerequisites = defineCliProcedure({
    id: "speckit-baseline-check-prerequisites",
    entry: new URL("./sources/speckit-baseline/check-prerequisites.ts", import.meta.url),
    description: "Spec-Driven Development 前置条件检查：验证 feature 目录、分支规范、plan.md 和可选 tasks.md 是否存在，输出当前工作路径和可用文档列表。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/check-prerequisites.mjs",
    runtime: "node",
    params: [
      { flag: "--json", type: "", description: "JSON 格式输出", required: false },
      { flag: "--require-tasks", type: "", description: "要求 tasks.md 必须存在（实现阶段使用）", required: false },
      { flag: "--include-tasks", type: "", description: "在可用文档列表中包含 tasks.md", required: false },
      { flag: "--paths-only", type: "", description: "仅输出路径变量，不进行前置条件验证", required: false },
    ],
  
  exampleArgs: { args: ["--json"] },});
export const speckitBaselineCreateNewFeature = defineCliProcedure({
    id: "speckit-baseline-create-new-feature",
    entry: new URL("./sources/speckit-baseline/create-new-feature.ts", import.meta.url),
    description: "创建新 feature 目录结构：根据功能描述文本生成 slug，在 .specify/features/ 下创建目录并初始化 feature.json，输出 FEATURE_DIR、SPEC_FILE、SLUG 信息。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/create-new-feature.mjs",
    runtime: "node",
    params: [
      { flag: "--json", type: "", description: "JSON 格式输出", required: false },
      { flag: "--short-name", type: "字符串", description: "手动指定 slug 短名，而非从描述自动生成", required: false },
    ],
  
  exampleArgs: { args: ["--short-name", "user-auth", "用户登录功能"] },});
export const speckitBaselineSetupPlan = defineCliProcedure({
    id: "speckit-baseline-setup-plan",
    entry: new URL("./sources/speckit-baseline/setup-plan.ts", import.meta.url),
    description: "初始化 feature 实现计划：从模板复制 plan.md 到 feature 目录，验证分支规范，输出 feature spec 和实现计划路径。",
    owners: { skillIds: ["speckit-baseline"] },
    target: "scripts/setup-plan.mjs",
    runtime: "node",
    params: [
      { flag: "--json", type: "", description: "JSON 格式输出", required: false },
    ],
  
  exampleArgs: { args: ["--json"] },});
export const typescriptTypeSafetyExtractTsErrors = defineCliProcedure({
    id: "typescript-type-safety-extract-ts-errors",
    entry: new URL("./sources/typescript-type-safety/extract-ts-errors.ts", import.meta.url),
    description: "把 tsc 输出按文件和错误码归组，便于先定位上游合同错误。",
    owners: { skillIds: ["typescript-type-safety"] },
    params: [
      { flag: "--input", type: "路径", description: "tsc --noEmit 输出文件路径（未提供时从 stdin 读取）", required: false },
    ],
    output: defineProcedureOutput<RuntimeProcedureResult>({
      typeName: "ExtractTsErrorsSummary",
      fields: runtimeProcedureOutput.fields,
    }),
  
  exampleArgs: { args: ["--input", "tsc-output.txt"] },});
export const uxResearcherDesignerPersonaGenerator = defineCliProcedure({
    id: "ux-researcher-designer-persona-generator",
    entry: new URL("./sources/ux-researcher-designer/persona_generator.ts", import.meta.url),
    description: "基于用户行为数据和访谈洞察生成结构化 Persona：分析使用频率、功能偏好、设备、上下文、痛点，输出原型特征、目标、痛点、设计启发和信心等级。",
    owners: { skillIds: ["ux-researcher-designer"] },
    target: "scripts/persona_generator.mjs",
    runtime: "node",
    params: [
      { flag: "--input", type: "路径", description: "用户数据 JSON 文件路径", required: false },
      { flag: "--interviews", type: "路径", description: "访谈洞察 JSON 文件路径", required: false },
      { flag: "--output-format", type: "字符串", description: "输出格式：text 或 json", required: false },
      { flag: "--sample", type: "", description: "使用内置示例数据", required: false },
      { flag: "--seed", type: "数字", description: "稳定命名种子（默认 7）", required: false },
    ],
  
  exampleArgs: { args: ["--input", "user_data.json", "--output-format", "json"] },});
export const webContentFetcherFetch = defineCliProcedure({
    id: "web-content-fetcher-fetch",
    entry: new URL("./sources/web-content-fetcher/fetch.ts", import.meta.url),
    description: "抓取网页正文并转为 Markdown：通过 HTML 内容选择器智能提取正文，支持常规和隐身请求头模式，自动处理图片懒加载和微信公众号页面。",
    owners: { skillIds: ["web-content-fetcher"] },
    target: "scripts/fetch.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["https://example.com/article", "--json"] },});
export const webPerformanceDiagnosisAnalyze = defineCliProcedure({
    id: "web-performance-diagnosis-analyze",
    entry: new URL("./sources/web-performance-diagnosis/analyze.ts", import.meta.url),
    description: "分析 HTML 文件中的常见 Web 质量问题：检查 doctype、charset、viewport、lang、title、图片 alt 文本和 HTTPS 使用情况，输出 JSON 审计报告。",
    owners: { skillIds: ["web-performance-diagnosis"] },
    target: "scripts/analyze.mjs",
    runtime: "node",
  
  exampleArgs: { args: ["./dist"] },});
export const youtubeAnalysisAnalyzeVideo = defineCliProcedure({
    id: "youtube-analysis-analyze-video",
    entry: new URL("./sources/youtube-analysis/analyze_video.ts", import.meta.url),
    description: "获取 YouTube 视频元数据和字幕，生成结构化分析脚手架 Markdown 文件：包含标题、频道、时长、上传日期、字幕分段和按深度的分析模板。",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/analyze_video.mjs",
    runtime: "node",
    params: [
      { flag: "--output", type: "路径", description: "输出文件路径（默认 ./{sanitized_title}.md）", required: false },
      { flag: "--depth", type: "字符串", description: "分析深度：quick、standard 或 deep", required: false },
      { flag: "--type", type: "字符串", description: "视频类型：auto、lecture、tutorial、interview、podcast、tech-talk 或 panel", required: false },
      { flag: "--lang", type: "字符串", description: "首选字幕语言代码（默认 en）", required: false },
      { flag: "--json", type: "", description: "输出原始 JSON 而非 Markdown 脚手架", required: false },
    ],
  
  exampleArgs: { args: ["https://www.youtube.com/watch?v=xxxx", "--depth", "deep"] },});
export const youtubeAnalysisFetchTranscript = defineCliProcedure({
    id: "youtube-analysis-fetch-transcript",
    entry: new URL("./sources/youtube-analysis/fetch_transcript.ts", import.meta.url),
    description: "通过 yt-dlp 获取 YouTube 视频字幕和元数据：支持按语言筛选字幕，返回结构化 JSON 包含字幕分段、标题、频道、时长等。",
    owners: { skillIds: ["youtube-analysis"] },
    target: "scripts/fetch_transcript.mjs",
    runtime: "node",
    params: [
      { flag: "--lang", type: "字符串", description: "首选字幕语言代码（默认 en）", required: false },
    ],
  
  exampleArgs: { args: ["https://www.youtube.com/watch?v=xxxx", "--lang", "zh"] },});
export const youtubeSearchSearchYoutube = defineCliProcedure({
    id: "youtube-search-search-youtube",
    entry: new URL("./sources/youtube-search/search_youtube.ts", import.meta.url),
    description: "通过 yt-dlp 搜索 YouTube 视频：支持按关键词搜索、结果数量限制、排序方式（relevance/views/newest）、时间过滤和多格式输出。",
    owners: { skillIds: ["youtube-search"] },
    target: "scripts/search_youtube.mjs",
    runtime: "node",
    params: [
      { flag: "--count", type: "数字", description: "返回结果数量（默认 10）", required: false },
      { flag: "--sort", type: "字符串", description: "排序方式：relevance、views 或 newest", required: false },
      { flag: "--days", type: "数字", description: "仅保留最近 N 天发布的视频", required: false },
      { flag: "--format", type: "字符串", description: "输出格式：json、table 或 urls", required: false },
    ],
  
  exampleArgs: { args: ["tailwindcss tutorial", "--count", "5", "--sort", "views"] },});

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
