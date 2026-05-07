/**
 * Launch checklist module for App Store Optimization.
 * Generates comprehensive pre-launch and update checklists.
 */

import { getField, getRecord, getString, runJsonProcedure } from "./cli";

type AnyRecord = Record<string, any>;

export class LaunchChecklistGenerator {
  platform: "apple" | "google" | "both";

  constructor(platform: "apple" | "google" | "both" = "both") {
    if (!["apple", "google", "both"].includes(platform)) {
      throw new Error("Platform must be 'apple', 'google', or 'both'");
    }
    this.platform = platform;
  }

  generatePrelaunchChecklist(appInfo: AnyRecord, launchDate?: string): AnyRecord {
    const checklist: AnyRecord = {
      app_info: appInfo,
      launch_date: launchDate,
      checklists: {},
    };

    if (["apple", "both"].includes(this.platform)) {
      checklist.checklists.apple = this.generateAppleChecklist(appInfo);
    }
    if (["google", "both"].includes(this.platform)) {
      checklist.checklists.google = this.generateGoogleChecklist(appInfo);
    }

    checklist.checklists.universal = this.generateUniversalChecklist(appInfo);

    if (launchDate) {
      checklist.timeline = this.generateLaunchTimeline(launchDate);
    }

    checklist.summary = this.calculateChecklistSummary(checklist.checklists);
    return checklist;
  }

  validateAppStoreCompliance(appData: AnyRecord, platform: "apple" | "google" = "apple"): AnyRecord {
    const results: AnyRecord = {
      platform,
      is_compliant: true,
      errors: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[],
    };

    if (platform === "apple") {
      this.validateAppleCompliance(appData, results);
    } else {
      this.validateGoogleCompliance(appData, results);
    }

    results.is_compliant = results.errors.length === 0;
    return results;
  }

  createUpdatePlan(currentVersion: string, plannedFeatures: string[], updateFrequency = "monthly"): AnyRecord {
    const nextVersions = this.calculateNextVersions(currentVersion, updateFrequency, plannedFeatures.length);
    const featureSchedule = this.distributeFeatures(plannedFeatures, nextVersions);

    return {
      current_version: currentVersion,
      update_frequency: updateFrequency,
      planned_updates: featureSchedule.length,
      feature_schedule: featureSchedule,
      whats_new_templates: featureSchedule.map((item) => this.generateWhatsNewTemplate(item)),
      recommendations: this.generateUpdateRecommendations(updateFrequency),
    };
  }

  optimizeLaunchTiming(appCategory: string, targetAudience: string, currentDate?: string): AnyRecord {
    const date = currentDate ?? formatDate(new Date());

    const dayOfWeekRecommendation = this.recommendDayOfWeek(appCategory);
    const seasonalConsiderations = this.recommendSeasonalTiming(appCategory, date);
    const competitiveTiming = this.analyzeCompetitiveTiming(appCategory);

    const optimalLaunchDates = this.calculateOptimalDates(date, dayOfWeekRecommendation, seasonalConsiderations);

    return {
      current_date: date,
      optimal_launch_dates: optimalLaunchDates,
      day_of_week_recommendation: dayOfWeekRecommendation,
      seasonal_considerations: seasonalConsiderations,
      competitive_timing: competitiveTiming,
      target_audience: targetAudience,
      final_recommendation: this.generateTimingRecommendation(optimalLaunchDates, seasonalConsiderations),
    };
  }

  planSeasonalCampaigns(appCategory: string, currentMonth?: number): AnyRecord {
    const month = currentMonth ?? new Date().getMonth() + 1;
    const seasonalOpportunities = this.identifySeasonalOpportunities(appCategory, month);
    const campaigns = seasonalOpportunities.map((opportunity) => this.generateSeasonalCampaign(opportunity));

    return {
      current_month: month,
      category: appCategory,
      seasonal_opportunities: seasonalOpportunities,
      campaign_ideas: campaigns,
      implementation_timeline: this.createSeasonalTimeline(campaigns),
    };
  }

