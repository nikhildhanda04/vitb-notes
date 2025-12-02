import { MoveRight, Github, NotebookPen } from "lucide-react"


export default function Hero() {
    return (
        <>
            <div className="relative overflow-hidden flex flex-col items-center px-52 gap-16 h-screen -mt-24 justify-center">
                {/* Glow Effects */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/2 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-zinc-500/2 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

                <div className="font-poppins items-center text-sm text-neutral-100 px-6 py-2 bg-neutral-700 uppercase tracking-tight font-medium rounded-md">
                    get back to study <MoveRight className="inline ml-2" />
                </div>

                <div>

                    {/* heading */}
                    <div className="font-jakarta items-center text-7xl font-bold tracking-tight text-center  text-neutral-800 dark:text-neutral-100">
                        Your Notes. Your Community. Your Learning Hub.
                    </div>

                    {/* subheading */}
                    <div className="font-poppins text-center mt-4 text-lg text-neutral-400 dark:text-neutral-400 tracking-tight">
                        Find the notes you need. Share the notes you have. Learn with quizzes made from your content.
                    </div>

                </div>

                {/* CTA */}
                <div className="flex flex-row gap-6 ">
                    <a href="/notes" className="px-8 py-2 bg-black items-center  flex gap-3 text-white border-neutral-400 border shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md ">
                        Notes <NotebookPen size="20" />
                    </a>
                    <a href="https://github.com/nikhildhanda04/vitb-notes" target="_black" className="px-8 py-2 bg-neutral-100 dark:bg-neutral-800 dark:text-white items-center flex flex-row gap-3 border-neutral-400 border shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] transition-shadow duration-100 ease-in rounded-md">
                        Contribute to Project <Github size="20" />
                    </a>
                </div>



            </div>

        </>
    )
}

