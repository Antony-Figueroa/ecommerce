import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Product, CartItem } from "@/types"
import { useAuth } from "./auth-context"

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  saveForLater: (productId: string) => void
  moveToCart: (productId: string) => void
  getSavedItems: () => CartItem[]
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "farmasiaplus_cart"
const SAVED_ITEMS_STORAGE_KEY = "farmasiaplus_saved"

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [savedItems, setSavedItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!user) {
        setItems([])
        setSavedItems([])
        localStorage.removeItem(CART_STORAGE_KEY)
        localStorage.removeItem(SAVED_ITEMS_STORAGE_KEY)
        setIsLoaded(true)
        return
      }

      try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY)
        const storedSaved = localStorage.getItem(SAVED_ITEMS_STORAGE_KEY)

        if (storedCart) {
          const parsed = JSON.parse(storedCart)
          if (Array.isArray(parsed)) {
            setItems(parsed)
          }
        }

        if (storedSaved) {
          const parsed = JSON.parse(storedSaved)
          if (Array.isArray(parsed)) {
            setSavedItems(parsed)
          }
        }
      } catch {
      }
      setIsLoaded(true)
    }
  }, [user])

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch {
      }
    }
  }, [items, isLoaded])

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(SAVED_ITEMS_STORAGE_KEY, JSON.stringify(savedItems))
      } catch {
      }
    }
  }, [savedItems, isLoaded])

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, quantity }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId))
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const saveForLater = useCallback((productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.id === productId)
      if (item) {
        setSavedItems((saved) => [...saved, item])
        return prev.filter((i) => i.product.id !== productId)
      }
      return prev
    })
  }, [])

  const moveToCart = useCallback((productId: string) => {
    setSavedItems((prev) => {
      const item = prev.find((i) => i.product.id === productId)
      if (item) {
        setItems((cart) => {
          const existing = cart.find((i) => i.product.id === productId)
          if (existing) {
            return cart.map((i) =>
              i.product.id === productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          }
          return [...cart, item]
        })
        return prev.filter((i) => i.product.id !== productId)
      }
      return prev
    })
  }, [])

  const getSavedItems = useCallback(() => savedItems, [savedItems])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        saveForLater,
        moveToCart,
        getSavedItems,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
