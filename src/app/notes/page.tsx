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

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchNotes()
    }, [page])

    const fetchNotes = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/notes?page=${page}&limit=9`)
            if (res.ok) {
                const data = await res.json()
                setNotes(data.notes)
                setTotalPages(data.pagination.pages)
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
        <div className="min-h-screen bg-white dark:bg-transparent flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col px-6 md:px-24 py-12 gap-12">
                <div className="flex flex-col gap-6 text-center items-center">
                    <h1 className="font-inter text-5xl font-bold text-neutral-800 dark:text-neutral-100">
                        Explore All Notes!
                    </h1>
                    <p className="font-poppins text-neutral-500 dark:text-neutral-400 max-w-2xl">
                        Access high-quality, AI-generated notes for your courses. Search by subject, branch, or title.
                    </p>

                    <div className="relative w-full max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-md shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] active:shadow-[4px_4px_0px_0px_#737373] transition-shadow duration-100 ease-in border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white outline-none font-poppins transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin w-10 h-10 text-neutral-400" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredNotes.map(note => (
                                <NoteCard key={note.id} note={note} />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-center gap-4 items-center">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-poppins text-sm"
                            >
                                Previous
                            </button>
                            <span className="text-neutral-600 dark:text-neutral-400 font-poppins text-sm">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-poppins text-sm"
                            >
                                Next
                            </button>
                        </div>
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
