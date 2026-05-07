/**
 * Keyword analysis module for App Store Optimization.
 * Analyzes keyword search volume, competition, and relevance for app discovery.
 */

import { getArray, runJsonProcedure } from "./cli";

type AnyRecord = Record<string, any>;

export class KeywordAnalyzer {
  static readonly COMPETITION_THRESHOLDS = {
    low: 1000,
    medium: 5000,
    high: 10000,
  } as const;

  static readonly VOLUME_CATEGORIES = {
    very_low: 1000,
    low: 5000,
    medium: 20000,
    high: 100000,
    very_high: 500000,
  } as const;

  analyzedKeywords: Record<string, AnyRecord> = {};

  analyzeKeyword(
    keyword: string,
    searchVolume = 0,
    competingApps = 0,
    relevanceScore = 0,
  ): AnyRecord {
    const competitionLevel = this.calculateCompetitionLevel(competingApps);
    const volumeCategory = this.categorizeSearchVolume(searchVolume);
    const difficultyScore = this.calculateKeywordDifficulty(searchVolume, competingApps);
    const potentialScore = this.calculatePotentialScore(searchVolume, competingApps, relevanceScore);

    const keywordLength = keyword.trim().split(/\s+/).filter(Boolean).length;
    const analysis = {
      keyword,
      search_volume: searchVolume,
      volume_category: volumeCategory,
      competing_apps: competingApps,
      competition_level: competitionLevel,
      relevance_score: relevanceScore,
      difficulty_score: difficultyScore,
      potential_score: potentialScore,
      recommendation: this.generateRecommendation(potentialScore, difficultyScore, relevanceScore),
      keyword_length: keywordLength,
      is_long_tail: keywordLength >= 3,
    };

    this.analyzedKeywords[keyword] = analysis;
    return analysis;
  }

  compareKeywords(keywordsData: AnyRecord[]): AnyRecord {
    const analyses = keywordsData.map((item) =>
      this.analyzeKeyword(
        item.keyword ?? "",
        Number(item.search_volume ?? 0),
        Number(item.competing_apps ?? 0),
        Number(item.relevance_score ?? 0),
      ),
    );

    const rankedKeywords = [...analyses].sort((a, b) => b.potential_score - a.potential_score);

    const primaryKeywords = rankedKeywords.filter(
      (kw) => kw.potential_score >= 70 && kw.relevance_score >= 0.8,
    );
    const secondaryKeywords = rankedKeywords.filter(
      (kw) => kw.potential_score >= 50 && kw.potential_score < 70 && kw.relevance_score >= 0.6,
    );
    const longTailKeywords = rankedKeywords.filter((kw) => kw.is_long_tail && kw.relevance_score >= 0.7);

    return {
      total_keywords_analyzed: analyses.length,
      ranked_keywords: rankedKeywords,
      primary_keywords: primaryKeywords.slice(0, 5),
      secondary_keywords: secondaryKeywords.slice(0, 10),
      long_tail_keywords: longTailKeywords.slice(0, 10),
      summary: this.generateComparisonSummary(primaryKeywords, secondaryKeywords, longTailKeywords),
    };
  }

  findLongTailOpportunities(baseKeyword: string, modifiers: string[]): AnyRecord[] {
    const longTailKeywords: AnyRecord[] = [];

    for (const modifier of modifiers) {
      longTailKeywords.push({
        keyword: `${modifier} ${baseKeyword}`,
        pattern: "modifier_base",
        estimated_competition: "low",
        rationale: `Less competitive variation of '${baseKeyword}'`,
      });

      longTailKeywords.push({
        keyword: `${baseKeyword} ${modifier}`,
        pattern: "base_modifier",
        estimated_competition: "low",
        rationale: `Specific use-case variation of '${baseKeyword}'`,
      });
    }

    for (const qWord of ["how", "what", "best", "top"]) {
      longTailKeywords.push({
        keyword: `${qWord} ${baseKeyword}`,
        pattern: "question_based",
        estimated_competition: "very_low",
        rationale: "Informational search query",
      });
    }

    return longTailKeywords;
  }

  extractKeywordsFromText(text: string, minWordLength = 3): Array<[string, number]> {
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");
    const words = normalized
      .split(/\s+/)
      .filter(Boolean)
      .filter((word) => word.length >= minWordLength)
      .filter(
        (word) =>
          !new Set([
            "the",
            "and",
            "for",
            "with",
            "this",
            "that",
            "from",
            "have",
            "but",
            "not",
            "you",
            "all",
            "can",
            "are",
            "was",
            "were",
            "been",
          ]).has(word),
      );

    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }

