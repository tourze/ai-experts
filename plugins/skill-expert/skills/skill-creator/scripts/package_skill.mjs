#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, realpathSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import { validateSkill } from "./quick_validate.mjs";

const EXCLUDE_DIRS = new Set(["__pycache__", "node_modules"]);
const EXCLUDE_FILES = new Set([".DS_Store"]);
const ROOT_EXCLUDE_DIRS = new Set(["evals"]);

function toZipPath(path) {
  return path.split(sep).join("/");
}

export function shouldExclude(relativePath) {
  const parts = toZipPath(relativePath).split("/");
  if (parts.some((part) => EXCLUDE_DIRS.has(part))) {
    return true;
  }
  if (parts.length > 1 && ROOT_EXCLUDE_DIRS.has(parts[1])) {
    return true;
  }
  const name = parts.at(-1);
  if (EXCLUDE_FILES.has(name)) {
    return true;
  }
  return name.endsWith(".pyc");
}

function collectFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(date.getFullYear(), 1980);
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value & 0xffff, 0);
  return buffer;
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

export function writeZip(outputPath, entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf-8");
    const data = readFileSync(entry.path);
    const compressed = deflateRawSync(data);
    const checksum = crc32(data);
    const { time, date } = dosDateTime(statSync(entry.path).mtime);

    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0x0800),
      writeUInt16(8),
      writeUInt16(time),
      writeUInt16(date),
      writeUInt32(checksum),
      writeUInt32(compressed.length),
      writeUInt32(data.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      nameBuffer,
    ]);

    chunks.push(localHeader, compressed);
    central.push(Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0x0800),
      writeUInt16(8),
      writeUInt16(time),
      writeUInt16(date),
      writeUInt32(checksum),
      writeUInt32(compressed.length),
      writeUInt32(data.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      nameBuffer,
    ]));
    offset += localHeader.length + compressed.length;
  }

  const centralOffset = offset;
  const centralDirectory = Buffer.concat(central);
  const endRecord = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(centralOffset),
    writeUInt16(0),
  ]);

  writeFileSync(outputPath, Buffer.concat([...chunks, centralDirectory, endRecord]));
}

export function packageSkill(skillPath, outputDir = null) {
  const resolvedSkillPath = resolve(skillPath);
  if (!existsSync(resolvedSkillPath)) {
    console.log(`❌ 错误：未找到 skill 目录：${resolvedSkillPath}`);
    return null;
  }
  if (!statSync(resolvedSkillPath).isDirectory()) {
    console.log(`❌ 错误：路径不是目录：${resolvedSkillPath}`);
    return null;
  }
  if (!existsSync(join(resolvedSkillPath, "SKILL.md"))) {
    console.log(`❌ 错误：${resolvedSkillPath} 中未找到 SKILL.md`);
    return null;
  }

  console.log("🔍 正在校验 skill...");
  const [valid, message] = validateSkill(resolvedSkillPath);
  if (!valid) {
    console.log(`❌ 校验失败：${message}`);
    console.log("   请先修复校验错误，再进行打包。");
    return null;
  }
  console.log(`✅ ${message}\n`);

  const outputPath = outputDir ? resolve(outputDir) : process.cwd();
  mkdirSync(outputPath, { recursive: true });
  const skillFilename = join(outputPath, `${basename(resolvedSkillPath)}.skill`);

  try {
    const entries = [];
    for (const filePath of collectFiles(resolvedSkillPath)) {
      const archiveName = toZipPath(relative(dirname(resolvedSkillPath), filePath));
      if (shouldExclude(archiveName)) {
        console.log(`  已跳过：${archiveName}`);
        continue;
      }
      entries.push({ path: filePath, name: archiveName });
      console.log(`  已添加：${archiveName}`);
    }

    writeZip(skillFilename, entries);
    console.log(`\n✅ Skill 打包完成：${skillFilename}`);
    return skillFilename;
  } catch (error) {
    console.log(`❌ 创建 .skill 文件失败：${error.message}`);
    return null;
  }
}

function printUsage() {
  console.log("用法：node package_skill.mjs <path/to/skill-folder> [output-directory]");
  console.log("\n示例：");
  console.log("  node package_skill.mjs skills/public/my-skill");
  console.log("  node package_skill.mjs skills/public/my-skill ./dist");
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length < 1) {
    printUsage();
    return 1;
  }

  const skillPath = argv[0];
  const outputDir = argv[1] ?? null;
  console.log(`📦 正在打包 skill：${skillPath}`);
  if (outputDir) {
    console.log(`   输出目录：${outputDir}`);
  }
  console.log();

  return packageSkill(skillPath, outputDir) ? 0 : 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
