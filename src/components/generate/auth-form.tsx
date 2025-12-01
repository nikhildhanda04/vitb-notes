'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

interface AuthFormProps {
    isLogin: boolean
    toggleAuth: () => void
}

export function AuthForm({ isLogin, toggleAuth }: AuthFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (isLogin) {
                await authClient.signIn.email({
                    email,
                    password,
                }, {
                    onSuccess: () => {
                        router.refresh()
                    },
                    onError: (ctx) => {
                        setError(ctx.error.message)
                    }
                })
            } else {
                await authClient.signUp.email({
                    email,
                    password,
                    name,
                }, {
                    onSuccess: () => {
                        router.refresh()
                    },
                    onError: (ctx) => {
                        setError(ctx.error.message)
                    }
                })
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md flex flex-col gap-6 p-8 bg-neutral-100 rounded-lg border-r-6 border-b-6 border-neutral-600">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="font-inter text-3xl font-bold text-neutral-800">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="font-poppins text-neutral-500 text-sm">
                    {isLogin ? "Enter your credentials to access your notes" : "Sign up to start generating AI notes"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                    <div className="flex flex-col gap-1">
                        <label className="font-inter text-sm font-semibold text-neutral-700">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-3 rounded-md border-2 border-neutral-300 focus:border-neutral-800 outline-none font-poppins transition-colors"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    <label className="font-inter text-sm font-semibold text-neutral-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-md border-2 border-neutral-300 focus:border-neutral-800 outline-none font-poppins transition-colors"
                        placeholder="john@example.com"
                        required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-inter text-sm font-semibold text-neutral-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-md border-2 border-neutral-300 focus:border-neutral-800 outline-none font-poppins transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm font-poppins text-center bg-red-100 p-2 rounded border border-red-200">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 p-3 bg-black text-white font-inter font-bold rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isLogin ? "Sign In" : "Sign Up")}
                </button>
            </form>

            <div className="text-center font-poppins text-sm text-neutral-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={toggleAuth} className="text-black font-semibold hover:underline">
                    {isLogin ? "Sign Up" : "Sign In"}
                </button>
            </div>
        </div>
    )
}
