import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * ASO scoring module for App Store Optimization.
 * Calculates comprehensive ASO health score across multiple dimensions.
 */

import { getRecord, runJsonProcedure } from "./cli";

export const procedure = defineCliProcedure({
  id: "app-store-optimization-aso-scorer",
  entry: procedureEntry(import.meta.url),
  description:
    "综合评估 ASO 健康分，覆盖元数据质量、评分评论、关键词表现和转化指标四个维度。",
  owners: { skillIds: ["app-store-optimization"] },
  target: "scripts/aso_scorer.mjs",
  runtime: "node",
  params: [
    {
      flag: "--input",
      type: "路径",
      description:
        "包含 metadata、ratings、keywordPerformance、conversion 的 JSON 输入文件",
      required: false,
    },
  ],

  exampleArgs: { args: ["--input", "aso_score_input.json"] },
});

type AnyRecord = Record<string, any>;

export class ASOScorer {
  static readonly WEIGHTS = {
    metadata_quality: 25,
    ratings_reviews: 25,
    keyword_performance: 25,
    conversion_metrics: 25,
  } as const;

  static readonly BENCHMARKS = {
    title_keyword_usage: { min: 1, target: 2 },
    description_length: { min: 500, target: 2000 },
    keyword_density: { min: 2, optimal: 5, max: 8 },
    average_rating: { min: 3.5, target: 4.5 },
    ratings_count: { min: 100, target: 5000 },
    keywords_top_10: { min: 2, target: 10 },
    keywords_top_50: { min: 5, target: 20 },
    conversion_rate: { min: 0.02, target: 0.1 },
  } as const;

  scoreBreakdown: AnyRecord = {};

  calculateOverallScore(
    metadata: AnyRecord,
    ratings: AnyRecord,
    keywordPerformance: AnyRecord,
    conversion: AnyRecord,
  ): AnyRecord {
    const metadataScore = this.scoreMetadataQuality(metadata);
    const ratingsScore = this.scoreRatingsReviews(ratings);
    const keywordScore = this.scoreKeywordPerformance(keywordPerformance);
    const conversionScore = this.scoreConversionMetrics(conversion);

    const overallScore =
      metadataScore * (ASOScorer.WEIGHTS.metadata_quality / 100) +
      ratingsScore * (ASOScorer.WEIGHTS.ratings_reviews / 100) +
      keywordScore * (ASOScorer.WEIGHTS.keyword_performance / 100) +
      conversionScore * (ASOScorer.WEIGHTS.conversion_metrics / 100);

    this.scoreBreakdown = {
      metadata_quality: {
        score: metadataScore,
        weight: ASOScorer.WEIGHTS.metadata_quality,
        weighted_contribution: roundTo(
          metadataScore * (ASOScorer.WEIGHTS.metadata_quality / 100),
          1,
        ),
      },
      ratings_reviews: {
        score: ratingsScore,
        weight: ASOScorer.WEIGHTS.ratings_reviews,
        weighted_contribution: roundTo(
          ratingsScore * (ASOScorer.WEIGHTS.ratings_reviews / 100),
          1,
        ),
      },
      keyword_performance: {
        score: keywordScore,
        weight: ASOScorer.WEIGHTS.keyword_performance,
        weighted_contribution: roundTo(
          keywordScore * (ASOScorer.WEIGHTS.keyword_performance / 100),
          1,
        ),
      },
      conversion_metrics: {
        score: conversionScore,
        weight: ASOScorer.WEIGHTS.conversion_metrics,
        weighted_contribution: roundTo(
          conversionScore * (ASOScorer.WEIGHTS.conversion_metrics / 100),
          1,
        ),
      },
    };

    const recommendations = this.generateRecommendations(
      metadataScore,
      ratingsScore,
      keywordScore,
      conversionScore,
    );

    return {
      overall_score: roundTo(overallScore, 1),
      health_status: this.assessHealthStatus(overallScore),
      score_breakdown: this.scoreBreakdown,
      recommendations,
      priority_actions: this.prioritizeActions(recommendations),
      strengths: this.identifyStrengths(this.scoreBreakdown),
      weaknesses: this.identifyWeaknesses(this.scoreBreakdown),
    };
  }

