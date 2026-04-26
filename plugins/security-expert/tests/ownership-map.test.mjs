import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  handleCommand,
  parseArgs,
  parseCsv,
} from "../skills/security-ownership-map/scripts/query_ownership.mjs";

const scriptPath = fileURLToPath(new URL("../skills/security-ownership-map/scripts/query_ownership.mjs", import.meta.url));

function createOwnershipData() {
  const dataDir = mkdtempSync(join(tmpdir(), "ownership-map-"));
  writeFileSync(
    join(dataDir, "people.csv"),
    [
      "person_id,name,email,touches,commit_count,sensitive_touches,primary_tz_offset,timezone_offsets",
      "alice@example.com,Alice,alice@example.com,10,4,3,+08:00,+08:00",
      "bob@example.com,Bob,bob@example.com,2,1,0,+00:00,+00:00",
    ].join("\n"),
  );
  writeFileSync(
    join(dataDir, "files.csv"),
    [
      "file_id,path,touches,commit_count,bus_factor,sensitivity_score,sensitivity_tags,last_seen",
      "src/auth/session.go,src/auth/session.go,8,3,1,3.5,auth;secrets,2026-01-01",
      "src/ui/view.ts,src/ui/view.ts,2,1,2,0,,2026-01-02",
    ].join("\n"),
  );
  writeFileSync(
    join(dataDir, "edges.csv"),
    [
      "person_id,file_id,touches,recency_weight,sensitive_weight,last_seen",
      "alice@example.com,src/auth/session.go,8,2.5,3,2026-01-01",
      "bob@example.com,src/auth/session.go,1,0.1,0,2025-12-01",
      "bob@example.com,src/ui/view.ts,2,0.4,0,2026-01-02",
    ].join("\n"),
  );
  writeFileSync(
    join(dataDir, "cochange_edges.csv"),
    [
      "file_a,file_b,cochange_count,jaccard",
      "src/auth/session.go,src/ui/view.ts,3,0.25",
    ].join("\n"),
  );
  writeFileSync(
    join(dataDir, "summary.json"),
    JSON.stringify({
      bus_factor_hotspots: [{ file_id: "src/auth/session.go" }],
      totals: { files: 2 },
    }),
  );
  writeFileSync(
    join(dataDir, "communities.json"),
    JSON.stringify([
      {
        id: 1,
        size: 2,
        files: ["src/auth/session.go", "src/ui/view.ts"],
        top_maintainers: [{ person_id: "alice@example.com" }],
      },
    ]),
  );
  return dataDir;
}

test("parseCsv handles quoted commas and escaped quotes", () => {
  const rows = parseCsv('name,email,note\n"Alice, A.",alice@example.com,"said ""hi"""');
  assert.deepEqual(rows, [
    {
      name: "Alice, A.",
      email: "alice@example.com",
      note: 'said "hi"',
    },
  ]);
});

test("summary section query returns bounded JSON payload", () => {
  const dataDir = createOwnershipData();
  const args = parseArgs(["--data-dir", dataDir, "summary", "--section", "bus_factor_hotspots"]);
  assert.equal(args.command, "summary");
  assert.equal(args.section, "bus_factor_hotspots");
  assert.deepEqual(handleCommand(args), [{ file_id: "src/auth/session.go" }]);
});

test("person query joins top file metadata", () => {
  const dataDir = createOwnershipData();
  const payload = handleCommand(parseArgs(["--data-dir", dataDir, "person", "--person", "alice", "--limit", "1"]));
  assert.equal(payload.person.person_id, "alice@example.com");
  assert.equal(payload.top_files[0].path, "src/auth/session.go");
  assert.deepEqual(payload.top_files[0].sensitivity_tags, ["auth", "secrets"]);
});

test("cochange query returns matching neighbors", () => {
  const dataDir = createOwnershipData();
  const payload = handleCommand(parseArgs(["--data-dir", dataDir, "cochange", "--file", "src/auth/session.go"]));
  assert.equal(payload.file.file_id, "src/auth/session.go");
  assert.equal(payload.neighbors[0].file_id, "src/ui/view.ts");
  assert.equal(payload.neighbors[0].cochange_count, 3);
});

test("community query can include a truncated file list", () => {
  const dataDir = createOwnershipData();
  const payload = handleCommand(
    parseArgs(["--data-dir", dataDir, "community", "--id", "1", "--include-files", "--file-limit", "1"]),
  );
  assert.equal(payload.id, 1);
  assert.deepEqual(payload.files, ["src/auth/session.go"]);
  assert.equal(payload.files_truncated, true);
});

test("query_ownership.mjs CLI filters files by tag", () => {
  const dataDir = createOwnershipData();
  const result = spawnSync(process.execPath, [scriptPath, "--data-dir", dataDir, "files", "--tag", "auth", "--limit", "1"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].file_id, "src/auth/session.go");
});