  private generateAppleChecklist(_appInfo: AnyRecord): AnyRecord[] {
    return [
      {
        category: "App Store Connect Setup",
        items: [
          { task: "App Store Connect account created", status: "pending" },
          { task: "App bundle ID registered", status: "pending" },
          { task: "App Privacy declarations completed", status: "pending" },
          { task: "Age rating questionnaire completed", status: "pending" },
        ],
      },
      {
        category: "Metadata (Apple)",
        items: [
          { task: "App title (30 chars max)", status: "pending" },
          { task: "Subtitle (30 chars max)", status: "pending" },
          { task: "Promotional text (170 chars max)", status: "pending" },
          { task: "Description (4000 chars max)", status: "pending" },
          { task: "Keywords (100 chars, comma-separated)", status: "pending" },
          { task: "Category selection (primary + secondary)", status: "pending" },
        ],
      },
      {
        category: "Visual Assets (Apple)",
        items: [
          { task: "App icon (1024x1024px)", status: "pending" },
          { task: "Screenshots (iPhone 6.7\" required)", status: "pending" },
          { task: "Screenshots (iPhone 5.5\" required)", status: "pending" },
          { task: "Screenshots (iPad Pro 12.9\" if iPad app)", status: "pending" },
          { task: "App preview video (optional but recommended)", status: "pending" },
        ],
      },
      {
        category: "Technical Requirements (Apple)",
        items: [
          { task: "Build uploaded to App Store Connect", status: "pending" },
          { task: "TestFlight testing completed", status: "pending" },
          { task: "App tested on required iOS versions", status: "pending" },
          { task: "Crash-free rate > 99%", status: "pending" },
          { task: "All links in app/metadata working", status: "pending" },
        ],
      },
      {
        category: "Legal & Privacy (Apple)",
        items: [
          { task: "Privacy Policy URL provided", status: "pending" },
          { task: "Terms of Service URL (if applicable)", status: "pending" },
          { task: "Data collection declarations accurate", status: "pending" },
          { task: "Third-party SDKs disclosed", status: "pending" },
        ],
      },
    ];
  }

  private generateGoogleChecklist(_appInfo: AnyRecord): AnyRecord[] {
    return [
      {
        category: "Play Console Setup",
        items: [
          { task: "Google Play Console account created", status: "pending" },
          { task: "Developer profile completed", status: "pending" },
          { task: "Payment merchant account linked (if paid app)", status: "pending" },
          { task: "Content rating questionnaire completed", status: "pending" },
        ],
      },
      {
        category: "Metadata (Google)",
        items: [
          { task: "App title (50 chars max)", status: "pending" },
          { task: "Short description (80 chars max)", status: "pending" },
          { task: "Full description (4000 chars max)", status: "pending" },
          { task: "Category selection", status: "pending" },
          { task: "Tags (up to 5)", status: "pending" },
        ],
      },
      {
        category: "Visual Assets (Google)",
        items: [
          { task: "App icon (512x512px)", status: "pending" },
          { task: "Feature graphic (1024x500px)", status: "pending" },
          { task: "Screenshots (2-8 required, phone)", status: "pending" },
          { task: "Screenshots (tablet, if applicable)", status: "pending" },
          { task: "Promo video (YouTube link, optional)", status: "pending" },
        ],
      },
      {
        category: "Technical Requirements (Google)",
        items: [
          { task: "APK/AAB uploaded to Play Console", status: "pending" },
          { task: "Internal testing completed", status: "pending" },
          { task: "App tested on required Android versions", status: "pending" },
          { task: "Target API level meets requirements", status: "pending" },
          { task: "All permissions justified", status: "pending" },
        ],
      },
      {
        category: "Legal & Privacy (Google)",
        items: [
          { task: "Privacy Policy URL provided", status: "pending" },
          { task: "Data safety section completed", status: "pending" },
          { task: "Ads disclosure (if applicable)", status: "pending" },
          { task: "In-app purchase disclosure (if applicable)", status: "pending" },
        ],
      },
    ];
  }