    const phraseCounts = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i += 1) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
    }

    const allKeywords: Array<[string, number]> = [
      ...Array.from(wordCounts.entries()),
      ...Array.from(phraseCounts.entries()),
    ].sort((a, b) => b[1] - a[1]);

    return allKeywords.slice(0, 50);
  }

  calculateKeywordDensity(text: string, targetKeywords: string[]): Record<string, number> {
    const textLower = text.toLowerCase();
    const totalWords = textLower.split(/\s+/).filter(Boolean).length;
    const densities: Record<string, number> = {};

    for (const keyword of targetKeywords) {
      const occurrences = this.countOccurrences(textLower, keyword.toLowerCase());
      const density = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
      densities[keyword] = roundTo(density, 2);
    }

    return densities;
  }

  private calculateCompetitionLevel(competingApps: number): string {
    if (competingApps < KeywordAnalyzer.COMPETITION_THRESHOLDS.low) return "low";
    if (competingApps < KeywordAnalyzer.COMPETITION_THRESHOLDS.medium) return "medium";
    if (competingApps < KeywordAnalyzer.COMPETITION_THRESHOLDS.high) return "high";
    return "very_high";
  }

  private categorizeSearchVolume(searchVolume: number): string {
    if (searchVolume < KeywordAnalyzer.VOLUME_CATEGORIES.very_low) return "very_low";
    if (searchVolume < KeywordAnalyzer.VOLUME_CATEGORIES.low) return "low";
    if (searchVolume < KeywordAnalyzer.VOLUME_CATEGORIES.medium) return "medium";
    if (searchVolume < KeywordAnalyzer.VOLUME_CATEGORIES.high) return "high";
    return "very_high";
  }

  private calculateKeywordDifficulty(searchVolume: number, competingApps: number): number {
    if (competingApps === 0) return 0;
    const competitionFactor = Math.min(competingApps / 50000, 1);
    const volumeFactor = Math.min(searchVolume / 1000000, 1);
    return roundTo((competitionFactor * 0.7 + volumeFactor * 0.3) * 100, 1);
  }

  private calculatePotentialScore(
    searchVolume: number,
    competingApps: number,
    relevanceScore: number,
  ): number {
    const volumeScore = Math.min((searchVolume / 100000) * 40, 40);
    const competitionScore = competingApps > 0 ? Math.max(30 - competingApps / 500, 0) : 30;
    const relevancePoints = relevanceScore * 30;
    return roundTo(Math.min(volumeScore + competitionScore + relevancePoints, 100), 1);
  }

  private generateRecommendation(
    potentialScore: number,
    difficultyScore: number,
    relevanceScore: number,
  ): string {
    if (relevanceScore < 0.5) return "Low relevance - avoid targeting";
    if (potentialScore >= 70) return "High priority - target immediately";
    if (potentialScore >= 50) {
      return difficultyScore < 50
        ? "Good opportunity - include in metadata"
        : "Competitive - use in description, not title";
    }
    if (potentialScore >= 30) return "Secondary keyword - use for long-tail variations";
    return "Low potential - deprioritize";
  }

  private generateComparisonSummary(
    primaryKeywords: AnyRecord[],
    secondaryKeywords: AnyRecord[],
    longTailKeywords: AnyRecord[],
  ): string {
    const summaryParts: string[] = [];
    summaryParts.push(`Identified ${primaryKeywords.length} high-priority primary keywords.`);

    if (primaryKeywords.length > 0) {
      summaryParts.push(
        `Top recommendation: '${primaryKeywords[0].keyword}' (potential score: ${primaryKeywords[0].potential_score}).`,
      );
    }

    summaryParts.push(
      `Found ${secondaryKeywords.length} secondary keywords for description and metadata.`,
    );
    summaryParts.push(
      `Discovered ${longTailKeywords.length} long-tail opportunities with lower competition.`,
    );

    return summaryParts.join(" ");
  }

  private countOccurrences(text: string, keyword: string): number {
    if (!keyword) return 0;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(escaped, "g"));
    return matches?.length ?? 0;
  }
}

export function analyzeKeywordSet(keywordsData: AnyRecord[]): AnyRecord {
  const analyzer = new KeywordAnalyzer();
  return analyzer.compareKeywords(keywordsData);
}

export const analyze_keyword_set = analyzeKeywordSet;

export function main(argv: string[] = process.argv.slice(2)): number {
  return runJsonProcedure(argv, (request) =>
    analyzeKeywordSet(getArray<AnyRecord>(request, ["keywordsData", "keywords_data", "keywords"])),
  );
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
