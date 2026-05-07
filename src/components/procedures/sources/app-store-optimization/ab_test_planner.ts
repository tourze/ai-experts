/**
 * A/B testing module for App Store Optimization.
 * Plans and tracks A/B tests for metadata and visual assets.
 */

type AnyRecord = Record<string, any>;

export class ABTestPlanner {
  static readonly MIN_EFFECT_SIZES: Record<string, number> = {
    icon: 0.1,
    screenshot: 0.08,
    title: 0.05,
    description: 0.03,
  };

  static readonly CONFIDENCE_LEVELS: Record<string, number> = {
    high: 0.95,
    standard: 0.9,
    exploratory: 0.8,
  };

  activeTests: AnyRecord[] = [];

  designTest(
    testType: string,
    variantA: AnyRecord,
    variantB: AnyRecord,
    hypothesis: string,
    successMetric = "conversion_rate",
  ): AnyRecord {
    const testDesign = {
      test_id: this.generateTestId(testType),
      test_type: testType,
      hypothesis,
      variants: {
        a: {
          name: "Control",
          details: variantA,
          traffic_split: 0.5,
        },
        b: {
          name: "Variation",
          details: variantB,
          traffic_split: 0.5,
        },
      },
      success_metric: successMetric,
      secondary_metrics: this.getSecondaryMetrics(testType),
      minimum_effect_size: ABTestPlanner.MIN_EFFECT_SIZES[testType] ?? 0.05,
      recommended_confidence: "standard",
      best_practices: this.getTestBestPractices(testType),
    };

    this.activeTests.push(testDesign);
    return testDesign;
  }

  calculateSampleSize(
    baselineConversion: number,
    minimumDetectableEffect: number,
    confidenceLevel = "standard",
    power = 0.8,
  ): AnyRecord {
    const alpha = 1 - (ABTestPlanner.CONFIDENCE_LEVELS[confidenceLevel] ?? ABTestPlanner.CONFIDENCE_LEVELS.standard);

    const expectedConversionB = baselineConversion * (1 + minimumDetectableEffect);
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(power);

    const pooled = (baselineConversion + expectedConversionB) / 2;
    const sdPooled = Math.sqrt(2 * pooled * (1 - pooled));

    const denominator = (expectedConversionB - baselineConversion) ** 2;
    const nPerVariant = denominator > 0
      ? Math.ceil(((zAlpha + zBeta) ** 2 * sdPooled ** 2) / denominator)
      : 0;

    const totalSampleSize = nPerVariant * 2;
    const durationEstimates = this.estimateTestDuration(totalSampleSize, baselineConversion);

    return {
      sample_size_per_variant: nPerVariant,
      total_sample_size: totalSampleSize,
      baseline_conversion: baselineConversion,
      expected_conversion_improvement: minimumDetectableEffect,
      expected_conversion_b: expectedConversionB,
      confidence_level: confidenceLevel,
      statistical_power: power,
      duration_estimates: durationEstimates,
      recommendations: this.generateSampleSizeRecommendations(nPerVariant, durationEstimates),
    };
  }

