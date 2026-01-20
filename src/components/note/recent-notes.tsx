"use client"

import { useEffect, useState } from "react"
import { NoteCard } from "@/components/note/note-card"
import { Clock } from "lucide-react"

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

export function RecentNotes() {
    const [recentNotes, setRecentNotes] = useState<Note[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Delay setting mounted to avoid synchronous state update warning
        const timer = setTimeout(() => setMounted(true), 0)
        return () => clearTimeout(timer)
    }, [])
    
    useEffect(() => {
        const loadRecentNotes = () => {
            try {
                const stored = localStorage.getItem("recent-notes")
                if (stored) {
                    const parsed = JSON.parse(stored) as Note[]
                    // Ensure unique notes by ID
                    const unique = parsed.filter((note, index, self) =>
                        index === self.findIndex((n) => n.id === note.id)
                    )
                    setRecentNotes(unique)
                }
            } catch (e) {
                console.error("Failed to load recent notes", e)
            }
        }

        loadRecentNotes()
        
        // Listen for storage events (in case updated in another tab/window)
        window.addEventListener("storage", loadRecentNotes)
        return () => window.removeEventListener("storage", loadRecentNotes)
    }, [])

    if (!mounted || recentNotes.length === 0) return null

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Clock className="w-5 h-5" />
                <h2 className="text-xl font-bold font-inter">Continue Reading</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                ))}
            </div>
        </div>
    )
}
