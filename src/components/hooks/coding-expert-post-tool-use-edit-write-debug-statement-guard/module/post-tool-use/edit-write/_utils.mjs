import { basename, extname } from "path";
import { execFileSync } from "child_process";

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

export const CPP_SOURCE_EXTENSIONS = new Set([
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

export function getLowerBaseName(filePath) {
  return basename(filePath.replaceAll("\\", "/")).toLowerCase();
}

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

export function matchExt(filePath, exts) {
  return exts.includes(extname(filePath).toLowerCase());
}

export function countLines(text) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/u);
  if (lines.at(-1) === "") lines.pop();
  return lines.length;
}
