import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/meeting-expert");
const scriptFiles = [
  "tests/skills.test.mjs",
  "tests/scripts.test.mjs",
].map((file) => resolve(pluginRoot, file));

test("所有 mjs 脚本都能通过 node --check", () => {
  for (const file of scriptFiles) {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  }
});
