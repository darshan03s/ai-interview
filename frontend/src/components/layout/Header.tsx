import { memo, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";
import Sidebar from "../sidebar/Sidebar";
import { Link } from "react-router-dom";
import { ThemeToggleButton } from "@/features/theme";
import UserAvatar from "./UserAvatar";

const Header = memo(() => {
    const { session, signInWithGoogle, signOut, authLoading } = useAuth();

    const handleSignIn = useCallback(() => {
        signInWithGoogle();
    }, [signInWithGoogle]);

    const handleSignOut = useCallback(() => {
        signOut();
    }, [signOut]);

    return <header className="h-16 sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Sidebar />
                    <Link to="/" className="text-lg sm:text-xl font-bold text-foreground">
                        InterviewBot
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggleButton />
                    {authLoading ? (
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    ) : session ? (
                        <UserAvatar session={session} onSignOut={handleSignOut} />
                    ) : (
                        <Button onClick={handleSignIn} size="sm">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </header>
});

Header.displayName = 'Header';

export default Header;