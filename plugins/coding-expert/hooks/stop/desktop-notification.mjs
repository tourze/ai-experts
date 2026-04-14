/**
 * desktop-notification (Stop) — 任务完成时发送桌面通知
 *
 * 复用 notification/ 下的同名模块。
 * dispatch.mjs 会按子目录推导 hookEventName，但这里显式补上，避免
 * 直接单测或独立调用时事件类型缺失。
 */

import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { run: baseRun } = await import(
  pathToFileURL(join(__dirname, "..", "notification", "desktop-notification.mjs")).href
);

export async function run(payload) {
  return baseRun({ ...payload, hook_event_name: "Stop" });
}
