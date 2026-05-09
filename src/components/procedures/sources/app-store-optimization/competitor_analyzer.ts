import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * Competitor analysis module for App Store Optimization.
 * Analyzes top competitors' ASO strategies and identifies opportunities.
 */

import { getArray, getString, runJsonProcedure } from "./cli";

export const procedure = defineCliProcedure({
  id: "app-store-optimization-competitor-analyzer",
  entry: procedureEntry(import.meta.url),
  description:
    "分析竞品 ASO 策略，包括标题、描述、关键词、评分对比和差距识别。",
  owners: { skillIds: ["app-store-optimization"] },
  target: "scripts/competitor_analyzer.mjs",
  runtime: "node",
  params: [
    {
      flag: "--input",
      type: "路径",
      description: "包含 category、competitorsData、platform 的 JSON 输入文件",
      required: false,
    },
  ],

  exampleArgs: { args: ["--input", "competitor_input.json"] },
});

type AnyRecord = Record<string, any>;

export class CompetitorAnalyzer {
  category: string;
  platform: string;
  competitors: AnyRecord[] = [];

  constructor(category: string, platform = "apple") {
    this.category = category;
    this.platform = platform;
  }

  analyzeCompetitor(appData: AnyRecord): AnyRecord {
    const appName = String(appData.app_name ?? "");
    const title = String(appData.title ?? "");
    const description = String(appData.description ?? "");
    const rating = Number(appData.rating ?? 0);
    const ratingsCount = Number(appData.ratings_count ?? 0);
    const keywords = Array.isArray(appData.keywords)
      ? appData.keywords.map(String)
      : [];

    const analysis = {
      app_name: appName,
      title_analysis: this.analyzeTitle(title),
      description_analysis: this.analyzeDescription(description),
      keyword_strategy: this.extractKeywordStrategy(
        title,
        description,
        keywords,
      ),
      rating_metrics: {
        rating,
        ratings_count: ratingsCount,
        rating_quality: this.assessRatingQuality(rating, ratingsCount),
      },
      competitive_strength: this.calculateCompetitiveStrength(
        rating,
        ratingsCount,
        description.length,
      ),
      key_differentiators: this.identifyDifferentiators(description),
    };

    this.competitors.push(analysis);
    return analysis;
  }

  compareCompetitors(competitorsData: AnyRecord[]): AnyRecord {
    const analyses = competitorsData.map((data) =>
      this.analyzeCompetitor(data),
    );

    const allKeywords: string[] = [];
    for (const analysis of analyses) {
      allKeywords.push(...analysis.keyword_strategy.primary_keywords);
    }

    const commonKeywords = this.findCommonKeywords(allKeywords);
    const keywordGaps = this.identifyKeywordGaps(analyses);

    const rankedCompetitors = [...analyses].sort(
      (a, b) => b.competitive_strength - a.competitive_strength,
    );

    const ratingAnalysis = this.analyzeRatingDistribution(analyses);
    const bestPractices = this.identifyBestPractices(rankedCompetitors);

    return {
      category: this.category,
      platform: this.platform,
      competitors_analyzed: analyses.length,
      ranked_competitors: rankedCompetitors,
      common_keywords: commonKeywords,
      keyword_gaps: keywordGaps,
      rating_analysis: ratingAnalysis,
      best_practices: bestPractices,
      opportunities: this.identifyOpportunities(
        analyses,
        commonKeywords,
        keywordGaps,
      ),
    };
  }