  calculateSignificance(
    variantAConversions: number,
    variantAVisitors: number,
    variantBConversions: number,
    variantBVisitors: number,
  ): AnyRecord {
    const rateA = variantAVisitors > 0 ? variantAConversions / variantAVisitors : 0;
    const rateB = variantBVisitors > 0 ? variantBConversions / variantBVisitors : 0;

    const relativeImprovement = rateA > 0 ? (rateB - rateA) / rateA : 0;
    const absoluteImprovement = rateB - rateA;

    const seA = variantAVisitors > 0 ? Math.sqrt((rateA * (1 - rateA)) / variantAVisitors) : 0;
    const seB = variantBVisitors > 0 ? Math.sqrt((rateB * (1 - rateB)) / variantBVisitors) : 0;
    const seDiff = Math.sqrt(seA ** 2 + seB ** 2);

    const zScore = seDiff > 0 ? absoluteImprovement / seDiff : 0;
    const pValue = 2 * (1 - this.standardNormalCdf(Math.abs(zScore)));

    const isSignificant95 = pValue < 0.05;
    const isSignificant90 = pValue < 0.1;

    const decision = this.generateTestDecision(
      relativeImprovement,
      isSignificant95,
      isSignificant90,
      variantAVisitors + variantBVisitors,
    );

    return {
      variant_a: {
        conversions: variantAConversions,
        visitors: variantAVisitors,
        conversion_rate: roundTo(rateA, 4),
      },
      variant_b: {
        conversions: variantBConversions,
        visitors: variantBVisitors,
        conversion_rate: roundTo(rateB, 4),
      },
      improvement: {
        absolute: roundTo(absoluteImprovement, 4),
        relative_percentage: roundTo(relativeImprovement * 100, 2),
      },
      statistical_analysis: {
        z_score: roundTo(zScore, 3),
        p_value: roundTo(pValue, 4),
        is_significant_95: isSignificant95,
        is_significant_90: isSignificant90,
        confidence_level: isSignificant95 ? "95%" : isSignificant90 ? "90%" : "Not significant",
      },
      decision,
    };
  }

  trackTestResults(testId: string, resultsData: AnyRecord): AnyRecord {
    const test = this.activeTests.find((item) => item.test_id === testId);
    if (!test) {
      return { error: `Test ${testId} not found` };
    }

    const significance = this.calculateSignificance(
      Number(resultsData.variant_a_conversions ?? 0),
      Number(resultsData.variant_a_visitors ?? 0),
      Number(resultsData.variant_b_conversions ?? 0),
      Number(resultsData.variant_b_visitors ?? 0),
    );

    const totalVisitors = Number(resultsData.variant_a_visitors ?? 0) + Number(resultsData.variant_b_visitors ?? 0);
    const requiredSample = Number(resultsData.required_sample_size ?? 10000);
    const progressPercentage = Math.min((totalVisitors / Math.max(requiredSample, 1)) * 100, 100);

    return {
      test_id: testId,
      test_type: test.test_type,
      progress: {
        total_visitors: totalVisitors,
        required_sample_size: requiredSample,
        progress_percentage: roundTo(progressPercentage, 1),
        is_complete: progressPercentage >= 100,
      },
      current_results: significance,
      recommendations: this.generateTrackingRecommendations(significance, progressPercentage, test.test_type),
      next_steps: this.determineNextSteps(significance, progressPercentage),
    };
  }

  generateTestReport(testId: string, finalResults: AnyRecord): AnyRecord {
    const test = this.activeTests.find((item) => item.test_id === testId);
    if (!test) {
      return { error: `Test ${testId} not found` };
    }

    const significance = this.calculateSignificance(
      Number(finalResults.variant_a_conversions ?? 0),
      Number(finalResults.variant_a_visitors ?? 0),
      Number(finalResults.variant_b_conversions ?? 0),
      Number(finalResults.variant_b_visitors ?? 0),
    );

    return {
      test_summary: {
        test_id: testId,
        test_type: test.test_type,
        hypothesis: test.hypothesis,
        duration_days: finalResults.duration_days ?? "N/A",
      },
      results: significance,
      insights: this.generateTestInsights(test, significance, finalResults),
      implementation_plan: this.createImplementationPlan(test, significance),
      learnings: this.extractLearnings(test, significance),
    };
  }

  private generateTestId(testType: string): string {
    return `${testType}_${Math.floor(Date.now() / 1000)}`;
  }

  private getSecondaryMetrics(testType: string): string[] {
    const metricsMap: Record<string, string[]> = {
      icon: ["tap_through_rate", "impression_count", "brand_recall"],
      screenshot: ["tap_through_rate", "time_on_page", "scroll_depth"],
      title: ["impression_count", "tap_through_rate", "search_visibility"],
      description: ["time_on_page", "scroll_depth", "tap_through_rate"],
    };

    return metricsMap[testType] ?? ["tap_through_rate"];
  }

