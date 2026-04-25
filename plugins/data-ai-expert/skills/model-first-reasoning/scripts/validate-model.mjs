#!/usr/bin/env node
/**
 * Model-First Reasoning Validator
 *
 * Validates whether model.json contains the structure that must be frozen
 * before implementation.
 *
 * Exit codes:
 * - 0: valid structure, ready for implementation
 * - 1: invalid structure
 * - 2: valid structure, but unknowns remain and Phase 1 must stop
 */

import { existsSync, readFileSync } from "node:fs";

const REQUIRED_KEYS = new Set([
  "deliverable",
  "entities",
  "state_variables",
  "actions",
  "constraints",
  "initial_state",
  "goal",
  "assumptions",
  "unknowns",
  "requirement_trace",
  "test_oracles",
]);
const REQUIRED_ACTION_KEYS = new Set(["name", "preconditions", "effects"]);
const REQUIRED_CONSTRAINT_KEYS = new Set(["id", "statement"]);
const REQUIRED_TRACE_KEYS = new Set(["requirement", "represented_as", "ref"]);
const REQUIRED_ORACLE_KEYS = new Set(["id", "maps_to", "description"]);
const LIST_FIELDS = [
  "entities",
  "state_variables",
  "actions",
  "constraints",
  "initial_state",
  "goal",
  "assumptions",
  "unknowns",
  "requirement_trace",
  "test_oracles",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sortedMissing(requiredKeys, item) {
  return [...requiredKeys].filter((key) => !(key in item)).sort();
}

function validateListOfObjects(data, field, requiredKeys, label, issues) {
  const value = data[field];
  if (!Array.isArray(value)) {
    return;
  }

  value.forEach((item, index) => {
    if (!isObject(item)) {
      issues.push(`${label}[${index}] must be an object`);
      return;
    }

    const missing = sortedMissing(requiredKeys, item);
    if (missing.length > 0) {
      issues.push(`${label}[${index}] missing: ${missing.join(", ")}`);
    }
  });
}

function validateModel(data) {
  const issues = [];

  const missingKeys = [...REQUIRED_KEYS].filter((key) => !(key in data)).sort();
  if (missingKeys.length > 0) {
    issues.push(`Missing top-level keys: ${missingKeys.join(", ")}`);
  }

  const deliverable = data.deliverable;
  if (deliverable !== undefined) {
    if (!isObject(deliverable)) {
      issues.push("'deliverable' must be an object");
    } else if (!("description" in deliverable)) {
      issues.push("'deliverable' missing 'description'");
    }
  }

  for (const field of LIST_FIELDS) {
    const value = data[field];
    if (value !== undefined && !Array.isArray(value)) {
      issues.push(`'${field}' must be a list`);
    }
  }

  validateListOfObjects(data, "actions", REQUIRED_ACTION_KEYS, "Action", issues);
  validateListOfObjects(data, "constraints", REQUIRED_CONSTRAINT_KEYS, "Constraint", issues);
  validateListOfObjects(data, "requirement_trace", REQUIRED_TRACE_KEYS, "RequirementTrace", issues);
  validateListOfObjects(data, "test_oracles", REQUIRED_ORACLE_KEYS, "TestOracle", issues);

  return [issues.length === 0, issues];
}

function usage() {
  return "Usage: node validate-model.mjs <model_path>";
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  const modelPath = args[0];
  if (!modelPath) {
    console.error(usage());
    return 1;
  }

  if (!existsSync(modelPath)) {
    console.log(`ERROR: File not found: ${modelPath}`);
    return 1;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(modelPath, "utf8"));
  } catch (error) {
    console.log(`ERROR: Invalid JSON: ${error.message}`);
    return 1;
  }

  const [isValid, issues] = validateModel(data);
  if (issues.length > 0) {
    console.log("VALIDATION FAILED:");
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
    console.log("");
  }

  const unknowns = data.unknowns ?? [];
  if (Array.isArray(unknowns) && unknowns.length > 0) {
    console.log(`WARNING: ${unknowns.length} unknowns remain - STOP after Phase 1`);
    for (const unknown of unknowns) {
      console.log(`  - ${unknown}`);
    }
    console.log("");
    console.log("Do NOT proceed to implementation until unknowns are resolved.");
    return isValid ? 2 : 1;
  }

  if (isValid) {
    console.log("OK: Model structure is valid");
    console.log("    Ready for Phase 2: Implementation");
    return 0;
  }

  return 1;
}

process.exitCode = main();