  identifyGaps(
    yourAppData: AnyRecord,
    competitorsData: AnyRecord[],
  ): AnyRecord {
    const yourAnalysis = this.analyzeCompetitor(yourAppData);
    const comparison = this.compareCompetitors(competitorsData);

    const yourKeywords = new Set<string>(
      yourAnalysis.keyword_strategy.primary_keywords,
    );
    const competitorKeywords = new Set<string>(comparison.common_keywords);
    const missingKeywords = new Set<string>(
      Array.from(competitorKeywords).filter(
        (keyword) => !yourKeywords.has(keyword),
      ),
    );

    const avgCompetitorRating = Number(
      comparison.rating_analysis.average_rating ?? 0,
    );
    const ratingGap =
      avgCompetitorRating - Number(yourAnalysis.rating_metrics.rating ?? 0);

    const ranked: AnyRecord[] = comparison.ranked_competitors;
    const avgDescLength =
      ranked.length > 0
        ? ranked.reduce(
            (sum, comp) =>
              sum + String(comp.description_analysis.text ?? "").length,
            0,
          ) / ranked.length
        : 0;
    const yourDescLength = String(
      yourAnalysis.description_analysis.text ?? "",
    ).length;
    const descLengthGap = avgDescLength - yourDescLength;

    return {
      your_app: yourAnalysis,
      keyword_gaps: {
        missing_keywords: Array.from(missingKeywords).slice(0, 10),
        recommendations: this.generateKeywordRecommendations(missingKeywords),
      },
      rating_gap: {
        your_rating: yourAnalysis.rating_metrics.rating,
        average_competitor_rating: avgCompetitorRating,
        gap: roundTo(ratingGap, 2),
        action_items: this.generateRatingImprovementActions(ratingGap),
      },
      content_gap: {
        your_description_length: yourDescLength,
        average_competitor_length: Math.floor(avgDescLength),
        gap: Math.floor(descLengthGap),
        recommendations: this.generateContentRecommendations(descLengthGap),
      },
      competitive_positioning: this.assessCompetitivePosition(
        yourAnalysis,
        comparison,
      ),
    };
  }

  private analyzeTitle(title: string): AnyRecord {
    const parts = title.split(/[-:|]/g).map((part) => part.trim());
    return {
      title,
      length: title.length,
      has_brand: parts.length > 0,
      has_keywords: parts.length > 1,
      components: parts,
      word_count: title.split(/\s+/).filter(Boolean).length,
      strategy: parts.length > 1 ? "brand_plus_keywords" : "brand_only",
    };
  }

  private analyzeDescription(description: string): AnyRecord {
    const lines = description.split(/\r?\n/);
    const wordCount = description.split(/\s+/).filter(Boolean).length;

    const hasBulletPoints =
      description.includes("•") || description.includes("*");
    const hasSections = lines.some(
      (line) => line.trim().length > 0 && line === line.toUpperCase(),
    );
    const lowered = description.toLowerCase();
    const hasCallToAction = ["download", "try", "get", "start", "join"].some(
      (keyword) => lowered.includes(keyword),
    );

    return {
      text: description,
      length: description.length,
      word_count: wordCount,
      structure: {
        has_bullet_points: hasBulletPoints,
        has_sections: hasSections,
        has_call_to_action: hasCallToAction,
      },
      features_mentioned: this.extractFeatures(description),
      readability:
        wordCount >= 50 && wordCount <= 300 ? "good" : "needs_improvement",
    };
  }

  private extractKeywordStrategy(
    title: string,
    description: string,
    explicitKeywords: string[],
  ): AnyRecord {
    const titleKeywords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const descWords = (description.toLowerCase().match(/\b\w{4,}\b/g) ??
      []) as string[];
    const freq = new Map<string, number>();
    for (const word of descWords) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }

