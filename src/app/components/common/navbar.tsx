import Link from "next/link";

export default function Navbar() {
    return(
        <>
        <div className="flex flex-row fixed items-center justify-between w-full px-24 py-8">
           
           <div className="flex flex-row items-center gap-20">
                    <div className="font-jakarta dark:text-neutral-50 text-3xl font-bold tracking-tighter">
                        VitB Notes
                    </div>

                    <div className="flex flex-row dark:text-neutral-50 items-center gap-8">
                        <Link href="/">About</Link>
                        <Link href="/about">Notes</Link>
                        <Link href="/contact">Testimonials</Link>
                    </div>
           </div>
           
           <div className="flex flex-row items-center gap-4">

                <div>

                </div>
                <div className="font-poppins text-sm px-4 py-2 rounded-md font-medium active:top-1 active:border-b-3 active:border-r-3 hover:border-b-4 hover:border-r-4 relative bg-neutral-600 text-neutral-50  border-b-3 border-r-3 border-neutral-400">
                    Sign In
                </div>
                
           </div>

           
           
        </div>
        </>
    )
}