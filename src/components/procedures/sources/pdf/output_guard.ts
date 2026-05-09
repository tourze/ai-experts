import { existsSync } from "node:fs";

export type OverwriteArgs = {
  error?: string;
  help?: boolean;
  overwrite: boolean;
  positional: string[];
};

export function parseOverwriteArgs(
  argv: readonly string[],
  positionalCount: number,
): OverwriteArgs {
  const positional: string[] = [];
  let overwrite = false;

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      return { help: true, overwrite, positional };
    }
    if (arg === "--overwrite") {
      overwrite = true;
    } else if (arg.startsWith("-")) {
      return {
        error: `Unknown option: ${arg}`,
        overwrite,
        positional,
      };
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== positionalCount) {
    return {
      error: "Invalid arguments",
      overwrite,
      positional,
    };
  }

  return { overwrite, positional };
}

export function assertOutputWritable(
  outputPath: string,
  overwrite = false,
): void {
  if (existsSync(outputPath) && !overwrite) {
    throw new Error(
      `output file already exists: ${outputPath}; pass --overwrite only after confirming it can be replaced`,
    );
  }
}

export function assertOutputFilesWritable(
  outputPaths: readonly string[],
  overwrite = false,
): void {
  for (const outputPath of outputPaths) {
    assertOutputWritable(outputPath, overwrite);
  }
}
