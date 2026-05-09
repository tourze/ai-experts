import { existsSync } from "node:fs";

export function assertOutputWritable(
  outputPath: any,
  overwrite: any = false,
): any {
  if (existsSync(outputPath) && !overwrite) {
    throw new Error(
      `output file already exists: ${outputPath}; pass --overwrite only after confirming it can be replaced`,
    );
  }
}

export function assertOutputFilesWritable(
  outputPaths: readonly any[],
  overwrite: any = false,
): any {
  for (const outputPath of outputPaths) {
    assertOutputWritable(outputPath, overwrite);
  }
}