  scoreMetadataQuality(metadata: AnyRecord): number {
    const scores: number[] = [];

    const titleKeywords = Number(metadata.title_keyword_count ?? 0);
    const titleLength = Number(metadata.title_length ?? 0);

    let titleScore = 0;
    if (titleKeywords >= ASOScorer.BENCHMARKS.title_keyword_usage.target) {
      titleScore = 35;
    } else if (titleKeywords >= ASOScorer.BENCHMARKS.title_keyword_usage.min) {
      titleScore = 25;
    } else {
      titleScore = 10;
    }

    if (titleLength <= 25) {
      titleScore -= 5;
    }
    scores.push(Math.min(titleScore, 35));

    const descLength = Number(metadata.description_length ?? 0);
    const descQuality = Number(metadata.description_quality ?? 0);

    let descScore = 0;
    if (descLength >= ASOScorer.BENCHMARKS.description_length.target) {
      descScore = 25;
    } else if (descLength >= ASOScorer.BENCHMARKS.description_length.min) {
      descScore = 15;
    } else {
      descScore = 5;
    }
    descScore += descQuality * 10;
    scores.push(Math.min(descScore, 35));

    const keywordDensity = Number(metadata.keyword_density ?? 0);
    let densityScore = 0;
    if (
      keywordDensity >= ASOScorer.BENCHMARKS.keyword_density.min &&
      keywordDensity <= ASOScorer.BENCHMARKS.keyword_density.optimal
    ) {
      densityScore = 30;
    } else if (keywordDensity < ASOScorer.BENCHMARKS.keyword_density.min) {
      densityScore =
        (keywordDensity / ASOScorer.BENCHMARKS.keyword_density.min) * 20;
    } else {
      const excess =
        keywordDensity - ASOScorer.BENCHMARKS.keyword_density.optimal;
      densityScore = Math.max(30 - excess * 5, 0);
    }
    scores.push(densityScore);

    return roundTo(
      scores.reduce((sum, value) => sum + value, 0),
      1,
    );
  }

  scoreRatingsReviews(ratings: AnyRecord): number {
    const averageRating = Number(ratings.average_rating ?? 0);
    const totalRatings = Number(ratings.total_ratings ?? 0);
    const recentRatings = Number(ratings.recent_ratings_30d ?? 0);

    let ratingQualityScore = 0;
    if (averageRating >= ASOScorer.BENCHMARKS.average_rating.target) {
      ratingQualityScore = 50;
    } else if (averageRating >= ASOScorer.BENCHMARKS.average_rating.min) {
      const proportion =
        (averageRating - ASOScorer.BENCHMARKS.average_rating.min) /
        (ASOScorer.BENCHMARKS.average_rating.target -
          ASOScorer.BENCHMARKS.average_rating.min);
      ratingQualityScore = 30 + proportion * 20;
    } else if (averageRating >= 3) {
      ratingQualityScore = 20;
    } else {
      ratingQualityScore = 10;
    }

    let ratingVolumeScore = 0;
    if (totalRatings >= ASOScorer.BENCHMARKS.ratings_count.target) {
      ratingVolumeScore = 30;
    } else if (totalRatings >= ASOScorer.BENCHMARKS.ratings_count.min) {
      const proportion =
        (totalRatings - ASOScorer.BENCHMARKS.ratings_count.min) /
        (ASOScorer.BENCHMARKS.ratings_count.target -
          ASOScorer.BENCHMARKS.ratings_count.min);
      ratingVolumeScore = 15 + proportion * 15;
    } else {
      ratingVolumeScore =
        (totalRatings / ASOScorer.BENCHMARKS.ratings_count.min) * 15;
    }

    let velocityScore = 5;
    if (recentRatings > 100) velocityScore = 20;
    else if (recentRatings > 50) velocityScore = 15;
    else if (recentRatings > 10) velocityScore = 10;

    return roundTo(
      Math.min(ratingQualityScore + ratingVolumeScore + velocityScore, 100),
      1,
    );
  }

