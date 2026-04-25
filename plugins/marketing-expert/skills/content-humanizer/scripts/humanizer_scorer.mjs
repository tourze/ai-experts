#!/usr/bin/env node
/**
 * humanizer_scorer.mjs - scores content 0-100 on "humanity" by detecting AI writing patterns.
 */

import { readFileSync } from "node:fs";

const SAMPLE_HUMAN = `
We tried to fix our churn problem the wrong way for about a year.

We threw money at marketing, assumed acquisition would outpace loss, and avoided looking at the actual numbers. It didn't work. Churn stayed flat at 8% monthly, which sounds manageable until you realize that's 65% annual churn. We were filling a leaky bucket with a garden hose.

The breakthrough — if you can call it that — was embarrassingly simple: we actually talked to the customers who left.

Not the ones who complained. The ones who quietly disappeared. We called 30 churned accounts over two weeks. You know what most of them said? They didn't hate the product. They just... forgot about it. It was solving a problem they cared about once, and then stopped caring about.

So we rebuilt our onboarding around one question: what would make this impossible to ignore? Not "valuable" — people know it's valuable. Impossible to ignore.

Three months later, 30-day activation was up 40%. Churn dropped to 4.5%.

The lesson wasn't about product or pricing. It was about habit formation. And we were terrible at it.
`;

const SAMPLE_AI = `
It is crucial to leverage data-driven insights in order to effectively navigate the challenges of customer retention in the competitive SaaS landscape. Furthermore, by implementing robust onboarding strategies, organizations can ensure that users achieve maximum value from the product, thereby significantly reducing churn rates.

To facilitate this process, it's important to note that companies should delve into their customer behavior data to identify patterns and trends. Moreover, by fostering meaningful connections with customers and ensuring comprehensive support throughout their journey, businesses can cultivate lasting relationships that drive long-term success.

In conclusion, the implementation of these holistic strategies will empower organizations to streamline their customer success operations and achieve sustainable growth in an increasingly competitive marketplace.
`;

const AI_VOCABULARY = [
  "delve",
  "delve into",
  "delves",
  "delving",
  "landscape",
  "crucial",
  "vital",
  "pivotal",
  "leverage",
  "leveraging",
  "leveraged",
  "robust",
  "comprehensive",
  "holistic",
  "foster",
  "fosters",
  "fostering",
  "facilitate",
  "facilitates",
  "facilitating",
  "navigate",
  "navigating",
  "ensure",
  "ensures",
  "ensuring",
  "utilize",
  "utilizing",
  "utilizes",
  "furthermore",
  "moreover",
  "innovative",
  "cutting-edge",
  "seamless",
  "seamlessly",
  "empower",
  "empowers",
  "empowering",
  "streamline",
  "streamlines",
  "streamlining",
  "cultivate",
  "cultivating",
  "paradigm",
  "ecosystem",
  "synergy",
  "in conclusion",
  "in summary",
  "to summarize",
];

const HEDGING_PHRASES = [
  "it is important to note",
  "it's important to note",
  "it should be noted",
  "it is worth mentioning",
  "it's worth mentioning",
  "it goes without saying",
  "needless to say",
  "in many cases",
  "in most cases",
  "in certain cases",
  "in most instances",
  "in many instances",
  "generally speaking",
  "for the most part",
  "this may vary",
  "results may differ",
  "one might argue",
  "it can be argued",
  "there are various",
  "there are many",
  "it is crucial to",
  "it's crucial to",
];

const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi,
  /\b(can|could|should|would|may|might|must)\s+be\s+\w+ed\b/gi,
];

const VAGUE_AUTHORITY = [
  "studies show",
  "research suggests",
  "research shows",
  "experts agree",
  "experts say",
  "many companies",
  "leading brands",
  "it has been shown",
  "according to research",
  "data suggests",
  "evidence suggests",
];

function countOccurrences(text, phrase) {
  let count = 0;
  let index = 0;
  while (true) {
    const found = text.indexOf(phrase, index);
    if (found === -1) break;
    count += 1;
    index = found + phrase.length;
  }
  return count;
}

function words(text) {
  return text.match(/\b\w+\b/g) ?? [];
}

