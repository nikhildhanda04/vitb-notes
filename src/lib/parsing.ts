
import { createWorker } from "tesseract.js";
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

import path from 'path';

// Configure pdfjs worker for Node.js environment
if (typeof window === 'undefined') {
    // Use path.join to avoid Next.js/Webpack resolving the path to an internal placeholder
    pdfjs.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.js');
    // Point to standard fonts in node_modules
    pdfjs.GlobalWorkerOptions.standardFontDataUrl = path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/');
}

type InputBuffer = Buffer | Uint8Array;

/**
 * Helper to parse a File object (e.g. from FormData)
 */
export async function parseFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return parseBuffer(buffer);
}

/**
 * Main parse function:
 *  - tries pdf-parse for selectable text
 *  - falls back to OCR (pdfjs -> canvas -> tesseract) if text is too short
 */
export async function parseBuffer(buffer: InputBuffer): Promise<string> {
    // 1. Try standard text extraction first
    try {
        const uint8Array = new Uint8Array(buffer);
        const text = (await extractTextFromBuffer(uint8Array)).trim();
        if (text.length > 50) {
            return text;
        }
        console.log("pdfjs-dist returned short text (likely scanned) — will run OCR fallback");
    } catch (err: unknown) {
        console.warn("pdfjs-dist text extraction failed, will attempt OCR fallback:", err);
    }

    // 2. OCR fallback
    return await performOCR(buffer);
}

async function extractTextFromBuffer(buffer: Uint8Array): Promise<string> {
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const doc = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: unknown) => {
                const textItem = item as { str?: string };
                return textItem.str || "";
            })
            .join(" ");
        fullText += pageText + "\n\n";
    }

    return fullText;
}

async function performOCR(buffer: InputBuffer): Promise<string> {
    console.log("OCR fallback: rendering pages...");

    // Load the document using pdfjs-dist
    // We need to convert buffer to Uint8Array if it's a Node Buffer
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const doc = await loadingTask.promise;

    console.log(`OCR fallback: found ${doc.numPages} pages`);

    // Create tesseract worker
    const worker = await createWorker("eng");
    let fullText = "";

    try {
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);

            // Render page to canvas
            const viewport = page.getViewport({ scale: 2.0 });

            // Use node-canvas
            const { createCanvas } = await import("canvas");
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d");

            await page.render({
                canvasContext: context,
                viewport: viewport,
            }).promise;

            // Convert canvas to buffer for Tesseract
            const imageBuffer = canvas.toBuffer("image/png");

            const { data } = await worker.recognize(imageBuffer);
            fullText += data.text + "\n\n";
        }
    } catch (err) {
        console.error("OCR failed:", err);
        if (err instanceof Error) {
            console.error("OCR Error Stack:", err.stack);
        }
        throw err;
    } finally {
        await worker.terminate();
    }

    return fullText.trim();
}
