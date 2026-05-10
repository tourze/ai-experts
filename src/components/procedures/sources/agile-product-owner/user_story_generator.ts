#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";

export const procedure = defineCliProcedure({
  id: "agile-product-owner-user-story-generator",
  entry: procedureEntry(import.meta.url),
  description:
    "根据 Epic 和容量生成用户故事 Backlog 或 Sprint 计划，输出故事编号、标题、验收标准、INVEST 检查和优先级。",
  owners: { skillIds: ["agile-product-owner"] },
  target: "scripts/user_story_generator.mjs",
  runtime: "node",
  params: [
    {
      flag: "[mode]",
      type: "字符串",
      description: "生成模式：backlog 或 sprint（默认 backlog）",
      required: false,
    },
    {
      flag: "[capacity]",
      type: "数字",
      description: "Sprint 容量点数，仅 mode=sprint 时使用（默认 30）",
      required: false,
    },
  ],

  exampleArgs: { args: ["sprint", "30"] },
});

class UserStoryGenerator {
  personas: any;
  storyTemplates: any;
  constructor() {
    this.personas = {
      end_user: {
        name: "End User",
        needs: ["efficiency", "simplicity", "reliability", "speed"],
        context: "daily usage of core features",
      },
      admin: {
        name: "Administrator",
        needs: ["control", "visibility", "security", "configuration"],
        context: "system management and oversight",
      },
      power_user: {
        name: "Power User",
        needs: [
          "advanced features",
          "automation",
          "customization",
          "shortcuts",
        ],
        context: "expert usage and workflow optimization",
      },
      new_user: {
        name: "New User",
        needs: ["guidance", "learning", "safety", "clarity"],
        context: "first-time experience and onboarding",
      },
    };
    this.storyTemplates = {
      feature: "As a {persona}, I want to {action} so that {benefit}",
      improvement: "As a {persona}, I need {capability} to {achieve_goal}",
      fix: "As a {persona}, I expect {behavior} when {condition}",
      integration: "As a {persona}, I want to {integrate} so that {workflow}",
    };
  }
  generateEpicStories(epic: any): any {
    const stories: any[] = [];
    const epicName = epic.name ?? "Feature";
    const personas = epic.personas ?? ["end_user"];
    const scope = epic.scope ?? [];
    for (const persona of personas) {
      scope.forEach((scopeItem: any, index: any) => {
        stories.push(
          this.generateStory(persona, scopeItem, epicName, index + 1),
        );
      });
    }
    if (epic.technical_requirements) {
      for (const requirement of epic.technical_requirements) {
        stories.push(this.generateEnablerStory(requirement, epicName));
      }
    }
    return stories;
  }
  generateStory(persona: any, feature: any, epic: any, index: any): any {
    const personaData = this.personas[persona] ?? this.personas.end_user;
    return {
      id: `${epic.slice(0, 3).toUpperCase()}-${String(index).padStart(3, "0")}`,
      type: "story",
      title: this.generateTitle(feature),
      narrative: this.generateNarrative(personaData, feature),
      acceptance_criteria: this.generateAcceptanceCriteria(feature),
      estimation: this.estimateComplexity(feature),
      priority: this.determinePriority(persona, feature),
      dependencies: [],
      invest_check: this.checkInvestCriteria(feature),
    };
  }
  generateEnablerStory(requirement: any, epic: any): any {
    return {
      id: `${epic.slice(0, 3).toUpperCase()}-E${String(requirement.length).padStart(2, "0")}`,
      type: "enabler",
      title: `Technical: ${requirement}`,
      narrative: `As a developer, I need to ${requirement} to enable user features`,
      acceptance_criteria: [
        `Technical requirement ${requirement} is implemented`,
        "All tests pass",
        "Documentation is updated",
        "No regression in existing functionality",
      ],
      estimation: 5,
      priority: "high",
      dependencies: [],
      invest_check: {
        independent: true,
        negotiable: false,
        valuable: true,
        estimable: true,
        small: true,
        testable: true,
      },
    };
  }
  generateTitle(feature: any): any {
    return feature
      .split(/\s+/)
      .slice(0, 5)
      .map(
        (word: any) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join(" ");
  }
  generateNarrative(persona: any, feature: any): any {
    return this.storyTemplates.feature
      .replace("{persona}", persona.name)
      .replace("{action}", this.extractAction(feature))
      .replace("{benefit}", this.extractBenefit(feature, persona.needs));
  }
  generateAcceptanceCriteria(feature: any): any {
    return [
      `Given user has access, When they ${this.extractAction(feature)}, Then ${this.extractOutcome(feature)}`,
      "Should validate input before processing",
      "Must show clear error message when action fails",
      "Should complete within 2 seconds",
      "Must be accessible via keyboard navigation",
    ];
  }
  extractAction(feature: any): any {
    const actionVerbs: any[] = [
      "create",
      "view",
      "edit",
      "delete",
      "share",
      "export",
      "import",
      "configure",
      "search",
      "filter",
    ];
    const featureLower = feature.toLowerCase();
    return actionVerbs.some((verb: any) => featureLower.includes(verb))
      ? featureLower
      : `use ${featureLower}`;
  }
  extractBenefit(feature: any, needs: any): any {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes("save") || featureLower.includes("quick")) {
      return "I can save time and work more efficiently";
    }
    if (featureLower.includes("share") || featureLower.includes("collab")) {
      return "I can collaborate with my team effectively";
    }
    if (featureLower.includes("report") || featureLower.includes("analyt")) {
      return "I can make data-driven decisions";
    }
    if (featureLower.includes("automat")) {
      return "I can reduce manual work and errors";
    }
    return `I can achieve my goals related to ${needs[0]}`;
  }
  extractOutcome(feature: any): any {
    return `the ${feature.toLowerCase()} is successfully completed`;
  }
  estimateComplexity(feature: any): any {
    const featureLower = feature.toLowerCase();
    let complexity = 3;
    if (
      ["simple", "basic", "view", "display"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      complexity = 1;
    } else if (
      ["create", "edit", "update"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      complexity = 3;
    } else if (
      ["complex", "advanced", "integrate", "migrate"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      complexity = 8;
    } else if (
      ["redesign", "refactor", "architect"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      complexity = 13;
    }
    return complexity;
  }
  determinePriority(persona: any, feature: any): any {
    const featureLower = feature.toLowerCase();
    if (
      ["security", "fix", "critical", "broken"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      return "critical";
    }
    if (
      ["end_user", "admin"].includes(persona) &&
      ["core", "essential", "primary"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      return "high";
    }
    if (
      ["improve", "enhance", "optimize"].some((word: any) =>
        featureLower.includes(word),
      )
    ) {
      return "medium";
    }
    return "low";
  }
  checkInvestCriteria(feature: any): any {
    const featureLower = feature.toLowerCase();
    return {
      independent: !["after", "depends", "requires"].some((word: any) =>
        featureLower.includes(word),
      ),
      negotiable: true,
      valuable: true,
      estimable: feature.split(/\s+/).filter(Boolean).length < 20,
      small: this.estimateComplexity(feature) <= 8,
      testable: !["maybe", "possibly", "somehow"].some((word: any) =>
        featureLower.includes(word),
      ),
    };
  }
  generateSprintStories(capacity: any, backlog: any): any {
    if (capacity <= 0) {
      throw new Error("capacity must be a positive integer");
    }
    const sprint: Record<string, any> = {
      capacity,
      committed: [],
      stretch: [],
      total_points: 0,
      utilization: 0,
    };
    const priorityOrder: Record<string, any> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    const sortedBacklog = [...backlog].sort(
      (a: any, b: any) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.estimation - b.estimation,
    );
    for (const story of sortedBacklog) {
      if (sprint.total_points + story.estimation <= capacity) {
        sprint.committed.push(story);
        sprint.total_points += story.estimation;
      } else if (sprint.total_points + story.estimation <= capacity * 1.2) {
        sprint.stretch.push(story);
      }
    }
    sprint.utilization =
      Math.round((sprint.total_points / capacity) * 1000) / 10;
    return sprint;
  }
  formatStoryOutput(story: any): any {
    const output: any[] = [];
    output.push(`USER STORY: ${story.id}`);
    output.push("=".repeat(40));
    output.push(`Title: ${story.title}`);
    output.push(`Type: ${story.type}`);
    output.push(`Priority: ${story.priority.toUpperCase()}`);
    output.push(`Points: ${story.estimation}`);
    output.push("");
    output.push("Story:");
    output.push(story.narrative);
    output.push("");
    output.push("Acceptance Criteria:");
    story.acceptance_criteria.forEach((criterion: any, index: any) => {
      output.push(`  ${index + 1}. ${criterion}`);
    });
    output.push("");
    output.push("INVEST Checklist:");
    for (const [criterion, passed] of Object.entries(story.invest_check)) {
      const status = passed ? "✓" : "✗";
      output.push(
        `  ${status} ${criterion.charAt(0).toUpperCase()}${criterion.slice(1)}`,
      );
    }
    return output.join("\n");
  }
}
function createSampleEpic(): any {
  return {
    name: "User Dashboard",
    description:
      "Create a comprehensive dashboard for users to view their data",
    personas: ["end_user", "power_user"],
    scope: [
      "View key metrics and KPIs",
      "Customize dashboard layout",
      "Export dashboard data",
      "Share dashboard with team members",
      "Set up automated reports",
    ],
    technical_requirements: [
      "Implement caching for performance",
      "Set up real-time data pipeline",
    ],
  };
}
function parseCapacity(value: any): any {
  if (!/^[+-]?\d+$/.test(value)) {
    throw new Error("capacity must be a positive integer");
  }
  const capacity = Number.parseInt(value, 10);
  if (capacity <= 0) {
    throw new Error("capacity must be a positive integer");
  }
  return capacity;
}
function sprintMode(generator: any, argv: readonly string[]): any {
  const capacity = parseCapacity(argv[1] ?? "30");
  const epic = createSampleEpic();
  const backlog = generator.generateEpicStories(epic);
  const sprint = generator.generateSprintStories(capacity, backlog);
  console.log("=".repeat(60));
  console.log("SPRINT PLANNING");
  console.log("=".repeat(60));
  console.log(`Sprint Capacity: ${sprint.capacity} points`);
  console.log(
    `Committed: ${sprint.total_points} points (${sprint.utilization}%)`,
  );
  console.log(
    `Stories: ${sprint.committed.length} committed + ${sprint.stretch.length} stretch`,
  );
  console.log("\n📋 COMMITTED STORIES:\n");
  for (const story of sprint.committed) {
    console.log(
      `  [${story.priority.slice(0, 1).toUpperCase()}] ${story.id}: ${story.title} (${story.estimation}pts)`,
    );
  }
  if (sprint.stretch.length > 0) {
    console.log("\n🎯 STRETCH GOALS:\n");
    for (const story of sprint.stretch) {
      console.log(
        `  [${story.priority.slice(0, 1).toUpperCase()}] ${story.id}: ${story.title} (${story.estimation}pts)`,
      );
    }
  }
}
function backlogMode(generator: any): any {
  const epic = createSampleEpic();
  const stories = generator.generateEpicStories(epic);
  console.log(`Generated ${stories.length} stories from epic: ${epic.name}\n`);
  for (const story of stories.slice(0, 3)) {
    console.log(generator.formatStoryOutput(story));
    console.log("\n");
  }
  console.log("=".repeat(60));
  console.log("BACKLOG SUMMARY");
  console.log("=".repeat(60));
  const totalPoints = stories.reduce(
    (sum: any, story: any) => sum + story.estimation,
    0,
  );
  console.log(`Total Stories: ${stories.length}`);
  console.log(`Total Points: ${totalPoints}`);
  console.log(
    `Average Size: ${(totalPoints / stories.length).toFixed(1)} points`,
  );
  console.log("\nPriority Breakdown:");
  for (const priority of ["critical", "high", "medium", "low"]) {
    const count = stories.filter(
      (story: any) => story.priority === priority,
    ).length;
    if (count > 0) {
      console.log(
        `  ${priority.charAt(0).toUpperCase()}${priority.slice(1)}: ${count} stories`,
      );
    }
  }
}
export function main(argv: readonly string[]): any {
  const generator = new UserStoryGenerator();
  if (argv[0] === "sprint") {
    sprintMode(generator, argv);
  } else {
    backlogMode(generator);
  }
}
