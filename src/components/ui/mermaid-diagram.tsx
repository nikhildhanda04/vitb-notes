"use client"

import React, { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
})

interface MermaidDiagramProps {
    chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>("")
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        if (chart && ref.current) {
            const renderDiagram = async () => {
                try {
                    const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart)
                    setSvg(svg)
                    setError(false)
                } catch (err) {
                    console.error("Failed to render mermaid diagram:", err)
                    setError(true)
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
            className="flex justify-center my-6 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}
