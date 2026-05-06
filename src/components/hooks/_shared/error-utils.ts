export type ErrorLikeRecord = Record<string, unknown>;

function asRecord(value: unknown): ErrorLikeRecord | null {
  return typeof value === "object" && value !== null ? (value as ErrorLikeRecord) : null;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Buffer.isBuffer(value)) return value.toString("utf-8");
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf-8");
  return "";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  const record = asRecord(error);
  if (record) {
    const message = toText(record.message);
    if (message) return message;
  }

  return String(error);
}

export function getExecOutput(error: unknown): string {
  const record = asRecord(error);
  if (!record) return "";

  const stdout = toText(record.stdout);
  const stderr = toText(record.stderr);
  if (stdout || stderr) return `${stdout}${stderr}`;

  if (Array.isArray(record.output)) {
    return record.output.map((entry) => toText(entry)).join("");
  }

  return "";
}

export function getErrorStatus(error: unknown): number | null | undefined {
  const record = asRecord(error);
  if (!record) return undefined;

  const { status } = record;
  if (typeof status === "number" || status === null) return status;
  return undefined;
}

export function getErrorCode(error: unknown): string | number | undefined {
  const record = asRecord(error);
  if (!record) return undefined;

  const { code } = record;
  if (typeof code === "string" || typeof code === "number") return code;
  return undefined;
}
