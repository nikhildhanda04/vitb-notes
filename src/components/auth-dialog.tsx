'use client'

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface AuthDialogProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AuthDialog({ children, open, onOpenChange }: AuthDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError("")
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/"
            })
        } catch (err: any) {
            setError(err.message || "Failed to login with Google")
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] font-poppins">
                <DialogHeader>
                    <DialogTitle className="font-inter text-2xl font-bold text-center">Welcome to VitB Notes</DialogTitle>
                    <DialogDescription className="text-center">
                        Sign in to access notes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        type="button"
                        disabled={isLoading}
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black border border-neutral-300 hover:bg-neutral-50"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                        )}
                        Continue with Google
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
