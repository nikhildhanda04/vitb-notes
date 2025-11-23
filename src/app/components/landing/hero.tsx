import { MoveRight } from "lucide-react"

export default function Hero() {
    return(
        <>
        <div className="flex flex-col items-center px-52 gap-16 h-screen justify-center">

            <div className="font-poppins items-center text-sm text-neutral-100 px-6 py-2 bg-neutral-700 uppercase tracking-tight font-medium rounded-md">
                get back to study <MoveRight className="inline ml-2" />
            </div>

            <div>

            {/* heading */}
            <div className="font-jakarta items-center text-7xl font-bold tracking-tight text-center  text-neutral-800">
            Your Notes. Your Community. Your Learning Hub.
            </div>

            {/* subheading */}
            <div className="font-poppins text-center mt-4 text-lg text-neutral-400 tracking-tight">
            Find the notes you need. Share the notes you have. Learn with quizzes made from your content.
            </div>

            </div>

            {/* CTA */}
            <div className="flex flex-row gap-6 ">
            <div>
                Notes
            </div>
            <div>
                Contribute to Project
            </div>
           </div>
            
            

        </div>
        </>
    )
}