import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildScaffold } from "../skills/youtube-analysis/scripts/analyze_video.mjs";
import {
  fetchMetadata,
  fetchTranscriptYtdlp,
  fetchVideo,
} from "../skills/youtube-analysis/scripts/fetch_transcript.mjs";
import { chunkTranscript, parseYoutubeUrl } from "../skills/youtube-analysis/scripts/utils.mjs";

function writeSubtitleFixture(dir, language = "en") {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `dQw4w9WgXcQ.${language}.json3`),
    JSON.stringify({
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "hello " }, { utf8: "world" }] },
        { tStartMs: 2000, dDurationMs: 500, segs: [{ utf8: "\n" }] },
      ],
    }),
  );
}

test("parseYoutubeUrl supports common formats", () => {
  assert.equal(parseYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYoutubeUrl("https://youtu.be/dQw4w9WgXcQ?t=42"), "dQw4w9WgXcQ");
  assert.equal(parseYoutubeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYoutubeUrl("https://vimeo.com/12345"), null);
});

test("chunkTranscript splits on time boundary", () => {
  const chunks = chunkTranscript(
    [
      { start: 0, duration: 10, text: "hello" },
      { start: 305, duration: 5, text: "world" },
    ],
    5,
  );

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].start_formatted, "0:00");
  assert.equal(chunks[1].start_formatted, "5:05");
});

test("fetchMetadata returns defaults when ytdlp missing", () => {
  const metadata = fetchMetadata("dQw4w9WgXcQ", {
    runner: () => {
      throw new Error("Command not found: yt-dlp");
    },
  });

  assert.equal(metadata.title, "Unknown");
  assert.equal(metadata.channel, "Unknown");
  assert.deepEqual(metadata.tags, []);
});

test("fetchTranscriptYtdlp parses json3 subtitle output", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "youtube-transcript-test-"));
  const [segments, language, source] = fetchTranscriptYtdlp("dQw4w9WgXcQ", "en", {
    tempDir,
    runner: () => {
      writeSubtitleFixture(tempDir, "en");
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(language, "en");
  assert.equal(source, "yt-dlp");
  assert.deepEqual(segments, [{ start: 0, duration: 1, text: "hello world" }]);
});

test("fetchVideo combines transcript and metadata", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "youtube-video-test-"));
  const data = fetchVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "en", {
    tempDir,
    runner: (_command, args) => {
      if (args.includes("--dump-json")) {
        return {
          status: 0,
          stdout: JSON.stringify({
            title: "Example",
            channel: "Channel",
            duration: 213,
            upload_date: "20240101",
            tags: ["tag1"],
          }),
          stderr: "",
        };
      }
      writeSubtitleFixture(tempDir, "en");
      return { status: 0, stdout: "", stderr: "" };
    },
  });

  assert.equal(data.title, "Example");
  assert.equal(data.upload_date, "2024-01-01");
  assert.equal(data.transcript_text, "hello world");
});

test("buildScaffold contains analysis context", () => {
  const data = {
    video_id: "dQw4w9WgXcQ",
    title: "Example",
    channel: "Channel",
    duration_seconds: 213,
    upload_date: "2024-01-01",
    description: "description",
    view_count: 1,
    tags: ["tag1"],
    transcript: [{ start: 0, duration: 5, text: "hello" }],
    transcript_text: "hello",
    language: "en",
    source: "yt-dlp",
  };

  const scaffold = buildScaffold(data, "quick", "auto");
  assert.match(scaffold, /## Analysis Context/);
  assert.match(scaffold, /\*\*Video type\*\*: auto/);
  assert.match(scaffold, /hello/);
});
