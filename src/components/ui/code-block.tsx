"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
    language: string
    value: string
    className?: string
}

export function CodeBlock({ language, value, className }: CodeBlockProps) {
    const [copied, setCopied] = React.useState(false)

    const copyToClipboard = async () => {
        if (!value) return
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={cn("relative group rounded-lg overflow-hidden my-4 bg-[#1d1f21]", className)}>
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800/50 hover:bg-zinc-700/50 hover:text-zinc-200 rounded-md transition-colors backdrop-blur-sm border border-zinc-700/50"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <div className="text-sm font-mono">
                <SyntaxHighlighter
                    language={language}
                    style={atomDark}
                    customStyle={{
                        margin: 0,
                        padding: "1.5rem",
                        background: "transparent",
                        fontSize: "0.875rem",
                        lineHeight: "1.5",
                    }}
                    wrapLines={true}
                    wrapLongLines={true}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    )
}
