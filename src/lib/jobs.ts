import { after, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@/generated/prisma";

const prisma = new PrismaClient();

const JOB_TTL_MS = 24 * 60 * 60 * 1000;

// Long AI work runs after the response is sent (Vercel keeps the function alive up to maxDuration).
// The browser polls /api/generate/job for the result, so a flaky connection only loses a poll, not the work.
export async function startJob(userId: string, work: () => Promise<unknown>, errorLabel: string) {
    await prisma.generationJob.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - JOB_TTL_MS) } } });
    const job = await prisma.generationJob.create({ data: { userId, status: "running" } });

    after(async () => {
        try {
            const result = await work();
            await prisma.generationJob.update({
                where: { id: job.id },
                data: { status: "done", result: result as Prisma.InputJsonValue },
            });
        } catch (error) {
            console.error(`${errorLabel}:`, error);
            await prisma.generationJob.update({
                where: { id: job.id },
                data: { status: "failed", error: `${errorLabel}: ${error instanceof Error ? error.message : String(error)}` },
            });
        }
    });

    return NextResponse.json({ jobId: job.id });
}

export function getJob(id: string, userId: string) {
    return prisma.generationJob.findFirst({ where: { id, userId } });
}
