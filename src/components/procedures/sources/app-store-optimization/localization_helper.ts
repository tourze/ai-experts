/**
 * Localization helper module for App Store Optimization.
 * Manages multi-language ASO optimization strategies.
 */

type AnyRecord = Record<string, any>;

export class LocalizationHelper {
  static readonly PRIORITY_MARKETS: Record<string, Array<{ language: string; market: string; revenue_share: number }>> = {
    tier_1: [
      { language: "en-US", market: "United States", revenue_share: 0.25 },
      { language: "zh-CN", market: "China", revenue_share: 0.2 },
      { language: "ja-JP", market: "Japan", revenue_share: 0.1 },
      { language: "de-DE", market: "Germany", revenue_share: 0.08 },
      { language: "en-GB", market: "United Kingdom", revenue_share: 0.06 },
    ],
    tier_2: [
      { language: "fr-FR", market: "France", revenue_share: 0.05 },
      { language: "ko-KR", market: "South Korea", revenue_share: 0.05 },
      { language: "es-ES", market: "Spain", revenue_share: 0.03 },
      { language: "it-IT", market: "Italy", revenue_share: 0.03 },
      { language: "pt-BR", market: "Brazil", revenue_share: 0.03 },
    ],
    tier_3: [
      { language: "ru-RU", market: "Russia", revenue_share: 0.02 },
      { language: "es-MX", market: "Mexico", revenue_share: 0.02 },
      { language: "nl-NL", market: "Netherlands", revenue_share: 0.02 },
      { language: "sv-SE", market: "Sweden", revenue_share: 0.01 },
      { language: "pl-PL", market: "Poland", revenue_share: 0.01 },
    ],
  };

  static readonly CHAR_MULTIPLIERS: Record<string, number> = {
    en: 1,
    zh: 0.6,
    ja: 0.7,
    ko: 0.8,
    de: 1.3,
    fr: 1.2,
    es: 1.1,
    pt: 1.1,
    ru: 1.1,
    ar: 1,
    it: 1.1,
  };

  appCategory: string;
  localizationPlans: AnyRecord[] = [];

  constructor(appCategory = "general") {
    this.appCategory = appCategory;
  }

  identifyTargetMarkets(currentMarket = "en-US", budgetLevel = "medium", targetMarketCount = 5): AnyRecord {
    let priorityTiers: string[] = [];
    let maxMarkets = targetMarketCount;

    if (budgetLevel === "low") {
      priorityTiers = ["tier_1"];
      maxMarkets = Math.min(targetMarketCount, 3);
    } else if (budgetLevel === "medium") {
      priorityTiers = ["tier_1", "tier_2"];
      maxMarkets = Math.min(targetMarketCount, 8);
    } else {
      priorityTiers = ["tier_1", "tier_2", "tier_3"];
    }

    const recommendedMarkets: AnyRecord[] = [];
    for (const tier of priorityTiers) {
      for (const market of LocalizationHelper.PRIORITY_MARKETS[tier] ?? []) {
        if (market.language === currentMarket) continue;
        recommendedMarkets.push({
          ...market,
          tier,
          estimated_translation_cost: this.estimateTranslationCost(market.language),
        });
      }
    }

    recommendedMarkets.sort((a, b) => Number(b.revenue_share) - Number(a.revenue_share));
    const limited = recommendedMarkets.slice(0, maxMarkets);
    const totalPotentialRevenueShare = limited.reduce((sum, market) => sum + Number(market.revenue_share), 0);

    return {
      recommended_markets: limited,
      total_markets: limited.length,
      estimated_total_revenue_lift: `${(totalPotentialRevenueShare * 100).toFixed(1)}%`,
      estimated_cost: this.estimateTotalLocalizationCost(limited),
      implementation_priority: this.prioritizeImplementation(limited),
    };
  }

