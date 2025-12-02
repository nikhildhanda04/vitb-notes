import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseFile } from "@/lib/parsing";
import { generateNotes } from "@/lib/gemini";

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
        const file = formData.get("file") as File | null;
        const syllabus = formData.get("syllabus") as string | null;

        if (!syllabus) {
            return NextResponse.json({ error: "Syllabus is required" }, { status: 400 });
        }

        let sourceText = "";

        if (file) {
            try {
                sourceText = await parseFile(file);
            } catch (error) {
                console.error("Parsing error:", error);
                return NextResponse.json({ error: "Failed to parse file" }, { status: 400 });
            }
        }

        let generatedContent;
        try {
            generatedContent = await generateNotes(syllabus, sourceText);
        } catch (error) {
            console.error("AI Generation error:", error);
            return NextResponse.json({
                error: "Failed to generate notes with AI",
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }

        return NextResponse.json(generatedContent);
    } catch (error) {
        console.error("Error generating preview:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
