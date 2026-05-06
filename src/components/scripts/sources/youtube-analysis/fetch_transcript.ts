#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYoutubeUrl } from "./utils";

function log(message) {
  console.error(message);
}

export function runCommand(command, args, { timeoutMs = 60000 } = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: timeoutMs });
  if (result.error) {
    if (result.error.code === "ENOENT") throw new Error(`Command not found: ${command}`);
    if (result.error.code === "ETIMEDOUT") throw new Error(`Command timed out: ${command}`);
    throw result.error;
  }
  return result;
}

export function buildSubtitleCommand(videoId, language, outputTemplate) {
  const args = [
    "--write-sub",
    "--write-auto-sub",
    "--sub-format",
    "json3",
    "--skip-download",
    "--output",
    outputTemplate,
  ];
  if (language) {
    args.push("--sub-lang", language);
  }
  args.push(`https://www.youtube.com/watch?v=${videoId}`);
  return args;
}

export function parseJson3(path) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const segments = [];

  for (const event of data.events || []) {
    if (!Array.isArray(event.segs)) continue;
    const text = event.segs.map((segment) => segment.utf8 || "").join("").trim();
    if (!text || text === "\n") continue;
    segments.push({
      start: Number(event.tStartMs || 0) / 1000.0,
      duration: Number(event.dDurationMs || 0) / 1000.0,
      text,
    });
  }

  return segments;
}

export function extractLanguage(path, fallback = "en") {
  const parts = basename(path).split(".");
  return parts.length >= 3 ? parts[parts.length - 2] : fallback;
}

export function fetchTranscriptYtdlp(videoId, lang = "en", { runner = runCommand, tempDir = null } = {}) {
  log("Fetching transcript via yt-dlp...");
  const workDir = tempDir || mkdtempSync(join(tmpdir(), "youtube-transcript-"));
  const cleanup = !tempDir;

  try {
    const tryExtract = (language) => {
      const result = runner("yt-dlp", buildSubtitleCommand(videoId, language, join(workDir, "%(id)s")));
      if (result.status !== 0) {
        const detail = String(result.stderr || result.stdout || "").trim();
        throw new Error(`yt-dlp subtitle extraction failed: ${detail}`);
      }

      const subtitleFiles = readdirSync(workDir)
        .filter((name) => name.endsWith(".json3"))
        .map((name) => join(workDir, name))
        .sort();
      if (!subtitleFiles.length) return null;

      const preferred = subtitleFiles.find((path) => language && extractLanguage(path, lang).startsWith(language)) || subtitleFiles[0];
      const segments = parseJson3(preferred);
      if (!segments.length) return null;
      return [segments, extractLanguage(preferred, lang)];
    };

    let extracted = tryExtract(lang);
    if (extracted === null) extracted = tryExtract(null);
    if (extracted === null) throw new Error("yt-dlp produced no usable subtitle files");

    const [segments, actualLang] = extracted;
    if (actualLang !== lang) {
      log(`yt-dlp requested lang '${lang}' unavailable. Using '${actualLang}'`);
    }
    return [segments, actualLang, "yt-dlp"];
  } finally {
    if (cleanup) rmSync(workDir, { recursive: true, force: true });
  }
}

function defaultMetadata() {
  return {
    title: "Unknown",
    channel: "Unknown",
    duration_seconds: 0,
    upload_date: "Unknown",
    description: "",
    view_count: 0,
    tags: [],
  };
}

export function fetchMetadata(videoId, { runner = runCommand } = {}) {
  log("Fetching metadata via yt-dlp...");
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  let result;
  try {
    result = runner("yt-dlp", ["--dump-json", "--no-download", url]);
  } catch (error) {
    log(`Metadata fetch failed: ${error.message}`);
    return defaultMetadata();
  }

  if (result.status !== 0) {
    log(`Metadata fetch failed: ${String(result.stderr || result.stdout || "").trim()}`);
    return defaultMetadata();
  }

  try {
    const data = JSON.parse(result.stdout);
    let uploadDate = data.upload_date || "";
    if (/^\d{8}$/.test(uploadDate)) {
      uploadDate = `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6)}`;
    }
    return {
      title: data.title || "Unknown",
      channel: data.channel || data.uploader || "Unknown",
      duration_seconds: data.duration || 0,
      upload_date: uploadDate,
      description: data.description || "",
      view_count: data.view_count || 0,
      tags: data.tags || [],
    };
  } catch (error) {
    log(`Metadata fetch returned invalid JSON: ${error.message}`);
    return defaultMetadata();
  }
}

export function fetchVideo(urlOrId, lang = "en", options = {}) {
  const videoId = parseYoutubeUrl(urlOrId);
  if (!videoId) {
    const error = new Error(`Cannot parse YouTube URL or video ID: ${urlOrId}`);
    error.exitCode = 1;
    throw error;
  }

  log(`Video ID: ${videoId}`);

  let segments;
  let language;
  let source;
  try {
    [segments, language, source] = fetchTranscriptYtdlp(videoId, lang, options);
  } catch (error) {
    log(`Transcript fetch failed: ${error.message}`);
    const wrapped = new Error("No transcript available for this video");
    wrapped.exitCode = 2;
    throw wrapped;
  }

  log(`Transcript: ${segments.length} segments via ${source} (lang=${language})`);
  const metadata = fetchMetadata(videoId, options);
  const transcriptText = segments.map((segment) => segment.text).join(" ");

  return {
    video_id: videoId,
    title: metadata.title,
    channel: metadata.channel,
    duration_seconds: metadata.duration_seconds,
    upload_date: metadata.upload_date,
    description: metadata.description,
    view_count: metadata.view_count,
    tags: metadata.tags,
    transcript: segments,
    transcript_text: transcriptText,
    language,
    source,
  };
}

export function usage() {
  return `Fetch YouTube video transcript and metadata.

Usage: node scripts/fetch_transcript.mjs <url-or-video-id> [--lang <code>]

Options:
  --lang <code>  Preferred transcript language (default: en)
  --help, -h     Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { url: null, lang: "en", help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--lang") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error("--lang requires a value");
      args.lang = value;
      index += 1;
    } else if (!args.url) {
      args.url = arg;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.url) throw new Error("url is required");
  const data = fetchVideo(args.url, args.lang);
  console.log(JSON.stringify(data, null, 2));
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = error.exitCode || 1;
  }
}
