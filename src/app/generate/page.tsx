'use client'

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Navbar from "@/components/common/navbar"
import { Loader2 } from "lucide-react"
import { AuthForm } from "@/components/generate/auth-form"
import { GenerateForm } from "@/components/generate/generate-form"

export default function GeneratePage() {
    const { data: session, isPending } = authClient.useSession()
    const [isLogin, setIsLogin] = useState(true)

    if (isPending) {
        return (
            <div className="min-h-screen  bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin w-10 h-10 text-neutral-400" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <div className="flex-1 mt-20 flex flex-col items-center justify-center p-8">
                {!session ? (
                    <AuthForm isLogin={isLogin} toggleAuth={() => setIsLogin(!isLogin)} />
                ) : (session.user as any).role !== "admin" ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 font-poppins">
                            Access Denied. Only admins can generate notes.
                        </div>
                        <p className="text-neutral-500 font-poppins text-sm">
                            Please contact an administrator if you believe this is an error.
                        </p>
                    </div>
                ) : (
                    <GenerateForm user={session.user} />
                )}
            </div>
        </div>
    )
}