  private generateUniversalChecklist(_appInfo: AnyRecord): AnyRecord[] {
    return [
      {
        category: "Pre-Launch Marketing",
        items: [
          { task: "Landing page created", status: "pending" },
          { task: "Social media accounts setup", status: "pending" },
          { task: "Press kit prepared", status: "pending" },
          { task: "Beta tester feedback collected", status: "pending" },
          { task: "Launch announcement drafted", status: "pending" },
        ],
      },
      {
        category: "ASO Preparation",
        items: [
          { task: "Keyword research completed", status: "pending" },
          { task: "Competitor analysis done", status: "pending" },
          { task: "A/B test plan created for post-launch", status: "pending" },
          { task: "Analytics tracking configured", status: "pending" },
        ],
      },
      {
        category: "Quality Assurance",
        items: [
          { task: "All core features tested", status: "pending" },
          { task: "User flows validated", status: "pending" },
          { task: "Performance testing completed", status: "pending" },
          { task: "Accessibility features tested", status: "pending" },
          { task: "Security audit completed", status: "pending" },
        ],
      },
      {
        category: "Support Infrastructure",
        items: [
          { task: "Support email/system setup", status: "pending" },
          { task: "FAQ page created", status: "pending" },
          { task: "Documentation for users prepared", status: "pending" },
          { task: "Team trained on handling reviews", status: "pending" },
        ],
      },
    ];
  }

  private generateLaunchTimeline(launchDate: string): AnyRecord[] {
    const launch = parseDate(launchDate);

    return [
      { date: formatDate(addDays(launch, -90)), milestone: "90 days before: Complete keyword research and competitor analysis" },
      { date: formatDate(addDays(launch, -60)), milestone: "60 days before: Finalize metadata and visual assets" },
      { date: formatDate(addDays(launch, -45)), milestone: "45 days before: Begin beta testing program" },
      { date: formatDate(addDays(launch, -30)), milestone: "30 days before: Submit app for review (Apple typically takes 1-2 days, Google instant)" },
      { date: formatDate(addDays(launch, -14)), milestone: "14 days before: Prepare launch marketing materials" },
      { date: formatDate(addDays(launch, -7)), milestone: "7 days before: Set up analytics and monitoring" },
      { date: formatDate(launch), milestone: "Launch Day: Release app and execute marketing plan" },
      { date: formatDate(addDays(launch, 7)), milestone: "7 days after: Monitor metrics, respond to reviews, address critical issues" },
      { date: formatDate(addDays(launch, 30)), milestone: "30 days after: Analyze launch metrics, plan first update" },
    ];
  }

  private calculateChecklistSummary(checklists: Record<string, AnyRecord[]>): AnyRecord {
    let totalItems = 0;
    let completedItems = 0;

    for (const categories of Object.values(checklists)) {
      for (const category of categories) {
        for (const item of category.items) {
          totalItems += 1;
          if (item.status === "completed") {
            completedItems += 1;
          }
        }
      }
    }

    const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return {
      total_items: totalItems,
      completed_items: completedItems,
      pending_items: totalItems - completedItems,
      completion_percentage: roundTo(completionPercentage, 1),
      is_ready_to_launch: completionPercentage === 100,
    };
  }

  private validateAppleCompliance(appData: AnyRecord, validationResults: AnyRecord): void {
    if (!appData.privacy_policy_url) {
      validationResults.errors.push("Privacy Policy URL is required");
    }
    if (!appData.app_icon) {
      validationResults.errors.push("App icon (1024x1024px) is required");
    }

    const title = String(appData.title ?? "");
    if (title.length > 30) {
      validationResults.errors.push(`Title exceeds 30 characters (${title.length})`);
    }

    const subtitle = String(appData.subtitle ?? "");
    if (!subtitle) {
      validationResults.warnings.push("Subtitle is empty - consider adding for better discoverability");
    }

    const keywords = String(appData.keywords ?? "");
    if (keywords.length < 80) {
      validationResults.warnings.push(`Keywords field underutilized (${keywords.length}/100 chars) - add more keywords`);
    }
  }

