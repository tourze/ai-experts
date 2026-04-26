#!/usr/bin/env node
export { main, parseIcmpOutput, pingIcmp, pingTcp, run } from "../../scripts/05_ping.mjs";
import { pathToFileURL } from "node:url";
import { main } from "../../scripts/05_ping.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
