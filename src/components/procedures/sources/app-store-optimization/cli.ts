import { readFileSync } from "node:fs";

type AnyRecord = Record<string, any>;

function parseJsonObject(raw: string, source: string): AnyRecord {
  const parsed = JSON.parse(raw);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${source} must contain a JSON object`);
  }
  return parsed as AnyRecord;
}

function optionValue(
  argv: readonly string[],
  names: readonly string[],
): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    if (!names.includes(argv[index])) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argv[index]} requires a value`);
    }
    return value;
  }
  return null;
}

export function readProcedureRequest(argv: readonly string[]): AnyRecord {
  const envRaw = process.env.AI_EXPERTS_PROCEDURE_REQUEST_JSON;
  const request =
    envRaw && envRaw.trim()
      ? parseJsonObject(envRaw, "AI_EXPERTS_PROCEDURE_REQUEST_JSON")
      : {};

  const inputFile = optionValue(argv, ["--input", "-i"]);
  if (!inputFile) return request;

  return {
    ...request,
    ...parseJsonObject(readFileSync(inputFile, "utf-8"), inputFile),
  };
}

export function getField<TValue>(
  request: AnyRecord,
  names: readonly string[],
  defaultValue?: TValue,
): TValue {
  for (const name of names) {
    if (request[name] !== undefined) return request[name] as TValue;
  }
  if (arguments.length >= 3) return defaultValue as TValue;
  throw new Error(`missing required JSON field: ${names.join(" | ")}`);
}

export function getRecord(
  request: AnyRecord,
  names: readonly string[],
  defaultValue?: AnyRecord,
): AnyRecord {
  const value = getField<unknown>(request, names, defaultValue);
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${names[0]} must be a JSON object`);
  }
  return value as AnyRecord;
}

export function getArray<TValue = any>(
  request: AnyRecord,
  names: readonly string[],
  defaultValue?: TValue[],
): TValue[] {
  const value = getField<unknown>(request, names, defaultValue);
  if (!Array.isArray(value)) {
    throw new Error(`${names[0]} must be a JSON array`);
  }
  return value as TValue[];
}

export function getString(
  request: AnyRecord,
  names: readonly string[],
  defaultValue?: string,
): string {
  const value = getField<unknown>(request, names, defaultValue);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${names[0]} must be a non-empty string`);
  }
  return value;
}

export function getNumber(
  request: AnyRecord,
  names: readonly string[],
  defaultValue?: number,
): number {
  const value = getField<unknown>(request, names, defaultValue);
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${names[0]} must be a finite number`);
  }
  return numberValue;
}

export function runJsonProcedure(
  argv: readonly string[],
  handler: (request: AnyRecord) => unknown,
): number {
  try {
    if (argv.includes("--help") || argv.includes("-h")) {
      console.log(
        "Pass procedure input as --request-json or --input <json-file>.",
      );
      return 0;
    }
    const result = handler(readProcedureRequest(argv));
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}