  translateMetadata(
    sourceMetadata: Record<string, string>,
    sourceLanguage: string,
    targetLanguage: string,
    platform = "apple",
  ): AnyRecord {
    const targetLangCode = targetLanguage.split("-")[0];
    const charMultiplier = LocalizationHelper.CHAR_MULTIPLIERS[targetLangCode] ?? 1;

    const limits: Record<string, number> =
      platform === "apple"
        ? { title: 30, subtitle: 30, description: 4000, keywords: 100 }
        : { title: 50, short_description: 80, description: 4000 };

    const localizedFields: AnyRecord = {};
    const warnings: string[] = [];

    for (const [field, text] of Object.entries(sourceMetadata)) {
      if (!(field in limits)) continue;

      const estimatedLength = Math.floor(text.length * charMultiplier);
      const limit = limits[field];

      localizedFields[field] = {
        original_text: text,
        original_length: text.length,
        estimated_target_length: estimatedLength,
        character_limit: limit,
        fits_within_limit: estimatedLength <= limit,
        translation_notes: this.getTranslationNotes(field, targetLanguage, estimatedLength, limit),
      };

      if (estimatedLength > limit) {
        warnings.push(
          `${field}: Estimated length (${estimatedLength}) may exceed limit (${limit}) - condensing may be required`,
        );
      }
    }

    return {
      source_language: sourceLanguage,
      target_language: targetLanguage,
      platform,
      localized_fields: localizedFields,
      character_multiplier: charMultiplier,
      warnings,
      recommendations: this.generateTranslationRecommendations(targetLanguage, warnings),
    };
  }

  adaptKeywords(
    sourceKeywords: string[],
    sourceLanguage: string,
    targetLanguage: string,
    targetMarket: string,
  ): AnyRecord {
    const culturalNotes = this.getCulturalKeywordConsiderations(targetMarket);
    const searchPatterns = this.getSearchPatterns(targetMarket);

    const adaptedKeywords = sourceKeywords.map((keyword, index) => ({
      source_keyword: keyword,
      adaptation_strategy: this.determineAdaptationStrategy(keyword, targetMarket),
      cultural_considerations: culturalNotes,
      priority: index < 3 ? "high" : "medium",
    }));

    return {
      source_language: sourceLanguage,
      target_language: targetLanguage,
      target_market: targetMarket,
      adapted_keywords: adaptedKeywords,
      search_behavior_notes: searchPatterns,
      recommendations: [
        "Use native speakers for keyword research",
        "Test keywords with local users before finalizing",
        "Consider local competitors' keyword strategies",
        "Monitor search trends in target market",
      ],
    };
  }

  validateTranslations(
    translatedMetadata: Record<string, string>,
    targetLanguage: string,
    platform = "apple",
  ): AnyRecord {
    const limits: Record<string, number> =
      platform === "apple"
        ? { title: 30, subtitle: 30, description: 4000, keywords: 100 }
        : { title: 50, short_description: 80, description: 4000 };

    const validation: AnyRecord = {
      is_valid: true,
      field_validations: {},
      errors: [] as string[],
      warnings: [] as string[],
    };

    for (const [field, text] of Object.entries(translatedMetadata)) {
      if (!(field in limits)) continue;

      const actualLength = text.length;
      const limit = limits[field];
      const isWithinLimit = actualLength <= limit;

      validation.field_validations[field] = {
        text,
        length: actualLength,
        limit,
        is_valid: isWithinLimit,
        usage_percentage: roundTo((actualLength / limit) * 100, 1),
      };

      if (!isWithinLimit) {
        validation.is_valid = false;
        validation.errors.push(`${field} exceeds limit: ${actualLength}/${limit} characters`);
      }
    }

    const qualityIssues = this.checkTranslationQuality(translatedMetadata, targetLanguage);
    validation.quality_checks = qualityIssues;

    if (qualityIssues.length > 0) {
      validation.warnings.push(...qualityIssues.map((issue: string) => `Quality issue: ${issue}`));
    }

    return validation;
  }

