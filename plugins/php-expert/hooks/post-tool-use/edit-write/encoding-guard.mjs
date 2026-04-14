/**
 * 文件编码检查 hook（PostToolUse — Edit|Write）
 *
 * php-expert 插件版本：
 * - 检查 PHP / Composer / 配置 / 文档常见文本文件的 BOM 与非 UTF-8 字节
 * - 仅提醒，不阻塞提交
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, extname } from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".php", ".phtml", ".inc", ".module", ".phpt",
  ".json", ".lock", ".xml", ".yaml", ".yml", ".neon", ".ini", ".dist",
  ".env", ".md", ".txt", ".rst", ".adoc",
  ".js", ".mjs", ".cjs", ".ts", ".tsx",
  ".sh", ".bash", ".zsh",
]);

const TEXT_FILE_NAMES = new Set([
  "composer.json",
  "composer.lock",
  "phpunit.xml",
  "phpunit.xml.dist",
  "phpstan.neon",
  "phpstan.neon.dist",
  ".gitignore",
  ".editorconfig",
]);

const TEXT_SUFFIXES = [".blade.php"];

const BOM_SIGNATURES = [
  { name: "UTF-8 BOM", bytes: [0xEF, 0xBB, 0xBF] },
  { name: "UTF-16 LE BOM", bytes: [0xFF, 0xFE] },
  { name: "UTF-16 BE BOM", bytes: [0xFE, 0xFF] },
  { name: "UTF-32 LE BOM", bytes: [0xFF, 0xFE, 0x00, 0x00] },
  { name: "UTF-32 BE BOM", bytes: [0x00, 0x00, 0xFE, 0xFF] },
];

function shouldCheck(filePath) {
  const normalizedPath = filePath.replaceAll("\\", "/").toLowerCase();
  const baseName = basename(normalizedPath);

  if (TEXT_FILE_NAMES.has(baseName)) return true;
  if (baseName === ".env" || baseName.startsWith(".env.")) return true;
  if (TEXT_SUFFIXES.some((suffix) => normalizedPath.endsWith(suffix))) return true;

  const ext = extname(baseName);
  return !ext || TEXT_EXTENSIONS.has(ext);
}

function findInvalidUtf8(buffer) {
  const positions = [];
  let index = 0;

  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    index = 3;
  }

  while (index < buffer.length && positions.length < 20) {
    const byte = buffer[index];

    if (byte <= 0x7F) {
      index += 1;
      continue;
    }

    if ((byte & 0xE0) === 0xC0) {
      if (index + 1 >= buffer.length || (buffer[index + 1] & 0xC0) !== 0x80) {
        positions.push(index);
        index += 1;
        continue;
      }
      const codePoint = ((byte & 0x1F) << 6) | (buffer[index + 1] & 0x3F);
      if (codePoint < 0x80) {
        positions.push(index);
      }
      index += 2;
      continue;
    }

    if ((byte & 0xF0) === 0xE0) {
      if (
        index + 2 >= buffer.length ||
        (buffer[index + 1] & 0xC0) !== 0x80 ||
        (buffer[index + 2] & 0xC0) !== 0x80
      ) {
        positions.push(index);
        index += 1;
        continue;
      }
      const codePoint =
        ((byte & 0x0F) << 12) |
        ((buffer[index + 1] & 0x3F) << 6) |
        (buffer[index + 2] & 0x3F);
      if (codePoint < 0x800) {
        positions.push(index);
      }
      index += 3;
      continue;
    }

    if ((byte & 0xF8) === 0xF0) {
      if (
        index + 3 >= buffer.length ||
        (buffer[index + 1] & 0xC0) !== 0x80 ||
        (buffer[index + 2] & 0xC0) !== 0x80 ||
        (buffer[index + 3] & 0xC0) !== 0x80
      ) {
        positions.push(index);
        index += 1;
        continue;
      }
      const codePoint =
        ((byte & 0x07) << 18) |
        ((buffer[index + 1] & 0x3F) << 12) |
        ((buffer[index + 2] & 0x3F) << 6) |
        (buffer[index + 3] & 0x3F);
      if (codePoint < 0x10000 || codePoint > 0x10FFFF) {
        positions.push(index);
      }
      index += 4;
      continue;
    }

    positions.push(index);
    index += 1;
  }

  return positions;
}

function detectBom(buffer) {
  return BOM_SIGNATURES.find((signature) => (
    buffer.length >= signature.bytes.length &&
    signature.bytes.every((value, index) => buffer[index] === value)
  )) ?? null;
}

function formatLineNumber(buffer, position) {
  let line = 1;

  for (let index = 0; index < position && index < buffer.length; index += 1) {
    if (buffer[index] === 0x0A) {
      line += 1;
    }
  }

  return `行 ${line} (偏移 0x${position.toString(16).toUpperCase()}: 0x${buffer[position].toString(16).toUpperCase().padStart(2, "0")})`;
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!shouldCheck(filePath)) return null;

  const buffer = readFileSync(filePath);
  if (buffer.length === 0) return null;

  const issues = [];
  const bom = detectBom(buffer);

  if (bom) {
    issues.push(
      `检测到 ${bom.name}（${bom.bytes.map((value) => `0x${value.toString(16).toUpperCase()}`).join(" ")}）— 推荐使用无 BOM 的 UTF-8`,
    );
  }

  const shouldScanUtf8 = !bom || bom.name === "UTF-8 BOM";
  if (shouldScanUtf8) {
    const invalidPositions = findInvalidUtf8(buffer);
    if (invalidPositions.length > 0) {
      const details = invalidPositions
        .slice(0, 5)
        .map((position) => formatLineNumber(buffer, position))
        .join("、");
      const suffix = invalidPositions.length > 5 ? ` 等共 ${invalidPositions.length} 处` : "";
      issues.push(`发现非 UTF-8 字节序列：${details}${suffix}`);
    }
  }

  if (issues.length === 0) return null;

  return {
    decision: "report",
    reason: [
      `[Encoding Guard] ${filePath} 存在编码问题：`,
      ...issues.map((issue) => `  • ${issue}`),
      "",
      "建议统一为无 BOM 的 UTF-8，避免 Composer / PHP / Shell 在跨平台环境下出现隐性解析问题。",
    ].join("\n"),
  };
}
