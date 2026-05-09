import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * Review analysis module for App Store Optimization.
 * Analyzes user reviews for sentiment, issues, and feature requests.
 */

import { getArray, getString, runJsonProcedure } from "./cli";

export const procedure = defineCliProcedure({
  id: "app-store-optimization-review-analyzer",
  entry: procedureEntry(import.meta.url),
  description: "分析用户评论情感、常见主题、问题分类、功能请求和情感趋势。",
  owners: { skillIds: ["app-store-optimization"] },
  target: "scripts/review_analyzer.mjs",
  runtime: "node",
  params: [
    {
      flag: "--input",
      type: "路径",
      description: "包含 appName、reviews 数组的 JSON 输入文件",
      required: false,
    },
  ],

  exampleArgs: { args: ["--input", "review_input.json"] },
});

type AnyRecord = Record<string, any>;

const POSITIVE_KEYWORDS = [
  "great",
  "awesome",
  "excellent",
  "amazing",
  "love",
  "best",
  "perfect",
  "fantastic",
  "wonderful",
  "brilliant",
  "outstanding",
  "superb",
];

const NEGATIVE_KEYWORDS = [
  "bad",
  "terrible",
  "awful",
  "horrible",
  "hate",
  "worst",
  "useless",
  "broken",
  "crash",
  "bug",
  "slow",
  "disappointing",
  "frustrating",
];

const ISSUE_KEYWORDS = [
  "crash",
  "bug",
  "error",
  "broken",
  "not working",
  "doesnt work",
  "freezes",
  "slow",
  "laggy",
  "glitch",
  "problem",
  "issue",
  "fail",
];

const FEATURE_REQUEST_KEYWORDS = [
  "wish",
  "would be nice",
  "should add",
  "need",
  "want",
  "hope",
  "please add",
  "missing",
  "lacks",
  "feature request",
];

export class ReviewAnalyzer {
  appName: string;
  reviews: AnyRecord[] = [];
  analysisCache: AnyRecord = {};

  constructor(appName: string) {
    this.appName = appName;
  }

  analyzeSentiment(reviews: AnyRecord[]): AnyRecord {
    this.reviews = reviews;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const detailedSentiments: AnyRecord[] = [];

    for (const review of reviews) {
      const text = String(review.text ?? "").toLowerCase();
      const rating = Number(review.rating ?? 3);

      const sentimentScore = this.calculateSentimentScore(text, rating);
      const sentiment = this.categorizeSentiment(sentimentScore);
      sentimentCounts[sentiment as keyof typeof sentimentCounts] += 1;

      detailedSentiments.push({
        review_id: review.id ?? "",
        rating,
        sentiment_score: sentimentScore,
        sentiment,
        text_preview: text.length > 100 ? `${text.slice(0, 100)}...` : text,
      });
    }

    const total = reviews.length;
    const distribution = {
      positive:
        total > 0 ? roundTo((sentimentCounts.positive / total) * 100, 1) : 0,
      neutral:
        total > 0 ? roundTo((sentimentCounts.neutral / total) * 100, 1) : 0,
      negative:
        total > 0 ? roundTo((sentimentCounts.negative / total) * 100, 1) : 0,
    };

    const averageRating =
      total > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) /
          total
        : 0;

