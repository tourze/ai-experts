import { homedir } from "os";
import { resolve } from "path";

const COMMAND_SEPARATORS = new Set(["&&", "||", ";", "|"]);
const SVN_GLOBAL_OPTIONS_WITH_VALUE = new Set([
  "--config-dir",
  "--config-option",
  "--password",
  "--username",
]);

function resolvePathToken(pathToken, baseCwd) {
  if (!pathToken) return baseCwd;
  if (pathToken === "~") return homedir();
  if (pathToken.startsWith("~/")) return resolve(homedir(), pathToken.slice(2));
  return resolve(baseCwd, pathToken);
}

function normalizeSubcommands(subcommands) {
  const input = Array.isArray(subcommands) ? subcommands : [subcommands];
  const aliases = new Map();

  for (const subcommand of input) {
    if (subcommand === "commit") {
      aliases.set("commit", "commit");
      aliases.set("ci", "commit");
      continue;
    }
    aliases.set(subcommand, subcommand);
  }

  return aliases;
}

function collectSvnInvocations(tokens, aliases) {
  const invocations = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] !== "svn") continue;

    let j = i + 1;
    while (j < tokens.length && !COMMAND_SEPARATORS.has(tokens[j])) {
      const token = tokens[j];
      const canonical = aliases.get(token);

      if (canonical) {
        const args = [];
        for (let k = j + 1; k < tokens.length && !COMMAND_SEPARATORS.has(tokens[k]); k += 1) {
          args.push(tokens[k]);
        }
        invocations.push({ subcommand: canonical, args });
        break;
      }

      if (SVN_GLOBAL_OPTIONS_WITH_VALUE.has(token) && tokens[j + 1]) {
        j += 2;
        continue;
      }

      if (token.startsWith("--config-dir=") || token.startsWith("--config-option=")) {
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

export function findSvnSubcommandInvocations(command, subcommands) {
  const aliases = normalizeSubcommands(subcommands);
  return collectSvnInvocations(tokenizeShell(command), aliases).map((item) => item.args);
}

export function extractCommandCwd(command, fallbackCwd = process.cwd()) {
  const tokens = tokenizeShell(command);
  let cwd = fallbackCwd;

  for (let i = 0; i < tokens.length - 2; i += 1) {
    if (tokens[i] === "cd" && tokens[i + 1] && COMMAND_SEPARATORS.has(tokens[i + 2])) {
      cwd = resolvePathToken(tokens[i + 1], cwd);
      break;
    }
    if (tokens[i] === "svn") break;
  }

  return cwd;
}
