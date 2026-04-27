'use client'

import { useState } from "react"
import { Loader2, BookOpen, Type, GraduationCap, Calendar, GitBranch, FileText, Upload } from "lucide-react"

interface Topic {
    title: string
    description: string
    content: string
}

interface QuizQuestion {
    question: string
    options: string[]
    answer: string
}

interface PreviewData {
    topics: Topic[]
    quiz?: QuizQuestion[]
}

interface GenerateFormProps {
    user: unknown 
}

export function GenerateForm({ user }: GenerateFormProps) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    // Form states
    const [module, setModule] = useState("")
    const [semester, setSemester] = useState("")
    const [year, setYear] = useState("")
    const [branch, setBranch] = useState("")
    const [specialization, setSpecialization] = useState("")
    const [subject, setSubject] = useState("")
    const [subjectCode, setSubjectCode] = useState("")
    const [syllabus, setSyllabus] = useState("")
    const [file, setFile] = useState<File | null>(null)

    const [previewData, setPreviewData] = useState<PreviewData | null>(null)

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        const formData = new FormData()
        formData.append("syllabus", syllabus)
        if (file) {
            formData.append("file", file)
        }

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.details ? `${data.error}: ${data.details}` : data.error || "Failed to generate preview")
            }

            const data = await res.json()
            setPreviewData(data)
            setMessage("Preview generated! Review below and click Upload to save.")
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!previewData) return
        setLoading(true)
        setMessage("")

        const formData = new FormData()
        formData.append("module", module)
        formData.append("semester", semester)
        formData.append("year", year)
        formData.append("branch", branch)
        if (specialization) formData.append("specialization", specialization)
        formData.append("subject", subject)
        if (subjectCode) formData.append("subjectCode", subjectCode)
        formData.append("syllabus", syllabus) 

        formData.append("topics", JSON.stringify(previewData.topics))
        if (previewData.quiz) {
            formData.append("quiz", JSON.stringify(previewData.quiz))
        }

        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.details ? `${data.error}: ${data.details}` : data.error || "Failed to save notes")
            }

            const data = await res.json()
            setMessage("Notes uploaded successfully!")
            // Reset form
            setModule("")
            setSyllabus("")
            setFile(null)
            setPreviewData(null)
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (previewData) {
        return (
            <div className="w-full max-w-4xl flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="font-inter text-4xl font-bold dark:text-neutral-200 text-neutral-800">
                        Preview Notes
                    </h1>
                    <p className="font-poppins text-neutral-500 dark:text-neutral-400">
                        Review the generated content before uploading.
                    </p>
                </div>

                <div className="p-6 bg-white border border-neutral-200 rounded-lg shadow-sm max-h-[60vh] overflow-y-auto">
                    <h2 className="text-2xl  text-neutral-800 font-bold mb-4">Topics</h2>
                    {previewData.topics?.map((topic: Topic, i: number) => (
                        <div key={i} className="mb-6">
                            <h3 className="text-xl text-neutral-800 font-semibold mb-2">{topic.title}</h3>
                            <p className=" text-neutral-800 mb-2">{topic.description}</p>
                            <div className="text-sm text-neutral-800 line-clamp-3">{topic.content}</div>
                        </div>
                    ))}

                    {previewData.quiz && (
                        <>
                            <h2 className="text-2xl font-bold mb-4 mt-8">Quiz Preview</h2>
                            <div className="grid gap-4">
                                {previewData.quiz.map((q: QuizQuestion, i: number) => (
                                    <div key={i} className="p-4 bg-neutral-50 text-neutral-800 rounded-lg">
                                        <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                                        <ul className="list-disc list-inside text-sm text-neutral-600">
                                            {q.options.map((opt: string, j: number) => (
                                                <li key={j} className={opt === q.answer ? "text-green-600 font-medium" : ""}>
                                                    {opt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setPreviewData(null)}
                        className="flex-1 p-4 bg-white border border-neutral-300 text-neutral-700 font-inter font-bold text-lg rounded-lg hover:bg-neutral-50 transition-all"
                    >
                        Edit Details
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="flex-1 p-4 bg-black text-white font-inter font-bold text-lg rounded-lg hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" /> Uploading...
                            </>
                        ) : (
                            "Upload Notes"
                        )}
                    </button>
                </div>
                {message && (
                    <div className={`p-4 rounded-lg text-center font-poppins ${message.includes("success") ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                        {message}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-inter text-4xl font-bold dark:text-neutral-200 text-neutral-800">
                    Generate New Notes
                </h1>
                <p className="font-poppins text-neutral-500">
                    Fill in the details below to generate AI-powered notes for your course.
                </p>
            </div>

            <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Metadata */}
                <div className="flex flex-col gap-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                    <h2 className="font-inter text-xl text-black font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5" /> Course Details
                    </h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold  text-neutral-700 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Module
                            </label>
                            <input required type="text" value={module} onChange={e => setModule(e.target.value)} className="p-2 rounded border text-black border-neutral-300 focus:border-black outline-none" placeholder="e.g. Module 1" />
                        </div>

                        {/* Removed duplicate syllabus input from left column as it's in the right column */}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Semester
                                </label>
                                <select required value={semester} onChange={e => setSemester(e.target.value)} className="p-2 text-black rounded border border-neutral-300 focus:border-black outline-none bg-white">
                                    <option value="" disabled>Select Semester</option>
                                    <option value="Fall">Fall</option>
                                    <option value="Winter">Winter</option>
                                    <option value="Interim">Interim</option>
                                    <option value="Summer">Summer</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Year
                                </label>
                                <select required value={year} onChange={e => setYear(e.target.value)} className="p-2 rounded text-black border border-neutral-300 focus:border-black outline-none bg-white">
                                    <option value="" disabled>Select Year</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <GitBranch className="w-4 h-4" /> Branch
                            </label>
                            <input required type="text" value={branch} onChange={e => setBranch(e.target.value)} className="p-2 text-black rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. CSE" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <GitBranch className="w-4 h-4" /> Specialization (Optional)
                            </label>
                            <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className="p-2 text-black rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. AI & ML" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Subject Name
                                </label>
                                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="p-2 text-black rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. Operating Systems" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Subject Code
                                </label>
                                <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} className="p-2 text-black rounded border border-neutral-300 focus:border-black outline-none" placeholder="e.g. CSE1001" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="flex flex-col gap-6 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                    <h2 className="font-inter text-xl text-black font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Content Source
                    </h2>

                    <div className="flex flex-col gap-4 h-full">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-sm font-semibold text-neutral-700">Syllabus (Required)</label>
                            <textarea
                                required
                                value={syllabus}
                                onChange={e => setSyllabus(e.target.value)}
                                className="flex-1 p-3 rounded border text-black border-neutral-300 focus:border-black outline-none resize-none min-h-[150px]"
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
                                className="p-2 rounded border text-black border-neutral-300 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
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
                        className="w-full p-4 bg-black dark:bg-neutral-100 dark:text-black text-white font-inter font-bold text-lg rounded-lg hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" /> Generating Preview...
                            </>
                        ) : (
                            "Generate Preview"
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
