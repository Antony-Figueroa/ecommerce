import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { api } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  avatarUrl?: string | null
  address?: string | null
}

interface GoogleData {
  googleId: string
  email: string
  name: string
  avatarUrl?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<{ requiresRegistration?: boolean; googleData?: GoogleData }>
  registerWithGoogle: (data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    username: string;
    password?: string;
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isRefreshing = useRef(false)

  const refreshUser = useCallback(async () => {
    if (isRefreshing.current) return;
    
    const token = api.getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    isRefreshing.current = true
    try {
      const userData = await api.getMe()
      setUser(prev => {
        if (!prev) return userData;
        if (JSON.stringify(prev) === JSON.stringify(userData)) return prev;
        return userData;
      })
    } catch (error) {
      console.error("Failed to fetch user:", error)
      const isAuthError = (error as any).status === 401;

      if (isAuthError) {
        api.logout()
        setUser(null)
      }
    } finally {
      setLoading(false)
      isRefreshing.current = false
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    if (result.success) {
      setUser(result.user)
    }
  }

  const loginWithGoogle = async (credential: string) => {
    const result = await api.googleAuth(credential)
    if (result.success && result.token) {
      setUser(result.user)
    }
    return {
      requiresRegistration: result.requiresRegistration,
      googleData: result.googleData,
    }
  }

  const registerWithGoogle = async (data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    username: string;
    password?: string;
  }) => {
    const result = await api.googleRegister(data)
    if (result.success) {
      setUser(result.user)
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithGoogle,
      registerWithGoogle,
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
