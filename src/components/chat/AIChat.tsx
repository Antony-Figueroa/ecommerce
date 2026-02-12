import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Zap, Activity, Heart, ExternalLink, History, Plus, Trash2, ChevronLeft, MessageCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'model'
  parts: { text: string }[]
  usage?: {
    promptLength: number
    responseLength: number
  }
}

interface ChatConversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

const getStorageKey = (userId?: string) => userId ? `anas_supplements_chat_history_${userId}` : 'anas_supplements_chat_history_guest'

const QUICK_QUESTIONS = [
  { 
    label: 'Energía y Enfoque', 
    icon: Zap, 
    query: '¿Qué suplementos recomiendas para tener más energía y enfoque?',
    staticResponse: 'Para mejorar tu energía y enfoque, te recomendamos nuestra selección de **Pre-entrenos** y **Complejos de Vitamina B**. Estos productos están diseñados para optimizar tu rendimiento mental y físico sin caídas bruscas de energía. \n\n¿Te gustaría que te ayude a elegir uno específico según tu nivel de actividad?'
  },
  { 
    label: 'Recuperación', 
    icon: Activity, 
    query: 'Busco algo para mejorar mi recuperación muscular post-entrenamiento.',
    staticResponse: 'La recuperación es clave para el progreso. Lo ideal es combinar una **Proteína Whey** de rápida absorción con **Creatina Monohidratada**. También puedes considerar **BCAAs** para reducir el dolor muscular. \n\n¿Entrenas fuerza o resistencia para darte una recomendación más precisa?'
  },
  { 
    label: 'Salud General', 
    icon: Heart, 
    query: '¿Qué vitaminas o suplementos son esenciales para la salud diaria?',
    staticResponse: 'Para el bienestar diario, los pilares son un buen **Multivitamínico**, **Omega-3** para la salud cardiovascular y **Magnesio** para el descanso y función muscular. \n\n¿Tienes alguna meta de salud específica ahora mismo?'
  },
  {
    label: 'Disponibilidad',
    icon: MessageCircle,
    query: '¿Tienen disponibilidad de productos específicos?',
    staticResponse: 'Mantenemos nuestro catálogo web sincronizado con el inventario real. Si ves un producto con el botón "Añadir al carrito", está disponible para envío inmediato. \n\nSi buscas algo muy específico que no aparece, puedes preguntarme o contactarnos directamente.'
  },
  {
    label: 'Precios y Cotizaciones',
    icon: MessageCircle,
    query: '¿Cómo puedo consultar los precios?',
    staticResponse: 'Todos los precios están visibles en nuestro **Catálogo**. Si necesitas una cotización para compras al mayor o productos específicos, puedes añadir los productos a tu carrito y ver el resumen, o contactarnos por WhatsApp para atención personalizada.'
  }
]