    const frequentWords = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([, count]) => count > 2)
      .slice(0, 15)
      .map(([word]) => word);

    const allKeywords = new Set([
      ...titleKeywords,
      ...frequentWords,
      ...explicitKeywords,
    ]);

    return {
      primary_keywords: titleKeywords,
      description_keywords: frequentWords.slice(0, 10),
      explicit_keywords: explicitKeywords,
      total_unique_keywords: allKeywords.size,
      keyword_focus: this.assessKeywordFocus(titleKeywords, frequentWords),
    };
  }

  private assessRatingQuality(rating: number, ratingsCount: number): string {
    if (ratingsCount < 100) return "insufficient_data";
    if (rating >= 4.5 && ratingsCount > 1000) return "excellent";
    if (rating >= 4 && ratingsCount > 500) return "good";
    if (rating >= 3.5) return "average";
    return "poor";
  }

  private calculateCompetitiveStrength(
    rating: number,
    ratingsCount: number,
    descriptionLength: number,
  ): number {
    const ratingScore = (rating / 5) * 40;
    const volumeScore = Math.min((ratingsCount / 10000) * 30, 30);
    const metadataScore = Math.min((descriptionLength / 2000) * 30, 30);
    return roundTo(ratingScore + volumeScore + metadataScore, 1);
  }

  private identifyDifferentiators(description: string): string[] {
    const keywords = [
      "unique",
      "only",
      "first",
      "best",
      "leading",
      "exclusive",
      "revolutionary",
      "innovative",
      "patent",
      "award",
    ];

    return description
      .split(".")
      .map((sentence) => sentence.trim())
      .filter((sentence) =>
        keywords.some((keyword) => sentence.toLowerCase().includes(keyword)),
      )
      .slice(0, 5);
  }

  private findCommonKeywords(allKeywords: string[]): string[] {
    const counts = new Map<string, number>();
    for (const keyword of allKeywords) {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }

    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);
  }

  private identifyKeywordGaps(analyses: AnyRecord[]): AnyRecord[] {
    const allKeywordsByApp: Record<string, Set<string>> = {};

    for (const analysis of analyses) {
      allKeywordsByApp[analysis.app_name] = new Set(
        analysis.keyword_strategy.primary_keywords,
      );
    }

    const allKeywords = new Set<string>();
    for (const keywords of Object.values(allKeywordsByApp)) {
      for (const keyword of keywords) {
        allKeywords.add(keyword);
      }
    }

    const gaps: AnyRecord[] = [];
    for (const keyword of allKeywords) {
      const usingApps = Object.entries(allKeywordsByApp)
        .filter(([, keywords]) => keywords.has(keyword))
        .map(([app]) => app);

      if (usingApps.length > 1 && usingApps.length < analyses.length) {
        gaps.push({
          keyword,
          used_by: usingApps,
          usage_percentage: roundTo(
            (usingApps.length / analyses.length) * 100,
            1,
          ),
        });
      }
    }

    return gaps
      .sort((a, b) => b.usage_percentage - a.usage_percentage)
      .slice(0, 15);
  }

  private analyzeRatingDistribution(analyses: AnyRecord[]): AnyRecord {
    const ratings = analyses.map((item) =>
      Number(item.rating_metrics.rating ?? 0),
    );
    const counts = analyses.map((item) =>
      Number(item.rating_metrics.ratings_count ?? 0),
    );

    return {
      average_rating: roundTo(
        ratings.reduce((sum, value) => sum + value, 0) /
          Math.max(ratings.length, 1),
        2,
      ),
      highest_rating: Math.max(...ratings),
      lowest_rating: Math.min(...ratings),
      average_ratings_count: Math.floor(
        counts.reduce((sum, value) => sum + value, 0) /
          Math.max(counts.length, 1),
      ),
      total_ratings_in_category: counts.reduce((sum, value) => sum + value, 0),
    };
  }

  private identifyBestPractices(rankedCompetitors: AnyRecord[]): string[] {
    if (rankedCompetitors.length === 0) return [];

    const top = rankedCompetitors[0];
    const practices: string[] = [];

    if (top.title_analysis.has_keywords) {
      practices.push(
        `Title Strategy: Include primary keyword in title (e.g., '${top.title_analysis.title}')`,
      );
    }

    if (top.description_analysis.structure.has_bullet_points) {
      practices.push(
        "Description: Use bullet points to highlight key features",
      );
    }

    if (top.description_analysis.structure.has_sections) {
      practices.push(
        "Description: Organize content with clear section headers",
      );
    }

    if (["excellent", "good"].includes(top.rating_metrics.rating_quality)) {
      practices.push(
        `Ratings: Maintain high rating quality (${top.rating_metrics.rating}★) with significant volume (${top.rating_metrics.ratings_count} ratings)`,
      );
    }

    return practices.slice(0, 5);
  }

  private identifyOpportunities(
    analyses: AnyRecord[],
    _commonKeywords: string[],
    keywordGaps: AnyRecord[],
  ): string[] {
    const opportunities: string[] = [];

    if (keywordGaps.length > 0) {
      const underutilized = keywordGaps
        .filter((gap) => Number(gap.usage_percentage) < 50)
        .map((gap) => String(gap.keyword));

      if (underutilized.length > 0) {
        opportunities.push(
          `Target underutilized keywords: ${underutilized.slice(0, 5).join(", ")}`,
        );
      }
    }

    const avgRating =
      analyses.reduce(
        (sum, item) => sum + Number(item.rating_metrics.rating ?? 0),
        0,
      ) / Math.max(analyses.length, 1);
    if (avgRating < 4.5) {
      opportunities.push(
        `Category average rating is ${avgRating.toFixed(1)} - opportunity to differentiate with higher ratings`,
      );
    }

    const avgDescLength =
      analyses.reduce(
        (sum, item) => sum + Number(item.description_analysis.length ?? 0),
        0,
      ) / Math.max(analyses.length, 1);
    if (avgDescLength < 1500) {
      opportunities.push(
        "Competitors have relatively short descriptions - opportunity to provide more comprehensive information",
      );
    }

    return opportunities.slice(0, 5);
  }

  private extractFeatures(description: string): string[] {
    const features: string[] = [];

    for (const rawLine of description.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;

      if (/[•*\-✓\d]/.test(line[0])) {
        const cleaned = line.replace(/^[•*\-✓\d.)\s]+/, "").trim();
        if (cleaned) {
          features.push(cleaned);
        }
      }
    }

    return features.slice(0, 10);
  }

  private assessKeywordFocus(
    titleKeywords: string[],
    descriptionKeywords: string[],
  ): string {
    const overlap = new Set(
      titleKeywords.filter((keyword) => descriptionKeywords.includes(keyword)),
    );
    if (overlap.size >= 3) return "consistent_focus";
    if (overlap.size >= 1) return "moderate_focus";
    return "broad_focus";
  }

  private generateKeywordRecommendations(
    missingKeywords: Set<string>,
  ): string[] {
    if (missingKeywords.size === 0) {
      return ["Your keyword coverage is comprehensive"];
    }

    const missingList = Array.from(missingKeywords).slice(0, 5);
    return [
      `Consider adding these competitor keywords: ${missingList.join(", ")}`,
      "Test keyword variations in subtitle/promotional text first",
      "Monitor competitor keyword changes monthly",
    ];
  }

  private generateRatingImprovementActions(ratingGap: number): string[] {
    if (ratingGap > 0.5) {
      return [
        "CRITICAL: Significant rating gap - prioritize user satisfaction improvements",
        "Analyze negative reviews to identify top issues",
        "Implement in-app rating prompts after positive experiences",
        "Respond to all negative reviews professionally",
      ];
    }

    if (ratingGap > 0.2) {
      return [
        "Focus on incremental improvements to close rating gap",
        "Optimize timing of rating requests",
      ];
    }

    return [
      "Ratings are competitive - maintain quality and continue improvements",
    ];
  }

  private generateContentRecommendations(descLengthGap: number): string[] {
    if (descLengthGap > 500) {
      return [
        "Expand description to match competitor detail level",
        "Add use case examples and success stories",
        "Include more feature explanations and benefits",
      ];
    }

    if (descLengthGap < -500) {
      return [
        "Consider condensing description for better readability",
        "Focus on most important features first",
      ];
    }

    return ["Description length is competitive"];
  }

  private assessCompetitivePosition(
    yourAnalysis: AnyRecord,
    competitorComparison: AnyRecord,
  ): string {
    const yourStrength = Number(yourAnalysis.competitive_strength ?? 0);
    const competitors: AnyRecord[] =
      competitorComparison.ranked_competitors ?? [];

    if (competitors.length === 0) {
      return "No comparison data available";
    }

    const betterThanCount = competitors.filter(
      (comp) => yourStrength > Number(comp.competitive_strength ?? 0),
    ).length;
    const positionPercentage = (betterThanCount / competitors.length) * 100;

    if (positionPercentage >= 75)
      return "Strong Position: Top quartile in competitive strength";
    if (positionPercentage >= 50)
      return "Competitive Position: Above average, opportunities for improvement";
    if (positionPercentage >= 25)
      return "Challenging Position: Below average, requires strategic improvements";
    return "Weak Position: Bottom quartile, major ASO overhaul needed";
  }
}

export function analyzeCompetitorSet(
  category: string,
  competitorsData: AnyRecord[],
  platform = "apple",
): AnyRecord {
  const analyzer = new CompetitorAnalyzer(category, platform);
  return analyzer.compareCompetitors(competitorsData);
}

export const analyze_competitor_set = analyzeCompetitorSet;

export function main(argv: readonly string[]): number {
  return runJsonProcedure(argv, (request) =>
    analyzeCompetitorSet(
      getString(request, ["category"]),
      getArray<AnyRecord>(request, [
        "competitorsData",
        "competitors_data",
        "competitors",
      ]),
      getString(request, ["platform"], "apple"),
    ),
  );
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
