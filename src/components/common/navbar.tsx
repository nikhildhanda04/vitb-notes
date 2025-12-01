'use client'

import Link from "next/link";
import { AuthDialog } from "@/components/auth-dialog";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.refresh();
                },
            },
        });
    };

    return (
        <>
            <div className="flex flex-row items-center justify-between w-full px-24 py-8 z-50 bg-white/80 backdrop-blur-sm">

                <div className="flex flex-row items-center gap-20">
                    <a 
                    href="/" 
                    className="font-jakarta dark:text-neutral-50 text-3xl font-bold tracking-tighter">
                        VitB Notes
                    </a>

                    <div className="flex flex-row dark:text-neutral-50 items-center gap-8">
                        <Link href="/">About</Link>
                        <Link href="/notes">Notes</Link>
                        <Link href="/contact">Testimonials</Link>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4">

                    <div>
                        {session && (
                            <div className="flex items-center gap-3">
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name}
                                        className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-xs border border-neutral-300">
                                        {session.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="font-poppins text-sm text-neutral-600 hidden md:block">
                                    {session.user.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {session ? (
                        <div
                            onClick={handleSignOut}
                            className="cursor-pointer font-poppins text-sm px-4 py-2 rounded-md font-medium active:top-1 active:border-b-3 active:border-r-3 hover:border-b-4 hover:border-r-4 relative bg-neutral-200 text-neutral-800 border-b-3 border-r-3 border-neutral-400"
                        >
                            Sign Out
                        </div>
                    ) : (
                        <AuthDialog>
                            <div className="cursor-pointer font-poppins text-sm px-4 py-2 rounded-md font-medium active:top-1 active:border-b-3 active:border-r-3 hover:border-b-4 hover:border-r-4 relative bg-neutral-600 text-neutral-50  border-b-3 border-r-3 border-neutral-400">
                                Sign In
                            </div>
                        </AuthDialog>
                    )}

                </div>



            </div>
        </>
    )
}