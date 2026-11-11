"use client"

import React, { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { fixMermaid } from "@/lib/mermaid-fix"

mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    suppressErrorRendering: true, // don't append mermaid's own error graphic to the page
    flowchart: { useMaxWidth: false }, // keep natural size; wide charts scroll instead of shrinking to unreadable text
})

interface MermaidDiagramProps {
    chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        if (chart && ref.current) {
            const renderDiagram = async () => {
                setLoading(true)
                const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`
                try {
                    const { svg } = await mermaid.render(id, fixMermaid(chart))
                    setSvg(svg)
                    setError(false)
                } catch (err) {
                    console.error("Failed to render mermaid diagram:", err)
                    document.getElementById(`d${id}`)?.remove() // render scratch element left behind on failure
                    setError(true)
                } finally {
                    setLoading(false)
                }
            }
            renderDiagram()
        }
    }, [chart])

    if (error) {
        return (
            <div className="p-4 border border-red-200 bg-red-50 rounded text-red-500 text-sm font-mono">
                Failed to render diagram
                <pre className="mt-2 text-xs">{chart}</pre>
            </div>
        )
    }

    return (
        <div
            ref={ref}
            className={`my-6 overflow-x-auto transition-all duration-300 ${loading ? 'flex justify-center min-h-[100px] items-center' : ''}`}
        >
            {loading ? (
                <div className="flex flex-col items-center gap-2 text-neutral-400 animate-pulse">
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading diagram...</span>
                </div>
            ) : (
                // White panel so the default theme's dark lines and text stay readable in dark mode
                <div className="w-fit mx-auto bg-white rounded-lg p-4" dangerouslySetInnerHTML={{ __html: svg }} />
            )}
        </div>
    )
}
