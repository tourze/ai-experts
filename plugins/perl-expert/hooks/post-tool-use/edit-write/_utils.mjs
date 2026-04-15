import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

const isWin = process.platform === "win32";

export function cmd(name) {
  return isWin ? `${name}.exe` : name;
}

export function hasCommand(name) {
  try {
    execFileSync(cmd(name), ["--version"], { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function getBaseName(filePath) {
  return basename(filePath.replaceAll("\\", "/"));
}

export function getLowerBaseName(filePath) {
  return getBaseName(filePath).toLowerCase();
}

/** 按扩展名匹配 */
export function matchExt(filePath, exts) {
  const ext = extname(getBaseName(filePath)).toLowerCase();
  return exts instanceof Set ? exts.has(ext) : exts.includes(ext);
}

/** 按文件名匹配（如 "Makefile.PL", "cpanfile"） */
export function matchName(filePath, names) {
  const fileName = getBaseName(filePath);
  const lowerFileName = fileName.toLowerCase();
  if (names instanceof Set) {
    return names.has(fileName) || names.has(lowerFileName);
  }
  return names.includes(fileName) || names.includes(lowerFileName);
}

/** 路径中是否包含指定目录段 */
export function pathContains(filePath, segment) {
  const normalized = filePath.replaceAll("\\", "/");
  return normalized.includes(`/${segment}/`);
}

/** 从文件所在目录向上查找配置文件，返回所在目录或 null */
export function findUp(startPath, fileNames) {
  let dir = dirname(resolve(startPath));
  while (true) {
    for (const name of fileNames) {
      if (existsSync(join(dir, name))) return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function countLines(text) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();
  return lines.length;
}
