import { existsSync } from "node:fs";

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
