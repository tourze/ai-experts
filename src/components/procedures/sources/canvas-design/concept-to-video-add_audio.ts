#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export function getMediaDuration(path: any): any {
    const result = spawnSync("ffprobe", [
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        path,
    ], {
        encoding: "utf-8",
    });
    const spawnError = result.error as NodeJS.ErrnoException | undefined;
    if (spawnError?.code === "ENOENT") {
        throw new Error("Error: ffprobe not found");
    }
    if (result.status !== 0) {
        throw new Error(`Error: ffprobe failed for ${path}: ${result.stderr || result.stdout}`);
    }
    const duration = Number.parseFloat(result.stdout.trim());
    if (!Number.isFinite(duration)) {
        throw new Error(`Error: invalid duration for ${path}: ${result.stdout.trim()}`);
    }
    return duration;
}
export function buildAudioFilterFromDurations(videoDuration: any, audioDuration: any, volume: any, fadeIn: any, fadeOut: any, trimToVideo: any): any {
    const filters: any[] = [];
    const effectiveDuration = trimToVideo ? videoDuration : Math.min(videoDuration, audioDuration);
    if (volume !== 1.0) {
        filters.push(`volume=${volume}`);
    }
    if (trimToVideo) {
        filters.push(`atrim=0:${videoDuration.toFixed(3)}`);
    }
    if (fadeIn > 0) {
        filters.push(`afade=t=in:st=0:d=${fadeIn.toFixed(3)}`);
    }
    if (fadeOut > 0) {
        const fadeStart = Math.max(0.0, effectiveDuration - fadeOut);
        filters.push(`afade=t=out:st=${fadeStart.toFixed(3)}:d=${fadeOut.toFixed(3)}`);
    }
    return filters.length ? filters.join(",") : "anull";
}
export function buildAudioFilter(video: any, audio: any, volume: any, fadeIn: any, fadeOut: any, trimToVideo: any): any {
    return buildAudioFilterFromDurations(getMediaDuration(video), getMediaDuration(audio), volume, fadeIn, fadeOut, trimToVideo);
}
export function buildFfmpegCommand(video: any, audio: any, output: any, volume: any, fadeIn: any, fadeOut: any, trimToVideo: any): any {
    const audioFilter = buildAudioFilter(video, audio, volume, fadeIn, fadeOut, trimToVideo);
    return [
        "ffmpeg",
        "-y",
        "-i", video,
        "-i", audio,
        "-filter_complex", `[1:a]${audioFilter}[aout]`,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        output,
    ];
}
function usage(): any {
    return `Overlay audio onto a Manim-rendered video using ffmpeg.

Usage: node scripts/concept-to-video-add_audio.mjs <video> <audio> --output <output> [options]

Options:
  --output, -o <path>      Output video file
  --volume <number>        Audio volume multiplier (default: 1.0)
  --fade-in <seconds>      Fade-in duration in seconds (default: 0)
  --fade-out <seconds>     Fade-out duration in seconds (default: 0)
  --trim-to-video          Trim audio to match video length
  --help                   Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = {
        video: null,
        audio: null,
        output: null,
        volume: 1.0,
        fadeIn: 0.0,
        fadeOut: 0.0,
        trimToVideo: false,
        help: false,
    };
    const positional: any[] = [];
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h") {
            args.help = true;
            continue;
        }
        if (arg === "--trim-to-video") {
            args.trimToVideo = true;
            continue;
        }
        if (["--output", "-o", "--volume", "--fade-in", "--fade-out"].includes(arg)) {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--")) {
                throw new Error(`${arg} requires a value`);
            }
            index += 1;
            if (arg === "--output" || arg === "-o")
                args.output = value;
            if (arg === "--volume")
                args.volume = Number.parseFloat(value);
            if (arg === "--fade-in")
                args.fadeIn = Number.parseFloat(value);
            if (arg === "--fade-out")
                args.fadeOut = Number.parseFloat(value);
            continue;
        }
        if (arg.startsWith("-")) {
            throw new Error(`unrecognized argument: ${arg}`);
        }
        positional.push(arg);
    }
    [args.video, args.audio] = positional;
    if (!args.help && positional.length !== 2) {
        throw new Error("video and audio arguments are required");
    }
    if (!args.help && !args.output) {
        throw new Error("--output is required");
    }
    if (!Number.isFinite(args.volume))
        throw new Error("--volume must be a number");
    if (!Number.isFinite(args.fadeIn))
        throw new Error("--fade-in must be a number");
    if (!Number.isFinite(args.fadeOut))
        throw new Error("--fade-out must be a number");
    return args;
}
export function main(argv: any = process.argv.slice(2)): any {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    const video = resolve(args.video);
    const audio = resolve(args.audio);
    const output = resolve(args.output);
    if (!existsSync(video))
        throw new Error(`Error: video file not found: ${video}`);
    if (!existsSync(audio))
        throw new Error(`Error: audio file not found: ${audio}`);
    if (args.volume <= 0)
        throw new Error(`Error: --volume must be > 0, got ${args.volume}`);
    if (args.fadeIn < 0 || args.fadeOut < 0)
        throw new Error("Error: --fade-in and --fade-out must be >= 0");
    mkdirSync(dirname(output), { recursive: true });
    const command = buildFfmpegCommand(video, audio, output, args.volume, args.fadeIn, args.fadeOut, args.trimToVideo);
    console.log(`Running: ${command.join(" ")}`);
    const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });
    const spawnError = result.error as NodeJS.ErrnoException | undefined;
    if (spawnError?.code === "ENOENT")
        throw new Error("Error: ffmpeg not found");
    if (result.status !== 0)
        throw new Error(`Error: ffmpeg exited with code ${result.status ?? 1}`);
    console.log(`Done: ${output}`);
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = main();
    }
    catch (error: any) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
