#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { writeFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  flattenTree,
  getAccessibilityTree,
  resolveUdid,
} from "./interaction_common";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-accessibility-audit",
  entry: procedureEntry(import.meta.url),
  description:
    "审计 iOS 模拟器屏幕无障碍性：扫描交互元素缺失标签、提示和标识符，输出严重度分级的发现问题。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/accessibility_audit.mjs",
  runtime: "node",
  params: [
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
    {
      flag: "--output",
      type: "路径",
      description: "将 JSON 报告保存到文件",
      required: false,
    },
    {
      flag: "--verbose",
      type: "",
      description: "包含所有问题详情，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--udid", "<device-udid>", "--verbose"] },
});

export class Issue {
  element_type: any;
  fix: any;
  issue: any;
  rule: any;
  severity: any;
  constructor(
    severity: any,
    rule: any,
    elementType: any,
    issue: any,
    fix: any,
  ) {
    this.severity = severity;
    this.rule = rule;
    this.element_type = elementType;
    this.issue = issue;
    this.fix = fix;
  }
  toDict(): any {
    return {
      severity: this.severity,
      rule: this.rule,
      element_type: this.element_type,
      issue: this.issue,
      fix: this.fix,
    };
  }
}
export class AccessibilityAuditor {
  udid: any;
  static CRITICAL_RULES = {
    missing_label: (element: any): any =>
      ["Button", "Link"].includes(element.type) && !element.AXLabel,
    empty_button: (element: any): any =>
      element.type === "Button" && !(element.AXLabel || element.AXValue),
    image_no_alt: (element: any): any =>
      element.type === "Image" && !element.AXLabel,
  };
  static WARNING_RULES = {
    missing_hint: (element: any): any =>
      ["Slider", "TextField"].includes(element.type) && !element.help,
    missing_traits: (element: any): any =>
      element.type && !hasTraits(element.traits),
  };
  static INFO_RULES = {
    no_identifier: (element: any): any => !element.AXUniqueId,
    deep_nesting: (element: any): any => (element.depth ?? 0) > 5,
  };
  constructor(udid: any = null) {
    this.udid = udid;
  }
  getAccessibilityTree(): any {
    return getAccessibilityTree(this.udid, { nested: true });
  }
  auditElement(element: any): any {
    const issues: any[] = [];
    for (const [ruleName, ruleFunc] of Object.entries(
      AccessibilityAuditor.CRITICAL_RULES,
    )) {
      if (ruleFunc(element))
        issues.push(this.buildIssue("critical", ruleName, element));
    }
    if (!issues.length) {
      for (const [ruleName, ruleFunc] of Object.entries(
        AccessibilityAuditor.WARNING_RULES,
      )) {
        if (ruleFunc(element))
          issues.push(this.buildIssue("warning", ruleName, element));
      }
    }
    if (!issues.length) {
      for (const [ruleName, ruleFunc] of Object.entries(
        AccessibilityAuditor.INFO_RULES,
      )) {
        if (ruleFunc(element))
          issues.push(this.buildIssue("info", ruleName, element));
      }
    }
    return issues;
  }
  audit(verbose: any = false): any {
    const elements = flattenTree(this.getAccessibilityTree());
    const allIssues: any[] = [];
    for (const element of elements) {
      for (const issue of this.auditElement(element)) {
        const issueDict = issue.toDict();
        issueDict.element = {
          type: element.type ?? "Unknown",
          label: element.AXLabel ? element.AXLabel.slice(0, 30) : null,
        };
        allIssues.push(issueDict);
      }
    }
    const summary: Record<string, any> = {
      total: elements.length,
      issues: allIssues.length,
      critical: allIssues.filter((issue) => issue.severity === "critical")
        .length,
      warning: allIssues.filter((issue) => issue.severity === "warning").length,
      info: allIssues.filter((issue) => issue.severity === "info").length,
    };
    const result: Record<string, any> = { summary };
    if (verbose) result.issues = allIssues;
    else result.top_issues = this.getTopIssues(allIssues);
    return result;
  }
  buildIssue(severity: any, ruleName: any, element: any): any {
    return new Issue(
      severity,
      ruleName,
      element.type ?? "Unknown",
      getIssueDescription(ruleName),
      getFixSuggestion(ruleName),
    );
  }
  getTopIssues(issues: any): any {
    if (!issues.length) return [];
    const grouped = new Map();
    for (const issue of issues) {
      if (!grouped.has(issue.rule)) {
        grouped.set(issue.rule, {
          severity: issue.severity,
          rule: issue.rule,
          count: 0,
          fix: issue.fix,
        });
      }
      grouped.get(issue.rule).count += 1;
    }
    const severityOrder: Record<string, any> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    return [...grouped.values()]
      .sort(
        (left: any, right: any) =>
          severityOrder[left.severity] - severityOrder[right.severity] ||
          right.count - left.count,
      )
      .slice(0, 3);
  }
}
export function getIssueDescription(rule: any): any {
  return (
    (
      {
        missing_label: "Interactive element missing accessibility label",
        empty_button: "Button has no text or label",
        image_no_alt: "Image missing alternative text",
        missing_hint: "Complex control missing hint",
        small_touch_target: "Touch target smaller than 44x44pt",
        missing_traits: "Element missing accessibility traits",
        no_identifier: "Missing accessibility identifier",
        deep_nesting: "Deeply nested (>5 levels)",
      } as Record<string, string>
    )[String(rule)] ?? "Accessibility issue"
  );
}
export function getFixSuggestion(rule: any): any {
  return (
    (
      {
        missing_label: "Add accessibilityLabel",
        empty_button: "Set button title or accessibilityLabel",
        image_no_alt: "Add accessibilityLabel with description",
        missing_hint: "Add accessibilityHint",
        small_touch_target: "Increase to minimum 44x44pt",
        missing_traits: "Set appropriate accessibilityTraits",
        no_identifier: "Add accessibilityIdentifier for testing",
        deep_nesting: "Simplify view hierarchy",
      } as Record<string, string>
    )[String(rule)] ?? "Review accessibility"
  );
}
function hasTraits(traits: any): any {
  if (Array.isArray(traits)) return traits.length > 0;
  return Boolean(traits);
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    udid: null,
    output: null,
    verbose: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--verbose") args.verbose = true;
    else if (["--udid", "--output"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--udid") args.udid = value;
      if (arg === "--output") args.output = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}
export function usage(): any {
  return `Audit iOS simulator screen for accessibility issues.

Usage: node scripts/accessibility_audit.mjs [options]

Options:
  --udid <udid>     Device UDID
  --output <file>   Save JSON report to file
  --verbose         Include all issue details
  --help            Show this help
`;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  let udid;
  try {
    udid = resolveUdid(args.udid);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
  const auditor = new AccessibilityAuditor(udid);
  let result;
  try {
    result = auditor.audit(args.verbose);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
  if (args.output) {
    writeFileSync(args.output, `${JSON.stringify(result, null, 2)}\n`);
    const summary = result.summary;
    console.log(
      `Audit complete: ${summary.issues} issues (${summary.critical} critical)`,
    );
    console.log(`Report saved to: ${args.output}`);
  } else if (args.verbose) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const summary = result.summary;
    console.log(`Elements: ${summary.total}, Issues: ${summary.issues}`);
    console.log(
      `Critical: ${summary.critical}, Warning: ${summary.warning}, Info: ${summary.info}`,
    );
    if (result.top_issues?.length) {
      console.log("\nTop issues:");
      for (const issue of result.top_issues) {
        console.log(
          `  [${issue.severity}] ${issue.rule} (${issue.count}x) - ${issue.fix}`,
        );
      }
    }
  }
  return result.summary.critical > 0 ? 1 : 0;
}
