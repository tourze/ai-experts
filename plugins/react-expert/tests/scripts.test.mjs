import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/react-expert");
const scriptFiles = [
  "hooks/dispatch.mjs",
].map((file) => resolve(pluginRoot, file));

test("所有 hook 脚本都能通过 node --check", () => {
  for (const file of scriptFiles) {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  }
});
