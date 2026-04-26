import assert from "node:assert/strict";
import test from "node:test";
import {
  filterRecent,
  normalizeEntry,
  runYtdlp,
  searchVideos,
  sortEntries,
} from "../skills/youtube-search/scripts/search_youtube.mjs";

test("normalizeEntry generates stable schema", () => {
  const normalized = normalizeEntry({
    id: "abc123def45",
    title: "Example Video",
    channel: "Example Channel",
    view_count: 42,
    duration_string: "10:00",
    upload_date: "20260401",
    description: "x".repeat(300),
  });

  assert.equal(normalized.url, "https://www.youtube.com/watch?v=abc123def45");
  assert.equal(normalized.upload_date, "2026-04-01");
  assert.equal(normalized.description.length, 200);
});

test("sortEntries sorts by views descending", () => {
  const results = sortEntries([
    { title: "A", view_count: 2 },
    { title: "B", view_count: 10 },
    { title: "C", view_count: null },
  ], "views");

  assert.deepEqual(results.map((item) => item.title), ["B", "A", "C"]);
});

test("filterRecent keeps dated entries within the UTC window", () => {
  const results = filterRecent([
    { title: "A", upload_date: "2026-04-20" },
    { title: "B", upload_date: "2026-03-01" },
    { title: "C", upload_date: null },
  ], 30, { now: new Date("2026-04-26T12:00:00Z") });

  assert.deepEqual(results.map((item) => item.title), ["A"]);
});

test("searchVideos normalizes mocked payload", () => {
  const payload = {
    entries: [
      {
        id: "abc123def45",
        title: "Example Video",
        channel: "Example Channel",
        view_count: 42,
        duration_string: "10:00",
        upload_date: "20260401",
      },
    ],
  };
  const results = searchVideos("example", {
    count: 1,
    runner: () => payload,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].title, "Example Video");
  assert.equal(results[0].upload_date, "2026-04-01");
});

test("runYtdlp reports missing binary", () => {
  assert.throws(
    () => runYtdlp("claude code", 5, { command: "__missing_yt_dlp_binary__" }),
    /yt-dlp 未安装/,
  );
});
