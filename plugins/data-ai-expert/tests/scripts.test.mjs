import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/data-ai-expert");
const analyzeScript = resolve(pluginRoot, "skills/data-analysis/scripts/analyze.mjs");
const validateModelScript = resolve(pluginRoot, "skills/model-first-reasoning/scripts/validate-model.mjs");
const optimizePromptScript = resolve(pluginRoot, "skills/prompt-engineering-patterns/scripts/optimize-prompt.mjs");
const modelTemplate = resolve(pluginRoot, "skills/model-first-reasoning/MODEL_TEMPLATE.json");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeStoredZip(path, entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, text] of Object.entries(entries)) {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(text);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);

    offset += local.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  writeFileSync(path, Buffer.concat([...localParts, centralDirectory, end]));
}

test("data-ai skill Node 脚本都能通过语法检查", () => {
  for (const script of [analyzeScript, validateModelScript, optimizePromptScript]) {
    const result = spawnSync(process.execPath, ["--check", script], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("data-analysis analyze.mjs 支持 CSV inspect/query/summary", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-analysis-"));
  const csvPath = join(dir, "sales.csv");

  try {
    writeFileSync(csvPath, "region,amount\nAPAC,10\nEMEA,20\nAPAC,15\n", "utf-8");

    const inspect = spawnSync(process.execPath, [
      analyzeScript,
      "--files", csvPath,
      "--action", "inspect",
    ], { encoding: "utf-8" });
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.match(inspect.stdout, /Table: sales/);
    assert.match(inspect.stdout, /amount\s+BIGINT/);

    const query = spawnSync(process.execPath, [
      analyzeScript,
      "--files", csvPath,
      "--action", "query",
      "--sql", "SELECT region, SUM(amount) AS revenue FROM sales GROUP BY region ORDER BY revenue DESC",
    ], { encoding: "utf-8" });
    assert.equal(query.status, 0, query.stderr);
    assert.match(query.stdout, /APAC\s+\|\s+25/);
    assert.match(query.stdout, /EMEA\s+\|\s+20/);

    const summary = spawnSync(process.execPath, [
      analyzeScript,
      "--files", csvPath,
      "--action", "summary",
      "--table", "sales",
    ], { encoding: "utf-8" });
    assert.equal(summary.status, 0, summary.stderr);
    assert.match(summary.stdout, /Statistical Summary: sales/);
    assert.match(summary.stdout, /mean\s+:\s+15/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("data-analysis analyze.mjs 可导出查询结果 Markdown", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-analysis-export-"));
  const csvPath = join(dir, "sales.csv");
  const outPath = join(dir, "result.md");

  try {
    writeFileSync(csvPath, "region,amount\nAPAC,10\nEMEA,20\n", "utf-8");
    const result = spawnSync(process.execPath, [
      analyzeScript,
      "--files", csvPath,
      "--action", "query",
      "--sql", "SELECT * FROM sales LIMIT 1",
      "--output-file", outPath,
    ], { encoding: "utf-8" });

    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(outPath, "utf-8"), /\| region \| amount \|/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("data-analysis analyze.mjs 可读取简单 xlsx 工作簿", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-analysis-xlsx-"));
  const xlsxPath = join(dir, "sales.xlsx");

  try {
    writeStoredZip(xlsxPath, {
      "xl/workbook.xml": '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sales" sheetId="1" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml": '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>region</t></is></c><c r="B1" t="inlineStr"><is><t>amount</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>APAC</t></is></c><c r="B2"><v>10</v></c></row></sheetData></worksheet>',
    });

    const result = spawnSync(process.execPath, [
      analyzeScript,
      "--files", xlsxPath,
      "--action", "query",
      "--sql", "SELECT region, amount FROM Sales",
    ], { encoding: "utf-8" });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /APAC\s+\|\s+10/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validate-model.mjs 对含 unknowns 的模板返回 Phase 1 停止码", () => {
  const result = spawnSync(process.execPath, [validateModelScript, modelTemplate], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /WARNING: 1 unknowns remain - STOP after Phase 1/);
  assert.match(result.stdout, /Do NOT proceed to implementation until unknowns are resolved/);
});

test("validate-model.mjs 对缺失结构返回明确错误", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-model-"));
  const invalidPath = join(dir, "invalid.json");

  try {
    writeFileSync(invalidPath, JSON.stringify({ deliverable: {} }), "utf-8");
    const result = spawnSync(process.execPath, [validateModelScript, invalidPath], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /VALIDATION FAILED/);
    assert.match(result.stdout, /Missing top-level keys/);
    assert.match(result.stdout, /'deliverable' missing 'description'/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("optimize-prompt.mjs 运行本地 mock 演示并写出结果历史", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-prompt-"));

  try {
    const result = spawnSync(process.execPath, [optimizePromptScript], {
      cwd: dir,
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Optimization Complete/);
    assert.match(result.stdout, /Best Accuracy: 1\.00/);

    const history = JSON.parse(readFileSync(join(dir, "optimization_results.json"), "utf-8"));
    assert.equal(history.length, 1);
    assert.equal(history[0].iteration, 0);
    assert.equal(history[0].metrics.avg_accuracy, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
