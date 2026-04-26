#!/usr/bin/env node
export { digWithTtl, dohQuery, hasRealRecords, main, parseDigAnswer, run } from "../../scripts/01_dig.mjs";
import { pathToFileURL } from "node:url";
import { main } from "../../scripts/01_dig.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
