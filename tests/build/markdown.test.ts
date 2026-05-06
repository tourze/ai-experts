import { describe, expect, test } from "vitest";
import {
  hasH2SectionMatching,
  insertSectionBeforeH2Matching,
  renderMarkdownBulletList,
  renderMarkdownTableCell,
  startsWithH2Section,
} from "../../src/build/markdown.ts";

describe("build/markdown", () => {
  test("renderMarkdownBulletList preserves multiline items", () => {
    expect(renderMarkdownBulletList(["one", "two\n  line2"]))
      .toBe("- one\n- two\n    line2");
  });

  test("renderMarkdownTableCell escapes markdown table syntax", () => {
    expect(renderMarkdownTableCell("a|b\nc")).toBe("a\\|b<br>c");
  });

  test("section matchers ignore fenced code blocks", () => {
    const source = [
      "## Real",
      "value",
      "```md",
      "## Hidden",
      "```",
    ].join("\n");
    expect(hasH2SectionMatching(source, (title) => title === "Real")).toBe(true);
    expect(hasH2SectionMatching(source, (title) => title === "Hidden")).toBe(false);
    expect(startsWithH2Section("  \n## First")).toBe(true);
    expect(startsWithH2Section("intro\n## First")).toBe(false);
  });

  test("insertSectionBeforeH2Matching inserts before target section", () => {
    const source = "## A\n\nbody\n\n## B\n\nend\n";
    const inserted = insertSectionBeforeH2Matching(source, "## X\n\nx", (title) => title === "B");
    expect(inserted.indexOf("## X")).toBeLessThan(inserted.indexOf("## B"));

    const appended = insertSectionBeforeH2Matching("## A\n", "## Tail\n", (title) => title === "Missing");
    expect(appended).toContain("## Tail");
  });
});

