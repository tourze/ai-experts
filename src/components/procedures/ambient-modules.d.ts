declare module "sharp" {
  const sharp: any;
  export default sharp;
}

declare module "playwright" {
  export const chromium: any;
}

declare module "@pdfme/converter" {
  export function pdf2img(pdf: ArrayBuffer, options: any): Promise<ArrayBuffer[]>;
  export function pdf2size(pdf: ArrayBuffer, options: any): Promise<Array<{ width: number; height: number }>>;
}

declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export const OPS: Record<string, number> & { constructPath: number };
  export function getDocument(params: Record<string, unknown>): { promise: Promise<any> };
}
