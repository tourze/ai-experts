#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common";

export class PushNotificationSender {
  constructor(udid = null) {
    this.udid = udid;
  }

  send(bundleId, payload) {
    let payloadData;
    try {
      payloadData = normalizePayload(payload);
    } catch (error) {
      console.log(`Error: ${error.message}`);
      return false;
    }

    const tempDir = mkdtempSync(join(tmpdir(), "ios-push-"));
    const payloadPath = join(tempDir, "payload.json");
    try {
      writeFileSync(payloadPath, JSON.stringify(payloadData));
      const command = ["xcrun", "simctl", "push", this.udid || "booted", bundleId, payloadPath];
      const result = runCommand(command);
      if (result.status !== 0) {
        console.log(`Error sending push notification: ${(result.stderr || result.stdout || "").trim()}`);
        return false;
      }
      return true;
    } catch (error) {
      console.log(`Error: ${error.message}`);
      return false;
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  sendSimple(bundleId, { title = null, body = null, badge = null, sound = true } = {}) {
    const payload = {};
    if (title || body) {
      payload.alert = {};
      if (title) payload.alert.title = title;
      if (body) payload.alert.body = body;
    }
    if (badge !== null) payload.badge = badge;
    if (sound) payload.sound = "default";
    return this.send(bundleId, { aps: payload });
  }
}

export function normalizePayload(payload) {
  let data = payload;
  if (typeof payload === "string") {
    if (existsSync(payload)) data = JSON.parse(readFileSync(payload, "utf8"));
    else {
      try {
        data = JSON.parse(payload);
      } catch {
        throw new Error(`Invalid JSON payload: ${payload}`);
      }
    }
  }
  return Object.hasOwn(data, "aps") ? data : { aps: data };
}

function usage() {
  return `Send simulated push notification to iOS app.

Usage: node scripts/push_notification.mjs --bundle-id <id> [options]

Options:
  --bundle-id <id>       Target app bundle ID
  --title <text>         Alert title
  --body <text>          Alert body
  --badge <number>       Badge number
  --no-sound             Do not play notification sound
  --payload <json|file>  Custom JSON payload file or inline JSON
  --test-name <name>     Test scenario name
  --expected <text>      Expected behavior after notification
  --udid <udid>          Device UDID
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    bundleId: null,
    title: null,
    body: null,
    badge: null,
    noSound: false,
    payload: null,
    testName: null,
    expected: null,
    udid: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--no-sound") args.noSound = true;
    else if (["--bundle-id", "--title", "--body", "--badge", "--payload", "--test-name", "--expected", "--udid"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--bundle-id") args.bundleId = value;
      if (arg === "--title") args.title = value;
      if (arg === "--body") args.body = value;
      if (arg === "--badge") args.badge = Number.parseInt(value, 10);
      if (arg === "--payload") args.payload = value;
      if (arg === "--test-name") args.testName = value;
      if (arg === "--expected") args.expected = value;
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.badge !== null && !Number.isInteger(args.badge)) throw new Error("--badge must be an integer");
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.bundleId) {
    console.error("Error: --bundle-id is required");
    return 1;
  }

  const sender = new PushNotificationSender(resolveUdid(args.udid));
  const success = args.payload
    ? sender.send(args.bundleId, args.payload)
    : sender.sendSimple(args.bundleId, {
        title: args.title,
        body: args.body,
        badge: args.badge,
        sound: !args.noSound,
      });
  if (!success) {
    console.log("Failed to send push notification");
    return 1;
  }

  let output = "Push notification sent";
  if (args.testName) output += ` (test: ${args.testName})`;
  console.log(output);
  if (args.expected) console.log(`Expected: ${args.expected}`);
  console.log("");
  console.log("Notification details:");
  if (args.title) console.log(`  Title: ${args.title}`);
  if (args.body) console.log(`  Body: ${args.body}`);
  if (args.badge) console.log(`  Badge: ${args.badge}`);
  console.log("");
  console.log("Verify notification handling:");
  console.log(`1. Check app log output: node scripts/log_monitor.mjs --app ${args.bundleId}`);
  console.log(`2. Capture state: node scripts/app_state_capture.mjs --app-bundle-id ${args.bundleId}`);
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
