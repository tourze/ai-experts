import { homedir } from "os";
import { resolve } from "path";

const COMMAND_SEPARATORS = new Set(["&&", "||", ";", "|"]);

const GIT_GLOBAL_OPTIONS_WITH_VALUE = new Set(["-C", "--git-dir", "--work-tree", "-c", "--config-env"]);

function collectCommandInvocations(
  tokens: readonly string[],
  cmdName: string,
  subcommand: string,
  globalOptionsWithValue: ReadonlySet<string> = new Set(),
): string[][] {
  const invocations: string[][] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] !== cmdName) continue;

    let j = i + 1;
    while (j < tokens.length && !COMMAND_SEPARATORS.has(tokens[j])) {
      const token = tokens[j];

      if (token === subcommand) {
        const args = [];
        for (let k = j + 1; k < tokens.length && !COMMAND_SEPARATORS.has(tokens[k]); k += 1) {
          args.push(tokens[k]);
        }
        invocations.push(args);
        break;
      }

      if (globalOptionsWithValue.has(token) && tokens[j + 1]) {
        j += 2;
        continue;
      }

      if (token.startsWith("--git-dir=") || token.startsWith("--work-tree=")) {
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

export function findGitSubcommandInvocations(command: string, subcommand: string): string[][] {
  return collectCommandInvocations(tokenizeShell(command), "git", subcommand, GIT_GLOBAL_OPTIONS_WITH_VALUE);
}

export function findSvnSubcommandInvocations(command: string, subcommand: string): string[][] {
  return collectCommandInvocations(tokenizeShell(command), "svn", subcommand);
}

export function hasShortFlag(token: string, flag: string): boolean {
  if (!token.startsWith("-") || token.startsWith("--")) return false;
  return token.slice(1).includes(flag);
}

export function quoteShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

function resolvePathToken(pathToken: string | null | undefined, baseCwd: string): string {
  if (!pathToken) return baseCwd;
  if (pathToken === "~") return homedir();
  if (pathToken.startsWith("~/")) return resolve(homedir(), pathToken.slice(2));
  return resolve(baseCwd, pathToken);
}

export function tokenizeShell(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | "\"" | null = null;
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

export function extractCommandCwd(command: string, fallbackCwd = process.cwd()): string {
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
