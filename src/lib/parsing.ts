const pdfParse = require("pdf-parse");
import { getTextExtractor } from "office-text-extractor";

export async function parseFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type;

    if (fileType === "application/pdf") {
        const data = await pdfParse(buffer);
        return data.text;
    } else if (
        fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        fileType === "application/vnd.ms-powerpoint"
    ) {
        // office-text-extractor works with file paths usually, but we have a buffer.
        // We might need to write to a temp file or find a buffer-compatible library.
        // For now, let's try a simpler approach or write to temp.

        // Actually, office-text-extractor requires a file path.
        // Let's use a temp file approach.
        const fs = require("fs");
        const path = require("path");
        const os = require("os");

        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `temp-${Date.now()}.pptx`);

        fs.writeFileSync(tempFilePath, buffer);

        try {
            const extractor = getTextExtractor();
            const text = await extractor.extractText({ input: tempFilePath, type: "file" });
            fs.unlinkSync(tempFilePath); // Clean up
            return text;
        } catch (error) {
            fs.unlinkSync(tempFilePath); // Clean up
            throw error;
        }
    } else {
        throw new Error("Unsupported file type");
    }
}
