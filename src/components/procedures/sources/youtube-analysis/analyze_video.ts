#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchVideo } from "./fetch_transcript";
import {
  chunkTranscript,
  estimateDurationCategory,
  formatTimestamp,
  sanitizeFilename,
} from "./utils";

export const procedure = defineCliProcedure({
  id: "youtube-analysis-analyze-video",
  entry: procedureEntry(import.meta.url),
  description:
    "获取 YouTube 视频元数据和字幕，生成结构化分析脚手架 Markdown 文件：包含标题、频道、时长、上传日期、字幕分段和按深度的分析模板。",
  owners: { skillIds: ["youtube-analysis"] },
  target: "scripts/analyze_video.mjs",
  runtime: "node",
  params: [
    {
      flag: "--output",
      type: "路径",
      description: "输出文件路径（默认 ./{sanitized_title}.md）",
      required: false,
    },
    {
      flag: "--depth",
      type: "字符串",
      description: "分析深度：quick、standard 或 deep",
      required: false,
    },
    {
      flag: "--type",
      type: "字符串",
      description:
        "视频类型：auto、lecture、tutorial、interview、podcast、tech-talk 或 panel",
      required: false,
    },
    {
      flag: "--lang",
      type: "字符串",
      description: "首选字幕语言代码（默认 en）",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出原始 JSON 而非 Markdown 脚手架",
      required: false,
    },
    {
      flag: "--force",
      type: "",
      description: "允许覆盖已存在的输出 Markdown 文件；仅在确认目标文件可覆盖后使用",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["https://www.youtube.com/watch?v=xxxx", "--depth", "deep"],
  },
});

const scriptDir = dirname(fileURLToPath(import.meta.url));
export function loadTemplate(): any {
  return readFileSync(
    join(scriptDir, "..", "assets", "output-template.md"),
    "utf8",
  );
}
function fillTemplate(template: any, values: any): any {
  return template.replace(/\{([a-z_]+)\}/g, (match: any, key: any) => {
    return Object.prototype.hasOwnProperty.call(values, key)
      ? values[key]
      : match;
  });
}
export function buildScaffold(data: any, depth: any, videoType: any): any {
  const duration = formatTimestamp(data.duration_seconds);
  const videoUrl = `https://www.youtube.com/watch?v=${data.video_id}`;
  const output = fillTemplate(loadTemplate(), {
    title: data.title,
    channel: data.channel,
    duration,
    upload_date: data.upload_date,
    video_url: videoUrl,
    tldr: "[TO BE ANALYZED]",
    key_concepts: "[TO BE ANALYZED]",
    detailed_analysis: "[TO BE ANALYZED]",
    notable_quotes: "[TO BE ANALYZED]",
    terms: "[TO BE ANALYZED]",
    takeaways: "[TO BE ANALYZED]",
    related: "[TO BE ANALYZED]",
  });
  const sections: any[] = [
    output,
    "",
    "---",
    "",
    "## Analysis Context",
    "",
    `- **Video type**: ${videoType}`,
    `- **Analysis depth**: ${depth}`,
    `- **Duration category**: ${estimateDurationCategory(data.duration_seconds)}`,
    `- **Transcript language**: ${data.language}`,
    `- **Transcript source**: ${data.source}`,
    `- **Segment count**: ${data.transcript.length}`,
  ];
  if (data.tags?.length) {
    sections.push(`- **Tags**: ${data.tags.slice(0, 20).join(", ")}`);
  }
  if (data.description) {
    const description =
      data.description.length > 500
        ? `${data.description.slice(0, 500)}...`
        : data.description;
    sections.push("", "### Video Description", "", description);
  }
  if (depth === "deep") {
    sections.push("", "### Transcript (Chunked by 5-minute segments)", "");
    for (const chunk of chunkTranscript(data.transcript, 5)) {
      sections.push(
        `**[${chunk.start_formatted} - ${chunk.end_formatted}]**`,
        "",
        chunk.text,
        "",
      );
    }
  } else {
    sections.push("", "### Full Transcript", "", data.transcript_text);
  }
  return sections.join("\n");
}
export function usage(): any {
  return `Fetch and structure YouTube video data for analysis.

Usage: node scripts/analyze_video.mjs <url-or-video-id> [options]

Options:
  --output <path>      Output file path (default: ./{sanitized_title}.md)
  --depth <value>      quick, standard, or deep (default: standard)
  --type <value>       auto, lecture, tutorial, interview, podcast, tech-talk, or panel
  --lang <code>        Preferred transcript language (default: en)
  --json               Output raw JSON instead of Markdown scaffold
  --force              Overwrite an existing Markdown output file
  --help, -h           Show this help
`;
}
function requireValue(argv: readonly string[], index: any, option: any): any {
  const value = argv[index + 1];
  if (value == null || value.startsWith("-"))
    throw new Error(`${option} requires a value`);
  return value;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    url: null,
    output: null,
    depth: "standard",
    videoType: "auto",
    lang: "en",
    json: false,
    force: false,
    help: false,
  };
  const depths = new Set(["quick", "standard", "deep"]);
  const types = new Set([
    "auto",
    "lecture",
    "tutorial",
    "interview",
    "podcast",
    "tech-talk",
    "panel",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--output") {
      args.output = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--depth") {
      args.depth = requireValue(argv, index, arg);
      if (!depths.has(args.depth))
        throw new Error(`invalid --depth: ${args.depth}`);
      index += 1;
    } else if (arg === "--type") {
      args.videoType = requireValue(argv, index, arg);
      if (!types.has(args.videoType))
        throw new Error(`invalid --type: ${args.videoType}`);
      index += 1;
    } else if (arg === "--lang") {
      args.lang = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`unrecognized argument: ${arg}`);
    } else if (!args.url) {
      args.url = arg;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.url) throw new Error("url is required");
  const data = fetchVideo(args.url, args.lang);
  if (args.json) {
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }
  const scaffold = buildScaffold(data, args.depth, args.videoType);
  const outputPath =
    args.output || join(process.cwd(), `${sanitizeFilename(data.title)}.md`);
  if (existsSync(outputPath) && !args.force) {
    throw new Error(
      `output file already exists: ${outputPath}; pass --force only after confirming it can be overwritten`,
    );
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, scaffold, "utf8");
  console.error(`Output written to: ${outputPath}`);
  console.log(outputPath);
  return 0;
}
