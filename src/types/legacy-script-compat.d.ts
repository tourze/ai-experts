declare module "sharp";
declare module "playwright";
declare module "@pdfme/converter";
declare module "pdfjs-dist/legacy/build/pdf.mjs";

interface Error {
  code?: string | number;
  result?: unknown;
  stderr?: unknown;
  exitCode?: number;
}
