/**
 * 文件编码检查 hook（PostToolUse — Edit|Write）
 *
 * 检测 Perl 相关文本文件中的 BOM 与非 UTF-8 字节序列。
 * 不阻塞（decision: "report"），仅作为提醒。
 */

import { existsSync, readFileSync } from "node:fs";
import { matchExt, matchName } from "./_utils.mjs";

const TEXT_EXTENSIONS = [
  ".pl",
  ".pm",
  ".t",
  ".psgi",
  ".pod",
  ".xs",
  ".yml",
  ".yaml",
  ".json",
  ".toml",
  ".ini",
  ".cfg",
  ".md",
  ".txt",
  ".sh",
  ".bash",
  ".zsh",
];

const TEXT_FILE_NAMES = [
  ".env",
  ".env.example",
  ".env.local",
  ".gitignore",
  ".editorconfig",
  ".perlcriticrc",
  ".perltidyrc",
  "cpanfile",
  "cpanfile.snapshot",
  "Makefile.PL",
  "Build.PL",
  "dist.ini",
  "META.json",
  "META.yml",
  "MYMETA.json",
  "MYMETA.yml",
  "Changes",
  "MANIFEST",
  "MANIFEST.SKIP",
];

const BOM_SIGNATURES = [
  { name: "UTF-32 LE BOM", bytes: [0xFF, 0xFE, 0x00, 0x00] },
  { name: "UTF-32 BE BOM", bytes: [0x00, 0x00, 0xFE, 0xFF] },
  { name: "UTF-8 BOM", bytes: [0xEF, 0xBB, 0xBF] },
  { name: "UTF-16 LE BOM", bytes: [0xFF, 0xFE] },
  { name: "UTF-16 BE BOM", bytes: [0xFE, 0xFF] },
];

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  if (!matchExt(filePath, TEXT_EXTENSIONS) && !matchName(filePath, TEXT_FILE_NAMES)) {
    return null;
  }

  const buf = readFileSync(filePath);
  if (buf.length === 0) return null;

  const issues = [];

  // ── 1. BOM 检测 ──
  for (const sig of BOM_SIGNATURES) {
    if (buf.length >= sig.bytes.length && sig.bytes.every((b, i) => buf[i] === b)) {
      issues.push(`检测到 ${sig.name}（${sig.bytes.map((b) => "0x" + b.toString(16).toUpperCase()).join(" ")}）— 现代项目通常使用无 BOM 的 UTF-8`);
      break;
    }
  }

  // ── 2. 非 UTF-8 字节序列检测 ──
  const isNonUtf8Bom = issues.length > 0 && !issues[0].startsWith("检测到 UTF-8");
  if (!isNonUtf8Bom) {
    const invalidPositions = findInvalidUtf8(buf);
    if (invalidPositions.length > 0) {
      const lineNumbers = invalidPositions.slice(0, 5).map((pos) => {
        let line = 1;
        for (let i = 0; i < pos && i < buf.length; i++) {
          if (buf[i] === 0x0A) line++;
        }
        return `行 ${line} (偏移 0x${pos.toString(16).toUpperCase()}: 0x${buf[pos].toString(16).toUpperCase().padStart(2, "0")})`;
      });
      const suffix = invalidPositions.length > 5 ? ` 等共 ${invalidPositions.length} 处` : "";
      issues.push(`发现非 UTF-8 字节序列：${lineNumbers.join("、")}${suffix}`);
    }
  }

  if (issues.length > 0) {
    return {
      decision: "report",
      reason: [
        `⚠️ ${filePath} 存在编码问题：`,
        ...issues.map((i) => `  • ${i}`),
        "",
        "建议统一使用无 BOM 的 UTF-8，并在 Perl 源文件头部声明 use utf8; 以确保跨平台一致性。",
      ].join("\n"),
    };
  }
  return null;
}

/**
 * 扫描 Buffer 中不符合 UTF-8 编码规则的字节位置。
 * 只返回前 20 个位置，避免大文件下数组膨胀。
 */
function findInvalidUtf8(buffer) {
  const positions = [];
  let i = 0;
  // 跳过 UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    i = 3;
  }
  while (i < buffer.length && positions.length < 20) {
    const b = buffer[i];
    if (b <= 0x7F) {
      i++;
    } else if ((b & 0xE0) === 0xC0) {
      if (i + 1 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80) {
        positions.push(i); i++; continue;
      }
      const cp = ((b & 0x1F) << 6) | (buffer[i + 1] & 0x3F);
      if (cp < 0x80) { positions.push(i); i += 2; continue; }
      i += 2;
    } else if ((b & 0xF0) === 0xE0) {
      if (i + 2 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80) {
        positions.push(i); i++; continue;
      }
      const cp = ((b & 0x0F) << 12) | ((buffer[i + 1] & 0x3F) << 6) | (buffer[i + 2] & 0x3F);
      if (cp < 0x800) { positions.push(i); i += 3; continue; }
      i += 3;
    } else if ((b & 0xF8) === 0xF0) {
      if (i + 3 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80 || (buffer[i + 3] & 0xC0) !== 0x80) {
        positions.push(i); i++; continue;
      }
      const cp = ((b & 0x07) << 18) | ((buffer[i + 1] & 0x3F) << 12) | ((buffer[i + 2] & 0x3F) << 6) | (buffer[i + 3] & 0x3F);
      if (cp < 0x10000 || cp > 0x10FFFF) { positions.push(i); i += 4; continue; }
      i += 4;
    } else {
      positions.push(i);
      i++;
    }
  }
  return positions;
}
