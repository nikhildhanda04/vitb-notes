'use client'

import { useEffect, useState, use } from "react"
import Navbar from "@/components/common/navbar"
import { Loader2, ArrowLeft, Calendar, GraduationCap, BookOpen } from "lucide-react"
import Link from "next/link"
import { NoteContent } from "@/components/note/note-content"
import { FloatingTOC } from "@/components/note/floating-toc"
import { FloatingSettings } from "@/components/note/floating-settings"
import { Badge } from "@/components/ui/badge"



interface Note {
    id: string
    module: string
    semester: string
    year: string
    branch: string
    subject: string
    createdAt: string
    user: {
        name: string
    }
    topics: {
        id: string
        title: string
        description: string
        content: string
    }[]
}

export default function NoteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)
    const [font, setFont] = useState<"inter" | "poppins" | "serif">("inter")
    const [fontSize, setFontSize] = useState(16)
    const [currentHeading, setCurrentHeading] = useState("")

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await fetch(`/api/notes/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setNote(data)
                }
            } catch (error) {
                console.error("Failed to fetch note", error)
            } finally {
                setLoading(false)
            }
        }
        fetchNote()
    }, [id])

    useEffect(() => {
        const handleScroll = () => {
            // Find current heading
            const headings = Array.from(document.querySelectorAll("h2"))
            let current = ""
            for (const heading of headings) {
                if (heading.getBoundingClientRect().top < 100) {
                    current = heading.innerText
                }
            }
            if (current) setCurrentHeading(current)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin w-10 h-10 text-neutral-400" />
                </div>
            </div>
        )
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold font-inter">Note not found</h1>
                    <Link href="/notes" className="text-neutral-500 hover:text-black underline font-poppins">
                        Back to all notes
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-transparent flex flex-col relative">
            <Navbar />

            {/* Floating Controls */}
            <FloatingTOC topics={note.topics} currentHeading={currentHeading} />
            <FloatingSettings
                font={font}
                setFont={setFont}
                fontSize={fontSize}
                setFontSize={setFontSize}
            />

            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">
                <div className="flex flex-col gap-8">
                    <Link href="/notes" className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors font-poppins text-sm w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Notes
                    </Link>

                    {/* Header Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-md shadow-[6px_6px_0px_0px_#737373]  hover:shadow-[9px_9px_0px_0px_#737373] transition-shadow duration-100 ease-in border border-zinc-200 dark:border-zinc-700 p-8 flex flex-col gap-6">
                        <div className="flex flex-col  gap-4">
                            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {note.subject}
                            </h1>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {note.module}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md" icon={<GraduationCap className="w-3.5 h-3.5" />}>
                                {note.branch}
                            </Badge>
                            <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md" icon={<BookOpen className="w-3.5 h-3.5" />}>
                                Semester {note.semester}
                            </Badge>
                            <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md" icon={<Calendar className="w-3.5 h-3.5" />}>
                                Year {note.year}
                            </Badge>
                            <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md">
                                Notes
                            </Badge>
                            <Badge variant="secondary" className="shadow-[3px_3px_0px_0px_#737373] hover:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md">
                                {note.topics.length} Topics
                            </Badge>
                        </div>
                    </div>

                    {/* Topics */}
                    <div className="flex flex-col gap-12">
                        {note.topics.map((topic, index) => (
                            <div key={topic.id} id={topic.id} className="flex flex-col gap-4 scroll-mt-32">
                                <div className="flex items-baseline gap-4">
                                    <span className="font-inter font-bold text-2xl text-zinc-300 dark:text-zinc-600">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    <h2 className="font-inter font-bold text-2xl text-zinc-900 dark:text-zinc-100">
                                        {topic.title}
                                    </h2>
                                </div>

                                <p className="font-poppins text-zinc-500 dark:text-zinc-400 italic border-l-4 border-zinc-200 dark:border-zinc-700 pl-4">
                                    {topic.description}
                                </p>

                                <NoteContent
                                    content={topic.content}
                                    font={font}
                                    fontSize={fontSize}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