  private validateGoogleCompliance(appData: AnyRecord, validationResults: AnyRecord): void {
    if (!appData.privacy_policy_url) {
      validationResults.errors.push("Privacy Policy URL is required");
    }
    if (!appData.feature_graphic) {
      validationResults.errors.push("Feature graphic (1024x500px) is required");
    }

    const title = String(appData.title ?? "");
    if (title.length > 50) {
      validationResults.errors.push(`Title exceeds 50 characters (${title.length})`);
    }

    const shortDesc = String(appData.short_description ?? "");
    if (shortDesc.length > 80) {
      validationResults.errors.push(`Short description exceeds 80 characters (${shortDesc.length})`);
    }
    if (!shortDesc) {
      validationResults.warnings.push("Short description is empty");
    }
  }

  private calculateNextVersions(currentVersion: string, updateFrequency: string, featureCount: number): string[] {
    const parts = currentVersion.split(".").map((part) => Number(part));
    const major = Number.isFinite(parts[0]) ? parts[0] : 1;
    let minor = Number.isFinite(parts[1]) ? parts[1] : 0;
    let patch = Number.isFinite(parts[2]) ? parts[2] : 0;

    const versions: string[] = [];
    for (let index = 0; index < featureCount; index += 1) {
      if (updateFrequency === "weekly" || updateFrequency === "biweekly") {
        patch += 1;
      } else {
        minor += 1;
        patch = 0;
      }
      versions.push(`${major}.${minor}.${patch}`);
    }

    return versions;
  }

  private distributeFeatures(features: string[], versions: string[]): AnyRecord[] {
    const featuresPerVersion = Math.max(1, Math.floor(features.length / Math.max(versions.length, 1)));
    const schedule: AnyRecord[] = [];

    for (let index = 0; index < versions.length; index += 1) {
      const start = index * featuresPerVersion;
      const end = index < versions.length - 1 ? start + featuresPerVersion : features.length;
      schedule.push({
        version: versions[index],
        features: features.slice(start, end),
        release_priority: index === 0 ? "high" : index < versions.length / 2 ? "medium" : "low",
      });
    }

    return schedule;
  }

  private generateWhatsNewTemplate(versionData: AnyRecord): AnyRecord {
    const features = Array.isArray(versionData.features) ? versionData.features : [];
    const featureList = features.map((feature: string) => `• ${feature}`).join("\n");
    const template = `Version ${versionData.version}\n\n${featureList}\n\nWe're constantly improving your experience. Thanks for using [App Name]!\n\nHave feedback? Contact us at support@[company].com`;

    return {
      version: versionData.version,
      template,
    };
  }

  private generateUpdateRecommendations(updateFrequency: string): string[] {
    const recommendations: string[] = [];
    if (updateFrequency === "weekly") {
      recommendations.push("Weekly updates show active development but ensure quality doesn't suffer");
    } else if (updateFrequency === "monthly") {
      recommendations.push("Monthly updates are optimal for most apps - balance features and stability");
    }

    recommendations.push(
      "Include bug fixes in every update",
      "Update 'What's New' section with each release",
      "Respond to reviews mentioning fixed issues",
    );

    return recommendations;
  }

  private recommendDayOfWeek(appCategory: string): AnyRecord {
    const category = appCategory.toLowerCase();
    if (["games", "entertainment"].includes(category)) {
      return { recommended_day: "Thursday", rationale: "People download entertainment apps before weekend" };
    }
    if (["productivity", "business"].includes(category)) {
      return { recommended_day: "Tuesday", rationale: "Business users most active mid-week" };
    }
    return { recommended_day: "Wednesday", rationale: "Mid-week provides good balance and review potential" };
  }

  private recommendSeasonalTiming(_appCategory: string, currentDate: string): AnyRecord {
    const current = parseDate(currentDate);
    const month = current.getMonth() + 1;

    const avoidPeriods: string[] = [];
    const goodPeriods: string[] = [];

    if (month === 12) avoidPeriods.push("Late December - low user engagement during holidays");
    if ([7, 8].includes(month)) avoidPeriods.push("Summer months - some categories see lower engagement");

    if ([1, 9].includes(month)) goodPeriods.push("New Year/Back-to-school - high user engagement");
    if ([10, 11].includes(month)) goodPeriods.push("Pre-holiday season - good for shopping/gift apps");

    return {
      current_month: month,
      avoid_periods: avoidPeriods,
      good_periods: goodPeriods,
    };
  }

