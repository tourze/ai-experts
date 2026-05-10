export const METADATA_FILES = new Set([
  "transcript.md",
  "user_notes.md",
  "metrics.json",
]);

export const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".py",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".yaml",
  ".yml",
  ".xml",
  ".html",
  ".css",
  ".sh",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".sql",
  ".r",
  ".toml",
]);

export const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
]);

export const MIME_OVERRIDES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
