import { readFileSync } from "node:fs";
import type { Platform as PlatformType } from "../components/sdk";
import { procedureRuntimePath } from "./skill-runtime";

export type RuntimeProcedureEntry = {
  id: string;
  target: string;
  runtime: "node";
  description: string;
  owners: {
    skillIds: readonly string[];
    agentIds: readonly string[];
  };
  argsSchema: string | null;
  outputSchema: string | null;
  params?: readonly {
    flag: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  exampleArgs?: { args?: readonly string[] };
};

export type RuntimeProcedureModule = RuntimeProcedureEntry & {
  sourcePath: string;
};

export type ProcedureManifestEntry = Omit<RuntimeProcedureEntry, "target"> & {
  target: string;
  bundled: true;
};

export const procedureRuntimeEntryId = "virtual:ai-experts-procedures";

function normalizeSeparators(path: string): string {
  return path.replaceAll("\\", "/");
}

function metadataForRuntime(procedure: RuntimeProcedureModule): RuntimeProcedureEntry {
  const { sourcePath: _sourcePath, ...entry } = procedure;
  return entry;
}

function renderProcedureLoaders(procedures: readonly RuntimeProcedureModule[]): string {
  return [
    "const procedureLoaders = {",
    ...procedures.map((procedure) =>
      `  ${JSON.stringify(procedure.id)}: () => import(/* webpackMode: "eager" */ ${JSON.stringify(normalizeSeparators(procedure.sourcePath))}),`
    ),
    "};",
  ].join("\n");
}

function loadRuntimeTemplate(): string {
  return readFileSync(new URL("./procedure-runtime-entry.template.mjs", import.meta.url), "utf-8");
}

function renderRuntimeTemplate(replacements: Record<string, string>): string {
  const template = loadRuntimeTemplate();
  const markerPattern = /__AI_EXPERTS_[A-Z_]+__/gu;
  const seen = new Set<string>();

  const rendered = template.replace(markerPattern, (marker) => {
    const replacement = replacements[marker];
    if (replacement === undefined) {
      throw new Error(`Unknown procedure runtime template marker: ${marker}`);
    }
    seen.add(marker);
    return replacement;
  });
  for (const marker of Object.keys(replacements)) {
    if (!seen.has(marker)) {
      throw new Error(`Procedure runtime template marker was not used: ${marker}`);
    }
  }
  return rendered;
}

export function renderProceduresEntrypoint(
  procedures: readonly RuntimeProcedureModule[],
  platform: PlatformType,
): string {
  const procedureMap = Object.fromEntries(procedures.map((procedure) => [procedure.id, metadataForRuntime(procedure)]));
  return renderRuntimeTemplate({
    __AI_EXPERTS_PROCEDURES_JSON__: JSON.stringify(procedureMap),
    __AI_EXPERTS_PROCEDURE_LOADERS__: renderProcedureLoaders(procedures),
    __AI_EXPERTS_PLATFORM_JSON__: JSON.stringify(platform),
    __AI_EXPERTS_RUNTIME_PATH_JSON__: JSON.stringify(procedureRuntimePath(platform)),
  });
}
