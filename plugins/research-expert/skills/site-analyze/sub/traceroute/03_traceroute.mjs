#!/usr/bin/env node
export { main, parseTraceroute, run, runTraceroute } from "../../scripts/03_traceroute.mjs";
import { pathToFileURL } from "node:url";
import { main } from "../../scripts/03_traceroute.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
