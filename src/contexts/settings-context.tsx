import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "@/lib/api"

interface Settings {
    show_stock_badge?: boolean
    [key: string]: any
}

interface SettingsContextType {
    settings: Settings
    loading: boolean
    refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({})
    const [loading, setLoading] = useState(true)

    const refreshSettings = async () => {
        try {
            const data = await api.getPublicSettings()
            setSettings(data)
        } catch (error) {
            console.error("Failed to fetch settings:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshSettings()
    }, [])

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
