import { auth } from "@/lib/auth";
import { PrismaClient, Prisma } from "@/generated/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseFile } from "@/lib/parsing";
import { generateNotes } from "@/lib/gemini";

const prisma = new PrismaClient();

interface Topic {
    title: string;
    description: string;
    content: string;
}

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
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
        const file = formData.get("file") as File | null;
        const syllabus = formData.get("syllabus") as string | null;
        const module = formData.get("module") as string;
        const semester = formData.get("semester") as string;
        const year = formData.get("year") as string;
        const branch = formData.get("branch") as string;
        const specialization = formData.get("specialization") as string | null;
        const subject = formData.get("subject") as string;
        const subjectCode = formData.get("subjectCode") as string | null;

        const topics = formData.get("topics") as string;
        const quiz = formData.get("quiz") as string;

        if (!syllabus || !module || !semester || !year || !branch || !subject || !topics) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let parsedTopics: Topic[];
        let parsedQuiz: QuizQuestion[];
        try {
            parsedTopics = JSON.parse(topics);
            parsedQuiz = quiz ? JSON.parse(quiz) : [];
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON for topics or quiz" }, { status: 400 });
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
                    create: parsedTopics.map((topic: Topic) => ({
                        title: topic.title,
                        description: topic.description,
                        content: topic.content,
                    })),
                },
                quiz: parsedQuiz.length > 0 ? {
                    create: {
                        questions: {
                            create: parsedQuiz.map((q: QuizQuestion) => ({
                                question: q.question,
                                options: q.options,
                                answer: q.answer,
                            })),
                        },
                    },
                } : undefined,
            },
            include: {
                topics: true,
                quiz: {
                    include: {
                        questions: true
                    }
                }
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
        const search = searchParams.get("search");

        const where: Prisma.NoteWhereInput = {};
        if (semester) where.semester = semester;
        if (year) where.year = year;
        if (branch) where.branch = branch;
        if (subject) where.subject = { contains: subject, mode: "insensitive" };

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: "insensitive" } },
                { branch: { contains: search, mode: "insensitive" } },
                { module: { contains: search, mode: "insensitive" } },
                { subjectCode: { contains: search, mode: "insensitive" } },
                { topics: { some: { title: { contains: search, mode: "insensitive" } } } },
                { topics: { some: { description: { contains: search, mode: "insensitive" } } } },
            ];
        }

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const [notes, total] = await Promise.all([
            prisma.note.findMany({
                where,
                skip,
                take: limit,
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
            }),
            prisma.note.count({ where }),
        ]);

        return NextResponse.json({
            notes,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
