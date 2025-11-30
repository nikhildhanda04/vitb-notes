import { CircleCheck } from "lucide-react"

export default function Features() {



    return(
        <>
        <div className="px-48 py-24 flex flex-col gap-24 items-center justify-center">

            <div className="flex flex-col gap-6">

                <div className="font-inter text-5xl font-bold text-center">
                    Learn better with VitB Notes
                </div>
                <div className="font-poppins text-base px-48 text-neutral-400 text-center">
                Transform your learning experience with our innovative platform designed for modern students. Preparing for exams is challenging enough - let us simplify the process.
                </div>

            </div>

            <div className="grid grid-cols-3 justify-between w-full items-center gap-12">

                <div className="flex flex-col gap-6 items-start p-7 bg-neutral-100 rounded-lg border-r-6 border-b-6 border-neutral-600 hover:border-b-2 hover:border-r-2 tranistion-all duration-150 ease-in">
                    <div className="p-3 text-white bg-neutral-500 rounded-md">
                        <CircleCheck />
                    </div>
                    <div className="font-inter font-bold text-lg">
                        Clarity Over Complexity
                    </div>
                    <div className="font-poppins text-neutral-400 text-base">
                    Simplifies concepts for deeper and better understanding. We break down complex topics into digestible chunks.
                    </div>
                </div>

                <div className="flex flex-col gap-6 items-start p-7 bg-neutral-100 rounded-lg border-r-6 border-b-6 border-neutral-600 hover:border-b-2 hover:border-r-2 tranistion-all duration-150 ease-in">
                    <div className="p-3 text-white bg-neutral-500 rounded-md">
                        <CircleCheck />
                    </div>
                    <div className="font-inter font-bold text-lg">
                        Answers at Your Fingertips
                    </div>
                    <div className="font-poppins text-neutral-400 text-base">
                    Simplifies concepts for deeper and better understanding. We break down complex topics into digestible chunks.
                    </div>
                </div>

                <div className="flex flex-col gap-6 items-start p-7 bg-neutral-100 rounded-lg border-r-6 border-b-6 border-neutral-600 hover:border-b-2 hover:border-r-2 tranistion-all duration-150 ease-in">
                    <div className="p-3 text-white bg-neutral-500 rounded-md">
                        <CircleCheck />
                    </div>
                    <div className="font-inter font-bold text-lg">
                    Fast and Efficient Learning
                    </div>
                    <div className="font-poppins text-neutral-400 text-base">
                    Simplifies concepts for deeper and better understanding. We break down complex topics into digestible chunks.
                    </div>
                </div>
                
            </div>
        </div>
        </>
    )
}