function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function round(value, places = 0) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function scoreAiVocabulary(text) {
  const textLower = text.toLowerCase();
  const wordsTotal = Math.max(1, words(text).length);
  const hits = [];

  for (const phrase of AI_VOCABULARY) {
    const count = countOccurrences(textLower, phrase);
    if (count > 0) {
      hits.push([phrase, count]);
    }
  }

  const totalHits = hits.reduce((sum, [, count]) => sum + count, 0);
  const density = totalHits / (wordsTotal / 100);
  let score;
  if (totalHits === 0) {
    score = 25;
  } else if (totalHits <= 2) {
    score = 20;
  } else if (totalHits <= 5) {
    score = 14;
  } else if (totalHits <= 10) {
    score = 8;
  } else if (totalHits <= 15) {
    score = 3;
  } else {
    score = 0;
  }

  return {
    score,
    max: 25,
    ai_word_hits: totalHits,
    density_per_100_words: round(density, 2),
    flagged_terms: hits.slice(0, 10).map(([phrase]) => phrase),
  };
}

function scoreSentenceVariance(text) {
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => splitWords(sentence).length >= 3);

  if (sentences.length < 3) {
    return { score: 10, max: 20, std_dev: 0, avg_length: 0, note: "too few sentences to score" };
  }

  const lengths = sentences.map((sentence) => splitWords(sentence).length);
  const avg = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const variance = lengths.reduce((sum, length) => sum + (length - avg) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  let score;
  if (stdDev >= 12) {
    score = 20;
  } else if (stdDev >= 8) {
    score = 16;
  } else if (stdDev >= 5) {
    score = 10;
  } else if (stdDev >= 3) {
    score = 5;
  } else {
    score = 0;
  }

  return {
    score,
    max: 20,
    std_dev: round(stdDev, 1),
    avg_length: round(avg, 1),
    min_length: Math.min(...lengths),
    max_length: Math.max(...lengths),
  };
}

function scorePassiveVoice(text) {
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const sentenceCount = Math.max(1, sentences.length);
  let passiveCount = 0;

  for (const pattern of PASSIVE_PATTERNS) {
    passiveCount += (text.match(pattern) ?? []).length;
  }

  const passiveRatio = passiveCount / sentenceCount;
  let score;
  if (passiveRatio < 0.1) {
    score = 20;
  } else if (passiveRatio < 0.2) {
    score = 16;
  } else if (passiveRatio < 0.3) {
    score = 10;
  } else if (passiveRatio < 0.4) {
    score = 5;
  } else {
    score = 0;
  }

  return {
    score,
    max: 20,
    passive_count: passiveCount,
    passive_ratio: round(passiveRatio, 2),
    passive_pct: `${Math.round(passiveRatio * 100)}%`,
  };
}

function scoreHedging(text) {
  const textLower = text.toLowerCase();
  const hits = [];

  for (const phrase of HEDGING_PHRASES) {
    const count = countOccurrences(textLower, phrase);
    if (count > 0) {
      hits.push([phrase, count]);
    }
  }

  const totalHedges = hits.reduce((sum, [, count]) => sum + count, 0);
  let score;
  if (totalHedges === 0) {
    score = 15;
  } else if (totalHedges === 1) {
    score = 12;
  } else if (totalHedges === 2) {
    score = 8;
  } else if (totalHedges === 3) {
    score = 4;
  } else {
    score = 0;
  }

  return {
    score,
    max: 15,
    hedge_count: totalHedges,
    vague_authority_count: VAGUE_AUTHORITY.reduce((sum, phrase) => sum + countOccurrences(textLower, phrase), 0),
    flagged_phrases: hits.map(([phrase]) => phrase),
  };
}

function scoreEmDashes(text) {
  const emCount = countOccurrences(text, "—") + countOccurrences(text, "--");
  const wordCount = Math.max(1, words(text).length);
  const per100 = emCount / (wordCount / 100);
  let score;
  if (per100 < 0.5) {
    score = 10;
  } else if (per100 < 1.5) {
    score = 8;
  } else if (per100 < 3) {
    score = 5;
  } else if (per100 < 5) {
    score = 2;
  } else {
    score = 0;
  }

  return {
    score,
    max: 10,
    em_dash_count: emCount,
    per_100_words: round(per100, 2),
  };
}

