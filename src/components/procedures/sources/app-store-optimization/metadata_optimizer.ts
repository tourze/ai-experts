import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * Metadata optimization module for App Store Optimization.
 * Optimizes titles, descriptions, and keyword fields with platform-specific limits.
 */

import { getArray, getRecord, getString, runJsonProcedure } from "./cli";

export const procedure = defineCliProcedure({
  id: "app-store-optimization-metadata-optimizer",
  entry: procedureEntry(import.meta.url),
  description:
    "优化 App Store / Google Play 元数据：标题、描述、关键词字段，支持平台字符限制校验。",
  owners: { skillIds: ["app-store-optimization"] },
  target: "scripts/metadata_optimizer.mjs",
  runtime: "node",
  params: [
    {
      flag: "--input",
      type: "路径",
      description: "包含 platform、appInfo、targetKeywords 的 JSON 输入文件",
      required: false,
    },
  ],

  exampleArgs: { args: ["--input", "metadata_input.json"] },
});

type AnyRecord = Record<string, any>;
type Platform = "apple" | "google";

const CHAR_LIMITS: Record<Platform, Record<string, number>> = {
  apple: {
    title: 30,
    subtitle: 30,
    promotional_text: 170,
    description: 4000,
    keywords: 100,
    whats_new: 4000,
  },
  google: {
    title: 50,
    short_description: 80,
    full_description: 4000,
    description: 4000,
  },
};

export class MetadataOptimizer {
  platform: Platform;
  limits: Record<string, number>;

  constructor(platform: Platform = "apple") {
    if (!(platform in CHAR_LIMITS)) {
      throw new Error("Platform must be 'apple' or 'google'");
    }
    this.platform = platform;
    this.limits = CHAR_LIMITS[platform];
  }

  optimizeTitle(
    appName: string,
    targetKeywords: string[],
    includeBrand = true,
  ): AnyRecord {
    const maxLength = this.limits.title;
    const options: AnyRecord[] = [];

    if (includeBrand) {
      const option = appName.slice(0, maxLength);
      options.push({
        title: option,
        length: option.length,
        remaining_chars: maxLength - option.length,
        keywords_included: [],
        strategy: "brand_only",
        pros: ["Maximum brand recognition", "Clean and simple"],
        cons: ["No keyword targeting", "Lower discoverability"],
      });
    }

    if (targetKeywords.length > 0) {
      const primary = targetKeywords[0];
      const option = this.buildTitleWithKeywords(appName, [primary], maxLength);
      if (option) {
        options.push({
          title: option,
          length: option.length,
          remaining_chars: maxLength - option.length,
          keywords_included: [primary],
          strategy: "brand_plus_primary",
          pros: ["Targets main keyword", "Maintains brand identity"],
          cons: ["Limited keyword coverage"],
        });
      }
    }

    if (targetKeywords.length > 1) {
      const twoKeywords = targetKeywords.slice(0, 2);
      const option = this.buildTitleWithKeywords(
        appName,
        twoKeywords,
        maxLength,
      );
      if (option) {
        options.push({
          title: option,
          length: option.length,
          remaining_chars: maxLength - option.length,
          keywords_included: twoKeywords,
          strategy: "brand_plus_multiple",
          pros: ["Multiple keyword targets", "Better discoverability"],
          cons: ["May feel cluttered", "Less brand focus"],
        });
      }
    }

    if (!includeBrand && targetKeywords.length > 0) {
      const option = targetKeywords.slice(0, 2).join(" ").slice(0, maxLength);
      options.push({
        title: option,
        length: option.length,
        remaining_chars: maxLength - option.length,
        keywords_included: targetKeywords.slice(0, 2),
        strategy: "keyword_first",
        pros: ["Maximum SEO benefit", "Clear functionality"],
        cons: ["No brand recognition", "Generic appearance"],
      });
    }

    return {
      platform: this.platform,
      max_length: maxLength,
      options,
      recommendation: this.recommendTitleOption(options),
    };
  }

