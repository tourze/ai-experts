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
