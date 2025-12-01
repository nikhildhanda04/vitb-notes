'use client'

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqData = [
    {
        question: "What is VitB Notes?",
        answer: "VitB Notes is an innovative platform designed to transform your learning experience. We help students prepare for exams by simplifying complex concepts into digestible chunks using AI-powered note generation."
    },
    {
        question: "How does the AI note generation work?",
        answer: "Our system analyzes your provided syllabus and reference materials (PDFs/PPTs). It then uses advanced AI to generate structured, detailed notes that cover all the necessary topics, complete with descriptions, formulas, and diagrams."
    },
    {
        question: "Is it free to use?",
        answer: "Currently, VitB Notes is in its beta phase. We offer a free tier for students to try out the core features. Premium features for advanced note generation and unlimited storage may be introduced in the future."
    },
    {
        question: "Can I upload my own syllabus?",
        answer: "Yes! You can upload your specific course syllabus, and our AI will tailor the generated notes to exactly match your curriculum requirements, ensuring you study exactly what's needed for your exams."
    }
]

export default function FAQs() {
    return (
        <div className="px-48 py-24 flex flex-col gap-12 items-center justify-center bg-white dark:bg-transparent">
            <div className="flex flex-col gap-6 text-center">
                <div className="font-inter text-5xl font-bold dark:text-neutral-100">
                    Frequently Asked Questions
                </div>
                <div className="font-poppins text-base px-48 text-neutral-400">
                    Got questions? We've got answers. Here's everything you need to know about VitB Notes.
                </div>
            </div>

            <div className="w-full max-w-3xl flex flex-col gap-6">
                {faqData.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
            </div>
        </div>
    )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div
            onClick={() => setIsOpen(!isOpen)}
            className={`
                flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-lg border-neutral-600 cursor-pointer transition-all duration-150 ease-in overflow-hidden
                ${isOpen ? 'shadow-[4px_4px_0px_0px_#737373]' : 'shadow-[6px_6px_0px_0px_#737373]'}
            `}
        >
            <div className="flex justify-between items-center p-6">
                <div className="font-inter font-bold text-lg text-neutral-800 dark:text-neutral-100">
                    {question}
                </div>
                <div className={`text-neutral-600 dark:text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown />
                </div>
            </div>

            <div
                className={`
                    grid transition-[grid-template-rows] duration-200 ease-out
                    ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
                `}
            >
                <div className="overflow-hidden">
                    <div className="px-6 pb-6 font-poppins text-neutral-500 dark:text-neutral-400 text-base">
                        {answer}
                    </div>
                </div>
            </div>
        </div>
    )
}
