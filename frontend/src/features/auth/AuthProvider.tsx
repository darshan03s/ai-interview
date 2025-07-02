import { useEffect, useState } from "react"
import supabase from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"
import { AuthContext } from "@/features/auth/AuthContext"
import { devLog } from "@/utils/devUtils";
import { toast } from "sonner";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    devLog("Session: ", session)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setAuthLoading(false)
        })
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setAuthLoading(false)
        })
        return () => subscription.unsubscribe()
    }, []);


    async function signInWithGoogle() {
        if (window.location.hostname === "localhost") {
            const port = window.location.port;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `http://localhost:${port}`
                }
            });

            if (error) {
                console.error('Error signing in with Google:', error.message);
                toast.error("Error signing in with Google")
            }
        } else {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });

            if (error) {
                console.error('Error signing in with Google:', error.message);
                toast.error("Error signing in with Google")
            }
        }
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error.message);
            toast.error("Error signing out")
        }
    }

    return (
        <AuthContext.Provider value={{
            session,
            setSession,
            signInWithGoogle,
            signOut,
            authLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}