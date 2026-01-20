"use client"

import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { MermaidDiagram } from "@/components/ui/mermaid-diagram"
import { CodeBlock } from "@/components/ui/code-block"
import { cn } from "@/lib/utils"

interface NoteContentProps {
    content: string
    font: "inter" | "poppins" | "serif"
    fontSize: number
}

export const NoteContent = React.memo(function NoteContent({ content, font, fontSize }: NoteContentProps) {
    const fontClass = {
        inter: "font-inter",
        poppins: "font-poppins",
        serif: "font-serif",
    }[font]

    const components = useMemo(() => ({
        code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
            const match = /language-(\w+)/.exec(className || "")
            const isMermaid = match && match[1] === "mermaid"

            if (isMermaid) {
                return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
            }

            if (match) {
                return (
                    <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, "")}
                        className={className}
                        {...props}
                    />
                )
            }

            // Inline code
            return (
                <code className={cn("bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-mono text-sm", className)} {...props}>
                    {children}
                </code>
            )
        },
        // Custom styling for other elements if needed
        h1: ({ className, ...props }: React.ComponentPropsWithoutRef<'h1'>) => <h1 className={cn("text-2xl font-bold mt-6 mb-4", className)} {...props} />,
        h2: ({ className, ...props }: React.ComponentPropsWithoutRef<'h2'>) => <h2 className={cn("text-xl font-bold mt-5 mb-3", className)} {...props} />,
        h3: ({ className, ...props }: React.ComponentPropsWithoutRef<'h3'>) => <h3 className={cn("text-lg font-bold mt-4 mb-2", className)} {...props} />,
        p: ({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) => <p className={cn("mb-4 leading-relaxed", className)} {...props} />,
        ul: ({ className, ...props }: React.ComponentPropsWithoutRef<'ul'>) => <ul className={cn("list-disc pl-6 mb-4 space-y-1", className)} {...props} />,
        ol: ({ className, ...props }: React.ComponentPropsWithoutRef<'ol'>) => <ol className={cn("list-decimal pl-6 mb-4 space-y-1", className)} {...props} />,
        blockquote: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
            <blockquote className={cn("border-l-4 border-neutral-200 pl-4 italic text-neutral-600 my-4", className)} {...props}>
                {children}
            </blockquote>
        ),
    }), [])

    return (
        <div
            className={cn("prose prose-neutral max-w-none", fontClass)}
            style={{ fontSize: `${fontSize}px` }}
        >
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div >
    )
})
