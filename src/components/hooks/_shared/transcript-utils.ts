import { existsSync, readFileSync } from "node:fs";

type TranscriptContentItem = {
  type?: string;
  text?: string;
  tool_use_id?: string;
  [key: string]: unknown;
};

type TranscriptRecord = {
  type?: string;
  promptId?: string;
  isSidechain?: boolean;
  message?: {
    content?: string | TranscriptContentItem[];
    [key: string]: unknown;
  };
  payload?: {
    type?: string;
    role?: string;
    content?: string | TranscriptContentItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function parseTranscript(path: string): TranscriptRecord[] | null {
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    return null;
  }

  const records: TranscriptRecord[] = [];
  for (const line of content.split("\n")) {
    if (!line) {
      continue;
    }
    try {
      records.push(JSON.parse(line) as TranscriptRecord);
    } catch {
      // Skip damaged tail lines.
    }
  }
  return records;
}

export function isToolResultUserRecord(record: TranscriptRecord): boolean {
  if (record?.type !== "user") {
    return false;
  }

  const content = record.message?.content;
  if (typeof content === "string") {
    return false;
  }
  if (!Array.isArray(content)) {
    return false;
  }
  return content.some((item) => item && typeof item === "object" && "tool_use_id" in item);
}

export function isCodexMessage(record: TranscriptRecord, role: "user" | "assistant"): boolean {
  return record?.type === "response_item" &&
    record.payload?.type === "message" &&
    record.payload?.role === role;
}

export function findCurrentPromptId(records: readonly TranscriptRecord[]): string | null {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (record?.isSidechain === true) {
      continue;
    }
    if (!record?.promptId || record.type !== "user") {
      continue;
    }
    if (isToolResultUserRecord(record)) {
      continue;
    }
    return record.promptId;
  }
  return null;
}

export function findCurrentCodexUserIndex(records: readonly TranscriptRecord[]): number {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (isCodexMessage(records[index], "user")) {
      return index;
    }
  }
  return -1;
}

export function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter((item) => ["text", "input_text", "output_text"].includes(item?.type) && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

export function getFinalAssistantText(records: readonly TranscriptRecord[], promptId: string): string {
  const texts = [];
  for (const record of records) {
    if (record?.promptId !== promptId || record?.isSidechain === true || record?.type !== "assistant") {
      continue;
    }
    const text = extractTextContent(record.message?.content).trim();
    if (text) {
      texts.push(text);
    }
  }
  return texts.join("\n\n");
}

export function getFinalCodexAssistantText(records: readonly TranscriptRecord[], userIndex: number): string {
  const texts = [];
  for (let index = userIndex + 1; index < records.length; index += 1) {
    const record = records[index];
    if (!isCodexMessage(record, "assistant")) {
      continue;
    }
    const text = extractTextContent(record.payload?.content).trim();
    if (text) {
      texts.push(text);
    }
  }
  return texts.join("\n\n");
}
