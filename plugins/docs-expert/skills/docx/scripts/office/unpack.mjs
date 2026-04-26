#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runPythonModule } from "../../../_office_runtime/run_python_module.mjs";

const skillsDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
process.exitCode = runPythonModule("_office_runtime.unpack", process.argv.slice(2), skillsDir);