export const AIChat: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState("584123456789")
  const [isVisible, setIsVisible] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentStorageKey = getStorageKey(user?.id)

  // Cargar historial y configuración al iniciar o cuando cambie el usuario
  useEffect(() => {
    const saved = localStorage.getItem(currentStorageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConversations(parsed)
      } catch (e) {
        console.error('Error parsing chat history', e)
        setConversations([])
      }
    } else {
      setConversations([])
    }
    
    // Resetear el chat activo al cambiar de usuario
    setActiveId(null)
    setMessages([])

    const fetchSettings = async () => {
      try {
        const settings = await api.getPublicSettings()
        
        // WhatsApp number
        if (settings.whatsapp_number) {
          const cleanNumber = settings.whatsapp_number.replace(/\+/g, '').replace(/\D/g, '')
          setWhatsappNumber(cleanNumber)
        }

        // Visibility check
        let visible = true
        if (!user) {
          visible = settings.chat_ia_visible_guest !== false
        } else if (user.role === 'ADMIN') {
          visible = settings.chat_ia_visible_admin !== false
        } else if (user.role === 'CUSTOMER') {
          visible = settings.chat_ia_visible_customer !== false
        }
        setIsVisible(visible)

      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }
    fetchSettings()
  }, [user])

  const openWhatsApp = (message?: string) => {
    const text = message || "Hola, tengo una pregunta sobre Ana's Supplements"
    const encodedMessage = encodeURIComponent(text)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank")
  }

  const saveConversations = (updated: ChatConversation[]) => {
    localStorage.setItem(currentStorageKey, JSON.stringify(updated))
  }

  // Guardar conversaciones cuando cambien los mensajes del chat activo
  useEffect(() => {
    if (activeId && messages.length > 0) {
      setConversations(prev => {
        const updated = prev.map(c => 
          c.id === activeId ? { ...c, messages: messages.map(m => ({
            role: m.role,
            parts: m.parts.map(p => ({ text: String(p.text || '') })),
            usage: m.usage
          })) } : c
        )
        saveConversations(updated)
        return updated
      })
    }
  }, [messages, activeId])

  // Actualizar mensajes cuando cambie la conversación activa
  useEffect(() => {
    if (activeId) {
      const active = conversations.find(c => c.id === activeId)
      if (active) {
        setMessages(active.messages)
      }
    } else {
      setMessages([])
    }
  }, [activeId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const createNewChat = (initialMessage?: string, initialMessages: Message[] = []) => {
    const newChat: ChatConversation = {
      id: Date.now().toString(),
      title: initialMessage ? (initialMessage.slice(0, 30) + '...') : 'Nueva conversación',
      messages: initialMessages,
      createdAt: Date.now()
    }
    setConversations(prev => [newChat, ...prev])
    setActiveId(newChat.id)
    setMessages(initialMessages)
    setShowHistory(false)
    return newChat.id
  }

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
    if (conversations.length <= 1) {
      localStorage.removeItem(currentStorageKey)
    }
  }

  const handleSend = async (textOverride?: string, staticResponse?: string) => {
    const textToSend = textOverride || input
    if (!textToSend || (typeof textToSend === 'string' && !textToSend.trim()) || isLoading) return

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: String(textToSend) }]
    }

    let currentActiveId = activeId
    if (!currentActiveId) {
      currentActiveId = createNewChat(textToSend, [userMessage])
    } else {
      setMessages(prev => [...prev, userMessage])
    }

    if (!textOverride) setInput('')

    if (staticResponse) {
      setTimeout(() => {
        const botResponse: Message = {
          role: 'model',
          parts: [{ text: staticResponse }]
        }
        setMessages(prev => [...prev, botResponse])
      }, 500)
      return
    }

    setIsLoading(true)
    try {
      // Usar los mensajes actuales más el nuevo mensaje del usuario para el historial
      // Si es un chat nuevo, messages estará vacío o contendrá el mensaje anterior si no se ha actualizado el estado
      // Por eso es mejor construir el historial explícitamente
      const historyForApi = activeId 
        ? messages 
        : [] // Para un chat nuevo, el historial previo es vacío

      const res = await api.chat(textToSend, historyForApi)
      const botMessage: Message = {
        role: 'model',
        parts: [{ text: res.response }],
        usage: res.usage
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error in chat:', error)
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: 'Lo siento, hubo un problema con la conexión. ¿Podrías intentar de nuevo?' }]
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessageContent = (msg: Message) => {
    let text = msg.parts[0]?.text || ''
    
    // Si el texto es un objeto (no debería pasar tras el fix de tipos), intentar stringificarlo
    if (typeof text !== 'string') {
      try {
        text = JSON.stringify(text)
      } catch (e) {
        text = 'Error: Contenido no procesable'
      }
    }

    // Extraer productos marcados con [[Nombre]]
    const parts = text.split(/(\[\[.*?\]\])/g)
    const products: string[] = []

    const cleanText = parts.map(part => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const productName = part.slice(2, -2)
        products.push(productName)
        return `**${productName}**` // En el texto lo mostramos en negrita
      }
      return part
    }).join('')

    return (
      <div className="space-y-3">
        <ReactMarkdown 
          components={{
            h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-4 mb-2 first:mt-0" {...props} />,
            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="mb-0" {...props} />,
          }}
        >
          {cleanText}
        </ReactMarkdown>

        {products.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            {products.map((product, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-[10px] h-7 gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary"
                onClick={() => {
                  navigate(`/productos?search=${encodeURIComponent(product)}`)
                  if (window.innerWidth < 768) setIsOpen(false)
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Ver {product}
              </Button>
            ))}
          </div>
        )}

        {/* Info de uso para Admins */}
        {user?.role === 'ADMIN' && msg.role === 'model' && msg.usage && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-3 text-[9px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Prompt: {msg.usage.promptLength} ch
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" /> Response: {msg.usage.responseLength} ch
            </span>
          </div>
        )}
      </div>
    )
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[450px] sm:w-[500px] h-[650px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative"
          >
            {/* Sidebar Historial (Overlay) */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  className="absolute inset-y-0 left-0 w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-xl"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <History className="w-4 h-4" /> Historial
                    </h4>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(false)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 mb-4 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                      onClick={() => createNewChat()}
                    >
                      <Plus className="w-4 h-4" /> Nuevo Chat
                    </Button>

                    {conversations.length === 0 ? (
                      <p className="text-[10px] text-center text-slate-400 py-8">No hay chats previos</p>
                    ) : (
                      conversations.map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveId(conv.id)
                            setShowHistory(false)
                          }}
                          className={cn(
                            "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                            activeId === conv.id 
                              ? "bg-primary text-slate-900" 
                              : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-medium truncate pr-2">{conv.title}</span>
                            <span className="text-[9px] opacity-60">
                              {new Date(conv.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                              activeId === conv.id ? "hover:bg-black/10" : "hover:bg-red-500/10 hover:text-red-500"
                            )}
                            onClick={(e) => deleteConversation(conv.id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-4 bg-primary text-slate-900 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hover:bg-black/10 rounded-full"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs leading-none">Asistente de Salud AI</h3>
                    <p className="text-[9px] opacity-80 mt-1 truncate max-w-[150px]">
                      {activeId ? conversations.find(c => c.id === activeId)?.title : "Nueva consulta"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-black/10 rounded-full"
                  onClick={() => {
                    setActiveId(null)
                    setMessages([])
                  }}
                  title="Nuevo Chat"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-black/10 rounded-full text-green-600 dark:text-green-400"
                  onClick={() => openWhatsApp()}
                  title="Contactar por WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-black/10 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-950/50"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">¡Hola! Soy tu asesor experto</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Puedo ayudarte a encontrar el suplemento ideal. ¿Qué buscas hoy?
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q.query, q.staticResponse)}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <q.icon className="w-4 h-4" />
                        </div>
                        {q.label}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => openWhatsApp()}
                      className="flex items-center gap-3 p-3 bg-green-500/10 dark:bg-green-500/5 rounded-xl border border-green-500/20 hover:border-green-500 hover:bg-green-500/20 transition-all text-left text-xs font-bold text-green-600 dark:text-green-400"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      Hablar con Ana (WhatsApp)
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Horarios de Atención</p>
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Lunes a Viernes: 8:00 AM - 8:00 PM</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Sábado: 9:00 AM - 2:00 PM</p>
                    </div>
                  </div>

                  {conversations.length > 0 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-6 text-slate-400 text-[10px] uppercase tracking-wider font-bold"
                      onClick={() => setShowHistory(true)}
                    >
                      <History className="w-3 h-3 mr-1" /> Ver chats previos
                    </Button>
                  )}
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div 
                    className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-primary text-slate-900 rounded-tr-none" 
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700 prose prose-slate dark:prose-invert prose-sm max-w-none"
                    )}
                  >
                    {msg.role === 'model' ? renderMessageContent(msg) : msg.parts[0].text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name || 'Usuario'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu consulta aquí..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all pr-12"
                />
                <Button 
                  size="icon" 
                  className="absolute right-1 w-10 h-10 rounded-lg bg-primary hover:bg-primary/90 text-slate-900 flex items-center justify-center"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[9px] text-center text-slate-400 mt-2">
                Asistente IA. No reemplaza el consejo médico profesional.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true)
        }}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-slate-900 text-white" : "bg-primary text-slate-900"
        )}
      >
        {isOpen ? <MessageSquare className="w-6 h-6" /> : <MessageSquare className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white"></span>
          </span>
        )}
      </motion.button>
    </div>
  )
}
