import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

// Polled by the generate form: { status: "running" | "done" | "failed", result?, error? }
export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = new URL(req.url).searchParams.get("id");
        const job = id ? await getJob(id, session.user.id) : null;

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({ status: job.status, result: job.result, error: job.error });
    } catch (error) {
        console.error("Error fetching job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
