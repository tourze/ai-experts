import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
function pad(value: any): any {
  return String(value).padStart(2, "0");
}
function timestamp(date: any = new Date()): any {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}
function directorySizeBytes(path: any): any {
  if (!existsSync(path)) return 0;
  const stat = statSync(path);
  if (stat.isFile()) return stat.size;
  if (!stat.isDirectory()) return 0;
  return readdirSync(path, { withFileTypes: true }).reduce(
    (total: any, entry: any) => {
      return total + directorySizeBytes(join(path, entry.name));
    },
    0,
  );
}
export class XCResultCache {
  cacheDir: any;
  static DEFAULT_CACHE_DIR = join(
    homedir(),
    ".ios-simulator-skill",
    "xcresults",
  );
  constructor(cacheDir: any = XCResultCache.DEFAULT_CACHE_DIR) {
    this.cacheDir = cacheDir;
    mkdirSync(this.cacheDir, { recursive: true });
  }
  generateId(prefix: any = "xcresult"): any {
    return `${prefix}-${timestamp()}`;
  }
  getPath(xcresultId: any): any {
    return join(
      this.cacheDir,
      xcresultId.endsWith(".xcresult") ? xcresultId : `${xcresultId}.xcresult`,
    );
  }
  exists(xcresultId: any): any {
    return existsSync(this.getPath(xcresultId));
  }
  save(sourcePath: any, xcresultId: any = null): any {
    if (!existsSync(sourcePath)) {
      throw new Error(`Source xcresult not found: ${sourcePath}`);
    }
    const id = xcresultId || this.generateId();
    const destination = this.getPath(id);
    if (existsSync(destination)) {
      rmSync(destination, { recursive: true, force: true });
    }
    cpSync(sourcePath, destination, { recursive: true });
    return id;
  }
  list(limit: any = 10): any {
    if (!existsSync(this.cacheDir)) return [];
    return readdirSync(this.cacheDir, { withFileTypes: true })
      .filter(
        (entry: any) => entry.isDirectory() && entry.name.endsWith(".xcresult"),
      )
      .map((entry: any) => {
        const path = join(this.cacheDir, entry.name);
        const stat = statSync(path);
        return {
          id: basename(entry.name, ".xcresult"),
          path,
          created: stat.mtime.toISOString(),
          size_mb:
            Math.round((directorySizeBytes(path) / (1024 * 1024)) * 100) / 100,
          mtimeMs: stat.mtimeMs,
        };
      })
      .sort((a: any, b: any) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)
      .map(({ mtimeMs, ...entry }: any) => entry);
  }
  cleanup(keepRecent: any = 20): any {
    if (!existsSync(this.cacheDir)) return 0;
    const bundles = readdirSync(this.cacheDir, { withFileTypes: true })
      .filter(
        (entry: any) => entry.isDirectory() && entry.name.endsWith(".xcresult"),
      )
      .map((entry: any) => {
        const path = join(this.cacheDir, entry.name);
        return { path, mtimeMs: statSync(path).mtimeMs };
      })
      .sort((a: any, b: any) => b.mtimeMs - a.mtimeMs);
    let removed = 0;
    for (const bundle of bundles.slice(keepRecent)) {
      rmSync(bundle.path, { recursive: true, force: true });
      removed += 1;
    }
    return removed;
  }
  getSizeMb(xcresultId: any): any {
    const path = this.getPath(xcresultId);
    return Math.round((directorySizeBytes(path) / (1024 * 1024)) * 100) / 100;
  }
  saveStderr(xcresultId: any, stderr: any): any {
    if (!stderr) return;
    writeFileSync(join(this.cacheDir, `${xcresultId}.stderr`), stderr, "utf8");
  }
  getStderr(xcresultId: any): any {
    const stderrPath = join(this.cacheDir, `${xcresultId}.stderr`);
    return existsSync(stderrPath) ? readFileSync(stderrPath, "utf8") : "";
  }
}
