import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { generateTopic } from "@/lib/gemini";
import { startJob } from "@/lib/jobs";
import { TOPIC_CHAR_BUDGET, type Source } from "@/lib/sources";

export const maxDuration = 300;

const isSource = (s: unknown): s is Source =>
    typeof (s as Source)?.name === "string" && typeof (s as Source)?.text === "string";

// Step 2 of generation: write one topic's notes from the passages the browser picked for it.
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

        const { syllabus, topic, allTitles, excerpts } = await req.json();

        if (
            typeof syllabus !== "string" || !syllabus ||
            typeof topic?.title !== "string" || typeof topic?.description !== "string" ||
            !Array.isArray(allTitles) || !allTitles.every(t => typeof t === "string") ||
            !Array.isArray(excerpts) || !excerpts.every(isSource)
        ) {
            return NextResponse.json({ error: "Invalid topic request" }, { status: 400 });
        }

        // The browser already trims to the budget; re-check so one request can't blow past Gemini's limits
        if (excerpts.reduce((n: number, s: Source) => n + s.text.length, 0) > TOPIC_CHAR_BUDGET * 1.1) {
            return NextResponse.json({ error: "Source passages too large" }, { status: 400 });
        }

        return startJob(session.user.id, () => generateTopic(syllabus, topic, allTitles, excerpts), `Failed to write topic "${topic.title}" with AI`);
    } catch (error) {
        console.error("Error generating topic:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
