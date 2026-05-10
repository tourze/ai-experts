import {
  defineCliProcedure,
  defineProcedureOutput,
  runtimeProcedureOutput,
  type RuntimeProcedureResult,
  procedureEntry,
} from "../../definition";
import { readFileSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "typescript-type-safety-extract-ts-errors",
  entry: procedureEntry(import.meta.url),
  description: "把 tsc 输出按文件和错误码归组，便于先定位上游合同错误。",
  owners: { skillIds: ["typescript-type-safety"] },
  params: [
    {
      flag: "--input",
      type: "路径",
      description: "tsc --noEmit 输出文件路径（未提供时从 stdin 读取）",
      required: false,
    },
  ],
  output: defineProcedureOutput<RuntimeProcedureResult>({
    typeName: "ExtractTsErrorsSummary",
    fields: runtimeProcedureOutput.fields,
  }),

  exampleArgs: { args: ["--input", "tsc-output.txt"] },
});

export function parseInputPath(argv: readonly string[]): string | null {
  const inputFlag = argv.findIndex(
    (arg: any): any => arg === "--input" || arg === "-i",
  );
  if (inputFlag < 0) return null;
  const value = argv[inputFlag + 1];
  if (value == null || value.startsWith("-")) {
    throw new Error(`${argv[inputFlag]} requires a value`);
  }
  return value;
}

export function main(argv: readonly string[]): any {
  type Diagnostic = {
    file: string;
    line: number;
    column: number;
    code: string;
    message: string;
  };
  type Summary = {
    total: number;
    byCode: Record<string, number>;
    byFile: Record<string, number>;
    diagnostics: Diagnostic[];
  };
  function readInput(argv: readonly string[]): string {
    const inputPath = parseInputPath(argv);
    return inputPath ? readFileSync(inputPath, "utf-8") : readFileSync(0, "utf-8");
  }
  function parseDiagnostics(text: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pattern = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/u;
    for (const line of text.split(/\r?\n/u)) {
      const match = line.match(pattern);
      if (!match) continue;
      diagnostics.push({
        file: match[1],
        line: Number(match[2]),
        column: Number(match[3]),
        code: match[4],
        message: match[5].trim(),
      });
    }
    return diagnostics;
  }
  function summarize(diagnostics: Diagnostic[]): Summary {
    const byCode: Record<string, number> = {};
    const byFile: Record<string, number> = {};
    for (const diagnostic of diagnostics) {
      byCode[diagnostic.code] = (byCode[diagnostic.code] ?? 0) + 1;
      byFile[diagnostic.file] = (byFile[diagnostic.file] ?? 0) + 1;
    }
    return {
      total: diagnostics.length,
      byCode,
      byFile,
      diagnostics,
    };
  }
  let text;
  try {
    text = readInput(argv);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(summarize(parseDiagnostics(text)), null, 2));
}
