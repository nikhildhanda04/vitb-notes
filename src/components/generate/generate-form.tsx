'use client'

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import type { Worker as OcrWorker } from "tesseract.js"
import { fitToBudget, relevantExcerpts, OUTLINE_CHAR_BUDGET, PYQ_CHAR_BUDGET, TOPIC_CHAR_BUDGET, type Source } from "@/lib/sources"
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
    probableQuestions?: string
    truncated?: string[] // parts the AI was cut off on (hit its output limit)
}

type Extracted = { texts: { name: string; text: string }[]; raw: File[] }

// Vercel rejects request bodies over 4.5MB, so read PDFs in the browser (text layer, or OCR for
// scanned PDFs) and send only text. Files that still can't be read are uploaded for the server to try.
async function extractTexts(files: File[], onFileDone: () => void, onStatus: (label: string) => void): Promise<Extracted> {
    const result: Extracted = { texts: [], raw: [] }
    let ocr: OcrWorker | null = null
    try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf")
        pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        for (const file of files) {
            let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]> | null = null
            try {
                doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
                let text = ""
                for (let i = 1; i <= doc.numPages; i++) {
                    const content = await (await doc.getPage(i)).getTextContent()
                    text += content.items.map(item => (item as { str?: string }).str || "").join(" ") + "\n\n"
                }
                if (text.trim().length <= 50) {
                    // Scanned PDF: OCR each page here so the file never has to be uploaded
                    if (!ocr) {
                        const { createWorker } = await import("tesseract.js")
                        ocr = await createWorker("eng")
                    }
                    text = ""
                    const canvas = document.createElement("canvas")
                    for (let i = 1; i <= doc.numPages; i++) {
                        onStatus(`Scanning ${file.name} (page ${i}/${doc.numPages})...`)
                        const page = await doc.getPage(i)
                        const viewport = page.getViewport({ scale: 2 })
                        canvas.width = viewport.width
                        canvas.height = viewport.height
                        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise
                        text += (await ocr.recognize(canvas)).data.text + "\n\n"
                    }
                }
                if (text.trim().length > 50) {
                    result.texts.push({ name: file.name, text: text.trim() })
                    continue
                }
            } catch (err) {
                console.warn(`Could not read ${file.name} in browser, uploading it instead`, err)
            } finally {
                await doc?.destroy() // terminates this document's PDF worker
                onFileDone()
            }
            result.raw.push(file)
        }
    } finally {
        await ocr?.terminate()
    }
    return result
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const TOPIC_CONCURRENCY = 3
const TOPIC_ATTEMPTS = 4

// Retry with backoff (4s, 8s, 16s) so one dropped request doesn't throw away the whole generation
async function withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fn()
        } catch (err) {
            if (attempt >= attempts) throw err
            console.warn(`Attempt ${attempt} failed, retrying`, err)
            await new Promise(resolve => setTimeout(resolve, 2000 * 2 ** attempt))
        }
    }
}

// POST and return JSON, turning error responses (JSON or plain text from Vercel) into readable errors.
async function postJson(url: string, body: BodyInit, json = false) {
    let res: Response
    try {
        res = await fetch(url, {
            method: "POST",
            body,
            headers: json ? { "Content-Type": "application/json" } : undefined,
        })
    } catch {
        // fetch only throws when no response arrived at all (connection dropped, offline)
        throw new Error("Lost connection to the server. Check your internet and try again.")
    }
    if (!res.ok) {
        const text = await res.text()
        let data: { error?: string; details?: string } = {}
        try { data = JSON.parse(text) } catch { data = { error: text || `Request failed (${res.status})` } }
        throw new Error(data.details ? `${data.error}: ${data.details}` : data.error || "Request failed")
    }
    return res.json()
}

const POLL_MS = 3000
const JOB_DEADLINE_MS = 330_000 // server functions are capped at 300s

// Start a background job, then poll until it finishes. A dropped poll is simply retried,
// so a flaky connection doesn't lose minutes of AI work.
async function runJob<T>(url: string, body: BodyInit, json = false): Promise<T> {
    const { jobId } = await withRetry(() => postJson(url, body, json), 3)
    const deadline = Date.now() + JOB_DEADLINE_MS
    while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, POLL_MS))
        let res: Response
        let job: { status?: string; result?: T; error?: string }
        try {
            res = await fetch(`/api/generate/job?id=${jobId}`)
            job = await res.json()
        } catch {
            continue // poll lost to the network, try again
        }
        if (!res.ok) throw new Error(job.error || `Request failed (${res.status})`)
        if (job.status === "done") return job.result as T
        if (job.status === "failed") throw new Error(job.error || "Generation failed")
    }
    throw new Error("The server took longer than 5 minutes. Try fewer or smaller files.")
}

