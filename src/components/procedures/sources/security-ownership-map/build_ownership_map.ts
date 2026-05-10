#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import {
  assertOutputFilesWritable,
  parseArgs,
  plannedOwnershipMapOutputFiles,
} from "./build_ownership_map_args";
import { buildOwnershipMap } from "./build_ownership_map_core";

export const procedure = defineCliProcedure({
  id: "security-ownership-map-build-ownership-map",
  entry: procedureEntry(import.meta.url),
  description:
    "基于 git 历史构建安全所有权图谱：分析敏感代码归属、bus factor、共改关系和社区结构，输出 CSV/JSON/GraphML。",
  owners: { skillIds: ["security-ownership-map"] },
  target: "scripts/build_ownership_map.mjs",
  runtime: "node",
  params: [
    {
      flag: "--repo",
      type: "路径",
      description: "Git 仓库路径（默认 .）",
      required: false,
    },
    {
      flag: "--out",
      type: "路径",
      description: "输出目录（默认 ownership-map-out）",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖输出目录内已存在的所有权分析产物；仅在确认目标可替换后使用",
      required: false,
    },
    {
      flag: "--since",
      type: "字符串",
      description: "起始日期（如 2024-01-01）",
      required: false,
    },
    {
      flag: "--until",
      type: "字符串",
      description: "结束日期",
      required: false,
    },
    {
      flag: "--identity",
      type: "author|committer",
      description: "身份归因字段（默认 author）",
      required: false,
    },
    {
      flag: "--date-field",
      type: "author|committer",
      description: "日期字段（默认 author）",
      required: false,
    },
    {
      flag: "--include-merges",
      type: "",
      description: "包含合并提交，传此标志即启用",
      required: false,
    },
    {
      flag: "--emit-commits",
      type: "",
      description: "输出 commits.jsonl，传此标志即启用",
      required: false,
    },
    {
      flag: "--sensitive-config",
      type: "路径",
      description: "敏感规则配置文件路径",
      required: false,
    },
    {
      flag: "--owner-threshold",
      type: "数字",
      description: "隐藏 owner 判定阈值（默认 0.5）",
      required: false,
    },
    {
      flag: "--bus-factor-threshold",
      type: "数字",
      description: "bus factor 告警阈值（默认 1）",
      required: false,
    },
    {
      flag: "--stale-days",
      type: "数字",
      description: "孤儿代码判定天数（默认 365）",
      required: false,
    },
    {
      flag: "--no-cochange",
      type: "",
      description: "跳过共改关系分析，传此标志即启用",
      required: false,
    },
    {
      flag: "--no-communities",
      type: "",
      description: "跳过社区检测，传此标志即启用",
      required: false,
    },
    {
      flag: "--graphml",
      type: "",
      description: "输出 GraphML 格式，传此标志即启用",
      required: false,
    },
    {
      flag: "--half-life-days",
      type: "数字",
      description: "减半周期天数（默认 180.0）",
      required: false,
    },
    {
      flag: "--min-touches",
      type: "数字",
      description: "最少触及次数（默认 1）",
      required: false,
    },
    {
      flag: "--author-exclude-regex",
      type: "字符串",
      description: "排除匹配正则的作者（可重复）",
      required: false,
    },
    {
      flag: "--no-default-author-excludes",
      type: "",
      description: "不使用默认的作者排除规则，传此标志即启用",
      required: false,
    },
    {
      flag: "--cochange-max-files",
      type: "数字",
      description: "共改最大文件数（默认 50）",
      required: false,
    },
    {
      flag: "--cochange-min-count",
      type: "数字",
      description: "共改最少出现次数（默认 2）",
      required: false,
    },
    {
      flag: "--cochange-min-jaccard",
      type: "数字",
      description: "共改最小 Jaccard 系数（默认 0.05）",
      required: false,
    },
    {
      flag: "--cochange-exclude",
      type: "字符串",
      description: "排除匹配正则的共改文件（可重复）",
      required: false,
    },
    {
      flag: "--no-default-cochange-excludes",
      type: "",
      description: "不使用默认的共改排除规则，传此标志即启用",
      required: false,
    },
    {
      flag: "--max-community-files",
      type: "数字",
      description: "社区分析最大文件数（默认 50）",
      required: false,
    },
    {
      flag: "--community-top-owners",
      type: "数字",
      description: "每个社区显示的最多 owner 数（默认 5）",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["--repo", ".", "--out", "ownership-out", "--since", "2024-01-01"],
  },
});

export {
  assertOutputFilesWritable,
  buildOwnershipMap,
  parseArgs,
  plannedOwnershipMapOutputFiles,
};

export function main(argv: readonly string[]): any {
  try {
    const outDir = buildOwnershipMap(parseArgs(argv));
    console.log(`Ownership map written to ${outDir}`);
    return 0;
  } catch (error: any) {
    console.error(error.message);
    return 1;
  }
}
