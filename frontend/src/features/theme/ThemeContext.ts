import { createContext } from "react"
import { initialState, type ThemeProviderState } from "./types"

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export default ThemeProviderContext

