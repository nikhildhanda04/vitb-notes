'use client'

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Navbar from "../components/common/navbar"
import { Loader2, Upload, FileText, BookOpen, GraduationCap, Calendar, GitBranch, Type } from "lucide-react"
import { useRouter } from "next/navigation"

export default function GeneratePage() {
    const { data: session, isPending } = authClient.useSession()
    const [isLogin, setIsLogin] = useState(true)

    if (isPending) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
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
            <div className="flex-1 flex flex-col items-center justify-center p-8">
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

function AuthForm({ isLogin, toggleAuth }: { isLogin: boolean, toggleAuth: () => void }) {
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

function GenerateForm({ user }: { user: any }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    // Form states
    const [title, setTitle] = useState("")
    const [semester, setSemester] = useState("")
    const [year, setYear] = useState("")
    const [branch, setBranch] = useState("")
    const [subject, setSubject] = useState("")
    const [syllabus, setSyllabus] = useState("")
    const [file, setFile] = useState<File | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        const formData = new FormData()
        formData.append("title", title)
        formData.append("semester", semester)
        formData.append("year", year)
        formData.append("branch", branch)
        formData.append("subject", subject)
        formData.append("syllabus", syllabus)
        if (file) {
            formData.append("file", file)
        }

        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to generate notes")
            }

            const data = await res.json()
            setMessage("Notes generated successfully!")
            // Reset form or redirect
            setTitle("")
            setSyllabus("")
            setFile(null)
        } catch (err: any) {
            setMessage(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-4xl flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-inter text-4xl font-bold text-neutral-800">
                    Generate New Notes
                </h1>
                <p className="font-poppins text-neutral-500">
                    Fill in the details below to generate AI-powered notes for your course.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Metadata */}
                <div className="flex flex-col gap-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                    <h2 className="font-inter text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> Course Details
                    </h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <Type className="w-4 h-4" /> Title
                            </label>
                            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="p-2 rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. Unit 1: Introduction" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Semester
                                </label>
                                <input required type="text" value={semester} onChange={e => setSemester(e.target.value)} className="p-2 rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. 4" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Year
                                </label>
                                <input required type="text" value={year} onChange={e => setYear(e.target.value)} className="p-2 rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. 2025" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <GitBranch className="w-4 h-4" /> Branch
                            </label>
                            <input required type="text" value={branch} onChange={e => setBranch(e.target.value)} className="p-2 rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. CSE" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Subject
                            </label>
                            <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="p-2 rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. Operating Systems" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="flex flex-col gap-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                    <h2 className="font-inter text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Content Source
                    </h2>

                    <div className="flex flex-col gap-4 h-full">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-sm font-semibold text-neutral-700">Syllabus (Required)</label>
                            <textarea
                                required
                                value={syllabus}
                                onChange={e => setSyllabus(e.target.value)}
                                className="flex-1 p-3 rounded border border-neutral-300 focus:border-black outline-none resize-none min-h-[150px]"
                                placeholder="Paste the syllabus topics here..."
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Reference File (Optional)
                            </label>
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="p-2 rounded border border-neutral-300 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
                            />
                            <p className="text-xs text-neutral-400">Supports PDF, PPTX</p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {message && (
                        <div className={`p-4 rounded-lg text-center font-poppins ${message.includes("success") ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-4 bg-black text-white font-inter font-bold text-lg rounded-lg hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" /> Generating Notes...
                            </>
                        ) : (
                            "Generate Notes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
