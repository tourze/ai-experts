#!/usr/bin/env node
export { isPrivateIp, main, mergeInfo, queryIpApi, queryIpinfo, queryIps, run } from "../../scripts/02_ip_info.mjs";
import { pathToFileURL } from "node:url";
import { main } from "../../scripts/02_ip_info.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
