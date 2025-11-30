'use client'

import { useEffect, useState, use } from "react"
import Navbar from "../../components/common/navbar"
import { Loader2, ArrowLeft, Calendar, GraduationCap, GitBranch, BookOpen } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Topic {
    id: string
    title: string
    description: string
    content: string
}

interface Note {
    id: string
    title: string
    semester: string
    year: string
    branch: string
    subject: string
    createdAt: string
    user: {
        name: string
    }
    topics: Topic[]
}

export default function NoteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNote()
    }, [id])

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
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col px-8 md:px-24 py-12 gap-8 max-w-5xl mx-auto w-full">
                <Link href="/notes" className="flex items-center gap-2 text-neutral-500 hover:text-black transition-colors font-poppins text-sm w-fit">
                    <ArrowLeft className="w-4 h-4" /> Back to Notes
                </Link>

                {/* Header */}
                <div className="flex flex-col gap-6 border-b border-neutral-200 pb-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-sm font-bold text-neutral-500 font-inter uppercase tracking-wider">
                            <span className="bg-neutral-100 px-2 py-1 rounded">{note.branch}</span>
                            <span>•</span>
                            <span>{note.subject}</span>
                        </div>
                        <h1 className="font-inter text-4xl md:text-5xl font-bold text-neutral-900">
                            {note.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-neutral-500 font-poppins">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>Semester {note.semester}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Year {note.year}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{note.topics.length} Topics</span>
                        </div>
                    </div>
                </div>

                {/* Topics */}
                <div className="flex flex-col gap-12">
                    {note.topics.map((topic, index) => (
                        <div key={topic.id} className="flex flex-col gap-4">
                            <div className="flex items-baseline gap-4">
                                <span className="font-inter font-bold text-2xl text-neutral-300">
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <h2 className="font-inter font-bold text-2xl text-neutral-800">
                                    {topic.title}
                                </h2>
                            </div>

                            <p className="font-poppins text-neutral-500 italic border-l-4 border-neutral-200 pl-4">
                                {topic.description}
                            </p>

                            <div className="prose prose-neutral max-w-none font-poppins bg-neutral-50 p-6 rounded-lg border border-neutral-100 whitespace-pre-wrap">
                                {topic.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
