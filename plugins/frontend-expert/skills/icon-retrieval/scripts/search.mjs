#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function searchIcons(query, topK = 5) {
  const params = new URLSearchParams({ text: query, topK: topK.toString() });
  const apiUrl = `https://www.weavefox.cn/api/open/v1/icon?${params}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  const data = await response.json();
  
  if (!data.status || !data.data?.success) {
    throw new Error(data.message || 'API request failed');
  }
  
  const iconUrls = data.data.data;
  const results = [];
  
  for (const url of iconUrls) {
    try {
      const svgResponse = await fetch(url);
      if (!svgResponse.ok) {
        throw new Error(`HTTP ${svgResponse.status}`);
      }
      const svgContent = await svgResponse.text();
      results.push({ url, svg: svgContent });
    } catch (e) {
      console.error(`Warning: Failed to fetch SVG from ${url}: ${e.message}`);
    }
  }
  
  return results;
}

async function main() {
  if (process.argv.length < 3) {
    const error = {
      error: 'Missing search query',
      usage: 'node search.mjs \'<search_query>\' [topK]',
      example: 'node search.mjs \'document\' 10',
      note: 'topK defaults to 5 if not specified',
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  const query = process.argv[2].trim();
  const topK = process.argv[3] ? parseInt(process.argv[3], 10) : 5;

  if (!query) {
    const error = {
      error: 'Search query cannot be empty',
      usage: 'node search.mjs \'<search_query>\' [topK]',
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  if (isNaN(topK) || topK < 1) {
    const error = {
      error: 'Invalid topK value',
      usage: 'node search.mjs \'<search_query>\' [topK]',
      note: 'topK must be a positive integer',
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  try {
    const results = await searchIcons(query, topK);
    const output = {
      query,
      topK,
      count: results.length,
      results,
    };
    console.log(JSON.stringify(output, null, 2));
    
    if (results.length === 0) {
      console.error(`Warning: No icons found for query "${query}"`);
    }
  } catch (e) {
    const error = { error: e.message, query };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

// Export functions for testing
export { searchIcons };
