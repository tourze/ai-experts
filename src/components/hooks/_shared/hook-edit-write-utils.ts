import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { basename, dirname, extname, join, resolve } from "path";

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

export function matchExt(filePath, exts) {
  return exts.includes(extname(filePath).toLowerCase());
}

export function matchName(filePath, names) {
  return names.includes(basename(filePath));
}

export function pathContains(filePath, segment) {
  const normalized = filePath.replaceAll("\\", "/");
  return normalized.includes(`/${segment}/`);
}

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

export function getLowerBaseName(filePath) {
  return basename(filePath.replaceAll("\\", "/")).toLowerCase();
}

export function countLines(text) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();
  return lines.length;
}

const CPP_SOURCE_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cxx",
  ".h",
  ".hh",
  ".hpp",
  ".hxx",
  ".ipp",
  ".tpp",
  ".inl",
  ".ixx",
  ".cppm",
]);

const CPP_RELATED_TEXT_EXTENSIONS = new Set([
  ...CPP_SOURCE_EXTENSIONS,
  ".cmake",
  ".md",
  ".rst",
  ".txt",
]);

const CPP_RELATED_TEXT_FILE_NAMES = new Set([
  "cmakelists.txt",
  "makefile",
  "gnumakefile",
  ".clang-format",
  ".clang-tidy",
  ".editorconfig",
  ".gitignore",
]);

const CPP_BUDGET_BY_EXTENSION = {
  ".c": 800,
  ".cc": 800,
  ".cpp": 800,
  ".cxx": 800,
  ".h": 500,
  ".hh": 500,
  ".hpp": 500,
  ".hxx": 500,
  ".ipp": 400,
  ".tpp": 400,
  ".inl": 300,
  ".ixx": 500,
  ".cppm": 500,
  ".cmake": 300,
};

const CPP_BUDGET_BY_FILE_NAME = {
  "cmakelists.txt": 300,
  "makefile": 300,
  "gnumakefile": 300,
};

export function isCppSourceFile(filePath) {
  return CPP_SOURCE_EXTENSIONS.has(extname(filePath).toLowerCase());
}

export function shouldCheckCppTextFile(filePath) {
  const baseName = getLowerBaseName(filePath);
  return (
    CPP_RELATED_TEXT_FILE_NAMES.has(baseName) ||
    CPP_RELATED_TEXT_EXTENSIONS.has(extname(baseName))
  );
}

export function getCppBudget(filePath) {
  const baseName = getLowerBaseName(filePath);
  return CPP_BUDGET_BY_FILE_NAME[baseName] ?? CPP_BUDGET_BY_EXTENSION[extname(baseName)] ?? null;
}
