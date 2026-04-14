import { spawnSync } from "node:child_process";

const PLUGIN_NAME = "obsidian-expert";
const REQUIRED_COMMANDS = [
  ["node", "hook 分发与本地 Node 校验"],
];
const OPTIONAL_COMMANDS = [
  ["obsidian", "Obsidian CLI（Vault/笔记/Bases/开发命令）"],
];

function hasCommand(command) {
  if (process.platform === "win32") {
    return spawnSync("where", [command], { stdio: "ignore" }).status === 0;
  }

  return spawnSync("bash", ["-lc", `command -v '${command}' >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function formatMissing(title, items) {
  if (items.length === 0) {
    return [];
  }

  const lines = [`[Plugin Deps] ${PLUGIN_NAME} ${title}：`];
  for (const [name, usage] of items) {
    lines.push(`  • ${name}：${usage}`);
  }
  return lines;
}

export async function run() {
  const missingRequired = REQUIRED_COMMANDS.filter(([command]) => !hasCommand(command));
  const missingOptional = OPTIONAL_COMMANDS.filter(([command]) => !hasCommand(command));

  if (missingRequired.length === 0 && missingOptional.length === 0) {
    return null;
  }

  const lines = [
    ...formatMissing("缺少基础命令", missingRequired),
    ...formatMissing("建议补齐命令", missingOptional),
  ];

  if (missingOptional.length > 0) {
    lines.push("  该插件的大部分示例依赖 Obsidian 1.12.7+ 安装器注册的 `obsidian` CLI，且执行命令时需保持 Obsidian 应用可用。");
  }

  return {
    decision: "report",
    reason: lines.join("\n"),
  };
}
