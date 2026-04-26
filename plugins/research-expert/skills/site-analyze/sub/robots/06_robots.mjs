#!/usr/bin/env node
export { fetchRobots, main, parseRobotsTxt, run, summarize } from "../../scripts/06_robots.mjs";
import { pathToFileURL } from "node:url";
import { main } from "../../scripts/06_robots.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