  optimizeDescription(
    appInfo: AnyRecord,
    targetKeywords: string[],
    descriptionType: "full" | "short" | "subtitle" = "full",
  ): AnyRecord {
    if (descriptionType === "short" && this.platform === "google") {
      return this.optimizeShortDescription(appInfo, targetKeywords);
    }
    if (descriptionType === "subtitle" && this.platform === "apple") {
      return this.optimizeSubtitle(appInfo, targetKeywords);
    }
    return this.optimizeFullDescription(appInfo, targetKeywords);
  }

  optimizeKeywordField(
    targetKeywords: string[],
    appTitle = "",
    appDescription = "",
  ): AnyRecord {
    if (this.platform !== "apple") {
      return {
        error: "Keyword field optimization only applies to Apple App Store",
      };
    }

    const maxLength = this.limits.keywords;
    const titleWords = new Set(
      appTitle
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean),
    );

    const processed: string[] = [];
    for (const keyword of targetKeywords) {
      const normalized = keyword.toLowerCase().trim();
      if (!normalized || titleWords.has(normalized)) continue;

      for (const word of normalized.split(/\s+/).filter(Boolean)) {
        if (!titleWords.has(word) && !processed.includes(word)) {
          processed.push(word);
        }
      }
    }

    const deduplicated = this.removePluralDuplicates(processed);
    const keywordField = this.buildKeywordField(deduplicated, maxLength);
    const coverage = this.calculateCoverage(targetKeywords, appDescription);
    const included = keywordField ? keywordField.split(",") : [];

