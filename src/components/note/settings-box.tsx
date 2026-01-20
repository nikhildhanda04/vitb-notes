"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Type, MoveVertical, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"

interface SettingsBoxProps {
    font: "inter" | "poppins" | "serif"
    setFont: (font: "inter" | "poppins" | "serif") => void
    fontSize: number
    setFontSize: (size: number) => void
    currentHeading: string
    progress: number
    topics: { id: string; title: string }[]
}

export function SettingsBox({
    font,
    setFont,
    fontSize,
    setFontSize,
    currentHeading,
    progress,
    topics,
}: SettingsBoxProps) {
    const scrollToTopic = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }

    return (
        <Card className="w-full lg:w-80 sticky top-24 h-fit shadow-lg border-neutral-200 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-neutral-100">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> On this page
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-6">
                {/* Navigation */}
                <div className="flex flex-col gap-1">
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => scrollToTopic(topic.id)}
                            className={cn(
                                "text-sm text-left px-3 py-2 rounded-md transition-colors line-clamp-1",
                                currentHeading === topic.title
                                    ? "bg-zinc-900 text-white font-medium shadow-sm"
                                    : "text-zinc-600 hover:bg-zinc-100"
                            )}
                        >
                            {topic.title}
                        </button>
                    ))}
                </div>

                <div className="h-px bg-neutral-100" />

                {/* Font Selection */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
                        <Type className="w-3 h-3" /> Font Family
                    </label>
                    <Select value={font} onValueChange={(value: "inter" | "poppins" | "serif") => setFont(value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Font" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inter">Inter (Sans-serif)</SelectItem>
                            <SelectItem value="poppins">Poppins (Modern)</SelectItem>
                            <SelectItem value="serif">Serif (Classic)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Font Size */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
                            <MoveVertical className="w-3 h-3" /> Font Size
                        </label>
                        <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                            {fontSize}px
                        </span>
                    </div>
                    <Slider
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        min={12}
                        max={24}
                        step={1}
                        className="w-full"
                    />
                </div>

                {/* Progress */}
                <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>Reading Progress</span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardContent>
        </Card>
    )
}
