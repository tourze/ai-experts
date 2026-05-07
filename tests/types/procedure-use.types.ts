import {
  defineProcedure,
  defineProcedureArgs,
  defineProcedureOutput,
} from "../../src/components/sdk";
import { procedureUse } from "../../src/components/scripts/index";

type TypedProcedureArgs = {
  inputPath: string;
  json?: boolean;
};

type TypedProcedureResult = {
  outputPath: string;
  warnings: readonly string[];
};

const typedProcedure = defineProcedure<TypedProcedureArgs, TypedProcedureResult>({
  id: "typed-procedure-fixture",
  entry: new URL("../../src/components/scripts/sources/debug-methodology/debug-checklist.ts", import.meta.url),
  description: "Fixture procedure for compile-time procedureUse checks.",
  owners: { skillIds: ["debug-methodology"] },
  args: defineProcedureArgs<TypedProcedureArgs>({
    typeName: "TypedProcedureArgs",
    fields: {
      inputPath: { type: "file", description: "输入文件。" },
      json: { type: "boolean", required: false, description: "是否输出 JSON。" },
    },
  }),
  output: defineProcedureOutput<TypedProcedureResult>({
    typeName: "TypedProcedureResult",
    fields: {
      outputPath: { type: "file", description: "输出文件。" },
      warnings: { type: "string[]", description: "警告列表。" },
    },
  }),
});

procedureUse(typedProcedure, {
  exampleArgs: {
    inputPath: "input.json",
    json: true,
  },
  expectedOutput: {
    outputPath: "output.json",
  },
});

// @ts-expect-error inputPath is required by TypedProcedureArgs.
procedureUse(typedProcedure, {
  exampleArgs: {
    json: true,
  },
});

// @ts-expect-error json must stay boolean when the procedure args type changes.
procedureUse(typedProcedure, {
  exampleArgs: {
    inputPath: "input.json",
    json: "true",
  },
});

// @ts-expect-error expectedOutput is tied to TypedProcedureResult fields.
procedureUse(typedProcedure, {
  expectedOutput: {
    missing: true,
  },
});