  private getTestBestPractices(testType: string): string[] {
    const practicesMap: Record<string, string[]> = {
      icon: [
        "Test only one element at a time (color vs. style vs. symbolism)",
        "Ensure icon is recognizable at small sizes (60x60px)",
        "Consider cultural context for global audience",
        "Test against top competitor icons",
      ],
      screenshot: [
        "Test order of screenshots (users see first 2-3)",
        "Use captions to tell story",
        "Show key features and benefits",
        "Test with and without device frames",
      ],
      title: [
        "Test keyword variations, not major rebrand",
        "Keep brand name consistent",
        "Ensure title fits within character limits",
        "Test on both search and browse contexts",
      ],
      description: [
        "Test structure (bullet points vs. paragraphs)",
        "Test call-to-action placement",
        "Test feature vs. benefit focus",
        "Maintain keyword density",
      ],
    };

    return practicesMap[testType] ?? ["Test one variable at a time"];
  }

  private estimateTestDuration(requiredSampleSize: number, _baselineConversion: number): AnyRecord {
    const trafficScenarios = {
      low: 100,
      medium: 1000,
      high: 10000,
    };

    const estimates: AnyRecord = {};
    for (const [scenario, dailyViews] of Object.entries(trafficScenarios)) {
      const days = Math.ceil(requiredSampleSize / dailyViews);
      estimates[scenario] = {
        daily_page_views: dailyViews,
        estimated_days: days,
        estimated_weeks: roundTo(days / 7, 1),
      };
    }

    return estimates;
  }

