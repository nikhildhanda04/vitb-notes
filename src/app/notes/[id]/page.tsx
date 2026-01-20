'use client'

import { useEffect, useState, use } from "react"
import Navbar from "@/components/common/navbar"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NoteContent } from "@/components/note/note-content"
import { FloatingTOC } from "@/components/note/floating-toc"
import { FloatingSettings } from "@/components/note/floating-settings"
import { Badge } from "@/components/ui/badge"
import { AuthDialog } from "@/components/auth-dialog"



import { Quiz } from "@/components/note/quiz"

interface Note {
    id: string
    module: string
    semester: string
    year: string
    branch: string
    specialization: string | null
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
    quiz?: {
        questions: {
            id: string
            question: string
            options: string[]
            answer: string
        }[]
    }
}

export default function NoteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)
    const [isUnauthorized, setIsUnauthorized] = useState(false)
    const [font, setFont] = useState<"inter" | "poppins" | "serif">("inter")
    const [fontSize, setFontSize] = useState(16)
    const [currentHeading, setCurrentHeading] = useState("")

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await fetch(`/api/notes/${id}`)
                if (res.status === 401) {
                    setIsUnauthorized(true)
                    setLoading(false)
                    return
                }
                if (res.ok) {
                    const data = await res.json()
                    setNote(data)
                    saveToRecent(data)
                } else {
                    throw new Error("Failed to fetch")
                }
            } catch (error) {
                console.error("Failed to fetch note, trying cache", error)
                // Try to load from recent notes cache
                try {
                    const stored = localStorage.getItem("recent-notes")
                    if (stored) {
                        const parsed = JSON.parse(stored) as Note[]
                        const cachedNote = parsed.find(n => n.id === id)
                        if (cachedNote) {
                            setNote(cachedNote)
                        }
                    }
                } catch (cacheError) {
                    console.error("Failed to load from cache", cacheError)
                }
            } finally {
                setLoading(false)
            }
        }
        fetchNote()
    }, [id])

    const saveToRecent = (noteToSave: Note) => {
        try {
            const stored = localStorage.getItem("recent-notes")
            let recents: Note[] = stored ? JSON.parse(stored) : []
            
            // Remove if already exists to move to top
            recents = recents.filter(n => n.id !== noteToSave.id)
            
            // Add to beginning
            recents.unshift(noteToSave)
            
            // Keep last 5
            if (recents.length > 5) {
                recents = recents.slice(0, 5)
            }
            
            localStorage.setItem("recent-notes", JSON.stringify(recents))
        } catch (e) {
            console.error("Failed to save to recent notes", e)
        }
    }

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

    if (isUnauthorized) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <AuthDialog open={true} onOpenChange={(open) => {
                        if (!open) {
                            router.push("/notes")
                        }
                    }} />
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
                    <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-8 shadow-sm">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    {note.semester} Semester
                                </Badge>
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    Year {note.year}
                                </Badge>
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                    {note.branch}
                                </Badge>
                                {note.specialization && (
                                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                        {note.specialization}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-inter">
                                    {note.subject}
                                </h1>
                                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-poppins">
                                    {note.module}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-8">
                        {note.topics.map((topic, index) => (
                            <div key={topic.id} id={topic.id} className="scroll-mt-24">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-sm font-bold border border-zinc-200 dark:border-zinc-700">
                                        {index + 1}
                                    </span>
                                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 font-inter">
                                        {topic.title}
                                    </h2>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-8 shadow-sm">
                                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                                        <p className="text-zinc-600 dark:text-zinc-400 mb-6 font-poppins italic border-l-4 border-zinc-200 dark:border-zinc-700 pl-4">
                                            {topic.description}
                                        </p>
                                        <NoteContent
                                            content={topic.content}
                                            font={font}
                                            fontSize={fontSize}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quiz Section */}
                    {note.quiz && note.quiz.questions.length > 0 && (
                        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                            <Quiz questions={note.quiz.questions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