  calculateLocalizationRoi(
    targetMarkets: string[],
    currentMonthlyDownloads: number,
    localizationCost: number,
    expectedLiftPercentage = 0.15,
  ): AnyRecord {
    const marketData: AnyRecord[] = [];
    let totalExpectedLift = 0;

    for (const marketCode of targetMarkets) {
      const marketInfo = this.findMarketByCode(marketCode);
      if (!marketInfo) continue;

      const marketDownloads = Math.floor(currentMonthlyDownloads * marketInfo.revenue_share);
      const expectedIncrease = Math.floor(marketDownloads * expectedLiftPercentage);
      totalExpectedLift += expectedIncrease;

      marketData.push({
        market: marketInfo.market,
        current_monthly_downloads: marketDownloads,
        expected_increase: expectedIncrease,
        revenue_potential: marketInfo.revenue_share,
      });
    }

    const revenuePerDownload = 2;
    const monthlyAdditionalRevenue = totalExpectedLift * revenuePerDownload;
    const paybackMonths = monthlyAdditionalRevenue > 0 ? localizationCost / monthlyAdditionalRevenue : Number.POSITIVE_INFINITY;

    return {
      markets_analyzed: marketData.length,
      market_breakdown: marketData,
      total_expected_monthly_lift: totalExpectedLift,
      expected_monthly_revenue_increase: formatMoney(monthlyAdditionalRevenue),
      localization_cost: formatMoney(localizationCost),
      payback_period_months: Number.isFinite(paybackMonths) ? roundTo(paybackMonths, 1) : "N/A",
      annual_roi: Number.isFinite(paybackMonths)
        ? `${(((monthlyAdditionalRevenue * 12 - localizationCost) / Math.max(localizationCost, 1)) * 100).toFixed(1)}%`
        : "Negative",
      recommendation: this.generateRoiRecommendation(paybackMonths),
    };
  }

  private findMarketByCode(marketCode: string) {
    for (const markets of Object.values(LocalizationHelper.PRIORITY_MARKETS)) {
      const found = markets.find((market) => market.language === marketCode);
      if (found) return found;
    }
    return null;
  }

  private estimateTranslationCost(language: string): AnyRecord {
    const baseCostPerWord = 0.12;
    const multipliers: Record<string, number> = {
      "zh-CN": 1.5,
      "ja-JP": 1.5,
      "ko-KR": 1.3,
      "ar-SA": 1.4,
      default: 1,
    };

    const multiplier = multipliers[language] ?? multipliers.default;
    const typicalWordCounts = {
      title: 5,
      subtitle: 5,
      description: 300,
      keywords: 20,
      screenshots: 50,
    };

    const totalWords = Object.values(typicalWordCounts).reduce((sum, value) => sum + value, 0);
    const estimatedCost = totalWords * baseCostPerWord * multiplier;

    return {
      cost_per_word: roundTo(baseCostPerWord * multiplier, 2),
      total_words: totalWords,
      estimated_cost: roundTo(estimatedCost, 2),
    };
  }

  private estimateTotalLocalizationCost(markets: AnyRecord[]): string {
    const total = markets.reduce(
      (sum, market) => sum + Number(market.estimated_translation_cost?.estimated_cost ?? 0),
      0,
    );
    return formatMoney(total);
  }

  private prioritizeImplementation(markets: AnyRecord[]): AnyRecord[] {
    const phases: AnyRecord[] = [];

    const phase1 = markets.slice(0, 3);
    if (phase1.length > 0) {
      phases.push({
        phase: "Phase 1 (First 30 days)",
        markets: phase1.map((market) => market.market).join(", "),
        rationale: "Highest revenue potential markets",
      });
    }

    const phase2 = markets.slice(3, 6);
    if (phase2.length > 0) {
      phases.push({
        phase: "Phase 2 (Days 31-60)",
        markets: phase2.map((market) => market.market).join(", "),
        rationale: "Strong revenue markets with good ROI",
      });
    }

    const phase3 = markets.slice(6);
    if (phase3.length > 0) {
      phases.push({
        phase: "Phase 3 (Days 61-90)",
        markets: phase3.map((market) => market.market).join(", "),
        rationale: "Complete global coverage",
      });
    }

    return phases;
  }

