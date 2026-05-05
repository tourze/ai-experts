export class OutputFormatter {
  static formatMinimal({
    status,
    errorCount,
    warningCount,
    xcresultId,
    testInfo = null,
    hints = null,
    errors = null,
    failedTests = null,
  }) {
    const lines = [];

    if (testInfo) {
      const total = testInfo.total || 0;
      const passed = testInfo.passed || 0;
      const failed = testInfo.failed || 0;
      const duration = testInfo.duration || 0.0;
      const testStatus = failed === 0 ? "PASS" : "FAIL";
      lines.push(`Tests: ${testStatus} (${passed}/${total} passed, ${duration.toFixed(1)}s) [${xcresultId}]`);
    } else {
      lines.push(`Build: ${status} (${errorCount} errors, ${warningCount} warnings) [${xcresultId}]`);
    }

    if (status === "FAILED" && errors?.length) {
      lines.push("", OutputFormatter.formatErrors(errors, 5));
    }
    if (failedTests?.length) {
      lines.push("", OutputFormatter.formatTestFailures(failedTests, 5));
    }
    if (status === "FAILED" && hints?.length) {
      lines.push("", ...hints);
    }

    return lines.join("\n");
  }

  static formatTestFailures(failedTests, limit = 5) {
    if (!failedTests?.length) return "No test failures found.";

    const lines = [`Failed tests (${failedTests.length}):`, ""];
    for (const [index, test] of failedTests.slice(0, limit).entries()) {
      lines.push(`${index + 1}. ${test.test_name || "Unknown"}`);
      if (test.failure_message) {
        lines.push(`   ${test.failure_message}`);
      }
      lines.push("");
    }
    if (failedTests.length > limit) {
      lines.push(`... and ${failedTests.length - limit} more failures`);
    }
    return lines.join("\n");
  }

  static formatErrors(errors, limit = 10) {
    if (!errors?.length) return "No errors found.";

    const lines = [`Errors (${errors.length}):`, ""];
    for (const [index, error] of errors.slice(0, limit).entries()) {
      const location = error.location || {};
      const locParts = [];
      if (location.file) locParts.push(String(location.file).replace("file://", ""));
      if (location.line) locParts.push(`line ${location.line}`);
      const locationString = locParts.length ? locParts.join(":") : "unknown location";

      lines.push(`${index + 1}. ${error.message || "Unknown error"}`);
      lines.push(`   Location: ${locationString}`);
      lines.push("");
    }
    if (errors.length > limit) {
      lines.push(`... and ${errors.length - limit} more errors`);
    }
    return lines.join("\n");
  }

  static formatWarnings(warnings, limit = 10) {
    if (!warnings?.length) return "No warnings found.";

    const lines = [`Warnings (${warnings.length}):`, ""];
    for (const [index, warning] of warnings.slice(0, limit).entries()) {
      const location = warning.location || {};
      const locParts = [];
      if (location.file) locParts.push(String(location.file).replace("file://", ""));
      if (location.line) locParts.push(`line ${location.line}`);
      const locationString = locParts.length ? locParts.join(":") : "unknown location";

      lines.push(`${index + 1}. ${warning.message || "Unknown warning"}`);
      lines.push(`   Location: ${locationString}`);
      lines.push("");
    }
    if (warnings.length > limit) {
      lines.push(`... and ${warnings.length - limit} more warnings`);
    }
    return lines.join("\n");
  }

  static formatLog(log, lines = 50) {
    if (!log) return "No build log available.";
    const logLines = log.trim().split("\n");
    if (logLines.length <= lines) return log;
    return `... (showing last ${lines} lines of ${logLines.length})\n\n${logLines.slice(-lines).join("\n")}`;
  }

  static formatJson(data) {
    return JSON.stringify(data, null, 2);
  }

  static generateHints(errors) {
    const hints = [];
    const errorTypes = new Set(errors.map((error) => error.type || "unknown"));

    if (errorTypes.has("provisioning")) {
      hints.push("Provisioning profile issue detected:");
      hints.push("  - Ensure you have a valid provisioning profile for iOS Simulator");
      hints.push('  - For simulator builds, use CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO');
      hints.push("  - Or specify simulator explicitly: --simulator 'iPhone 16 Pro'");
    }

    if (errorTypes.has("signing")) {
      hints.push("Code signing issue detected:");
      hints.push("  - For simulator builds, code signing is not required");
      hints.push("  - Ensure build settings target iOS Simulator, not physical device");
      hints.push("  - Check destination: platform=iOS Simulator,name=<device>");
    }

    if (!errorTypes.size || errorTypes.has("build")) {
      if (errors.some((error) => String(error.message || "").toLowerCase().includes("destination"))) {
        hints.push("Device selection issue detected:");
        hints.push("  - List available simulators: xcrun simctl list devices available");
        hints.push("  - Specify simulator: --simulator 'iPhone 16 Pro'");
      }
    }

    return hints;
  }

  static formatVerbose({
    status,
    errorCount,
    warningCount,
    xcresultId,
    errors = null,
    warnings = null,
    testInfo = null,
  }) {
    const lines = [];

    if (testInfo) {
      const failed = testInfo.failed || 0;
      lines.push(`Tests: ${failed === 0 ? "PASS" : "FAIL"}`);
      lines.push(`  Total: ${testInfo.total || 0}`);
      lines.push(`  Passed: ${testInfo.passed || 0}`);
      lines.push(`  Failed: ${failed}`);
      lines.push(`  Duration: ${(testInfo.duration || 0).toFixed(1)}s`);
    } else {
      lines.push(`Build: ${status}`);
    }

    lines.push(`XCResult: ${xcresultId}`, "");
    if (errors?.length) {
      lines.push(OutputFormatter.formatErrors(errors, 5), "");
    }
    if (warnings?.length) {
      lines.push(OutputFormatter.formatWarnings(warnings, 5), "");
    }
    lines.push(`Summary: ${errorCount} errors, ${warningCount} warnings`);

    return lines.join("\n");
  }
}
