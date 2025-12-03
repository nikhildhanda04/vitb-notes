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
    subjectCode?: string
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
        <Link 
        href={`/notes/${note.id}`} className="group flex flex-col p-6 bg-white dark:bg-neutral-900 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] transition-all duration-300 h-full relative overflow-hidden">
            {/* Content */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-2xl text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-2">
                        {note.subjectCode ? `${note.subjectCode} : ` : ""}{note.subject}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {note.module}
                    </p>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md" icon={<GraduationCap className="w-3 h-3" />}>
                    VIT Bhopal
                </Badge>
                <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md" icon={<BookOpen className="w-3 h-3" />}>
                    {note.branch}
                </Badge>
                <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md" icon={<Calendar className="w-3 h-3" />}>
                    Year {note.year}
                </Badge>
                <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md">
                    Sem {note.semester}
                </Badge>
                <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md">
                    Notes
                </Badge>
            </div>

            {/* Action */}
            <div className="w-full">
                <Button
                    className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-[6px_6px_0px_0px_#737373]  duration-200 ease-in relative hover:shadow-[8px_8px_0px_0px_#737373] transition-all duration-100 ease-in text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 justify-between"
                >
                    View Notes
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </Link>
    )
}
