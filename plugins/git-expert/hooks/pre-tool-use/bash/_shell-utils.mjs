import { homedir } from "os";
import { resolve } from "path";

const COMMAND_SEPARATORS = new Set(["&&", "||", ";", "|"]);
const GIT_GLOBAL_OPTIONS_WITH_VALUE = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--exec-path",
  "--config-env",
]);

function resolvePathToken(pathToken, baseCwd) {
  if (!pathToken) return baseCwd;
  if (pathToken === "~") return homedir();
  if (pathToken.startsWith("~/")) return resolve(homedir(), pathToken.slice(2));
  return resolve(baseCwd, pathToken);
}

function collectGitInvocations(tokens, subcommand) {
  const invocations = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] !== "git") continue;

    let j = i + 1;
    while (j < tokens.length && !COMMAND_SEPARATORS.has(tokens[j])) {
      const token = tokens[j];

      if (subcommand && token === subcommand) {
        const args = [];
        for (let k = j + 1; k < tokens.length && !COMMAND_SEPARATORS.has(tokens[k]); k += 1) {
          args.push(tokens[k]);
        }
        invocations.push(args);
        break;
      }

      if (token === "-C" && tokens[j + 1]) {
        j += 2;
        continue;
      }
      if (token.startsWith("-C") && token.length > 2) {
        j += 1;
        continue;
      }
      if (GIT_GLOBAL_OPTIONS_WITH_VALUE.has(token)) {
        j += 2;
        continue;
      }
      if (token.startsWith("--config-env=")) {
        j += 1;
        continue;
      }
      if (token.startsWith("-")) {
        j += 1;
        continue;
      }

      break;
    }
  }

  return invocations;
}

export function tokenizeShell(command) {
  const tokens = [];
  let current = "";
  let quote = null;
  let escaped = false;

  const pushCurrent = () => {
    if (current !== "") {
      tokens.push(current);
      current = "";
    }
  };

  for (let i = 0; i < command.length; i += 1) {
    const char = command[i];
    const next = command[i + 1];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (quote) {
      if (quote === "\"" && char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) {
        quote = null;
        continue;
      }
      current += char;
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (/\s/.test(char)) {
      pushCurrent();
      continue;
    }

    if (char === "&" && next === "&") {
      pushCurrent();
      tokens.push("&&");
      i += 1;
      continue;
    }

    if (char === "|" && next === "|") {
      pushCurrent();
      tokens.push("||");
      i += 1;
      continue;
    }

    if (char === ";" || char === "|") {
      pushCurrent();
      tokens.push(char);
      continue;
    }

    current += char;
  }

  pushCurrent();
  return tokens;
}

export function findGitSubcommandInvocations(command, subcommand) {
  return collectGitInvocations(tokenizeShell(command), subcommand);
}

export function extractCommandCwd(command, fallbackCwd = process.cwd()) {
  const tokens = tokenizeShell(command);
  let cwd = fallbackCwd;

  for (let i = 0; i < tokens.length - 2; i += 1) {
    if (tokens[i] === "cd" && tokens[i + 1] && COMMAND_SEPARATORS.has(tokens[i + 2])) {
      cwd = resolvePathToken(tokens[i + 1], cwd);
      break;
    }
    if (tokens[i] === "git") break;
  }

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] !== "git") continue;

    for (let j = i + 1; j < tokens.length && !COMMAND_SEPARATORS.has(tokens[j]); j += 1) {
      const token = tokens[j];

      if (token === "-C" && tokens[j + 1]) {
        return resolvePathToken(tokens[j + 1], cwd);
      }
      if (token.startsWith("-C") && token.length > 2) {
        return resolvePathToken(token.slice(2), cwd);
      }
      if (!token.startsWith("-")) {
        break;
      }
      if (GIT_GLOBAL_OPTIONS_WITH_VALUE.has(token)) {
        j += 1;
      }
    }
  }

  return cwd;
}

export function hasShortFlag(token, flag) {
  return /^-[^-]/.test(token) && token.includes(flag);
}

export function quoteShellArg(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
