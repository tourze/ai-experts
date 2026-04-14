import { spawnSync } from "node:child_process";

const COMMANDS_REQUIRED = [
  ["node", "hook 分发器与本地 JS/TS 工具"],
  ["python3", "截图、视频、图像导出等 Python 脚本"],
];

const COMMANDS_OPTIONAL = [
  ["ffmpeg", "视频导出后的音频混流"],
  ["ffprobe", "音频/视频时长探测"],
  ["plantuml", "ASCII PlantUML 生成"],
  ["bun", "TypeScript 脚本的本地直跑"],
  ["npx", "TypeScript 脚本的回退执行"],
];

const PYTHON_MODULES = [
  ["playwright", "concept-to-image 静态图导出"],
  ["manim", "concept-to-video 动画渲染"],
];

function hasCommand(command) {
  if (process.platform === "win32") {
    return spawnSync("where", [command], { stdio: "ignore" }).status === 0;
  }

  return spawnSync("bash", ["-lc", `command -v '${command}' >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function hasPythonModule(moduleName) {
  if (!hasCommand("python3")) {
    return false;
  }

  return spawnSync(
    "python3",
    [
      "-c",
      `import importlib.util, sys; sys.exit(0 if importlib.util.find_spec("${moduleName}") else 1)`,
    ],
    { stdio: "ignore" },
  ).status === 0;
}

function hasNodeModule(moduleName) {
  return spawnSync(
    "node",
    ["-e", `require.resolve("${moduleName}")`],
    { stdio: "ignore" },
  ).status === 0;
}

function collectPlatformTools() {
  if (process.platform === "darwin") {
    return [
      ["swift", "macOS 截图窗口枚举与权限检测"],
      ["screencapture", "macOS 系统截图"],
      ["osascript", "macOS 应用激活与窗口对焦"],
    ];
  }

  if (process.platform === "linux") {
    const hasLinuxCapture =
      hasCommand("scrot") ||
      hasCommand("gnome-screenshot") ||
      hasCommand("import");

    return hasLinuxCapture
      ? []
      : [["scrot / gnome-screenshot / import", "Linux 截图至少需要一种后端"]];
  }

  if (process.platform === "win32") {
    const hasPowerShell = hasCommand("powershell") || hasCommand("pwsh");
    return hasPowerShell
      ? []
      : [["powershell / pwsh", "Windows 截图脚本需要 PowerShell"]];
  }

  return [];
}

function collectCompressionBackend() {
  const hasBackend =
    (process.platform === "darwin" && hasCommand("sips")) ||
    hasCommand("cwebp") ||
    hasCommand("magick") ||
    hasCommand("convert") ||
    hasNodeModule("sharp");

  return hasBackend
    ? []
    : [["sips / cwebp / magick / convert / sharp", "图片压缩至少需要一个可用后端"]];
}

function formatSection(title, items) {
  if (items.length === 0) {
    return [];
  }

  const lines = [title];
  for (const [name, usage] of items) {
    lines.push(`  • ${name}：${usage}`);
  }
  return lines;
}

export async function run() {
  const missingRequired = COMMANDS_REQUIRED.filter(([command]) => !hasCommand(command));
  const missingOptional = [
    ...COMMANDS_OPTIONAL.filter(([command]) => !hasCommand(command)),
    ...collectPlatformTools(),
    ...collectCompressionBackend(),
  ];
  const missingPythonModules = PYTHON_MODULES.filter(
    ([moduleName]) => !hasPythonModule(moduleName),
  );

  const lines = [
    ...formatSection("[Plugin Deps] creative-expert 缺少基础命令：", missingRequired),
    ...formatSection("[Plugin Deps] creative-expert 建议补齐命令：", missingOptional),
    ...formatSection("[Plugin Deps] creative-expert 建议补齐 Python 模块：", missingPythonModules),
  ];

  if (lines.length === 0) {
    return null;
  }

  lines.push("  缺少依赖不会阻止插件加载，但会让对应脚本示例或导出流程无法直接执行。");
  return { decision: "report", reason: lines.join("\n") };
}
