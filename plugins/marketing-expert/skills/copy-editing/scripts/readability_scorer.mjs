#!/usr/bin/env node

import { readFileSync } from "node:fs";

const fillerWords = [
  "very", "really", "just", "actually", "basically", "literally",
  "honestly", "totally", "absolutely", "definitely", "certainly",
  "obviously", "clearly", "quite", "rather", "somewhat", "fairly",
  "pretty", "simply", "truly", "genuinely", "essentially",
];

const passivePattern = /\b(was|were|is|are|been|being|be|am)\s+(\w+ed|known|written|built|made|done|seen|given|taken|brought|thought|found|put|set|cut|read|let|hit|hurt|cost|led|felt|kept|left|meant|sent|spent|stood|told|wore|won|beat|lost|broke|chose|drove|flew|froze|grew|hid|rang|rode|rose|ran|sank|sang|spoke|swore|swam|threw|woke|wrote)\b/gi;
const adverbPattern = /\b\w+ly\b/gi;
const nonAdverbs = new Set([
  "family", "early", "only", "likely", "nearly", "really",
  "daily", "weekly", "monthly", "yearly", "friendly", "lovely",
  "lonely", "lively", "elderly", "costly",
]);

const demoText = `
Marketing copy needs to be clear, direct, and persuasive. When you write for your audience,
you should always think about what they actually want to hear. Really good copy is basically
about solving problems. It is very important to avoid using overly complicated language that
might confuse the reader.

The best headlines are written by experts who truly understand their customers. A strong
call-to-action is absolutely essential for any landing page. You need to make sure that
every single word is earning its place on the page.

Studies show that shorter sentences improve comprehension. The average reader processes
information faster when sentences contain fewer than 20 words. This is genuinely proven
by research. Passive voice constructions are often used by writers who want to sound
authoritative, but they can actually make copy feel distant and unclear.

Focus on benefits, not features. Tell the reader what they will gain. Use numbers when
you can — "save 3 hours per week" beats "save time" every single time. Specificity
builds trust. Vague promises are ignored.
`;