    return {
      keyword_field: keywordField,
      length: keywordField.length,
      remaining_chars: maxLength - keywordField.length,
      keywords_included: included,
      keywords_count: included.length,
      keywords_excluded: targetKeywords.filter(
        (kw) => !keywordField.toLowerCase().includes(kw.toLowerCase()),
      ),
      description_coverage: coverage,
      optimization_tips: [
        "Keywords in title are auto-indexed - no need to repeat",
        "Use singular forms only (Apple indexes plurals automatically)",
        "No spaces between commas to maximize character usage",
        "Update keyword field with each app update to test variations",
      ],
    };
  }

  validateCharacterLimits(metadata: Record<string, string>): AnyRecord {
    const validation = {
      is_valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      field_status: {} as Record<string, AnyRecord>,
    };

    for (const [fieldName, value] of Object.entries(metadata)) {
      if (!(fieldName in this.limits)) {
        validation.warnings.push(
          `Unknown field '${fieldName}' for ${this.platform} platform`,
        );
        continue;
      }

      const maxLength = this.limits[fieldName];
      const actualLength = value.length;
      const remaining = maxLength - actualLength;

      validation.field_status[fieldName] = {
        value,
        length: actualLength,
        limit: maxLength,
        remaining,
        is_valid: actualLength <= maxLength,
        usage_percentage: roundTo((actualLength / maxLength) * 100, 1),
      };

      if (actualLength > maxLength) {
        validation.is_valid = false;
        validation.errors.push(
          `'${fieldName}' exceeds limit: ${actualLength}/${maxLength} chars`,
        );
      } else if (remaining > maxLength * 0.2) {
        validation.warnings.push(
          `'${fieldName}' under-utilizes space: ${remaining} chars remaining`,
        );
      }
    }

    return validation;
  }

  calculateKeywordDensity(text: string, targetKeywords: string[]): AnyRecord {
    const normalizedText = text.toLowerCase();
    const totalWords = normalizedText.split(/\s+/).filter(Boolean).length;

    const keywordDensities: Record<string, AnyRecord> = {};
    for (const keyword of targetKeywords) {
      const occurrences = countOccurrences(
        normalizedText,
        keyword.toLowerCase(),
      );
      const density = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;

      keywordDensities[keyword] = {
        occurrences,
        density_percentage: roundTo(density, 2),
        status: this.assessDensity(density),
      };
    }

    const totalOccurrences = Object.values(keywordDensities).reduce(
      (sum, item) => sum + Number(item.occurrences ?? 0),
      0,
    );
    const overallDensity =
      totalWords > 0 ? (totalOccurrences / totalWords) * 100 : 0;

    return {
      total_words: totalWords,
      keyword_densities: keywordDensities,
      overall_keyword_density: roundTo(overallDensity, 2),
      assessment: this.assessOverallDensity(overallDensity),
      recommendations: this.generateDensityRecommendations(keywordDensities),
    };
  }

  private buildTitleWithKeywords(
    appName: string,
    keywords: string[],
    maxLength: number,
  ): string | null {
    const separators = [" - ", ": ", " | "];
    for (const separator of separators) {
      for (const keyword of keywords) {
        const title = `${appName}${separator}${keyword}`;
        if (title.length <= maxLength) {
          return title;
        }
      }
    }
    return null;
  }

  private optimizeShortDescription(
    appInfo: AnyRecord,
    targetKeywords: string[],
  ): AnyRecord {
    const maxLength = this.limits.short_description;
    const uniqueValue = String(appInfo.unique_value ?? "");
    const primaryKeyword = targetKeywords[0] ?? "";
    const shortDescription =
      `${titleCase(primaryKeyword)} - ${uniqueValue}`.slice(0, maxLength);

    return {
      short_description: shortDescription,
      length: shortDescription.length,
      remaining_chars: maxLength - shortDescription.length,
      keywords_included: shortDescription
        .toLowerCase()
        .includes(primaryKeyword.toLowerCase())
        ? [primaryKeyword]
        : [],
      strategy: "keyword_value_proposition",
    };
  }

  private optimizeSubtitle(
    appInfo: AnyRecord,
    targetKeywords: string[],
  ): AnyRecord {
    const maxLength = this.limits.subtitle;
    const primaryKeyword = targetKeywords[0] ?? "";
    const keyFeature = Array.isArray(appInfo.key_features)
      ? String(appInfo.key_features[0] ?? "")
      : "";

    const options = [
      primaryKeyword.slice(0, maxLength),
      keyFeature.slice(0, maxLength),
      `${primaryKeyword} App`.slice(0, maxLength),
    ].filter(Boolean);

    return {
      subtitle_options: options,
      max_length: maxLength,
      recommendation: options[0] ?? "",
    };
  }

  private optimizeFullDescription(
    appInfo: AnyRecord,
    targetKeywords: string[],
  ): AnyRecord {
    const maxLength =
      this.limits.description ?? this.limits.full_description ?? 4000;
    const sections: string[] = [];

    const primaryKeyword = targetKeywords[0] ?? "";
    const uniqueValue = String(appInfo.unique_value ?? "");
    sections.push(
      `${uniqueValue} ${titleCase(primaryKeyword)} that helps you achieve more.\n\n`,
    );

    const features = Array.isArray(appInfo.key_features)
      ? appInfo.key_features
      : [];
    if (features.length > 0) {
      sections.push("KEY FEATURES:\n");
      for (let index = 0; index < Math.min(features.length, 5); index += 1) {
        const feature = String(features[index]);
        let text = `• ${feature}`;

        if (index < targetKeywords.length) {
          const keyword = targetKeywords[index];
          if (!feature.toLowerCase().includes(keyword.toLowerCase())) {
            text = `• ${feature} with ${keyword}`;
          }
        }
        sections.push(`${text}\n`);
      }
      sections.push("\n");
    }

    const targetAudience = String(appInfo.target_audience ?? "users");
    sections.push(`PERFECT FOR:\n${targetAudience}\n\n`);
    sections.push("WHY USERS LOVE US:\n");
    sections.push(
      "Join thousands of satisfied users who have transformed their workflow.\n\n",
    );
    sections.push("Download now and start experiencing the difference!");

    let fullDescription = sections.join("");
    if (fullDescription.length > maxLength) {
      fullDescription = `${fullDescription.slice(0, maxLength - 3)}...`;
    }

    return {
      full_description: fullDescription,
      length: fullDescription.length,
      remaining_chars: maxLength - fullDescription.length,
      keyword_analysis: this.calculateKeywordDensity(
        fullDescription,
        targetKeywords,
      ),
      structure: {
        has_hook: true,
        has_features: features.length > 0,
        has_benefits: true,
        has_cta: true,
      },
    };
  }

  private removePluralDuplicates(keywords: string[]): string[] {
    const deduplicated: string[] = [];
    const singularSet = new Set<string>();

    for (const keyword of keywords) {
      if (keyword.endsWith("s") && keyword.length > 1) {
        const singular = keyword.slice(0, -1);
        if (!singularSet.has(singular)) {
          deduplicated.push(singular);
          singularSet.add(singular);
        }
      } else if (!singularSet.has(keyword)) {
        deduplicated.push(keyword);
        singularSet.add(keyword);
      }
    }

    return deduplicated;
  }

  private buildKeywordField(keywords: string[], maxLength: number): string {
    let keywordField = "";
    for (const keyword of keywords) {
      const nextValue = keywordField ? `${keywordField},${keyword}` : keyword;
      if (nextValue.length <= maxLength) {
        keywordField = nextValue;
      } else {
        break;
      }
    }
    return keywordField;
  }

  private calculateCoverage(
    keywords: string[],
    text: string,
  ): Record<string, number> {
    const normalized = text.toLowerCase();
    const coverage: Record<string, number> = {};
    for (const keyword of keywords) {
      coverage[keyword] = countOccurrences(normalized, keyword.toLowerCase());
    }
    return coverage;
  }

  private assessDensity(density: number): string {
    if (density < 0.5) return "too_low";
    if (density <= 2.5) return "optimal";
    return "too_high";
  }

  private assessOverallDensity(density: number): string {
    if (density < 2)
      return "Under-optimized: Consider adding more keyword variations";
    if (density <= 5)
      return "Optimal: Good keyword integration without stuffing";
    if (density <= 8)
      return "High: Approaching keyword stuffing - reduce keyword usage";
    return "Too High: Keyword stuffing detected - rewrite for natural flow";
  }

  private generateDensityRecommendations(
    keywordDensities: Record<string, AnyRecord>,
  ): string[] {
    const recommendations: string[] = [];
    for (const [keyword, data] of Object.entries(keywordDensities)) {
      if (data.status === "too_low") {
        recommendations.push(
          `Increase usage of '${keyword}' - currently only ${data.occurrences} times`,
        );
      } else if (data.status === "too_high") {
        recommendations.push(
          `Reduce usage of '${keyword}' - appears ${data.occurrences} times (keyword stuffing risk)`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Keyword density is well-balanced");
    }

    return recommendations;
  }

  private recommendTitleOption(options: AnyRecord[]): string {
    if (options.length === 0) return "No valid options available";

    const preferred = options.find(
      (option) => option.strategy === "brand_plus_primary",
    );
    if (preferred) {
      return `Recommended: '${preferred.title}' (Balance of brand and SEO)`;
    }

    return `Recommended: '${options[0].title}' (${options[0].strategy})`;
  }
}

export function optimizeAppMetadata(
  platform: Platform,
  appInfo: AnyRecord,
  targetKeywords: string[],
): AnyRecord {
  const optimizer = new MetadataOptimizer(platform);

  return {
    platform,
    title: optimizer.optimizeTitle(String(appInfo.name ?? ""), targetKeywords),
    description: optimizer.optimizeDescription(appInfo, targetKeywords, "full"),
    keyword_field:
      platform === "apple"
        ? optimizer.optimizeKeywordField(targetKeywords)
        : null,
  };
}

export const optimize_app_metadata = optimizeAppMetadata;

export function main(argv: readonly string[]): number {
  return runJsonProcedure(argv, (request) =>
    optimizeAppMetadata(
      getString(request, ["platform"], "apple") as Platform,
      getRecord(request, ["appInfo", "app_info", "app"]),
      getArray<string>(request, [
        "targetKeywords",
        "target_keywords",
        "keywords",
      ]).map(String),
    ),
  );
}

function countOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(escaped, "g"));
  return matches?.length ?? 0;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join(" ");
}
