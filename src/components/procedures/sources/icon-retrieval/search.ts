#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "icon-retrieval-search",
  entry: procedureEntry(import.meta.url),
  description:
    "根据搜索词从远程 API 检索 SVG 图标，返回包含 SVG 原始内容的候选列表。",
  owners: { skillIds: ["icon-retrieval"] },
  target: "scripts/search.mjs",
  runtime: "node",
  params: [
    {
      flag: "[search_query]",
      type: "字符串",
      description: "图标搜索词（必填）",
      required: true,
    },
    {
      flag: "[topK]",
      type: "数字",
      description: "返回候选数量（默认 5）",
      required: false,
    },
  ],

  exampleArgs: { args: ["security shield", "3"] },
});

async function searchIcons(query: any, topK: any = 5): Promise<any> {
  const params = new URLSearchParams({ text: query, topK: topK.toString() });
  const apiUrl = `https://www.weavefox.cn/api/open/v1/icon?${params}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  const data = await response.json();
  if (!data.status || !data.data?.success) {
    throw new Error(data.message || "API request failed");
  }
  const iconUrls = data.data.data;
  const results: any[] = [];
  for (const url of iconUrls) {
    try {
      const svgResponse = await fetch(url);
      if (!svgResponse.ok) {
        throw new Error(`HTTP ${svgResponse.status}`);
      }
      const svgContent = await svgResponse.text();
      results.push({ url, svg: svgContent });
    } catch (e: any) {
      console.error(`Warning: Failed to fetch SVG from ${url}: ${e.message}`);
    }
  }
  return results;
}
export async function main(argv: readonly string[]): Promise<any> {
  if (argv.length < 1) {
    const error: Record<string, any> = {
      error: "Missing search query",
      usage: "node search.mjs '<search_query>' [topK]",
      example: "node search.mjs 'document' 10",
      note: "topK defaults to 5 if not specified",
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  const query = argv[0].trim();
  const topK = argv[1] ? parseInt(argv[1], 10) : 5;
  if (!query) {
    const error: Record<string, any> = {
      error: "Search query cannot be empty",
      usage: "node search.mjs '<search_query>' [topK]",
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  if (isNaN(topK) || topK < 1) {
    const error: Record<string, any> = {
      error: "Invalid topK value",
      usage: "node search.mjs '<search_query>' [topK]",
      note: "topK must be a positive integer",
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  try {
    const results = await searchIcons(query, topK);
    const output: Record<string, any> = {
      query,
      topK,
      count: results.length,
      results,
    };
    console.log(JSON.stringify(output, null, 2));
    if (results.length === 0) {
      console.error(`Warning: No icons found for query "${query}"`);
    }
  } catch (e: any) {
    const error: Record<string, any> = { error: e.message, query };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
} // Export functions for testing
export { searchIcons };
