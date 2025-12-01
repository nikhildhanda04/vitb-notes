"use client"

import * as React from "react"
import { List, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface FloatingTOCProps {
    topics: { id: string; title: string }[]
    currentHeading: string
}

export function FloatingTOC({ topics, currentHeading }: FloatingTOCProps) {
    const [open, setOpen] = React.useState(false)

    const scrollToTopic = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
            setOpen(false)
        }
    }

    return (
        <div className="fixed top-40 right-8 z-50 hidden lg:block">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 gap-2 rounded-md px-4 h-10 max-w-[300px]"
                    >
                        <List className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                            {currentHeading || "Table of Contents"}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-2 bg-white dark:bg-neutral-900 border-zinc-200 dark:border-zinc-700 shadow-xl rounded-xl max-h-[60vh] overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        <div className="px-3 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            On this page
                        </div>
                        {topics.map((topic) => (
                            <button
                                key={topic.id}
                                onClick={() => scrollToTopic(topic.id)}
                                className={cn(
                                    "text-sm text-left px-3 py-2.5 rounded-lg transition-colors flex items-start justify-between gap-2 group",
                                    currentHeading === topic.title
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <span className="line-clamp-2">{topic.title}</span>
                                {currentHeading === topic.title && (
                                    <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0 mt-0.5" />
                                )}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
