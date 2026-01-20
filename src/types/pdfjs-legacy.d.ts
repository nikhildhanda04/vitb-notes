declare module 'pdfjs-dist/legacy/build/pdf' {
    export const GlobalWorkerOptions: {
        workerSrc: string;
        standardFontDataUrl?: string;
    };
    export function getDocument(src: unknown): {
        promise: Promise<{
            numPages: number;
            getPage(num: number): Promise<{
                getViewport(options: { scale: number }): { width: number; height: number };
                getTextContent(): Promise<{ items: Array<{ str: string } | unknown> }>;
                render(params: unknown): { promise: Promise<void> };
            }>;
        }>;
    };
}
declare module 'pdfjs-dist/legacy/build/pdf.worker.js' {
  const content: unknown;
  export default content;
}
