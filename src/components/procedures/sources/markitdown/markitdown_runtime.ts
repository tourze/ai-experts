import { spawn } from "node:child_process";
function pythonCommand(): any {
  return (
    process.env.PYTHON ??
    process.env.PYTHON3 ??
    (process.platform === "win32" ? "python" : "python3")
  );
}
const CONVERT_CODE = String.raw`
import json
import sys

payload = json.loads(sys.stdin.read())

kwargs = {}
if "enable_plugins" in payload:
    kwargs["enable_plugins"] = bool(payload["enable_plugins"])

if payload.get("llm"):
    from openai import OpenAI

    llm = payload["llm"]
    kwargs["llm_client"] = OpenAI(
        api_key=llm["api_key"],
        base_url="https://openrouter.ai/api/v1",
    )
    kwargs["llm_model"] = llm["model"]
    kwargs["llm_prompt"] = llm["prompt"]

from markitdown import MarkItDown

result = MarkItDown(**kwargs).convert(payload["input"])
print(json.dumps({
    "title": result.title,
    "text_content": result.text_content,
}, ensure_ascii=False))
`;
export function convertDocument(input: any, options: any = {}): any {
  const payload: Record<string, any> = {
    input,
  };
  if (options.enablePlugins !== undefined) {
    payload.enable_plugins = options.enablePlugins;
  }
  if (options.llm) {
    payload.llm = options.llm;
  }
  return new Promise((resolve: any, reject: any) => {
    const child = spawn(pythonCommand(), ["-c", CONVERT_CODE], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: any) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: any) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code: any, signal: any) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `markitdown conversion failed with exit code ${code}`,
          ),
        );
        return;
      }
      if (signal) {
        reject(new Error(`markitdown conversion terminated by ${signal}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error: any) {
        reject(new Error(`markitdown returned invalid JSON: ${error.message}`));
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}
export function normalizeExtensions(extensions: any): any {
  return extensions.map((extension: any) =>
    extension.startsWith(".") ? extension : `.${extension}`,
  );
}