  private getTranslationNotes(
    field: string,
    targetLanguage: string,
    estimatedLength: number,
    limit: number,
  ): string[] {
    const notes: string[] = [];

    if (estimatedLength > limit) {
      notes.push(`Condensing required - aim for ${limit - 10} characters to allow buffer`);
    }

    if (field === "title" && targetLanguage.startsWith("zh")) {
      notes.push("Chinese characters convey more meaning - may need fewer characters");
    }

    if (field === "keywords" && targetLanguage.startsWith("de")) {
      notes.push("German compound words may be longer - prioritize shorter keywords");
    }

    return notes;
  }

  private generateTranslationRecommendations(targetLanguage: string, warnings: string[]): string[] {
    const recommendations = [
      "Use professional native speakers for translation",
      "Test translations with local users before finalizing",
    ];

    if (warnings.length > 0) {
      recommendations.push("Work with translator to condense text while preserving meaning");
    }

    if (targetLanguage.startsWith("zh") || targetLanguage.startsWith("ja")) {
      recommendations.push("Consider cultural context and local idioms");
    }

    return recommendations;
  }

  private getCulturalKeywordConsiderations(targetMarket: string): string[] {
    const considerations: Record<string, string[]> = {
      China: ["Avoid politically sensitive terms", "Consider local alternatives to blocked services"],
      Japan: ["Honorific language important", "Technical terms often use katakana"],
      Germany: ["Privacy and security terms resonate", "Efficiency and quality valued"],
      France: ["French language protection laws", "Prefer French terms over English"],
      default: ["Research local search behavior", "Test with native speakers"],
    };

    return considerations[targetMarket] ?? considerations.default;
  }

  private getSearchPatterns(targetMarket: string): string[] {
    const patterns: Record<string, string[]> = {
      China: ["Use both simplified characters and romanization", "Brand names often romanized"],
      Japan: ["Mix of kanji, hiragana, and katakana", "English words common in tech"],
      Germany: ["Compound words common", "Specific technical terminology"],
      default: ["Research local search trends", "Monitor competitor keywords"],
    };

    return patterns[targetMarket] ?? patterns.default;
  }

  private determineAdaptationStrategy(_keyword: string, targetMarket: string): string {
    if (["China", "Japan", "Korea"].includes(targetMarket)) return "full_localization";
    if (["Germany", "France", "Spain"].includes(targetMarket)) return "adapt_and_translate";
    return "direct_translation";
  }

  private checkTranslationQuality(translatedMetadata: Record<string, string>, _targetLanguage: string): string[] {
    const issues: string[] = [];

    for (const [field, text] of Object.entries(translatedMetadata)) {
      if (text.includes("[") || text.includes("{") || text.toUpperCase().includes("TODO")) {
        issues.push(`${field} contains placeholder text`);
      }
      if ((text.match(/!/g) ?? []).length > 3) {
        issues.push(`${field} has excessive exclamation marks`);
      }
    }

    return issues;
  }

  private generateRoiRecommendation(paybackMonths: number): string {
    if (paybackMonths <= 3) return "Excellent ROI - proceed immediately";
    if (paybackMonths <= 6) return "Good ROI - recommended investment";
    if (paybackMonths <= 12) return "Moderate ROI - consider if strategic market";
    return "Low ROI - reconsider or focus on higher-priority markets first";
  }
}

export function planLocalizationStrategy(
  currentMarket: string,
  budgetLevel: string,
  monthlyDownloads: number,
): AnyRecord {
  const helper = new LocalizationHelper();

  const targetMarkets = helper.identifyTargetMarkets(currentMarket, budgetLevel);
  const marketCodes = (targetMarkets.recommended_markets ?? []).map((market: AnyRecord) => String(market.language));

  const estimatedCostRaw = String(targetMarkets.estimated_cost ?? "$0").replace(/[$,]/g, "");
  const estimatedCost = Number(estimatedCostRaw) || 0;

  const roiAnalysis = helper.calculateLocalizationRoi(marketCodes, monthlyDownloads, estimatedCost);

  return {
    target_markets: targetMarkets,
    roi_analysis: roiAnalysis,
  };
}

export const plan_localization_strategy = planLocalizationStrategy;

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
