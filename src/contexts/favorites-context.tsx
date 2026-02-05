import * as React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { api } from "@/lib/api"
import type { Product } from "@/types"
import { toast } from "@/hooks/use-toast"

interface FavoritesContextType {
  favorites: Product[]
  toggleFavorite: (product: Product) => Promise<void>
  isFavorite: (productId: string) => boolean
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavorites([])
    }
  }, [user])

  const loadFavorites = async () => {
    setIsLoading(true)
    try {
      const response = await api.getFavorites()
      setFavorites(response.favorites || [])
    } catch (error) {
      console.error("Error loading favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async (product: Product) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive",
      })
      return
    }

    const isFav = favorites.some((f) => f.id === product.id)
    
    try {
      if (isFav) {
        await api.removeFavorite(product.id)
        setFavorites((prev) => prev.filter((f) => f.id !== product.id))
        toast({
          title: "Eliminado",
          description: "Producto eliminado de tus favoritos",
        })
      } else {
        await api.addFavorite(product.id)
        setFavorites((prev) => [...prev, product])
        toast({
          title: "Agregado",
          description: "Producto agregado a tus favoritos",
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar tus favoritos",
        variant: "destructive",
      })
    }
  }

  const isFavorite = (productId: string) => {
    return favorites.some((f) => f.id === productId)
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