// Draft of the form + generated preview, kept in localStorage so a refresh doesn't lose work.
// Files can't be restored by browsers, so they have to be re-selected.
const DRAFT_KEY = "generate-draft"

function loadDraft(): Record<string, string> & { previewData?: PreviewData | null } {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}")
    } catch {
        return {}
    }
}

interface GenerateFormProps {
    user: unknown 
}

export function GenerateForm({ user }: GenerateFormProps) {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState<{ label: string; value: number } | null>(null)
    const [message, setMessage] = useState("")

    // Form states
    const [draft] = useState(loadDraft)
    const [module, setModule] = useState(draft.module ?? "")
    const [semester, setSemester] = useState(draft.semester ?? "")
    const [year, setYear] = useState(draft.year ?? "")
    const [branch, setBranch] = useState(draft.branch ?? "")
    const [specialization, setSpecialization] = useState(draft.specialization ?? "")
    const [subject, setSubject] = useState(draft.subject ?? "")
    const [subjectCode, setSubjectCode] = useState(draft.subjectCode ?? "")
    const [syllabus, setSyllabus] = useState(draft.syllabus ?? "")
    const [files, setFiles] = useState<File[]>([])
    const [pyqFiles, setPyqFiles] = useState<File[]>([])

    const [previewData, setPreviewData] = useState<PreviewData | null>(draft.previewData ?? null)

    useEffect(() => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ module, semester, year, branch, specialization, subject, subjectCode, syllabus, previewData }))
        } catch (e) {
            console.warn("Could not save draft", e) // e.g. storage full or blocked
        }
    }, [module, semester, year, branch, specialization, subject, subjectCode, syllabus, previewData])

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        try {
            // Reading files is real progress (0-20%)
            const total = files.length + pyqFiles.length
            let read = 0
            const onFileDone = () => {
                read++
                setProgress({ label: `Reading files (${read}/${total})...`, value: (read / total) * 20 })
            }
            setProgress({ label: "Reading files...", value: 0 })
            const onStatus = (label: string) => setProgress(p => ({ label, value: p?.value ?? 0 }))
            const [refs, pyqs] = await Promise.all([extractTexts(files, onFileDone, onStatus), extractTexts(pyqFiles, onFileDone, onStatus)])

            const formData = new FormData()
            formData.append("syllabus", syllabus)
            const textsJson = JSON.stringify(fitToBudget(refs.texts, OUTLINE_CHAR_BUDGET))
            const pyqTextsJson = JSON.stringify(fitToBudget(pyqs.texts, PYQ_CHAR_BUDGET))
            formData.append("texts", textsJson)
            formData.append("pyqTexts", pyqTextsJson)
            refs.raw.forEach(f => formData.append("file", f))
            pyqs.raw.forEach(f => formData.append("pyq", f))

            const rawFiles = [...refs.raw, ...pyqs.raw]
            const requestBytes = new Blob([textsJson, pyqTextsJson]).size + rawFiles.reduce((sum, f) => sum + f.size, 0)
            if (requestBytes > MAX_UPLOAD_BYTES) {
                throw new Error(`Too much to upload at once (${(requestBytes / 1024 / 1024).toFixed(1)}MB, limit 4MB).${rawFiles.length ? ` These files couldn't be read in the browser: ${rawFiles.map(f => f.name).join(", ")}. Try re-saving them as PDF or uploading fewer at a time.` : ""}`)
            }

            // Step 1: outline. The AI call reports no progress, so ease toward 30% while waiting.
            setProgress({ label: "AI is planning the topics...", value: 20 })
            const tick = setInterval(() => setProgress(p => p && { ...p, value: p.value + (30 - p.value) * 0.05 }), 1000)
            const outline: { topics: { title: string; description: string }[]; quiz: QuizQuestion[]; probableQuestions: string; truncated: boolean; serverParsed: Source[] } =
                await runJob<{ topics: { title: string; description: string }[]; quiz: QuizQuestion[]; probableQuestions: string; truncated: boolean; serverParsed: Source[] }>("/api/generate", formData).finally(() => clearInterval(tick))
            if (outline.topics.length === 0) throw new Error("The AI returned no topics. Try again.")

            // Step 2: write each topic separately (3 at a time) so every topic gets the AI's full output budget
            const allSources = [...refs.texts, ...outline.serverParsed]
            const allTitles = outline.topics.map(t => t.title)
            const topics: Topic[] = new Array(outline.topics.length)
            const truncated: string[] = outline.truncated ? ["Topic list / quiz / probable questions"] : []
            let next = 0, written = 0
            const writeTopics = async () => {
                while (next < outline.topics.length) {
                    const i = next++
                    const topic = outline.topics[i]
                    const excerpts = relevantExcerpts(allSources, `${topic.title} ${topic.description}`, TOPIC_CHAR_BUDGET)
                    const result = await withRetry(() => runJob<{ content: string; truncated: boolean }>(
                        "/api/generate/topic",
                        JSON.stringify({ syllabus, topic, allTitles, excerpts }),
                        true,
                    ), TOPIC_ATTEMPTS).catch(err => {
                        next = outline.topics.length // stop the other workers picking up new topics
                        throw new Error(`Topic "${topic.title}" failed after ${TOPIC_ATTEMPTS} tries: ${err instanceof Error ? err.message : err}`)
                    })
                    topics[i] = { ...topic, content: result.content }
                    if (result.truncated) truncated.push(topic.title)
                    written++
                    setProgress({ label: `Writing topics (${written}/${outline.topics.length}): ${topic.title}`, value: 30 + (written / outline.topics.length) * 70 })
                }
            }
            setProgress({ label: `Writing topics (0/${outline.topics.length})...`, value: 30 })
            await Promise.all(Array.from({ length: TOPIC_CONCURRENCY }, writeTopics))

            setPreviewData({ topics, quiz: outline.quiz, probableQuestions: outline.probableQuestions, truncated })
            setMessage("Preview generated! Review below and click Upload to save.")
        } catch (err: unknown) {
            setMessage(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
            setProgress(null)
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
        if (previewData.probableQuestions) {
            formData.append("probableQuestions", previewData.probableQuestions)
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
            setFiles([])
            setPyqFiles([])
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

                {previewData.truncated && previewData.truncated.length > 0 && (
                    <div className="p-4 rounded-lg font-poppins bg-yellow-50 text-yellow-800 border border-yellow-200" role="alert">
                        The AI hit its length limit and these parts were cut off at the end: <strong>{previewData.truncated.join(", ")}</strong>. Check them before uploading, or split those syllabus items into smaller ones and generate again.
                    </div>
                )}

                <div className="p-6 bg-white border border-neutral-200 rounded-lg shadow-sm max-h-[60vh] overflow-y-auto">
                    <h2 className="text-2xl  text-neutral-800 font-bold mb-4">Topics</h2>
                    {previewData.topics?.map((topic: Topic, i: number) => (
                        <div key={i} className="mb-6">
                            <h3 className="text-xl text-neutral-800 font-semibold mb-2">{topic.title}</h3>
                            <p className=" text-neutral-800 mb-2">{topic.description}</p>
                            <div className="text-sm text-neutral-800 line-clamp-3">{topic.content}</div>
                        </div>
                    ))}

                    {previewData.probableQuestions && (
                        <>
                            <h2 className="text-2xl text-neutral-800 font-bold mb-4 mt-8">Probable Questions</h2>
                            <div className="text-sm text-neutral-800 whitespace-pre-wrap">{previewData.probableQuestions}</div>
                        </>
                    )}

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
                                <Upload className="w-4 h-4" /> Reference Files (Optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={e => setFiles(Array.from(e.target.files ?? []))}
                                className="p-2 rounded border text-black border-neutral-300 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
                            />
                            <p className="text-xs text-neutral-400">Supports PDF, PPTX. Select multiple files; topics are taken from all of them.</p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Previous Year Papers (Optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf"
                                onChange={e => setPyqFiles(Array.from(e.target.files ?? []))}
                                className="p-2 rounded border text-black border-neutral-300 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
                            />
                            <p className="text-xs text-neutral-400">AI analyses past papers and adds a Probable Questions section for the next exam.</p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {progress && (
                        <div className="flex flex-col gap-2" role="status" aria-live="polite">
                            <div className="flex justify-between text-sm font-poppins text-neutral-600 dark:text-neutral-400">
                                <span>{progress.label}</span>
                                <span>{Math.round(progress.value)}%</span>
                            </div>
                            <Progress value={progress.value} className="h-3 bg-neutral-200 dark:bg-neutral-800 [&>[data-slot=progress-indicator]]:bg-black dark:[&>[data-slot=progress-indicator]]:bg-neutral-100" />
                        </div>
                    )}

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
