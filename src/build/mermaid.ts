import { JSDOM } from "jsdom";

type MermaidApi = typeof import("mermaid").default;

let mermaidPromise: Promise<MermaidApi> | null = null;

function installMermaidDom(): void {
  const globalRecord = globalThis as Record<string, unknown>;
  if (globalRecord.window && globalRecord.document) return;

  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const windowRecord = dom.window as unknown as Record<string, unknown>;
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: windowRecord.document,
    Element: windowRecord.Element,
    HTMLElement: windowRecord.HTMLElement,
    SVGElement: windowRecord.SVGElement,
    Node: windowRecord.Node,
    DOMParser: windowRecord.DOMParser,
    XMLSerializer: windowRecord.XMLSerializer,
  };

  for (const [key, value] of Object.entries(globals)) {
    if (globalRecord[key] === undefined) globalRecord[key] = value;
  }
}

async function loadMermaid(): Promise<MermaidApi> {
  mermaidPromise ??= (async () => {
    installMermaidDom();
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
    return mermaid;
  })();
  return mermaidPromise;
}

export async function validateMermaidSyntax(owner: string, diagram: string): Promise<void> {
  const mermaid = await loadMermaid();
  try {
    await mermaid.parse(diagram, { suppressErrors: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${owner} generated Mermaid diagram is invalid: ${message}`);
  }
}
