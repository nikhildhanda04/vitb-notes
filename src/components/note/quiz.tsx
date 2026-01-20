'use client'

import { useState } from "react"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

interface Question {
    id: string
    question: string
    options: string[]
    answer: string
}

interface QuizProps {
    questions: Question[]
}

export function Quiz({ questions }: QuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState(0)
    const [completed, setCompleted] = useState(false)

    const handleOptionSelect = (option: string) => {
        if (showResult) return
        setSelectedOption(option)
    }

    const handleNext = () => {
        if (selectedOption === questions[currentQuestion].answer) {
            setScore(score + 1)
        }

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setSelectedOption(null)
            setShowResult(false)
        } else {
            setCompleted(true)
        }
    }

    const handleCheck = () => {
        setShowResult(true)
    }

    const resetQuiz = () => {
        setCurrentQuestion(0)
        setSelectedOption(null)
        setShowResult(false)
        setScore(0)
        setCompleted(false)
    }

    if (!questions || questions.length === 0) {
        return null
    }

    if (completed) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center flex flex-col items-center gap-6 shadow-sm">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Quiz Completed!</h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        You scored <span className="font-bold text-black dark:text-white">{score}</span> out of <span className="font-bold text-black dark:text-white">{questions.length}</span>
                    </p>
                </div>
                <button
                    onClick={resetQuiz}
                    className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    <RefreshCw className="w-4 h-4" /> Try Again
                </button>
            </div>
        )
    }

    const question = questions[currentQuestion]

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">
                    Quiz: Test Your Knowledge
                </h2>
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
                    Question {currentQuestion + 1} / {questions.length}
                </span>
            </div>

            <div className="p-6 flex flex-col gap-6">
                <div className="text-lg font-medium text-neutral-800 dark:text-neutral-200 prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            p: ({ node: _node, ...props }) => <span {...props} className="block mb-4 last:mb-0" />
                        }}
                    >
                        {question.question}
                    </ReactMarkdown>
                </div>

                <div className="grid gap-3">
                    {question.options.map((option, index) => {
                        let optionClass = "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"

                        if (showResult) {
                            if (option === question.answer) {
                                optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            } else if (option === selectedOption) {
                                optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }
                        } else if (selectedOption === option) {
                            optionClass = "border-black dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-1 ring-black dark:ring-white"
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(option)}
                                disabled={showResult}
                                className={cn(
                                    "w-full text-left p-4 rounded-lg border transition-all flex justify-between items-center group",
                                    optionClass
                                )}
                            >
                                <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors w-full">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            p: ({ node: _node, ...props }) => <span {...props} />
                                        }}
                                    >
                                        {option}
                                    </ReactMarkdown>
                                </span>
                                {showResult && option === question.answer && (
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 ml-2" />
                                )}
                                {showResult && option === selectedOption && option !== question.answer && (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 ml-2" />
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    {!showResult ? (
                        <button
                            onClick={handleCheck}
                            disabled={!selectedOption}
                            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
