import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface BadgeProps {
    children: ReactNode
    variant?: "default" | "secondary" | "outline"
    icon?: ReactNode
    className?: string
}

export function Badge({ children, variant = "default", icon, className }: BadgeProps) {
    const variants = {
        default: "bg-zinc-900 text-white hover:bg-zinc-800",
        secondary: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200",
        outline: "border border-zinc-200 text-zinc-800 hover:bg-zinc-50",
    }

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-default",
            variants[variant],
            className
        )}>
            {icon}
            {children}
        </span>
    )
}
