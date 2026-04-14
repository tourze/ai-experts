import { spawnSync } from "node:child_process";

const REQUIRED_COMMANDS = [
  ["node", "hooks 分发器与 KaTeX 渲染脚本"],
  ["python3", "Office / PDF / Markdown 处理脚本"],
  ["bash", "md-to-pdf 依赖检查脚本"],
];

const OPTIONAL_COMMANDS = [
  ["soffice", "DOCX / PPTX / XLSX 的转换、重算与缩略图流程"],
  ["gcc", "LibreOffice AF_UNIX socket shim 编译"],
  ["pandoc", "Markdown 转 HTML"],
  ["mmdc", "Mermaid 图渲染"],
];

const PYTHON_IMPORTS = [
  ["defusedxml.minidom", "Office XML 安全解析"],
  ["lxml.etree", "Office XSD 校验"],
  ["markitdown", "多格式转 Markdown"],
  ["openai", "AI 增强的 MarkItDown 图片描述"],
  ["pypdf", "PDF 表单读写"],
  ["pdfplumber", "PDF 文本与表格提取"],
  ["pdf2image", "PDF 转图片"],
  ["PIL", "PDF / PPT 缩略图与标注图绘制"],
  ["openpyxl", "Excel 公式结果校验"],
  ["playwright", "md-to-pdf 的 HTML 转 PDF"],
];

const NODE_MODULES = [
  ["katex", "md-to-pdf 的数学公式服务端渲染"],
];

function hasCommand(command) {
  if (process.platform === "win32") {
    return spawnSync("where", [command], { stdio: "ignore" }).status === 0;
  }

  return spawnSync("bash", ["-lc", `command -v '${command}' >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function canImportPythonModule(moduleName) {
  if (!hasCommand("python3")) {
    return false;
  }

  return spawnSync(
    "python3",
    [
      "-c",
      `import importlib, sys; importlib.import_module(${JSON.stringify(moduleName)}); sys.exit(0)`,
    ],
    { stdio: "ignore" },
  ).status === 0;
}

function hasNodeModule(moduleName) {
  if (!hasCommand("node")) {
    return false;
  }

  return spawnSync("node", ["-e", `require.resolve(${JSON.stringify(moduleName)})`], {
    stdio: "ignore",
  }).status === 0;
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
  const missingRequired = REQUIRED_COMMANDS.filter(([command]) => !hasCommand(command));
  const missingOptional = OPTIONAL_COMMANDS.filter(([command]) => !hasCommand(command));
  const missingPython = PYTHON_IMPORTS.filter(([moduleName]) => !canImportPythonModule(moduleName));
  const missingNode = NODE_MODULES.filter(([moduleName]) => !hasNodeModule(moduleName));

  const lines = [
    ...formatSection("[Plugin Deps] docs-expert 缺少基础命令：", missingRequired),
    ...formatSection("[Plugin Deps] docs-expert 建议补齐系统命令：", missingOptional),
    ...formatSection("[Plugin Deps] docs-expert 建议补齐 Python 模块：", missingPython),
    ...formatSection("[Plugin Deps] docs-expert 建议补齐 Node 模块：", missingNode),
  ];

  if (lines.length === 0) {
    return null;
  }

  lines.push("  缺少依赖不会阻止插件加载，但会让对应 skill 的脚本示例在运行时失败。");
  return {
    decision: "report",
    reason: lines.join("\n"),
  };
}
