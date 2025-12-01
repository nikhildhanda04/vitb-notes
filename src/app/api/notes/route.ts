import { auth } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseFile } from "@/lib/parsing";
import { generateNotes } from "@/lib/gemini";

const prisma = new PrismaClient();

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
        const module = formData.get("module") as string;
        const semester = formData.get("semester") as string;
        const year = formData.get("year") as string;
        const branch = formData.get("branch") as string;
        const specialization = formData.get("specialization") as string | null;
        const subject = formData.get("subject") as string;
        const subjectCode = formData.get("subjectCode") as string | null;

        if (!syllabus || !module || !semester || !year || !branch || !subject) {
            return NextResponse.json({ error: "Missing required fields (syllabus is required)" }, { status: 400 });
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

        let generatedTopics;
        try {
            generatedTopics = await generateNotes(syllabus, sourceText);
        } catch (error) {
            console.error("AI Generation error:", error);
            return NextResponse.json({
                error: "Failed to generate notes with AI",
                details: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }

        const note = await prisma.note.create({
            data: {
                module,
                semester,
                year,
                branch,
                specialization,
                subject,
                subjectCode,
                userId: session.user.id,
                topics: {
                    create: generatedTopics.map((topic: any) => ({
                        title: topic.title,
                        description: topic.description,
                        content: topic.content,
                    })),
                },
            },
            include: {
                topics: true,
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const semester = searchParams.get("semester");
        const year = searchParams.get("year");
        const branch = searchParams.get("branch");
        const subject = searchParams.get("subject");

        const where: any = {};
        if (semester) where.semester = semester;
        if (year) where.year = year;
        if (branch) where.branch = branch;
        if (subject) where.subject = { contains: subject, mode: "insensitive" };

        const notes = await prisma.note.findMany({
            where,
            select: {
                id: true,
                module: true,
                semester: true,
                year: true,
                branch: true,
                specialization: true,
                subject: true,
                subjectCode: true,
                createdAt: true,
                topics: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
