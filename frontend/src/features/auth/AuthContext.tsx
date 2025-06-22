import type { Session } from "@supabase/supabase-js"
import { createContext } from "react"

type AuthContextType = {
    session: Session | null
    setSession: (session: Session | null) => void
    signInWithGoogle: () => void
    signOut: () => void
    authLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
    session: null,
    setSession: () => { },
    signInWithGoogle: () => { },
    signOut: () => { },
    authLoading: true
})

