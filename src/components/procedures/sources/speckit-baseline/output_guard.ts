import fs from "node:fs";

export function assertOutputWritable(
  outputPath: any,
  overwrite: any = false,
): any {
  if (fs.existsSync(outputPath) && !overwrite) {
    throw new Error(
      `output file already exists: ${outputPath}; pass --overwrite only after confirming it can be replaced`,
    );
  }
}
