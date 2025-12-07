'use client'
import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { Menu, X, Calendar, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useScroll, motion } from 'motion/react'
import { cn } from '@/lib/utils'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { authClient } from '@/lib/auth-client'
import { useRouter, usePathname } from 'next/navigation'

const menuItems = [
    { name: 'Cars', href: '#cars' },
    { name: 'Bookings', href: '/bookings' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const [user, setUser] = React.useState<{ id: string; name: string | null; email: string; image: string | null; role: string } | null>(null)

    const { scrollYProgress } = useScroll()
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    const fetchUser = React.useCallback(async () => {
        try {
            const session = await authClient.getSession()
            if (session?.data?.user) {
                setUser({
                    ...session.data.user,
                    image: session.data.user.image ?? null,
                    role: (session.data.user as { role?: string }).role || 'user'
                })
            } else {
                setUser(null)
            }
        } catch {
            setUser(null)
        }
    }, [])

    // Fetch user on mount and when pathname changes (after navigation)
    React.useEffect(() => {
        fetchUser()
    }, [fetchUser, pathname])

    // Refresh session when window regains focus or storage changes
    React.useEffect(() => {
        const handleFocus = () => {
            fetchUser()
        }

        const handleStorage = () => {
            fetchUser()
        }

        window.addEventListener('focus', handleFocus)
        window.addEventListener('storage', handleStorage)
        window.addEventListener('custom:auth-changed', handleStorage)

        return () => {
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('custom:auth-changed', handleStorage)
        }
    }, [fetchUser])

    const handleSignOut = async () => {
        try {
            await authClient.signOut()
            setUser(null)
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full pt-2">
                <div className={cn('mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12', scrolled && 'bg-background/50 backdrop-blur-2xl')}>
                    <motion.div
                        key={1}
                        className={cn('relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6', scrolled && 'lg:py-4')}>
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:flex items-center gap-6">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden w-full">
                                <ul className="space-y-6 text-base mb-6">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="hidden lg:flex"
                                    >
                                        <Link href="/bookings">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Bookings
                                        </Link>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                                                    <AvatarFallback>
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end" forceMount>
                                            <DropdownMenuLabel className="font-normal">
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href="/bookings">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>My Bookings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            {user.role === 'admin' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/dashboard">
                                                            <Settings className="mr-2 h-4 w-4" />
                                                            <span>Admin Dashboard</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleSignOut}>
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Log out</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ) : (
                                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm">
                                        <Link href="/login">
                                            <span>Login</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm">
                                        <Link href="/signup">
                                            <span>Sign Up</span>
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </nav>
        </header>
    )
}