  private analyzeCompetitiveTiming(_appCategory: string): AnyRecord {
    return {
      recommendation: "Research competitor launch schedules in your category",
      strategy: "Avoid launching same week as major competitor updates",
    };
  }

  private calculateOptimalDates(currentDate: string, dayRec: AnyRecord, seasonalRec: AnyRecord): string[] {
    const current = parseDate(currentDate);
    const daysMap: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
    const targetDay = Number(daysMap[String(dayRec.recommended_day)] ?? 3);

    const currentWeekday = current.getDay() === 0 ? 7 : current.getDay();
    let daysAhead = (targetDay - currentWeekday + 7) % 7;
    if (daysAhead === 0) daysAhead = 7;

    const nextTarget = addDays(current, daysAhead);
    const dates = [nextTarget, addDays(nextTarget, 7), addDays(nextTarget, 14)].map((date) => formatDate(date));

    return seasonalRec.avoid_periods?.length ? dates : dates;
  }

  private generateTimingRecommendation(optimalDates: string[], seasonalRec: AnyRecord): string {
    if (Array.isArray(seasonalRec.avoid_periods) && seasonalRec.avoid_periods.length > 0) {
      return `Consider launching in ${optimalDates[1]} to avoid ${seasonalRec.avoid_periods[0]}`;
    }
    if (Array.isArray(seasonalRec.good_periods) && seasonalRec.good_periods.length > 0) {
      return `Launch on ${optimalDates[0]} to capitalize on ${seasonalRec.good_periods[0]}`;
    }
    return `Recommended launch date: ${optimalDates[0]}`;
  }

  private identifySeasonalOpportunities(appCategory: string, currentMonth: number): AnyRecord[] {
    const opportunities: AnyRecord[] = [];
    const category = appCategory.toLowerCase();

    if (currentMonth === 1) {
      opportunities.push({
        event: "New Year Resolutions",
        dates: "January 1-31",
        relevance: ["health", "fitness", "productivity"].includes(category) ? "high" : "medium",
      });
    }

    if ([11, 12].includes(currentMonth)) {
      opportunities.push({
        event: "Holiday Shopping Season",
        dates: "November-December",
        relevance: ["shopping", "gifts"].includes(category) ? "high" : "low",
      });
    }

    if (category === "education" && [8, 9].includes(currentMonth)) {
      opportunities.push({ event: "Back to School", dates: "August-September", relevance: "high" });
    }

    return opportunities;
  }

  private generateSeasonalCampaign(opportunity: AnyRecord): AnyRecord {
    return {
      event: opportunity.event,
      campaign_idea: `Create themed visuals and messaging for ${opportunity.event}`,
      metadata_updates: "Update app description and screenshots with seasonal themes",
      promotion_strategy: "Consider limited-time features or discounts",
    };
  }

  private createSeasonalTimeline(campaigns: AnyRecord[]): string[] {
    return campaigns.map((campaign) => `30 days before: Plan ${campaign.event} campaign strategy`);
  }
}

export function generateLaunchChecklist(platform: "apple" | "google" | "both", appInfo: AnyRecord, launchDate?: string): AnyRecord {
  const generator = new LaunchChecklistGenerator(platform);
  return generator.generatePrelaunchChecklist(appInfo, launchDate);
}

export const generate_launch_checklist = generateLaunchChecklist;

export function main(argv: string[] = process.argv.slice(2)): number {
  return runJsonProcedure(argv, (request) =>
    generateLaunchChecklist(
      getString(request, ["platform"], "both") as "apple" | "google" | "both",
      getRecord(request, ["appInfo", "app_info", "app"]),
      getField<string | undefined>(request, ["launchDate", "launch_date"], undefined),
    ),
  );
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
