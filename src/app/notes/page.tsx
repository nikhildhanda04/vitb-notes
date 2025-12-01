'use client'

import { useEffect, useState } from "react"
import Navbar from "@/components/common/navbar"
import { Loader2, Search } from "lucide-react"
import { NoteCard } from "@/components/note/note-card"

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
        note.subject.toLowerCase().includes(search.toLowerCase()) ||
        note.branch.toLowerCase().includes(search.toLowerCase()) ||
        note.module.toLowerCase().includes(search.toLowerCase())
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
                            <NoteCard key={note.id} note={note} />
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
