"use client"

import * as React from "react"
import { Type, Minus, Plus, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface FloatingSettingsProps {
    font: "inter" | "poppins" | "serif"
    setFont: (font: "inter" | "poppins" | "serif") => void
    fontSize: number
    setFontSize: (size: number) => void
}

export function FloatingSettings({
    font,
    setFont,
    fontSize,
    setFontSize,
}: FloatingSettingsProps) {
    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2 bg-white p-1.5 rounded-2xl shadow-xl border border-zinc-200">
            {/* Font Family */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-600">
                        <Type className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="left" align="center" className="w-40 p-1.5 bg-white border-zinc-200 shadow-xl rounded-xl">
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setFont("inter")}
                            className={cn(
                                "text-sm text-left px-3 py-2 rounded-lg transition-colors font-inter",
                                font === "inter" ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            Inter
                        </button>
                        <button
                            onClick={() => setFont("poppins")}
                            className={cn(
                                "text-sm text-left px-3 py-2 rounded-lg transition-colors font-poppins",
                                font === "poppins" ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            Poppins
                        </button>
                        <button
                            onClick={() => setFont("serif")}
                            className={cn(
                                "text-sm text-left px-3 py-2 rounded-lg transition-colors font-serif",
                                font === "serif" ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            Serif
                        </button>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="h-px w-full bg-zinc-100" />

            {/* Font Size Increase */}
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-600"
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
            >
                <Plus className="h-5 w-5" />
            </Button>

            <div className="text-xs font-mono text-center text-zinc-400 py-1 select-none">
                {fontSize}
            </div>

            {/* Font Size Decrease */}
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-600"
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
            >
                <Minus className="h-5 w-5" />
            </Button>

            <div className="h-px w-full bg-zinc-100" />

            {/* Fullscreen (Mock) */}
            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-zinc-100 text-zinc-600"
                onClick={() => {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch((e) => console.log(e));
                    } else {
                        document.exitFullscreen();
                    }
                }}
            >
                <Maximize2 className="h-5 w-5" />
            </Button>
        </div>
    )
}
