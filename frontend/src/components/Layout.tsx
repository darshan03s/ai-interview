import { LogIn, LogOut } from "lucide-react";
import { ThemeToggleButton } from "@/features/theme";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Header = () => {
    const { session, signInWithGoogle, signOut, authLoading } = useAuth();

    const handleSignIn = () => {
        signInWithGoogle();
    };

    const handleSignOut = () => {
        signOut();
    };

    const getUserDisplayName = () => {
        if (session?.user?.user_metadata?.full_name) {
            return session.user.user_metadata.full_name;
        }
        if (session?.user?.email) {
            return session.user.email.split('@')[0];
        }
        return 'User';
    };

    const getUserAvatar = () => {
        return session?.user?.user_metadata?.avatar_url ||
            session?.user?.user_metadata?.picture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=random`;
    };

    const getInitials = () => {
        const name = getUserDisplayName();
        return name
            .split(' ')
            .map((word: string) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return <header className="h-16 sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-full flex items-center justify-between">
                {/* Logo/Brand */}
                <div className="flex items-center gap-4">
                    <Sidebar />
                    <Link to="/" className="text-lg sm:text-xl font-bold text-foreground">
                        InterviewBot
                    </Link>
                </div>

                {/* Right side - Theme toggle and Auth */}
                <div className="flex items-center gap-3">
                    <ThemeToggleButton />

                    {authLoading ? (
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    ) : session ? (
                        /* User is signed in - show avatar with dropdown */
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={getUserAvatar()}
                                            alt={getUserDisplayName()}
                                        />
                                        <AvatarFallback>
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage
                                                    src={getUserAvatar()}
                                                    alt={getUserDisplayName()}
                                                />
                                                <AvatarFallback>
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-none truncate">
                                                    {getUserDisplayName()}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                                                    {session.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="p-2">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        /* User is not signed in - show sign in button */
                        <Button onClick={handleSignIn} size="sm">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </header>
}

const Layout = () => {
    return (
        <div className="min-h-screen h-full flex flex-col">
            <Header />
            <main className="flex-1 overflow-auto">
                <div className="min-h-[calc(100vh-4rem)] h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;