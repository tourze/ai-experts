#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { runXcrunSimctl } from "./simctl_common";
export function generateScreenshotName(appName: any = null, screenName: any = null, state: any = null, timestamp: any = null, extension: any = "png"): any {
    const stamp = timestamp ?? formatTimestamp(new Date());
    const parts = [appName, screenName, state].filter(Boolean);
    const prefix = parts.length ? parts.join("_") : "screenshot";
    return `${prefix}_${stamp}.${extension}`;
}
export function getSizePreset(size: any = "half"): any {
    return (({
        full: [1.0, 1.0],
        half: [0.5, 0.5],
        quarter: [0.25, 0.25],
        thumb: [0.1, 0.1],
    } as Record<string, number[]>)[String(size)] ?? [0.5, 0.5]);
}
export function resizeScreenshot(inputPath: any, outputPath: any = null, size: any = "half"): any {
    if (!existsSync(inputPath))
        throw new Error(`Screenshot not found: ${inputPath}`);
    const targetPath = outputPath ?? addSizeMarker(inputPath, size);
    if (size === "full") {
        if (targetPath !== inputPath)
            copyFileSync(inputPath, targetPath);
        const [width, height] = getImageDimensions(targetPath);
        return [targetPath, width, height];
    }
    const [width, height] = getImageDimensions(inputPath);
    const [scaleX, scaleY] = getSizePreset(size);
    const newWidth = Math.trunc(width * scaleX);
    const newHeight = Math.trunc(height * scaleY);
    const result = runSips(["-z", newHeight, newWidth, inputPath, "--out", targetPath]);
    if (result.status !== 0) {
        copyFileSync(inputPath, targetPath);
        return [targetPath, width, height];
    }
    return [targetPath, newWidth, newHeight];
}
export function captureScreenshot(udid: any, { outputPath = null, size = "half", inline = false, appName = null, screenName = null, state = null, }: any = {}): any {
    const tempDir = mkdtempSync(join(tmpdir(), "ios-screenshot-"));
    const tempPath = join(tempDir, "screenshot.png");
    try {
        const result = runXcrunSimctl(["io", udid, "screenshot", tempPath], { check: true });
        if (result.status !== 0)
            throw new Error(result.stderr || "Failed to capture screenshot");
        if (inline) {
            const [finalPath, width, height] = size === "full" ? [tempPath, ...getImageDimensions(tempPath)] : resizeScreenshot(tempPath, null, size);
            const base64Data = readFileSync(finalPath).toString("base64");
            return {
                mode: "inline",
                base64_data: base64Data,
                mime_type: "image/png",
                width,
                height,
                size_preset: size,
            };
        }
        const targetPath = outputPath ?? generateScreenshotName(appName, screenName, state);
        let finalPath;
        let width;
        let height;
        if (size !== "full") {
            [finalPath, width, height] = resizeScreenshot(tempPath, targetPath, size);
        }
        else {
            renameSync(tempPath, targetPath);
            finalPath = targetPath;
            [width, height] = getImageDimensions(finalPath);
        }
        return {
            mode: "file",
            file_path: finalPath,
            size_bytes: statSync(finalPath).size,
            width,
            height,
            size_preset: size,
        };
    }
    catch (error: any) {
        throw new Error(`Screenshot capture error: ${error.message}`);
    }
    finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
}
export function formatScreenshotResult(result: any): any {
    if (result.mode === "file") {
        return `Screenshot: ${result.file_path}\nDimensions: ${result.width}x${result.height}\nSize: ${result.size_bytes} bytes`;
    }
    return `Screenshot (inline): ${result.width}x${result.height}\nBase64 length: ${result.base64_data.length} chars`;
}
export function getImageDimensions(filePath: any): any {
    const result = runSips(["-g", "pixelWidth", "-g", "pixelHeight", filePath]);
    if (result.status !== 0)
        return [390, 844];
    const width = Number.parseInt(result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1] ?? "390", 10);
    const height = Number.parseInt(result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1] ?? "844", 10);
    return [width, height];
}
function runSips(args: any): any {
    try {
        return spawnSync("sips", args.map(String), { encoding: "utf8" });
    }
    catch {
        return { status: 1, stdout: "", stderr: "" };
    }
}
function addSizeMarker(inputPath: any, size: any): any {
    const extension = extname(inputPath);
    return join(dirname(inputPath), `${basename(inputPath, extension)}_${size}${extension}`);
}
function formatTimestamp(date: any): any {
    const pad = (value: any) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
