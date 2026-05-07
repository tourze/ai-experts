import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { Config } from "./config";
import { XCResultCache } from "./cache";
function run(command: any, args: any): any {
    return spawnSync(command, args, { encoding: "utf8" });
}
export class BuildRunner {
    cache: any;
    configuration: any;
    projectPath: any;
    scheme: any;
    simulator: any;
    workspacePath: any;
    constructor({ projectPath = null, workspacePath = null, scheme = null, configuration = "Debug", simulator = null, cache = null, }: any = {}) {
        this.projectPath = projectPath;
        this.workspacePath = workspacePath;
        this.scheme = scheme;
        this.configuration = configuration;
        this.simulator = simulator;
        this.cache = cache || new XCResultCache();
    }
    autoDetectScheme(): any {
        const args: any[] = ["-list"];
        if (this.workspacePath) {
            args.push("-workspace", this.workspacePath);
        }
        else if (this.projectPath) {
            args.push("-project", this.projectPath);
        }
        else {
            return null;
        }
        const result = run("xcodebuild", args);
        if (result.status !== 0) {
            console.error(`Error auto-detecting scheme: ${result.stderr || result.error?.message || `exit ${result.status}`}`);
            return null;
        }
        let inSchemesSection = false;
        for (const rawLine of result.stdout.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (line.includes("Schemes:")) {
                inSchemesSection = true;
                continue;
            }
            if (inSchemesSection && line && !line.startsWith("Build")) {
                return line;
            }
        }
        return null;
    }
    getSimulatorDestination(): any {
        if (this.simulator) {
            return `platform=iOS Simulator,name=${this.simulator}`;
        }
        try {
            const config = Config.load(this.projectDir());
            const preferred = config.getPreferredSimulator();
            if (preferred) {
                if (this.simulatorExists(preferred)) {
                    return `platform=iOS Simulator,name=${preferred}`;
                }
                console.error(`Warning: Preferred simulator '${preferred}' not available`);
                if (config.shouldFallbackToAnyIphone()) {
                    console.error("Falling back to auto-detection...");
                }
                else {
                    return `platform=iOS Simulator,name=${preferred}`;
                }
            }
        }
        catch (error: any) {
            console.error(`Warning: Could not load config: ${error.message}`);
        }
        return this.autoDetectSimulator();
    }
    simulatorExists(name: any): any {
        const result = run("xcrun", ["simctl", "list", "devices", "available", "iOS"]);
        if (result.status !== 0)
            return false;
        return result.stdout.split(/\r?\n/).some((line: any) => line.includes(name) && line.includes("("));
    }
    extractSimulatorNameFromDestination(destination: any): any {
        return destination.match(/name=([^,]+)/)?.[1]?.trim() || null;
    }
    autoDetectSimulator(): any {
        const result = run("xcrun", ["simctl", "list", "devices", "available", "iOS"]);
        if (result.status !== 0) {
            console.error(`Warning: Could not auto-detect simulator: ${result.stderr || result.error?.message || `exit ${result.status}`}`);
            return "generic/platform=iOS Simulator";
        }
        for (const rawLine of result.stdout.split(/\r?\n/)) {
            if (rawLine.includes("iPhone") && rawLine.includes("(")) {
                const name = rawLine.split("(")[0].trim();
                if (name)
                    return `platform=iOS Simulator,name=${name}`;
            }
        }
        return "generic/platform=iOS Simulator";
    }
    build(clean: any = false): any {
        if (!this.scheme) {
            this.scheme = this.autoDetectScheme();
            if (!this.scheme) {
                console.error("Error: Could not auto-detect scheme. Use --scheme");
                return [false, "", ""];
            }
        }
        const xcresultId = this.cache.generateId();
        const xcresultPath = this.cache.getPath(xcresultId);
        const args: any[] = ["-quiet"];
        if (clean)
            args.push("clean");
        args.push("build");
        if (this.workspacePath) {
            args.push("-workspace", this.workspacePath);
        }
        else if (this.projectPath) {
            args.push("-project", this.projectPath);
        }
        else {
            console.error("Error: No project or workspace specified");
            return [false, "", ""];
        }
        args.push("-scheme", this.scheme, "-configuration", this.configuration, "-destination", this.getSimulatorDestination(), "-resultBundlePath", xcresultPath);
        try {
            const result = run("xcodebuild", args);
            const stderr = result.stderr || result.error?.message || "";
            const success = result.status === 0;
            if (!existsSync(xcresultPath)) {
                console.error("Warning: xcresult bundle was not created");
                return [success, "", stderr];
            }
            if (success)
                this.updateLastUsedSimulator();
            return [success, xcresultId, stderr];
        }
        catch (error: any) {
            console.error(`Error executing build: ${error.message}`);
            return [false, "", error.message];
        }
    }
    test(testSuite: any = null): any {
        if (!this.scheme) {
            this.scheme = this.autoDetectScheme();
            if (!this.scheme) {
                console.error("Error: Could not auto-detect scheme. Use --scheme");
                return [false, "", ""];
            }
        }
        const xcresultId = this.cache.generateId();
        const xcresultPath = this.cache.getPath(xcresultId);
        const args: any[] = ["-quiet", "test"];
        if (this.workspacePath) {
            args.push("-workspace", this.workspacePath);
        }
        else if (this.projectPath) {
            args.push("-project", this.projectPath);
        }
        else {
            console.error("Error: No project or workspace specified");
            return [false, "", ""];
        }
        args.push("-scheme", this.scheme, "-destination", this.getSimulatorDestination(), "-resultBundlePath", xcresultPath);
        if (testSuite) {
            args.push("-only-testing", testSuite);
        }
        try {
            const result = run("xcodebuild", args);
            const stderr = result.stderr || result.error?.message || "";
            const success = result.status === 0;
            if (!existsSync(xcresultPath)) {
                console.error("Warning: xcresult bundle was not created");
                return [success, "", stderr];
            }
            if (success)
                this.updateLastUsedSimulator();
            return [success, xcresultId, stderr];
        }
        catch (error: any) {
            console.error(`Error executing tests: ${error.message}`);
            return [false, "", error.message];
        }
    }
    projectDir(): any {
        if (this.projectPath)
            return dirname(this.projectPath);
        if (this.workspacePath)
            return dirname(this.workspacePath);
        return process.cwd();
    }
    updateLastUsedSimulator(): any {
        try {
            const config = Config.load(this.projectDir());
            const simulatorName = this.extractSimulatorNameFromDestination(this.getSimulatorDestination());
            if (simulatorName) {
                config.updateLastUsedSimulator(simulatorName);
                config.save();
            }
        }
        catch (error: any) {
            console.error(`Warning: Could not update config: ${error.message}`);
        }
    }
}
