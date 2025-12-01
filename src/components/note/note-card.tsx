import { ArrowRight, BookOpen, Calendar, GraduationCap } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Note {
    id: string
    module: string
    semester: string
    year: string
    branch: string
    subject: string
    createdAt: string
    topics: {
        id: string
        title: string
        description: string
    }[]
    user: {
        name: string
    }
}

interface NoteCardProps {
    note: Note
}

export function NoteCard({ note }: NoteCardProps) {
    return (
        <div className="group flex flex-col p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 h-full relative overflow-hidden">
            {/* Content */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-2xl text-zinc-900 leading-tight line-clamp-2">
                        {note.subject}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">
                        {note.module}
                    </p>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                <Badge variant="secondary" icon={<GraduationCap className="w-3 h-3" />}>
                    VIT Bhopal
                </Badge>
                <Badge variant="secondary" icon={<BookOpen className="w-3 h-3" />}>
                    {note.branch}
                </Badge>
                <Badge variant="secondary" icon={<Calendar className="w-3 h-3" />}>
                    Year {note.year}
                </Badge>
                <Badge variant="secondary">
                    Sem {note.semester}
                </Badge>
                <Badge variant="secondary">
                    Notes
                </Badge>
            </div>

            {/* Action */}
            <Link href={`/notes/${note.id}`} className="w-full">
                <Button
                    className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 shadow-none justify-between group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300"
                >
                    View Notes
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </Link>
        </div>
    )
}
