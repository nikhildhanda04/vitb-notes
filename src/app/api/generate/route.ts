import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseFile } from "@/lib/parsing";
import { generateOutline } from "@/lib/gemini";
import { keepAliveJson } from "@/lib/keep-alive";

export const maxDuration = 300;

function parseTexts(value: FormDataEntryValue | null): { name: string; text: string }[] {
    if (typeof value !== "string" || !value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every(t => typeof t?.name === "string" && typeof t?.text === "string")) {
        throw new Error("bad texts");
    }
    return parsed;
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        const formData = await req.formData();
        const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
        const pyqFiles = formData.getAll("pyq").filter((f): f is File => f instanceof File && f.size > 0);
        const syllabus = formData.get("syllabus") as string | null;

        if (!syllabus) {
            return NextResponse.json({ error: "Syllabus is required" }, { status: 400 });
        }

        // Text the browser already extracted (keeps the request under Vercel's 4.5MB body limit)
        let sources: { name: string; text: string }[];
        let pyqs: { name: string; text: string }[];
        try {
            sources = parseTexts(formData.get("texts"));
            pyqs = parseTexts(formData.get("pyqTexts"));
        } catch {
            return NextResponse.json({ error: "Invalid extracted text payload" }, { status: 400 });
        }

        // Parsing (server-side OCR) and the AI call can both take minutes, so run them under a keep-alive stream.
        // Step 1 of generation: topic outline + quiz + PYQ analysis. Topics are written one by one via /api/generate/topic.
        return keepAliveJson(async () => {
            for (const [list, target] of [[files, sources], [pyqFiles, pyqs]] as const) {
                for (const file of list) {
                    try {
                        target.push({ name: file.name, text: await parseFile(file) });
                    } catch (error) {
                        throw new Error(`Failed to parse file: ${file.name}`, { cause: error });
                    }
                }
            }
            // Files the server had to parse itself are sent back so the browser can pick passages from them for each topic.
            const serverParsed = files.length ? sources.slice(-files.length) : [];
            return { ...(await generateOutline(syllabus, sources, pyqs)), serverParsed };
        }, "Failed to generate notes with AI");
    } catch (error) {
        console.error("Error generating preview:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
