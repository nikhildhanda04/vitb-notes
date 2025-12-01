'use client'

import Link from "next/link";
import { AuthDialog } from "@/components/auth-dialog";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial theme
        if (document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        }
    };

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
            <div className="flex flex-row items-center justify-between w-full px-24 py-8 z-50 bg-white/80 dark:bg-[#1c1c1b]/80 backdrop-blur-sm">

                <div className="flex flex-row items-center gap-20">
                    <a
                        href="/"
                        className="font-jakarta text-neutral-900 dark:text-neutral-50 text-3xl font-bold tracking-tighter">
                        VitB Notes
                    </a>

                    <div className="flex flex-row text-neutral-600 dark:text-neutral-300 items-center gap-8">
                        <Link href="/">About</Link>
                        <Link href="/notes">Notes</Link>
                        <Link href="/contact">Testimonials</Link>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4">

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div>
                        {session && (
                            <div className="flex items-center gap-3">
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name}
                                        className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-bold text-xs border border-neutral-300 dark:border-neutral-600">
                                        {session.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="font-poppins text-sm text-neutral-600 dark:text-neutral-300 hidden md:block">
                                    {session.user.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {session ? (
                        <div
                            onClick={handleSignOut}
                            className="cursor-pointer font-poppins text-sm px-4 py-2 rounded-md font-medium active:top-1 relative bg-neutral-200 dark:bg-neutral-800 shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] transition-shadow duration-100 ease-in text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-neutral-600"
                        >
                            Sign Out
                        </div>
                    ) : (
                        <AuthDialog>
                            <div className="cursor-pointer font-poppins text-sm px-4 py-2 rounded-md font-medium active:top-1 relative bg-neutral-600 dark:bg-neutral-700 shadow-[6px_6px_0px_0px_#737373] hover:shadow-[8px_8px_0px_0px_#737373] transition-shadow duration-100 ease-in text-neutral-50 dark:text-neutral-100 border border-neutral-400 dark:border-neutral-600">
                                Sign In
                            </div>
                        </AuthDialog>
                    )}

                </div>



            </div>
        </>
    )
}