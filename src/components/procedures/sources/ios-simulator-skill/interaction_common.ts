#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { getBootedDeviceUdid } from "./simctl_common";
export function buildIdbCommand(operation: any, udid: any = null, ...args: any): any {
    const command: any[] = ["idb", ...operation.split(" "), ...args.map(String)];
    if (udid)
        command.push("--udid", udid);
    return command;
}
export function runCommand(command: any, { check = false, input = null, timeoutMs = 30000 }: any = {}): any {
    const options: Record<string, any> = {
        encoding: "utf8",
        timeout: timeoutMs,
    };
    if (input != null)
        options.input = input;
    const result = spawnSync(command[0], command.slice(1), options);
    if (check && result.status !== 0) {
        const error = new Error(String(result.stderr || result.stdout || `${command[0]} failed`).trim());
        error.result = result;
        throw error;
    }
    return result;
}
export function resolveUdid(udid: any = null): any {
    if (udid)
        return udid;
    const booted = getBootedDeviceUdid();
    if (booted)
        return booted;
    throw new Error("No device UDID provided and no simulator is currently booted.\n" +
        "Boot a simulator or provide --udid explicitly:\n" +
        "  xcrun simctl boot <device-name>\n" +
        "  node scripts/<tool>.mjs --udid <device-udid>");
}
export function getAccessibilityTree(udid: any = null, { nested = true }: any = {}): any {
    const command = buildIdbCommand("ui describe-all", udid, "--json", ...(nested ? ["--nested"] : []));
    const result = runCommand(command, { check: true });
    const data = JSON.parse(result.stdout);
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
}
export function getScreenSize(udid: any = null): any {
    const defaultSize: any[] = [390, 844];
    try {
        const tree = getAccessibilityTree(udid, { nested: false });
        const frame = tree?.frame ?? {};
        const width = Number.parseInt(frame.width ?? defaultSize[0], 10);
        const height = Number.parseInt(frame.height ?? defaultSize[1], 10);
        return [Number.isInteger(width) ? width : defaultSize[0], Number.isInteger(height) ? height : defaultSize[1]];
    }
    catch {
        return defaultSize;
    }
}
export function flattenTree(node: any, depth: any = 0, elements: any = []): any {
    if (!node || typeof node !== "object")
        return elements;
    elements.push({ ...node, depth });
    for (const child of node.children ?? []) {
        flattenTree(child, depth + 1, elements);
    }
    return elements;
}
export function countElements(node: any): any {
    if (!node || typeof node !== "object")
        return 0;
    let count = 1;
    for (const child of node.children ?? [])
        count += countElements(child);
    return count;
}
export function transformScreenshotCoords(x: any, y: any, screenshotWidth: any, screenshotHeight: any, deviceWidth: any, deviceHeight: any): any {
    return [
        Math.trunc((x / screenshotWidth) * deviceWidth),
        Math.trunc((y / screenshotHeight) * deviceHeight),
    ];
}
export function parseCoordinatePair(value: any, label: any = "coordinates"): any {
    const [xText, yText] = String(value).split(",");
    const x = Number.parseInt(xText, 10);
    const y = Number.parseInt(yText, 10);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
        throw new Error(`${label} must use x,y integer coordinates`);
    }
    return [x, y];
}
