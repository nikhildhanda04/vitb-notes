'use client'

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

export function AuthForm({ isLogin, toggleAuth }: { isLogin: boolean; toggleAuth: () => void }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError("")
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/"
            })
        } catch (err: any) {
            setError(err.message || "Failed to login with Google")
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md flex flex-col gap-6 p-8 bg-neutral-100 rounded-lg border-r-6 border-b-6 border-neutral-600">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="font-inter text-3xl font-bold text-neutral-800">
                    {isLogin ? "Welcome Back" : "Create an Account"}
                </h1>
                <p className="font-poppins text-neutral-500 text-sm">
                    {isLogin
                        ? "Sign in to access your notes and generate new ones"
                        : "Sign up to start generating smart notes"}
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {error && (
                    <div className="text-red-500 text-sm font-poppins text-center bg-red-100 p-2 rounded border border-red-200">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="p-3 bg-white text-black border border-neutral-300 font-inter font-bold rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                    )}
                    {isLogin ? "Continue with Google" : "Sign up with Google"}
                </button>

                <div className="text-center text-sm font-poppins text-neutral-500">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={toggleAuth}
                        className="text-neutral-900 font-semibold hover:underline"
                    >
                        {isLogin ? "Sign up" : "Sign in"}
                    </button>
                </div>
            </div>
        </div>
    )
}
