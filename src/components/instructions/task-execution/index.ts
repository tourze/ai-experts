import { defineInstruction, Platform } from "../../sdk";

export const taskExecutionInstruction = defineInstruction({
  id: "task-execution",
  title: "任务路由与执行流程",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./INSTRUCTION.body.md", import.meta.url),
  priority: 20,
});
