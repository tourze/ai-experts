#!/usr/bin/env node
import { main } from "./build/main";

main().catch((error) => {
  console.error(`component build failed: ${error.stack || error.message || error}`);
  process.exit(1);
});
