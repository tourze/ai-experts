import { spawnSync } from "child_process";

const TOOL_GROUPS = {
  required: [
    ["python3", "社交平台安全过滤脚本"],
    ["curl", "抖音音频下载与图片生成接口请求"],
  ],
  optional: [
    ["ffmpeg", "抖音音频转码"],
    ["ffprobe", "抖音音频时长检测"],
    ["whisper-cli", "抖音本地转录"],
    ["jq", "小红书图文生成脚本 JSON 处理"],
  ],
};

function hasCommand(command) {
  return spawnSync("bash", ["-lc", `command -v ${command} >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function formatMissing(title, tools) {
  if (tools.length === 0) {
    return [];
  }

  const lines = [`[Plugin Deps] social-media-expert ${title}：`];
  for (const [command, usage] of tools) {
    lines.push(`  • ${command}：${usage}`);
  }
  return lines;
}

export async function run() {
  const missingRequired = TOOL_GROUPS.required.filter(([command]) => !hasCommand(command));
  const missingOptional = TOOL_GROUPS.optional.filter(([command]) => !hasCommand(command));

  const lines = [
    ...formatMissing("缺少基础命令", missingRequired),
    ...formatMissing("建议补齐可选命令", missingOptional),
  ];

  if (lines.length === 0) {
    return null;
  }

  lines.push("  缺少命令不会阻止插件加载，但会让对应技能的脚本示例无法直接执行。");
  return { decision: "report", reason: lines.join("\n") };
}
