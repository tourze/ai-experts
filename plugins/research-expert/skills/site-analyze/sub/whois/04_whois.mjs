#!/usr/bin/env node
export { main, parseWhois, run, runWhois } from "../../scripts/04_whois.mjs";
import { pathToFileURL } from "node:url";
import { main } from "../../scripts/04_whois.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
