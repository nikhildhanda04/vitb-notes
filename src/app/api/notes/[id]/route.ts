import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const note = await prisma.note.findUnique({
            where: { id },
            include: {
                topics: true,
                user: {
                    select: {
                        name: true,
                    },
                },
                quiz: {
                    include: {
                        questions: true,
                    },
                },
            },
        });

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error fetching note:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
