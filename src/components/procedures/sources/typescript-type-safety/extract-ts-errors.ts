import { readFileSync } from "node:fs";
type Diagnostic = {
    file: string;
    line: number;
    column: number;
    code: string;
    message: string;
};
type Summary = {
    total: number;
    byCode: Record<string, number>;
    byFile: Record<string, number>;
    diagnostics: Diagnostic[];
};
function readInput(argv: string[]): string {
    const inputFlag = argv.findIndex((arg: any): any => arg === "--input" || arg === "-i");
    if (inputFlag >= 0 && argv[inputFlag + 1]) {
        return readFileSync(argv[inputFlag + 1], "utf-8");
    }
    return readFileSync(0, "utf-8");
}
function parseDiagnostics(text: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pattern = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/u;
    for (const line of text.split(/\r?\n/u)) {
        const match = line.match(pattern);
        if (!match)
            continue;
        diagnostics.push({
            file: match[1],
            line: Number(match[2]),
            column: Number(match[3]),
            code: match[4],
            message: match[5].trim(),
        });
    }
    return diagnostics;
}
function summarize(diagnostics: Diagnostic[]): Summary {
    const byCode: Record<string, number> = {};
    const byFile: Record<string, number> = {};
    for (const diagnostic of diagnostics) {
        byCode[diagnostic.code] = (byCode[diagnostic.code] ?? 0) + 1;
        byFile[diagnostic.file] = (byFile[diagnostic.file] ?? 0) + 1;
    }
    return {
        total: diagnostics.length,
        byCode,
        byFile,
        diagnostics,
    };
}
const text = readInput(process.argv.slice(2));
console.log(JSON.stringify(summarize(parseDiagnostics(text)), null, 2));
