import { defineInstruction, Platform } from "../../sdk";

export const reportingFormatsInstruction = defineInstruction({
  id: "reporting-formats",
  title: "复杂报告格式模板",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./INSTRUCTION.body.md", import.meta.url),
  priority: 50,
});