function parseArgs(argv) {
  const args = {
    file: null,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file") {
      args.file = requireValue(argv, ++i, arg);
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log("Usage: readability_scorer.mjs [--file copy.txt] [--json]");
}

function countSyllables(word) {
  let normalized = word.toLowerCase().replace(/^[.,!?;:"']+|[.,!?;:"']+$/g, "");
  if (!normalized) return 0;
  if (normalized.endsWith("e") && normalized.length > 2) {
    normalized = normalized.slice(0, -1);
  }
  const matches = normalized.match(/[aeiou]+/g) ?? [];
  return Math.max(1, matches.length);
}

function splitSentences(text) {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitWords(text) {
  return text.match(/\b[a-zA-Z]+\b/g) ?? [];
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function fleschReadingEase(avgSentenceLen, avgSyllables) {
  const score = 206.835 - (1.015 * avgSentenceLen) - (84.6 * avgSyllables);
  return round(Math.max(0.0, Math.min(100.0, score)), 1);
}

function fleschKincaidGrade(avgSentenceLen, avgSyllables) {
  const grade = (0.39 * avgSentenceLen) + (11.8 * avgSyllables) - 15.59;
  return round(Math.max(0.0, grade), 1);
}

function easeLabel(score) {
  if (score >= 90) return "Very Easy (5th grade)";
  if (score >= 80) return "Easy (6th grade)";
  if (score >= 70) return "Fairly Easy (7th grade)";
  if (score >= 60) return "Standard (8-9th grade)";
  if (score >= 50) return "Fairly Difficult (10-12th grade)";
  if (score >= 30) return "Difficult (College)";
  return "Very Confusing (Professional)";
}

function analyzeText(text) {
  const sentences = splitSentences(text);
  const words = splitWords(text);

  if (words.length === 0) {
    return { error: "No readable text found." };
  }

  const numSentences = Math.max(1, sentences.length);
  const numWords = words.length;
  const syllableCounts = words.map((word) => countSyllables(word));
  const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);

  const avgSentenceLen = numWords / numSentences;
  const avgWordLen = words.reduce((sum, word) => sum + word.length, 0) / numWords;
  const avgSyllablesPerWord = totalSyllables / numWords;
  const fre = fleschReadingEase(avgSentenceLen, avgSyllablesPerWord);
  const fkGrade = fleschKincaidGrade(avgSentenceLen, avgSyllablesPerWord);

  const passiveMatches = text.match(passivePattern) ?? [];
  const passiveCount = passiveMatches.length;
  const passivePct = round((passiveCount / numSentences) * 100, 1);
  const adverbMatches = text.match(adverbPattern) ?? [];
  const adverbs = adverbMatches.filter((adverb) => !nonAdverbs.has(adverb.toLowerCase()));
  const adverbDensity = round((adverbs.length / numWords) * 100, 1);

  const wordTokensLower = words.map((word) => word.toLowerCase());
  const fillerFound = {};
  for (const filler of fillerWords) {
    const count = wordTokensLower.filter((word) => word === filler).length;
    if (count > 0) {
      fillerFound[filler] = count;
    }
  }
  const fillerTotal = Object.values(fillerFound).reduce((sum, count) => sum + count, 0);

  return {
    stats: {
      word_count: numWords,
      sentence_count: numSentences,
      avg_sentence_length: round(avgSentenceLen, 1),
      avg_word_length: round(avgWordLen, 1),
      avg_syllables_per_word: round(avgSyllablesPerWord, 2),
    },
    flesch_reading_ease: {
      score: fre,
      label: easeLabel(fre),
      target: "60-80 for most marketing copy",
    },
    flesch_kincaid_grade: {
      grade_level: fkGrade,
      note: `Equivalent to grade ${fkGrade} reading level`,
    },
    passive_voice: {
      count: passiveCount,
      percentage: passivePct,
      target: "<10%",
      pass: passivePct < 10,
    },
    adverb_density: {
      count: adverbs.length,
      percentage: adverbDensity,
      examples: [...new Set(adverbs)].slice(0, 8),
      target: "<5%",
      pass: adverbDensity < 5,
    },
    filler_words: {
      total_count: fillerTotal,
      breakdown: fillerFound,
      target: "0-3 per 100 words",
      per_100_words: round((fillerTotal / numWords) * 100, 1),
    },
    overall_score: Math.round(fre),
  };
}

function readInput(args) {
  if (args.file) {
    return readFileSync(args.file, "utf-8");
  }
  if (!process.stdin.isTTY) {
    const input = readFileSync(0, "utf-8");
    return input.trim() ? input : demoText;
  }
  return demoText;
}

function printReport(result, usedDemo) {
  if (usedDemo) {
    console.log("No input provided — running in demo mode.\n");
  }

  const fre = result.flesch_reading_ease;
  const fk = result.flesch_kincaid_grade;
  const stats = result.stats;
  const passive = result.passive_voice;
  const adverbs = result.adverb_density;
  const fillers = result.filler_words;
  const score = result.overall_score;
  const pass = "✅";
  const fail = "❌";

  console.log("=".repeat(62));
  console.log(`  READABILITY REPORT   Flesch Score: ${fre.score}/100`);
  console.log("=".repeat(62));
  console.log(`  ${fre.label}`);
  console.log(`  Target: ${fre.target}`);
  console.log();
  console.log("  📊 Stats");
  console.log(`     Words:              ${stats.word_count}`);
  console.log(`     Sentences:          ${stats.sentence_count}`);
  console.log(`     Avg sentence length:${stats.avg_sentence_length} words`);
  console.log(`     Avg word length:    ${stats.avg_word_length} chars`);
  console.log(`     Syllables/word:     ${stats.avg_syllables_per_word}`);
  console.log();
  console.log(`  📐 Flesch-Kincaid Grade Level: ${fk.grade_level}`);
  console.log(`     ${fk.note}`);
  console.log();

  console.log(`  ${passive.pass ? pass : fail} Passive Voice: ${passive.count} instances (${passive.percentage}%)`);
  console.log(`     Target: ${passive.target}`);
  console.log(`  ${adverbs.pass ? pass : fail} Adverb Density: ${adverbs.count} adverbs (${adverbs.percentage}%)`);
  if (adverbs.examples.length > 0) {
    console.log(`     Examples: ${adverbs.examples.slice(0, 5).join(", ")}`);
  }

  const fillerOk = fillers.per_100_words <= 3;
  console.log(`  ${fillerOk ? pass : fail} Filler Words: ${fillers.total_count} total (${fillers.per_100_words} per 100 words)`);
  if (Object.keys(fillers.breakdown).length > 0) {
    const top = Object.entries(fillers.breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => `${word}(${count})`)
      .join(", ");
    console.log(`     Top: ${top}`);
  }

  console.log();
  console.log("=".repeat(62));
  const scoreBarLen = Math.round(score / 10);
  const bar = "█".repeat(scoreBarLen) + "░".repeat(10 - scoreBarLen);
  console.log(`  Readability Score:  [${bar}] ${score}/100`);
  console.log("=".repeat(62));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const text = readInput(args);
  const usedDemo = text === demoText;
  const result = analyzeText(text);

  if (result.error) {
    console.error(`Error: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printReport(result, usedDemo);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