    return {
      total_reviews_analyzed: total,
      average_rating: roundTo(averageRating, 2),
      sentiment_distribution: distribution,
      sentiment_counts: sentimentCounts,
      sentiment_trend: this.assessSentimentTrend(distribution),
      detailed_sentiments: detailedSentiments.slice(0, 50),
    };
  }

  extractCommonThemes(reviews: AnyRecord[], minMentions = 3): AnyRecord {
    const allWords: string[] = [];
    const allPhrases: string[] = [];

    const stopWords = new Set([
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
      "from",
      "have",
      "app",
      "apps",
      "very",
      "really",
      "just",
      "but",
      "not",
      "you",
    ]);

    for (const review of reviews) {
      const text = String(review.text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, " ");
      const words = text
        .split(/\s+/)
        .filter(Boolean)
        .filter((word) => !stopWords.has(word) && word.length > 3);

      allWords.push(...words);

      for (let i = 0; i < words.length - 1; i += 1) {
        allPhrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    const commonWords = topCounts(allWords, 30, minMentions).map(
      ([word, mentions]) => ({ word, mentions }),
    );
    const commonPhrases = topCounts(allPhrases, 20, minMentions).map(
      ([phrase, mentions]) => ({ phrase, mentions }),
    );
    const themes = this.categorizeThemes(commonWords, commonPhrases);

    return {
      common_words: commonWords,
      common_phrases: commonPhrases,
      identified_themes: themes,
      insights: this.generateThemeInsights(themes),
    };
  }

  identifyIssues(reviews: AnyRecord[], ratingThreshold = 3): AnyRecord {
    const issues: AnyRecord[] = [];

    for (const review of reviews) {
      const rating = Number(review.rating ?? 5);
      if (rating > ratingThreshold) continue;

      const text = String(review.text ?? "").toLowerCase();
      const mentionedIssues = ISSUE_KEYWORDS.filter((keyword) =>
        text.includes(keyword),
      );

      if (mentionedIssues.length === 0) continue;

      issues.push({
        review_id: review.id ?? "",
        rating,
        date: review.date ?? "",
        issue_keywords: mentionedIssues,
        text: text.length > 200 ? `${text.slice(0, 200)}...` : text,
      });
    }

    const issueFrequency = new Map<string, number>();
    for (const issue of issues) {
      for (const keyword of issue.issue_keywords) {
        issueFrequency.set(keyword, (issueFrequency.get(keyword) ?? 0) + 1);
      }
    }

    const categorizedIssues = this.categorizeIssues(issues);
    const severityScores = this.calculateIssueSeverity(
      categorizedIssues,
      reviews.length,
    );

    return {
      total_issues_found: issues.length,
      issue_frequency: Object.fromEntries(
        [...issueFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15),
      ),
      categorized_issues: categorizedIssues,
      severity_scores: severityScores,
      top_issues: this.rankIssuesBySeverity(severityScores),
      recommendations: this.generateIssueRecommendations(
        categorizedIssues,
        severityScores,
      ),
    };
  }

  findFeatureRequests(reviews: AnyRecord[]): AnyRecord {
    const featureRequests: AnyRecord[] = [];

    for (const review of reviews) {
      const text = String(review.text ?? "").toLowerCase();
      const rating = Number(review.rating ?? 3);

      if (!FEATURE_REQUEST_KEYWORDS.some((keyword) => text.includes(keyword)))
        continue;

      featureRequests.push({
        review_id: review.id ?? "",
        rating,
        date: review.date ?? "",
        request_text: this.extractFeatureRequestText(text),
        full_review: text.length > 200 ? `${text.slice(0, 200)}...` : text,
      });
    }

    const clustered = this.clusterFeatureRequests(featureRequests);
    const prioritized = this.prioritizeFeatureRequests(clustered);

    return {
      total_feature_requests: featureRequests.length,
      clustered_requests: clustered,
      prioritized_requests: prioritized,
      implementation_recommendations:
        this.generateFeatureRecommendations(prioritized),
    };
  }

  trackSentimentTrends(
    reviewsByPeriod: Record<string, AnyRecord[]>,
  ): AnyRecord {
    const trends: AnyRecord[] = [];

    for (const [period, reviews] of Object.entries(reviewsByPeriod)) {
      const sentiment = this.analyzeSentiment(reviews);
      trends.push({
        period,
        total_reviews: reviews.length,
        average_rating: sentiment.average_rating,
        positive_percentage: sentiment.sentiment_distribution.positive,
        negative_percentage: sentiment.sentiment_distribution.negative,
      });
    }

    let trendDirection = "insufficient_data";
    if (trends.length >= 2) {
      const first = trends[0];
      const last = trends[trends.length - 1];
      const ratingChange =
        Number(last.average_rating) - Number(first.average_rating);
      const sentimentChange =
        Number(last.positive_percentage) - Number(first.positive_percentage);
      trendDirection = this.determineTrendDirection(
        ratingChange,
        sentimentChange,
      );
    }

    return {
      periods_analyzed: trends.length,
      trend_data: trends,
      trend_direction: trendDirection,
      insights: this.generateTrendInsights(trends, trendDirection),
    };
  }

  generateResponseTemplates(issueCategory: string): AnyRecord[] {
    const templates: Record<string, AnyRecord[]> = {
      crash: [
        {
          scenario: "App crash reported",
          template:
            "Thank you for bringing this to our attention. We're sorry you experienced a crash. Our team is investigating this issue. Could you please share more details about when this occurred (device model, iOS/Android version) by contacting support@[company].com? We're committed to fixing this quickly.",
        },
        {
          scenario: "Crash already fixed",
          template:
            "Thank you for your feedback. We've identified and fixed this crash issue in version [X.X]. Please update to the latest version. If the problem persists, please reach out to support@[company].com and we'll help you directly.",
        },
      ],
      bug: [
        {
          scenario: "Bug reported",
          template:
            "Thanks for reporting this bug. We take these issues seriously. Our team is looking into it and we'll have a fix in an upcoming update. We appreciate your patience and will notify you when it's resolved.",
        },
      ],
      feature_request: [
        {
          scenario: "Feature request received",
          template:
            "Thank you for this suggestion! We're always looking to improve [app_name]. We've added your request to our roadmap and will consider it for a future update. Follow us @[social] for updates on new features.",
        },
        {
          scenario: "Feature already planned",
          template:
            "Great news! This feature is already on our roadmap and we're working on it. Stay tuned for updates in the coming months. Thanks for your feedback!",
        },
      ],
      positive: [
        {
          scenario: "Positive review",
          template:
            "Thank you so much for your kind words! We're thrilled that you're enjoying [app_name]. Reviews like yours motivate our team to keep improving. If you ever have suggestions, we'd love to hear them!",
        },
      ],
      negative_general: [
        {
          scenario: "General complaint",
          template:
            "We're sorry to hear you're not satisfied with your experience. We'd like to make this right. Please contact us at support@[company].com so we can understand the issue better and help you directly. Thank you for giving us a chance to improve.",
        },
      ],
    };

    return templates[issueCategory] ?? templates.negative_general;
  }

  private calculateSentimentScore(text: string, rating: number): number {
    const ratingScore = (rating - 3) / 2;

    const positiveCount = POSITIVE_KEYWORDS.filter((keyword) =>
      text.includes(keyword),
    ).length;
    const negativeCount = NEGATIVE_KEYWORDS.filter((keyword) =>
      text.includes(keyword),
    ).length;
    const textScore = (positiveCount - negativeCount) / 10;

    const finalScore = ratingScore * 0.6 + textScore * 0.4;
    return Math.max(Math.min(finalScore, 1), -1);
  }

  private categorizeSentiment(
    score: number,
  ): "positive" | "neutral" | "negative" {
    if (score > 0.3) return "positive";
    if (score < -0.3) return "negative";
    return "neutral";
  }

  private assessSentimentTrend(distribution: Record<string, number>): string {
    const positive = Number(distribution.positive ?? 0);
    const negative = Number(distribution.negative ?? 0);

    if (positive > 70) return "very_positive";
    if (positive > 50) return "positive";
    if (negative > 50) return "critical";
    if (negative > 30) return "concerning";
    return "mixed";
  }

  private categorizeThemes(
    commonWords: AnyRecord[],
    _commonPhrases: AnyRecord[],
  ): Record<string, string[]> {
    const themes: Record<string, string[]> = {
      features: [],
      performance: [],
      usability: [],
      support: [],
      pricing: [],
    };

    const featureKeywords = ["feature", "functionality", "option", "tool"];
    const performanceKeywords = [
      "fast",
      "slow",
      "crash",
      "lag",
      "speed",
      "performance",
    ];
    const usabilityKeywords = [
      "easy",
      "difficult",
      "intuitive",
      "confusing",
      "interface",
      "design",
    ];
    const supportKeywords = [
      "support",
      "help",
      "customer",
      "service",
      "response",
    ];
    const pricingKeywords = [
      "price",
      "cost",
      "expensive",
      "cheap",
      "subscription",
      "free",
    ];

    for (const wordData of commonWords) {
      const word = String(wordData.word ?? "");
      if (featureKeywords.some((kw) => word.includes(kw)))
        themes.features.push(word);
      else if (performanceKeywords.some((kw) => word.includes(kw)))
        themes.performance.push(word);
      else if (usabilityKeywords.some((kw) => word.includes(kw)))
        themes.usability.push(word);
      else if (supportKeywords.some((kw) => word.includes(kw)))
        themes.support.push(word);
      else if (pricingKeywords.some((kw) => word.includes(kw)))
        themes.pricing.push(word);
    }

    return Object.fromEntries(
      Object.entries(themes).filter(([, value]) => value.length > 0),
    );
  }

  private generateThemeInsights(themes: Record<string, string[]>): string[] {
    const insights: string[] = [];
    for (const [category, keywords] of Object.entries(themes)) {
      if (keywords.length > 0) {
        insights.push(
          `${titleCase(category)}: Users frequently mention ${keywords.slice(0, 3).join(", ")}`,
        );
      }
    }
    return insights.slice(0, 5);
  }

  private categorizeIssues(issues: AnyRecord[]): Record<string, AnyRecord[]> {
    const categories: Record<string, AnyRecord[]> = {
      crashes: [],
      bugs: [],
      performance: [],
      compatibility: [],
    };

    for (const issue of issues) {
      const keywords = issue.issue_keywords as string[];
      if (keywords.includes("crash") || keywords.includes("freezes"))
        categories.crashes.push(issue);
      else if (
        keywords.includes("bug") ||
        keywords.includes("error") ||
        keywords.includes("broken")
      ) {
        categories.bugs.push(issue);
      } else if (keywords.includes("slow") || keywords.includes("laggy")) {
        categories.performance.push(issue);
      } else {
        categories.compatibility.push(issue);
      }
    }

    return Object.fromEntries(
      Object.entries(categories).filter(([, value]) => value.length > 0),
    );
  }

  private calculateIssueSeverity(
    categorizedIssues: Record<string, AnyRecord[]>,
    totalReviews: number,
  ): AnyRecord {
    const severityScores: AnyRecord = {};

    for (const [category, issues] of Object.entries(categorizedIssues)) {
      const count = issues.length;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      const avgRating =
        count > 0
          ? issues.reduce((sum, issue) => sum + Number(issue.rating ?? 0), 0) /
            count
          : 0;
      const severity = Math.min(percentage * 10 + (5 - avgRating) * 10, 100);

      severityScores[category] = {
        count,
        percentage: roundTo(percentage, 2),
        average_rating: roundTo(avgRating, 2),
        severity_score: roundTo(severity, 1),
        priority:
          severity > 70 ? "critical" : severity > 40 ? "high" : "medium",
      };
    }

    return severityScores;
  }

  private rankIssuesBySeverity(severityScores: AnyRecord): AnyRecord[] {
    return Object.entries(severityScores)
      .map(([category, data]) => ({
        category,
        ...(data as { severity_score?: number } & AnyRecord),
      }))
      .sort(
        (a: { severity_score?: number }, b: { severity_score?: number }) =>
          Number(b.severity_score ?? 0) - Number(a.severity_score ?? 0),
      );
  }

  private generateIssueRecommendations(
    _categorizedIssues: Record<string, AnyRecord[]>,
    severityScores: AnyRecord,
  ): string[] {
    const recommendations: string[] = [];

    for (const [category, scoreData] of Object.entries(severityScores)) {
      const data = scoreData as AnyRecord;
      if (data.priority === "critical") {
        recommendations.push(
          `URGENT: Address ${category} issues immediately - affecting ${data.percentage}% of reviews`,
        );
      } else if (data.priority === "high") {
        recommendations.push(
          `HIGH PRIORITY: Focus on ${category} issues in next update`,
        );
      }
    }

    return recommendations;
  }

  private extractFeatureRequestText(text: string): string {
    const sentences = text.split(".");
    for (const sentence of sentences) {
      if (
        FEATURE_REQUEST_KEYWORDS.some((keyword) => sentence.includes(keyword))
      ) {
        return sentence.trim();
      }
    }
    return text.slice(0, 100);
  }

  private clusterFeatureRequests(featureRequests: AnyRecord[]): AnyRecord[] {
    const clusters = new Map<string, AnyRecord[]>();

    for (const request of featureRequests) {
      const text = String(request.request_text ?? "").toLowerCase();
      const words = text.split(/\s+/).filter((word) => word.length > 4);

      let matchedKey: string | null = null;
      for (const key of clusters.keys()) {
        if (words.slice(0, 3).some((word) => key.includes(word))) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        clusters.get(matchedKey)?.push(request);
      } else if (words.length > 0) {
        clusters.set(`${words[0]} ${words[1] ?? ""}`.trim(), [request]);
      }
    }

    return [...clusters.entries()].map(([theme, requests]) => ({
      feature_theme: theme,
      request_count: requests.length,
      examples: requests.slice(0, 3),
    }));
  }

  private prioritizeFeatureRequests(
    clusteredRequests: AnyRecord[],
  ): AnyRecord[] {
    return [...clusteredRequests]
      .sort((a, b) => Number(b.request_count) - Number(a.request_count))
      .slice(0, 10);
  }

  private generateFeatureRecommendations(
    prioritizedRequests: AnyRecord[],
  ): string[] {
    const recommendations: string[] = [];

    if (prioritizedRequests.length > 0) {
      const top = prioritizedRequests[0];
      recommendations.push(
        `Most requested feature: ${top.feature_theme} (${top.request_count} mentions) - consider for next major release`,
      );
    }

    if (prioritizedRequests.length > 1) {
      recommendations.push(
        `Also consider: ${prioritizedRequests[1].feature_theme}`,
      );
    }

    return recommendations;
  }

  private determineTrendDirection(
    ratingChange: number,
    sentimentChange: number,
  ): string {
    if (ratingChange > 0.2 && sentimentChange > 5) return "improving";
    if (ratingChange < -0.2 && sentimentChange < -5) return "declining";
    return "stable";
  }

  private generateTrendInsights(
    trends: AnyRecord[],
    trendDirection: string,
  ): string[] {
    const insights: string[] = [];

    if (trendDirection === "improving") {
      insights.push(
        "Positive trend: User satisfaction is increasing over time",
      );
    } else if (trendDirection === "declining") {
      insights.push(
        "WARNING: User satisfaction is declining - immediate action needed",
      );
    } else {
      insights.push("Sentiment is stable - maintain current quality");
    }

    if (trends.length >= 2) {
      const recent = Number(trends[trends.length - 1].total_reviews ?? 0);
      const previous = Number(trends[trends.length - 2].total_reviews ?? 0);
      if (recent > previous * 1.5) {
        insights.push(
          "Review volume increasing - growing user base or recent controversy",
        );
      }
    }

    return insights;
  }
}

export function analyzeReviews(
  appName: string,
  reviews: AnyRecord[],
): AnyRecord {
  const analyzer = new ReviewAnalyzer(appName);
  return {
    sentiment_analysis: analyzer.analyzeSentiment(reviews),
    common_themes: analyzer.extractCommonThemes(reviews),
    issues_identified: analyzer.identifyIssues(reviews),
    feature_requests: analyzer.findFeatureRequests(reviews),
  };
}

export const analyze_reviews = analyzeReviews;

export function main(argv: readonly string[]): number {
  return runJsonProcedure(argv, (request) =>
    analyzeReviews(
      getString(request, ["appName", "app_name"], "App"),
      getArray<AnyRecord>(request, ["reviews"]),
    ),
  );
}

function topCounts(
  items: string[],
  limit: number,
  minMentions: number,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count >= minMentions)
    .slice(0, limit);
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function titleCase(value: string): string {
  if (!value) return value;
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`;
}