function scoreParagraphVariety(text) {
  const paragraphs = text
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !paragraph.startsWith("#"));

  if (paragraphs.length < 3) {
    return { score: 5, max: 10, note: "too few paragraphs to score" };
  }

  const lengths = paragraphs.map((paragraph) => splitWords(paragraph).length);
  const avg = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const variance = lengths.reduce((sum, length) => sum + (length - avg) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const hasShort = lengths.some((length) => length <= 15);
  const hasLong = lengths.some((length) => length >= 80);
  let score = 0;

  if (stdDev >= 30) {
    score += 5;
  } else if (stdDev >= 15) {
    score += 3;
  } else if (stdDev >= 5) {
    score += 1;
  }
  if (hasShort) score += 3;
  if (hasLong && stdDev >= 15) score += 2;

  return {
    score: Math.min(10, score),
    max: 10,
    paragraph_count: paragraphs.length,
    paragraph_std_dev: round(stdDev, 1),
    has_short_paragraphs: hasShort,
    avg_paragraph_words: round(avg, 1),
  };
}

function scoreHumanity(text) {
  const vocab = scoreAiVocabulary(text);
  const variance = scoreSentenceVariance(text);
  const passive = scorePassiveVoice(text);
  const hedging = scoreHedging(text);
  const em = scoreEmDashes(text);
  const paragraphs = scoreParagraphVariety(text);
  const total = vocab.score + variance.score + passive.score + hedging.score + em.score + paragraphs.score;

  let label;
  if (total >= 85) {
    label = "Sounds human ✅";
  } else if (total >= 70) {
    label = "Mostly human — light edits needed";
  } else if (total >= 50) {
    label = "Mixed — AI patterns detectable";
  } else if (total >= 30) {
    label = "Robotic — significant rewrite needed";
  } else {
    label = "AI fingerprint — full rewrite required 🔴";
  }

  return {
    humanity_score: total,
    label,
    sections: {
      ai_vocabulary: vocab,
      sentence_variance: variance,
      passive_voice: passive,
      hedging,
      em_dashes: em,
      paragraph_variety: paragraphs,
    },
  };
}

