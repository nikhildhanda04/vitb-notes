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

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const syllabus = formData.get("syllabus") as string | null;
        const title = formData.get("title") as string;
        const semester = formData.get("semester") as string;
        const year = formData.get("year") as string;
        const branch = formData.get("branch") as string;
        const subject = formData.get("subject") as string;

        if (!syllabus || !title || !semester || !year || !branch || !subject) {
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

        // Generate notes using Gemini
        let generatedTopics;
        try {
            generatedTopics = await generateNotes(syllabus, sourceText);
        } catch (error) {
            console.error("AI Generation error:", error);
            return NextResponse.json({ error: "Failed to generate notes with AI" }, { status: 500 });
        }

        // Save to database
        const note = await prisma.note.create({
            data: {
                title,
                semester,
                year,
                branch,
                subject,
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
                title: true,
                semester: true,
                year: true,
                branch: true,
                subject: true,
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
