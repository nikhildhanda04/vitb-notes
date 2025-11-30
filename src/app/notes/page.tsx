'use client'

import { useEffect, useState } from "react"
import Navbar from "../components/common/navbar"
import { Loader2, Search, BookOpen, Calendar, GraduationCap, GitBranch } from "lucide-react"
import Link from "next/link"

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
}

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        try {
            const res = await fetch("/api/notes")
            if (res.ok) {
                const data = await res.json()
                setNotes(data)
            }
        } catch (error) {
            console.error("Failed to fetch notes", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.subject.toLowerCase().includes(search.toLowerCase()) ||
        note.branch.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col px-24 py-12 gap-12">
                <div className="flex flex-col gap-6 text-center items-center">
                    <h1 className="font-inter text-5xl font-bold text-neutral-800">
                        Explore Notes
                    </h1>
                    <p className="font-poppins text-neutral-500 max-w-2xl">
                        Access high-quality, AI-generated notes for your courses. Search by subject, branch, or title.
                    </p>

                    <div className="relative w-full max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-neutral-200 focus:border-black outline-none font-poppins transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin w-10 h-10 text-neutral-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredNotes.map(note => (
                            <Link href={`/notes/${note.id}`} key={note.id}>
                                <div className="group flex flex-col gap-4 p-6 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-black transition-all duration-200 hover:shadow-lg cursor-pointer h-full">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-white rounded-lg border border-neutral-100 group-hover:border-neutral-300 transition-colors">
                                            <BookOpen className="w-6 h-6 text-neutral-700" />
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 bg-neutral-200 rounded text-neutral-600">
                                            {note.branch}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-inter font-bold text-xl text-neutral-800 line-clamp-2 group-hover:text-black">
                                            {note.title}
                                        </h3>
                                        <p className="font-poppins text-sm text-neutral-500">
                                            {note.subject}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-neutral-400 font-poppins border-t border-neutral-200">
                                        <div className="flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3" /> Sem {note.semester}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {note.year}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filteredNotes.length === 0 && (
                    <div className="text-center py-20 text-neutral-400 font-poppins">
                        No notes found matching your search.
                    </div>
                )}
            </div>
        </div>
    )
}