function printReport(result, label = "") {
  const total = result.humanity_score;
  const sections = result.sections;
  const barFilled = Math.trunc(total / 5);
  const bar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);

  console.log();
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       HUMANIZER SCORER — REPORT          ║");
  console.log("╚══════════════════════════════════════════╝");
  if (label) {
    console.log(`  Input: ${label}`);
  }
  console.log();
  console.log(`  HUMANITY SCORE:  ${total}/100`);
  console.log(`  [${bar}]`);
  console.log(`  Verdict: ${result.label}`);
  console.log();
  console.log("  ── Section Breakdown ──────────────────────");

  const sectionRows = [
    ["AI Vocabulary", sections.ai_vocabulary, 25],
    ["Sentence Variance", sections.sentence_variance, 20],
    ["Passive Voice", sections.passive_voice, 20],
    ["Hedging Phrases", sections.hedging, 15],
    ["Em-Dash Use", sections.em_dashes, 10],
    ["Paragraph Variety", sections.paragraph_variety, 10],
  ];

  for (const [name, section, max] of sectionRows) {
    const score = section.score;
    const sectionBar = "█".repeat(Math.trunc((score / max) * 10)) + "░".repeat(10 - Math.trunc((score / max) * 10));
    console.log(`  ${name.padEnd(20)} ${String(score).padStart(2)}/${max}  [${sectionBar}]`);
  }

  console.log();
  console.log("  ── Detected Issues ────────────────────────");

  const vocab = sections.ai_vocabulary;
  if (vocab.ai_word_hits > 0) {
    console.log(`  🔴 AI vocabulary: ${vocab.ai_word_hits} hits — [${vocab.flagged_terms.slice(0, 5).join(", ")}]`);
  } else {
    console.log("  ✅ No AI vocabulary detected");
  }

  const sentenceVariance = sections.sentence_variance;
  if (sentenceVariance.std_dev < 5) {
    console.log(`  🔴 Sentence rhythm robotic — std dev only ${sentenceVariance.std_dev} (target: 8+)`);
  } else if (sentenceVariance.std_dev < 8) {
    console.log(`  🟡 Sentence variance low — ${sentenceVariance.std_dev} (target: 8+)`);
  } else {
    console.log(`  ✅ Sentence variance good — ${sentenceVariance.std_dev}`);
  }

  const passive = sections.passive_voice;
  if (passive.passive_ratio > 0.3) {
    console.log(`  🔴 Passive voice overuse — ${passive.passive_pct} of sentences`);
  } else if (passive.passive_ratio > 0.2) {
    console.log(`  🟡 Passive voice elevated — ${passive.passive_pct}`);
  } else {
    console.log(`  ✅ Passive voice in range — ${passive.passive_pct}`);
  }

  const hedging = sections.hedging;
  if (hedging.hedge_count > 2) {
    console.log(`  🔴 Hedging overload — ${hedging.hedge_count} phrases: [${hedging.flagged_phrases.slice(0, 3).join(", ")}]`);
  } else if (hedging.hedge_count > 0) {
    console.log(`  🟡 Hedging present — ${hedging.hedge_count} phrase(s): ${JSON.stringify(hedging.flagged_phrases).replaceAll('"', "'")}`);
  } else {
    console.log("  ✅ No hedging detected");
  }

  if (hedging.vague_authority_count > 0) {
    console.log(`  🟡 Vague authority claims: ${hedging.vague_authority_count} (e.g. 'studies show') — add citations`);
  }

  const em = sections.em_dashes;
  if (em.per_100_words > 3) {
    console.log(`  🟡 Em-dash overuse — ${em.em_dash_count} in piece (${em.per_100_words}/100 words)`);
  }

  const paragraphs = sections.paragraph_variety;
  if (!paragraphs.has_short_paragraphs) {
    console.log("  🟡 No short paragraphs found — add some 1-2 sentence paragraphs for rhythm");
  }

  console.log();
  console.log("  ── Priority Fixes ─────────────────────────");

  if (vocab.ai_word_hits > 5) {
    console.log("  1. Replace AI vocabulary (biggest impact)");
  }
  if (sentenceVariance.std_dev < 8) {
    console.log("  2. Vary sentence length — mix short punchy sentences with longer ones");
  }
  if (passive.passive_ratio > 0.25) {
    console.log("  3. Flip passive sentences to active voice");
  }
  if (hedging.hedge_count > 2) {
    console.log("  4. Cut hedging phrases — state claims directly");
  }
  if (!paragraphs.has_short_paragraphs) {
    console.log("  5. Add short paragraphs — even 1-sentence paragraphs help rhythm");
  }
  if (total >= 85) {
    console.log("  ✅ No priority fixes — content reads as human");
  }
  console.log();
}

function parseArgs(argv) {
  const args = {
    file: null,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (!arg.startsWith("-") && args.file === null) {
      args.file = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function usage() {
  return [
    "Scores content 0-100 on 'humanity' by detecting AI writing patterns.",
    "",
    "Usage:",
    "  node humanizer_scorer.mjs draft.txt --json",
    "  node humanizer_scorer.mjs",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.file === null) {
    console.log("[Demo mode — comparing human vs AI sample content]");
    console.log();
    console.log("═".repeat(50));
    console.log("SAMPLE 1: Human-written content");
    console.log("═".repeat(50));
    const humanResult = scoreHumanity(SAMPLE_HUMAN);
    printReport(humanResult, "Human sample");

    console.log("═".repeat(50));
    console.log("SAMPLE 2: AI-generated content");
    console.log("═".repeat(50));
    const aiResult = scoreHumanity(SAMPLE_AI);
    printReport(aiResult, "AI sample");

    console.log(`  Delta: Human scored ${humanResult.humanity_score}, AI scored ${aiResult.humanity_score}`);
    console.log(`  Difference: ${humanResult.humanity_score - aiResult.humanity_score} points`);
    console.log();
    return;
  }

  let text;
  try {
    text = readFileSync(args.file, "utf-8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error(`Error: file not found: ${args.file}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const result = scoreHumanity(text);
  printReport(result, args.file);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
