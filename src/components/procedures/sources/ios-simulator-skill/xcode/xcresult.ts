import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
function emptyLocation(): any {
  return { file: null, line: null, column: null };
}
function nestedValue(object: any, path: any, fallback: any = undefined): any {
  let current = object;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current))
      return fallback;
    current = current[key];
  }
  return current;
}
export class XCResultParser {
  stderr: any;
  xcresultPath: any;
  constructor(xcresultPath: any, stderr: any = "") {
    this.xcresultPath = xcresultPath;
    this.stderr = stderr;
    if (xcresultPath && !existsSync(xcresultPath)) {
      throw new Error(`XCResult bundle not found: ${xcresultPath}`);
    }
  }
  getBuildResults(): any {
    return this.runXcresulttool(["get", "build-results"]);
  }
  getTestResults(): any {
    return this.runXcresulttool(["get", "test-results", "summary"]);
  }
  getFailedTests(): any {
    try {
      const data = this.runXcresulttool(["get", "test-results", "tests"]);
      if (!data) return [];
      const failed: any[] = [];
      const nodes = Array.isArray(data) ? data : data.testNodes || [];
      this.collectFailedTests(nodes, failed);
      return failed;
    } catch (error: any) {
      console.error(`Warning: Could not parse failed tests: ${error.message}`);
      return [];
    }
  }
  collectFailedTests(nodes: any, failed: any): any {
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
  getBuildLog(): any {
    return (
      this.runXcresulttool(["get", "log", "--type", "build"], false) || null
    );
  }
  countIssues(): any {
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
      } catch (error: any) {
        console.error(
          `Warning: Could not parse issue counts from xcresult: ${error.message}`,
        );
      }
    }
    if (errorCount === 0 && this.stderr) {
      errorCount = this.parseStderrErrors().length;
    }
    return [errorCount, warningCount];
  }
  getErrors(): any {
    const buildResults = this.getBuildResults();
    let errors: any[] = [];
    if (buildResults) {
      try {
        if (Array.isArray(buildResults.errors)) {
          errors = buildResults.errors.map((error: any) => ({
            message: error.message || "Unknown error",
            type: error.issueType || "error",
            location: this.extractLocationFromUrl(error.sourceURL),
          }));
        }
        if (!errors.length) {
          const actions = nestedValue(buildResults, ["actions", "_values"], []);
          const errorSummaries =
            actions[0]?.buildResult?.issues?.errorSummaries?._values || [];
          errors = errorSummaries.map((error: any) => ({
            message: error.message?._value || "Unknown error",
            type: error.issueType?._value || "error",
            location: this.extractLocation(error),
          }));
        }
      } catch (error: any) {
        console.error(
          `Warning: Could not parse errors from xcresult: ${error.message}`,
        );
      }
    }
    if (!errors.length && this.stderr) {
      errors = this.parseStderrErrors();
    }
    return errors;
  }
  getWarnings(): any {
    const buildResults = this.getBuildResults();
    if (!buildResults) return [];
    try {
      if (Array.isArray(buildResults.warnings)) {
        return buildResults.warnings.map((warning: any) => ({
          message: warning.message || "Unknown warning",
          type: warning.issueType || "warning",
          location: this.extractLocationFromUrl(warning.sourceURL),
        }));
      }
      const actions = nestedValue(buildResults, ["actions", "_values"], []);
      const warningSummaries =
        actions[0]?.buildResult?.issues?.warningSummaries?._values || [];
      return warningSummaries.map((warning: any) => ({
        message: warning.message?._value || "Unknown warning",
        type: warning.issueType?._value || "warning",
        location: this.extractLocation(warning),
      }));
    } catch (error: any) {
      console.error(`Warning: Could not parse warnings: ${error.message}`);
      return [];
    }
  }
  extractLocation(issue: any): any {
    const docLocation = issue?.documentLocationInCreatingWorkspace || {};
    return {
      file: docLocation.url?._value || null,
      line: docLocation.startingLineNumber?._value || null,
      column: docLocation.startingColumnNumber?._value || null,
    };
  }
  extractLocationFromUrl(sourceUrl: any): any {
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
          .filter((param: any) => param.includes("="))
          .map((param: any) => param.split("=", 2)),
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
  runXcresulttool(args: any, parseJson: any = true): any {
    if (!this.xcresultPath) return null;
    const result = spawnSync(
      "xcrun",
      ["xcresulttool", ...args, "--path", this.xcresultPath],
      {
        encoding: "utf8",
      },
    );
    if (result.status !== 0) {
      console.error(
        `Error running xcresulttool: ${result.error?.message || `exit ${result.status}`}`,
      );
      if (result.stderr) console.error(`stderr: ${result.stderr}`);
      return null;
    }
    if (!parseJson) return result.stdout;
    try {
      return JSON.parse(result.stdout);
    } catch (error: any) {
      console.error(`Error parsing JSON from xcresulttool: ${error.message}`);
      return null;
    }
  }
  parseStderrErrors(): any {
    const errors: any[] = [];
    if (!this.stderr) return errors;
    const compilationPattern =
      /^(?<file>[^:]+):(?<line>\d+):(?<column>\d+):\s*error:\s*(?<message>.+?)$/gm;
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
    const xcodebuildPattern =
      /xcodebuild:\s*error:\s*(?<message>.*?)(?:\n\n|\s*$)/gs;
    for (const match of this.stderr.matchAll(xcodebuildPattern)) {
      errors.push({
        message: match.groups.message
          .split("\n")
          .map((line: any) => line.trim())
          .filter(Boolean)
          .join(" "),
        type: "build",
        location: emptyLocation(),
      });
    }
    const provisioningPattern =
      /error:.*?provisioning profile.*?(?:doesn't|does not|cannot).*?(?<message>.*?)(?:\n|$)/gi;
    for (const match of this.stderr.matchAll(provisioningPattern)) {
      errors.push({
        message: `Provisioning profile error: ${match.groups.message.trim()}`,
        type: "provisioning",
        location: emptyLocation(),
      });
    }
    const signingPattern =
      /error:.*?(?:code sign|signing).*?(?<message>.*?)(?:\n|$)/gi;
    for (const match of this.stderr.matchAll(signingPattern)) {
      errors.push({
        message: `Code signing error: ${match.groups.message.trim()}`,
        type: "signing",
        location: emptyLocation(),
      });
    }
    if (!errors.length) {
      const genericPattern =
        /^(?:\*\*\s)?(?:error|ERROR):\s*(?<message>.*?)(?:\n|$)/gm;
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