  scoreKeywordPerformance(keywordPerformance: AnyRecord): number {
    const top10Count = Number(keywordPerformance.top_10 ?? 0);
    const top50Count = Number(keywordPerformance.top_50 ?? 0);
    const top100Count = Number(keywordPerformance.top_100 ?? 0);
    const improvingKeywords = Number(
      keywordPerformance.improving_keywords ?? 0,
    );

    let top10Score = 0;
    if (top10Count >= ASOScorer.BENCHMARKS.keywords_top_10.target) {
      top10Score = 50;
    } else if (top10Count >= ASOScorer.BENCHMARKS.keywords_top_10.min) {
      const proportion =
        (top10Count - ASOScorer.BENCHMARKS.keywords_top_10.min) /
        (ASOScorer.BENCHMARKS.keywords_top_10.target -
          ASOScorer.BENCHMARKS.keywords_top_10.min);
      top10Score = 25 + proportion * 25;
    } else {
      top10Score = (top10Count / ASOScorer.BENCHMARKS.keywords_top_10.min) * 25;
    }

    let top50Score = 0;
    if (top50Count >= ASOScorer.BENCHMARKS.keywords_top_50.target) {
      top50Score = 30;
    } else if (top50Count >= ASOScorer.BENCHMARKS.keywords_top_50.min) {
      const proportion =
        (top50Count - ASOScorer.BENCHMARKS.keywords_top_50.min) /
        (ASOScorer.BENCHMARKS.keywords_top_50.target -
          ASOScorer.BENCHMARKS.keywords_top_50.min);
      top50Score = 15 + proportion * 15;
    } else {
      top50Score = (top50Count / ASOScorer.BENCHMARKS.keywords_top_50.min) * 15;
    }

    const coverageScore = Math.min((top100Count / 30) * 10, 10);
    const trendScore =
      improvingKeywords > 5 ? 10 : improvingKeywords > 0 ? 5 : 0;

    return roundTo(
      Math.min(top10Score + top50Score + coverageScore + trendScore, 100),
      1,
    );
  }

  scoreConversionMetrics(conversion: AnyRecord): number {
    const conversionRate = Number(conversion.impression_to_install ?? 0);
    const downloads30d = Number(conversion.downloads_last_30_days ?? 0);
    const downloadsTrend = String(conversion.downloads_trend ?? "stable");

    let conversionScore = 0;
    if (conversionRate >= ASOScorer.BENCHMARKS.conversion_rate.target) {
      conversionScore = 70;
    } else if (conversionRate >= ASOScorer.BENCHMARKS.conversion_rate.min) {
      const proportion =
        (conversionRate - ASOScorer.BENCHMARKS.conversion_rate.min) /
        (ASOScorer.BENCHMARKS.conversion_rate.target -
          ASOScorer.BENCHMARKS.conversion_rate.min);
      conversionScore = 35 + proportion * 35;
    } else {
      conversionScore =
        (conversionRate / ASOScorer.BENCHMARKS.conversion_rate.min) * 35;
    }

    let velocityScore = 5;
    if (downloads30d > 10000) velocityScore = 20;
    else if (downloads30d > 1000) velocityScore = 15;
    else if (downloads30d > 100) velocityScore = 10;

    const trendScore =
      downloadsTrend === "up" ? 10 : downloadsTrend === "stable" ? 5 : 0;

    return roundTo(
      Math.min(conversionScore + velocityScore + trendScore, 100),
      1,
    );
  }

