import { CircleCheck } from "lucide-react"

const features = [
    {
        title: "Clarity Over Complexity",
        description: "Simplifies concepts for deeper and better understanding. We break down complex topics into digestible chunks.",
        icon: <CircleCheck />
    },
    {
        title: "Answers at Your Fingertips",
        description: "Simplifies concepts for deeper and better understanding. We break down complex topics into digestible chunks.",
        icon: <CircleCheck />
    },
    {
        title: "Fast and Efficient Learning",
        description: "Simplifies concepts for deeper and better understanding. We break down complex topics into digestible chunks.",
        icon: <CircleCheck />
    }
]

export default function Features() {

    return (
        <>
            <div className="px-48 py-24 flex flex-col gap-24 items-center justify-center">

                <div className="flex flex-col gap-6">

                    <div className="font-inter text-5xl font-bold text-center dark:text-neutral-100">
                        Learn better with VitB Notes
                    </div>
                    <div className="font-poppins text-base px-48 text-neutral-400 text-center">
                        Transform your learning experience with our innovative platform designed for modern students. Preparing for exams is challenging enough - let us simplify the process.
                    </div>

                </div>

                <div className="grid grid-cols-3 justify-between w-full items-center gap-12">

                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col gap-6 items-start p-7 bg-neutral-100 dark:bg-neutral-900 rounded-md shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] transition-shadow duration-150 ease-in border-neutral-600 dark:border-neutral-700 tranistion-all duration-150 ease-in">
                            <div className="p-3 text-white bg-neutral-500 dark:bg-neutral-700 rounded-md">
                                {feature.icon}
                            </div>
                            <div className="font-inter font-bold text-lg dark:text-neutral-100">
                                {feature.title}
                            </div>
                            <div className="font-poppins text-neutral-400 text-base">
                                {feature.description}
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </>
    )
}