  private generateSampleSizeRecommendations(sampleSize: number, durationEstimates: AnyRecord): string[] {
    const recommendations: string[] = [];

    if (sampleSize > 50000) {
      recommendations.push("Large sample size required - consider testing smaller effect size or increasing traffic");
    }

    if (Number(durationEstimates.medium?.estimated_days ?? 0) > 30) {
      recommendations.push(
        "Long test duration - consider higher minimum detectable effect or focus on high-impact changes",
      );
    }

    if (Number(durationEstimates.low?.estimated_days ?? 0) > 60) {
      recommendations.push(
        "Insufficient traffic for reliable testing - consider user acquisition or broader targeting",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Sample size and duration are reasonable for this test");
    }

    return recommendations;
  }

  private getZScore(percentile: number): number {
    const zScores: Record<string, number> = {
      "0.8": 0.84,
      "0.85": 1.04,
      "0.9": 1.28,
      "0.95": 1.645,
      "0.975": 1.96,
      "0.99": 2.33,
    };

    return zScores[String(percentile)] ?? 1.96;
  }

  private standardNormalCdf(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p =
      d *
      t *
      (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z > 0 ? 1 - p : p;
  }

  private generateTestDecision(
    improvement: number,
    isSignificant95: boolean,
    isSignificant90: boolean,
    totalVisitors: number,
  ): AnyRecord {
    if (totalVisitors < 1000) {
      return {
        decision: "continue",
        rationale: "Insufficient data - continue test to reach minimum sample size",
        action: "Keep test running",
      };
    }

    if (isSignificant95) {
      if (improvement > 0) {
        return {
          decision: "implement_b",
          rationale: `Variant B shows ${(improvement * 100).toFixed(1)}% improvement with 95% confidence`,
          action: "Implement Variant B",
        };
      }
      return {
        decision: "keep_a",
        rationale: "Variant A performs better with 95% confidence",
        action: "Keep current version (A)",
      };
    }

    if (isSignificant90) {
      if (improvement > 0) {
        return {
          decision: "implement_b_cautiously",
          rationale: `Variant B shows ${(improvement * 100).toFixed(1)}% improvement with 90% confidence`,
          action: "Consider implementing B, monitor closely",
        };
      }
      return {
        decision: "keep_a",
        rationale: "Variant A performs better with 90% confidence",
        action: "Keep current version (A)",
      };
    }

    return {
      decision: "inconclusive",
      rationale: "No statistically significant difference detected",
      action: "Either keep A or test different hypothesis",
    };
  }

  private generateTrackingRecommendations(significance: AnyRecord, progress: number, _testType: string): string[] {
    const recommendations: string[] = [];

    if (progress < 50) {
      recommendations.push(`Test is ${progress.toFixed(0)}% complete - continue collecting data`);
    }

    if (progress >= 100) {
      if (Boolean(significance.statistical_analysis?.is_significant_95)) {
        recommendations.push("Sufficient data collected with significant results - ready to conclude test");
      } else {
        recommendations.push(
          "Sample size reached but no significant difference - consider extending test or concluding",
        );
      }
    }

    return recommendations;
  }

  private determineNextSteps(significance: AnyRecord, progress: number): string {
    if (progress < 100) {
      return `Continue test until reaching 100% sample size (currently ${progress.toFixed(0)}%)`;
    }

    const decision = String(significance.decision?.decision ?? "inconclusive");

    if (decision === "implement_b") {
      return "Implement Variant B and monitor metrics for 2 weeks";
    }
    if (decision === "keep_a") {
      return "Keep Variant A and design new test with different hypothesis";
    }
    return "Test inconclusive - either keep A or design new test";
  }

  private generateTestInsights(test: AnyRecord, significance: AnyRecord, _results: AnyRecord): string[] {
    const insights: string[] = [];
    const improvement = Number(significance.improvement?.relative_percentage ?? 0);

    if (Boolean(significance.statistical_analysis?.is_significant_95)) {
      insights.push(
        `Strong evidence: Variant B ${improvement > 0 ? "improved" : "decreased"} conversion by ${Math.abs(improvement).toFixed(1)}% with 95% confidence`,
      );
    }

    insights.push(`Tested ${test.test_type} changes: ${test.hypothesis}`);

    if (test.test_type === "icon" && improvement > 5) {
      insights.push("Icon change had substantial impact - visual first impression is critical");
    }

    return insights;
  }

  private createImplementationPlan(test: AnyRecord, significance: AnyRecord): AnyRecord[] {
    if (String(significance.decision?.decision ?? "") !== "implement_b") {
      return [];
    }

    return [
      {
        step: "1. Update store listing",
        details: `Replace ${test.test_type} with Variant B across all platforms`,
      },
      {
        step: "2. Monitor metrics",
        details: "Track conversion rate for 2 weeks to confirm sustained improvement",
      },
      {
        step: "3. Document learnings",
        details: "Record insights for future optimization",
      },
    ];
  }

  private extractLearnings(test: AnyRecord, significance: AnyRecord): string[] {
    const improvement = Math.abs(Number(significance.improvement?.relative_percentage ?? 0));
    const learnings = [`Testing ${test.test_type} can yield ${improvement.toFixed(1)}% conversion change`];

    if (test.test_type === "title") {
      learnings.push("Title changes affect search visibility and user perception");
    } else if (test.test_type === "screenshot") {
      learnings.push("First 2-3 screenshots are critical for conversion");
    }

    return learnings;
  }
}

export function planAbTest(
  testType: string,
  variantA: AnyRecord,
  variantB: AnyRecord,
  hypothesis: string,
  baselineConversion: number,
): AnyRecord {
  const planner = new ABTestPlanner();

  const testDesign = planner.designTest(testType, variantA, variantB, hypothesis);
  const sampleSize = planner.calculateSampleSize(
    baselineConversion,
    ABTestPlanner.MIN_EFFECT_SIZES[testType] ?? 0.05,
  );

  return {
    test_design: testDesign,
    sample_size_requirements: sampleSize,
  };
}

export const plan_ab_test = planAbTest;

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