  generateRecommendations(
    metadataScore: number,
    ratingsScore: number,
    keywordScore: number,
    conversionScore: number,
  ): AnyRecord[] {
    const recommendations: AnyRecord[] = [];

    if (metadataScore < 60) {
      recommendations.push({
        category: "metadata_quality",
        priority: "high",
        action: "Optimize app title and description",
        details:
          "Add more keywords to title, expand description to 1500-2000 characters, improve keyword density to 3-5%",
        expected_impact: "Improve discoverability and ranking potential",
      });
    } else if (metadataScore < 80) {
      recommendations.push({
        category: "metadata_quality",
        priority: "medium",
        action: "Refine metadata for better keyword targeting",
        details:
          "Test variations of title/subtitle, optimize keyword field for Apple",
        expected_impact: "Incremental ranking improvements",
      });
    }

    if (ratingsScore < 60) {
      recommendations.push({
        category: "ratings_reviews",
        priority: "high",
        action: "Improve rating quality and volume",
        details:
          "Address top user complaints, implement in-app rating prompts, respond to negative reviews",
        expected_impact: "Better conversion rates and trust signals",
      });
    } else if (ratingsScore < 80) {
      recommendations.push({
        category: "ratings_reviews",
        priority: "medium",
        action: "Increase rating velocity",
        details:
          "Optimize timing of rating requests, encourage satisfied users to rate",
        expected_impact: "Sustained rating quality",
      });
    }

    if (keywordScore < 60) {
      recommendations.push({
        category: "keyword_performance",
        priority: "high",
        action: "Improve keyword rankings",
        details:
          "Target long-tail keywords with lower competition, update metadata with high-potential keywords, build backlinks",
        expected_impact: "Significant improvement in organic visibility",
      });
    } else if (keywordScore < 80) {
      recommendations.push({
        category: "keyword_performance",
        priority: "medium",
        action: "Expand keyword coverage",
        details:
          "Target additional related keywords, test seasonal keywords, localize for new markets",
        expected_impact: "Broader reach and more discovery opportunities",
      });
    }

    if (conversionScore < 60) {
      recommendations.push({
        category: "conversion_metrics",
        priority: "high",
        action: "Optimize store listing for conversions",
        details:
          "Improve screenshots and icon, strengthen value proposition in description, add video preview",
        expected_impact: "Higher impression-to-install conversion",
      });
    } else if (conversionScore < 80) {
      recommendations.push({
        category: "conversion_metrics",
        priority: "medium",
        action: "Test visual asset variations",
        details: "A/B test different icon designs and screenshot sequences",
        expected_impact: "Incremental conversion improvements",
      });
    }

    return recommendations;
  }

  private assessHealthStatus(overallScore: number): string {
    if (overallScore >= 80) return "Excellent - Top-tier ASO performance";
    if (overallScore >= 65)
      return "Good - Competitive ASO with room for improvement";
    if (overallScore >= 50) return "Fair - Needs strategic improvements";
    return "Poor - Requires immediate ASO overhaul";
  }

  private prioritizeActions(recommendations: AnyRecord[]): AnyRecord[] {
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    return [...recommendations]
      .sort(
        (a, b) =>
          (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99),
      )
      .slice(0, 3);
  }

  private identifyStrengths(scoreBreakdown: AnyRecord): string[] {
    const strengths: string[] = [];
    for (const [category, data] of Object.entries(scoreBreakdown)) {
      if (Number((data as AnyRecord).score ?? 0) >= 75) {
        strengths.push(
          `${category.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}: ${(data as AnyRecord).score}/100`,
        );
      }
    }
    return strengths.length > 0
      ? strengths
      : ["Focus on building strengths across all areas"];
  }

  private identifyWeaknesses(scoreBreakdown: AnyRecord): string[] {
    const weaknesses: string[] = [];
    for (const [category, data] of Object.entries(scoreBreakdown)) {
      if (Number((data as AnyRecord).score ?? 0) < 60) {
        weaknesses.push(
          `${category.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}: ${(data as AnyRecord).score}/100 - needs improvement`,
        );
      }
    }
    return weaknesses.length > 0
      ? weaknesses
      : ["All areas performing adequately"];
  }
}

export function calculateAsoScore(
  metadata: AnyRecord,
  ratings: AnyRecord,
  keywordPerformance: AnyRecord,
  conversion: AnyRecord,
): AnyRecord {
  const scorer = new ASOScorer();
  return scorer.calculateOverallScore(
    metadata,
    ratings,
    keywordPerformance,
    conversion,
  );
}

export const calculate_aso_score = calculateAsoScore;

export function main(argv: readonly string[]): number {
  return runJsonProcedure(argv, (request) =>
    calculateAsoScore(
      getRecord(request, ["metadata"]),
      getRecord(request, ["ratings"]),
      getRecord(request, ["keywordPerformance", "keyword_performance"]),
      getRecord(request, ["conversion"]),
    ),
  );
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
