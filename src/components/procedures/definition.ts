import type {
  Platform as SdkPlatform,
  ProcedureArgsDefinition,
  ProcedureDefinition,
  ProcedureOutputDefinition,
} from "../sdk";

export { Platform, defineProcedureOutput };

const Platform = {
  Claude: "claude-code" as SdkPlatform,
  Codex: "codex-cli" as SdkPlatform,
} as const;

function defineProcedure<
  TArgs extends object = object,
  TResult extends object = object,
>(
  definition: ProcedureDefinition<TArgs, TResult>,
): ProcedureDefinition<TArgs, TResult> {
  return definition;
}

function defineProcedureArgs<TArgs>(
  definition: ProcedureArgsDefinition<TArgs>,
): ProcedureArgsDefinition<TArgs> {
  return definition;
}

function defineProcedureOutput<TResult>(
  definition: ProcedureOutputDefinition<TResult>,
): ProcedureOutputDefinition<TResult> {
  return definition;
}

export type CliProcedureRequest = {
  args?: readonly string[];
};

export type RuntimeProcedureResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const cliProcedureArgs = defineProcedureArgs<CliProcedureRequest>({
  typeName: "CliProcedureRequest",
  fields: {
    args: {
      type: "string[]",
      required: false,
      description: "传给 procedure CLI 的 argv 参数。",
    },
  },
});

export const runtimeProcedureOutput = defineProcedureOutput<RuntimeProcedureResult>({
  typeName: "RuntimeProcedureResult",
  fields: {
    exitCode: {
      type: "number",
      description: "子进程退出码。",
    },
    stdout: {
      type: "string",
      description: "procedure 标准输出。",
    },
    stderr: {
      type: "string",
      description: "procedure 标准错误。",
    },
  },
});

type CliProcedureDefinition = Omit<
  ProcedureDefinition<CliProcedureRequest, RuntimeProcedureResult>,
  "args" | "output"
> & Partial<Pick<ProcedureDefinition<CliProcedureRequest, RuntimeProcedureResult>, "args" | "output">>;

export function defineCliProcedure(
  definition: CliProcedureDefinition,
): ProcedureDefinition<CliProcedureRequest, RuntimeProcedureResult> {
  const normalizedParams = definition.params?.map((param) => ({
    ...param,
    type: param.type.trim() === "" ? "布尔" : param.type,
  }));

  return defineProcedure({
    args: cliProcedureArgs,
    output: runtimeProcedureOutput,
    ...definition,
    ...(normalizedParams ? { params: normalizedParams } : {}),
  });
}

export function procedureEntry(metaUrl: string): URL {
  const url = new URL(metaUrl);
  if (url.pathname.endsWith(".js")) {
    url.pathname = `${url.pathname.slice(0, -3)}.ts`;
  }
  return url;
}
