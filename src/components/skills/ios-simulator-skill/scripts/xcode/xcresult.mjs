import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

function emptyLocation() {
  return { file: null, line: null, column: null };
}

function nestedValue(object, path, fallback = undefined) {
  let current = object;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return fallback;
    current = current[key];
  }
  return current;
}

export class XCResultParser {
  constructor(xcresultPath, stderr = "") {
    this.xcresultPath = xcresultPath;
    this.stderr = stderr;

    if (xcresultPath && !existsSync(xcresultPath)) {
      throw new Error(`XCResult bundle not found: ${xcresultPath}`);
    }
  }

  getBuildResults() {
    return this.runXcresulttool(["get", "build-results"]);
  }

  getTestResults() {
    return this.runXcresulttool(["get", "test-results", "summary"]);
  }

  getFailedTests() {
    try {
      const data = this.runXcresulttool(["get", "test-results", "tests"]);
      if (!data) return [];

      const failed = [];
      const nodes = Array.isArray(data) ? data : data.testNodes || [];
      this.collectFailedTests(nodes, failed);
      return failed;
    } catch (error) {
      console.error(`Warning: Could not parse failed tests: ${error.message}`);
      return [];
    }
  }

  collectFailedTests(nodes, failed) {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      if (node.nodeType === "Test Case" && node.result === "Failed") {
        failed.push({
          test_name: node.name || "Unknown",
          failure_message: node.details || "",
        });
      }
      this.collectFailedTests(node.children || [], failed);
    }
  }

  getBuildLog() {
    return this.runXcresulttool(["get", "log", "--type", "build"], false) || null;
  }

  countIssues() {
    let errorCount = 0;
    let warningCount = 0;
    const buildResults = this.getBuildResults();

    if (buildResults) {
      try {
        if (Array.isArray(buildResults.errors)) {
          errorCount = buildResults.errors.length;
        }
        if (Array.isArray(buildResults.warnings)) {
          warningCount = buildResults.warnings.length;
        }

        if (errorCount === 0 && warningCount === 0) {
          const actions = nestedValue(buildResults, ["actions", "_values"], []);
          if (actions.length) {
            const issues = actions[0].buildResult?.issues || {};
            errorCount = issues.errorSummaries?._values?.length || 0;
            warningCount = issues.warningSummaries?._values?.length || 0;
          }
        }
      } catch (error) {
        console.error(`Warning: Could not parse issue counts from xcresult: ${error.message}`);
      }
    }

    if (errorCount === 0 && this.stderr) {
      errorCount = this.parseStderrErrors().length;
    }

    return [errorCount, warningCount];
  }

  getErrors() {
    const buildResults = this.getBuildResults();
    let errors = [];

    if (buildResults) {
      try {
        if (Array.isArray(buildResults.errors)) {
          errors = buildResults.errors.map((error) => ({
            message: error.message || "Unknown error",
            type: error.issueType || "error",
            location: this.extractLocationFromUrl(error.sourceURL),
          }));
        }

        if (!errors.length) {
          const actions = nestedValue(buildResults, ["actions", "_values"], []);
          const errorSummaries = actions[0]?.buildResult?.issues?.errorSummaries?._values || [];
          errors = errorSummaries.map((error) => ({
            message: error.message?._value || "Unknown error",
            type: error.issueType?._value || "error",
            location: this.extractLocation(error),
          }));
        }
      } catch (error) {
        console.error(`Warning: Could not parse errors from xcresult: ${error.message}`);
      }
    }

    if (!errors.length && this.stderr) {
      errors = this.parseStderrErrors();
    }

    return errors;
  }

  getWarnings() {
    const buildResults = this.getBuildResults();
    if (!buildResults) return [];

    try {
      if (Array.isArray(buildResults.warnings)) {
        return buildResults.warnings.map((warning) => ({
          message: warning.message || "Unknown warning",
          type: warning.issueType || "warning",
          location: this.extractLocationFromUrl(warning.sourceURL),
        }));
      }

      const actions = nestedValue(buildResults, ["actions", "_values"], []);
      const warningSummaries = actions[0]?.buildResult?.issues?.warningSummaries?._values || [];
      return warningSummaries.map((warning) => ({
        message: warning.message?._value || "Unknown warning",
        type: warning.issueType?._value || "warning",
        location: this.extractLocation(warning),
      }));
    } catch (error) {
      console.error(`Warning: Could not parse warnings: ${error.message}`);
      return [];
    }
  }

  extractLocation(issue) {
    const docLocation = issue?.documentLocationInCreatingWorkspace || {};
    return {
      file: docLocation.url?._value || null,
      line: docLocation.startingLineNumber?._value || null,
      column: docLocation.startingColumnNumber?._value || null,
    };
  }

  extractLocationFromUrl(sourceUrl) {
    const location = emptyLocation();
    if (!sourceUrl) return location;

    try {
      if (!sourceUrl.includes("#")) {
        location.file = sourceUrl.replace("file://", "");
        return location;
      }

      const [filePart, fragment] = sourceUrl.split("#", 2);
      location.file = filePart.replace("file://", "");

      const params = Object.fromEntries(
        fragment
          .split("&")
          .filter((param) => param.includes("="))
          .map((param) => param.split("=", 2)),
      );
      if ("StartingLineNumber" in params) {
        location.line = Number(params.StartingLineNumber) + 1;
      }
      if ("StartingColumnNumber" in params) {
        location.column = Number(params.StartingColumnNumber) + 1;
      }
    } catch {
      return emptyLocation();
    }

    return location;
  }

  runXcresulttool(args, parseJson = true) {
    if (!this.xcresultPath) return null;

    const result = spawnSync("xcrun", ["xcresulttool", ...args, "--path", this.xcresultPath], {
      encoding: "utf8",
    });

    if (result.status !== 0) {
      console.error(`Error running xcresulttool: ${result.error?.message || `exit ${result.status}`}`);
      if (result.stderr) console.error(`stderr: ${result.stderr}`);
      return null;
    }

    if (!parseJson) return result.stdout;

    try {
      return JSON.parse(result.stdout);
    } catch (error) {
      console.error(`Error parsing JSON from xcresulttool: ${error.message}`);
      return null;
    }
  }

  parseStderrErrors() {
    const errors = [];
    if (!this.stderr) return errors;

    const compilationPattern = /^(?<file>[^:]+):(?<line>\d+):(?<column>\d+):\s*error:\s*(?<message>.+?)$/gm;
    for (const match of this.stderr.matchAll(compilationPattern)) {
      errors.push({
        message: match.groups.message.trim(),
        type: "compilation",
        location: {
          file: match.groups.file,
          line: Number(match.groups.line),
          column: Number(match.groups.column),
        },
      });
    }

    const xcodebuildPattern = /xcodebuild:\s*error:\s*(?<message>.*?)(?:\n\n|\s*$)/gs;
    for (const match of this.stderr.matchAll(xcodebuildPattern)) {
      errors.push({
        message: match.groups.message
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" "),
        type: "build",
        location: emptyLocation(),
      });
    }

    const provisioningPattern = /error:.*?provisioning profile.*?(?:doesn't|does not|cannot).*?(?<message>.*?)(?:\n|$)/gi;
    for (const match of this.stderr.matchAll(provisioningPattern)) {
      errors.push({
        message: `Provisioning profile error: ${match.groups.message.trim()}`,
        type: "provisioning",
        location: emptyLocation(),
      });
    }

    const signingPattern = /error:.*?(?:code sign|signing).*?(?<message>.*?)(?:\n|$)/gi;
    for (const match of this.stderr.matchAll(signingPattern)) {
      errors.push({
        message: `Code signing error: ${match.groups.message.trim()}`,
        type: "signing",
        location: emptyLocation(),
      });
    }

    if (!errors.length) {
      const genericPattern = /^(?:\*\*\s)?(?:error|ERROR):\s*(?<message>.*?)(?:\n|$)/gm;
      for (const match of this.stderr.matchAll(genericPattern)) {
        errors.push({
          message: match.groups.message.trim(),
          type: "build",
          location: emptyLocation(),
        });
      }
    }

    if (this.stderr.includes("No profiles for")) {
      const noProfilePattern = /No profiles for '(?<bundleId>.*?)' were found/g;
      for (const match of this.stderr.matchAll(noProfilePattern)) {
        errors.push({
          message: `No provisioning profile found for bundle ID '${match.groups.bundleId}'`,
          type: "provisioning",
          location: emptyLocation(),
        });
      }
    }

    return errors;
  }
}
