import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  Command,
  Cpu,
  History,
  Plus,
  Trash2,
  MessageSquare,
  Image as ImageIcon,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: number;
  type?: 'text' | 'insight' | 'action';
  metadata?: any;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export function AdminAIHub() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = 'anas_supplements_admin_chat_history';
  const ACTIVE_CHAT_KEY = 'anas_supplements_admin_active_chat_id';

  // Cargar historial y chat activo al iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        
        // Si hay un ID guardado y existe en las conversaciones, activarlo
        if (savedActiveId && parsed.find((c: ChatConversation) => c.id === savedActiveId)) {
          setActiveId(savedActiveId);
        }
      } catch (e) {
        console.error('Error parsing admin chat history', e);
      }
    }
  }, []);

  // Guardar conversaciones cuando cambien
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Guardar ID del chat activo cuando cambie
  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  }, [activeId]);

  // Actualizar mensajes cuando cambie la conversación activa
  useEffect(() => {
    if (activeId) {
      const active = conversations.find(c => c.id === activeId);
      if (active) {
        setMessages(active.messages);
      }
    } else {
      setMessages([]);
    }
  }, [activeId]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const createNewChat = (initialMessage: string, initialMessages: Message[] = []) => {
    const newChat: ChatConversation = {
      id: Date.now().toString(),
      title: initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : ''),
      messages: initialMessages,
      createdAt: Date.now()
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newChat.id);
    return newChat.id;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        
        // Iniciar análisis automático
        setIsAnalyzingImage(true);
        setAnalysisResult(null);
        try {
          console.log('[DEBUG_CLIENT] Iniciando análisis previo de imagen...');
          const result = await api.analyzeImage(base64);
          console.log('[DEBUG_CLIENT] Análisis completado:', result);
          
          if (result.isValid === false) {
            alert(`Imagen rechazada: ${result.rejectionReason || 'Este producto no pertenece a la temática de suplementos y bienestar.'}`);
            setSelectedImage(null);
            setAnalysisResult(null);
          } else {
            setAnalysisResult(result);
          }
        } catch (error: any) {
          console.error('Error al analizar imagen:', error);
          
          // Manejo específico de errores de cuota
          if (error.quotaExceeded || error.message?.includes('límite') || error.message?.includes('quota')) {
            alert('Has alcanzado el límite de uso de la API de Gemini. Por favor, espera unos minutos antes de intentar nuevamente.');
          } else {
            alert('Error al analizar la imagen. Por favor, intenta nuevamente.');
          }
          
          // Limpiar la imagen en caso de error
          setSelectedImage(null);
          setAnalysisResult(null);
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    
    // Bloqueos de seguridad
    if (isLoading || isAnalyzingImage) return;
    if (!textToSend.trim() && !selectedImage) return;
    
    // Si hay una imagen pero no hay resultado de análisis (o el análisis falló), bloqueamos.
    // El análisis ya hace el alert y borra el selectedImage si es inválido, 
    // pero esto es una doble capa de seguridad.
    if (selectedImage && !analysisResult) {
      console.warn('[DEBUG_CLIENT] Bloqueado: Imagen seleccionada sin análisis completado.');
      return;
    }

    const userMsg: Message = {
      role: 'user',
      parts: [
        { text: textToSend },
        ...(selectedImage ? [{ text: "[Imagen]", image: selectedImage } as any] : [])
      ],
      timestamp: Date.now(),
      metadata: selectedImage ? { image: selectedImage, analysis: analysisResult } : undefined
    };

    let currentActiveId = activeId;
    if (!currentActiveId) {
      currentActiveId = createNewChat(textToSend || 'Imagen adjunta', [userMsg]);
    } else {
      setMessages(prev => [...prev, userMsg]);
      setConversations(prev => prev.map(c => 
        c.id === currentActiveId ? { ...c, messages: [...c.messages, userMsg] } : c
      ));
    }

    if (!textOverride) setInput('');
    const imageToSend = selectedImage;
    const currentAnalysis = analysisResult;
    
    setSelectedImage(null);
    setAnalysisResult(null);
    setIsLoading(true);

    try {
      console.log('[DEBUG_CLIENT] Iniciando petición adminChat...', { 
        textToSend, 
        hasImage: !!imageToSend,
        hasAnalysis: !!currentAnalysis
      });
      
      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: m.parts.map(p => ({ text: p.text })) // Clean parts for API
      }));

      const res = await api.adminChat(textToSend, historyForApi, imageToSend, currentAnalysis);
      
      if (!res.response) {
        throw new Error('Respuesta vacía del servidor');
      }

      console.log('[DEBUG_CLIENT] Respuesta recibida:', { 
        length: res.response.length,
        hasResponse: !!res.response 
      });
        console.log('[DEBUG_CLIENT] Respuesta adminChat recibida:', !!res);

        const botMsg: Message = {
          role: 'model',
          parts: [{ text: res.response }],
          timestamp: Date.now(),
          type: res.response.includes('[[') ? 'insight' : 'text'
        };

      setMessages(prev => [...prev, botMsg]);
      setConversations(prev => prev.map(c => 
        c.id === currentActiveId ? { ...c, messages: [...c.messages, botMsg] } : c
      ));
    } catch (error) {
      console.error('Admin AI Error:', error);
      const errorMsg: Message = {
        role: 'model',
        parts: [{ text: 'Error de comunicación con el núcleo de IA. Verifique los logs del sistema.' }],
        timestamp: Date.now(),
        type: 'action'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8 overflow-hidden">
      {/* Panel Lateral Izquierdo: Historial (Nuevo) */}
      <div className="w-72 flex flex-col bg-white dark:bg-[#0a0f0a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historial</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
            onClick={() => {
              setActiveId(null);
              setMessages([]);
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[10px] text-slate-400 font-medium italic">Sin conversaciones previas</p>
              </div>
            ) : (
              conversations.map((chat) => (
                <div 
                  key={chat.id}
                  className={cn(
                    "group relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
                    activeId === chat.id 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-transparent"
                  )}
                  onClick={() => setActiveId(chat.id)}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="text-xs font-medium truncate pr-6">{chat.title}</span>
                  
                  <button 
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversations(prev => prev.filter(c => c.id !== chat.id));
                      if (activeId === chat.id) {
                        setActiveId(null);
                        setMessages([]);
                      }
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Panel Central: Terminal de Comando */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0a0f0a] rounded-2xl border border-slate-200 dark:border-emerald-900/30 shadow-2xl overflow-hidden relative transition-colors duration-300">
        {/* Header de la Terminal */}
        <div className="h-14 border-b border-slate-200 dark:border-emerald-900/30 bg-slate-50/50 dark:bg-emerald-950/20 flex items-center justify-between px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
            </div>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-emerald-900/30 mx-3" />
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-emerald-500/70">Asistente AI</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[9px] uppercase tracking-tighter">
            Chat Online
          </Badge>
        </div>

        {/* Area de Mensajes */}
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          <div className="space-y-10 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                <div className="p-5 bg-emerald-500/10 rounded-full mb-8">
                  <Cpu size={48} className="text-emerald-500 dark:text-emerald-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-emerald-50 mb-3 tracking-tight">Asistente de Inteligencia Administrativa</h2>
                <p className="text-slate-500 dark:text-emerald-500/60 text-sm max-w-sm mx-auto leading-relaxed">
                  Consulte inventario, analice ventas o solicite reportes operativos en lenguaje natural.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-5",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === 'model' && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot size={20} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm border ${ 
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-emerald-950/20 border-slate-200 dark:border-emerald-900/30 text-slate-900 dark:text-emerald-50' 
                    : msg.type === 'insight'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-900 dark:text-emerald-50'
                      : 'bg-slate-100 dark:bg-emerald-900/10 border-slate-200 dark:border-emerald-900/20 text-slate-900 dark:text-emerald-50'
                } prose prose-slate dark:prose-invert max-w-none
                  prose-p:leading-relaxed prose-p:my-0
                  prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400
                  prose-pre:bg-slate-900 dark:prose-pre:bg-black/40 prose-pre:rounded-xl
                  prose-pre:border prose-pre:border-slate-300 dark:prose-pre:border-emerald-900/30
                  prose-table:border-collapse prose-table:w-full prose-table:my-8
                  prose-th:border prose-th:border-slate-300 dark:prose-th:border-emerald-900/30 prose-th:p-3 prose-th:bg-slate-200/50 dark:prose-th:bg-emerald-900/40
                  prose-td:border prose-td:border-slate-300 dark:prose-td:border-emerald-900/20 prose-td:p-3`}>
                  {msg.role === 'user' && (msg as any).metadata?.image && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-emerald-500/30">
                      <img 
                        src={(msg as any).metadata.image} 
                        alt="User upload" 
                        className="max-w-full h-auto max-h-64 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.parts[0]?.text || ''}
                  </ReactMarkdown>
                </div>

                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-emerald-900/30 border border-slate-300 dark:border-emerald-800/50 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <User size={20} className="text-slate-600 dark:text-emerald-400" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-5 justify-start">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-sm">
                  <Loader2 size={20} className="text-emerald-500 dark:text-emerald-400 animate-spin" />
                </div>
                <div className="bg-slate-100 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/20 rounded-2xl px-6 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            
            {/* Ancla para el auto-scroll */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </ScrollArea>

        {/* Input de Comandos */}
        <div className="p-8 bg-slate-50/80 dark:bg-emerald-950/10 border-t border-slate-200 dark:border-emerald-900/30 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto mb-4 flex items-center gap-4">
            {selectedImage && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-lg group">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                {isAnalyzingImage && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
                    <Loader2 size={24} className="text-emerald-500 animate-spin" />
                    <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-tighter">Analizando</span>
                  </div>
                )}
                {!isAnalyzingImage && (
                  <button 
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                )}
                {!isAnalyzingImage && analysisResult && (
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-500 py-0.5 flex justify-center">
                    <Zap size={10} className="text-white fill-white" />
                  </div>
                )}
              </div>
            )}
            {isAnalyzingImage && (
              <div className="flex-1 animate-pulse">
                <div className="h-2 w-48 bg-emerald-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-[loading_1.5s_ease-in-out_infinite]" />
                </div>
                <p className="text-xs text-emerald-500/60 mt-2 font-medium">Extrayendo datos técnicos y comerciales...</p>
              </div>
            )}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center gap-3">
              <Command size={20} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-emerald-900/30 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                title="Subir imagen"
              >
                <ImageIcon size={20} />
              </button>
            </div>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={selectedImage ? "Describe qué quieres hacer con esta imagen..." : "Escriba un comando o consulta operativa..."}
              className="w-full bg-white dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-900/30 text-slate-900 dark:text-emerald-50 pl-28 pr-16 py-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:emerald-500/40 placeholder:font-medium shadow-inner"
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <Button 
                onClick={() => handleSend()}
                disabled={
                  isLoading || 
                  isAnalyzingImage || 
                  (!input.trim() && !selectedImage) || 
                  (!!selectedImage && !analysisResult)
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white h-full px-6 rounded-xl shadow-xl shadow-emerald-600/20 border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzingImage ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </Button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-4 flex flex-wrap items-center gap-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-emerald-500/50 uppercase tracking-widest">
              <Zap size={12} className="text-amber-500 dark:text-amber-400" />
              Sugerencias:
            </div>
            <button 
              onClick={() => handleSend('¿Qué productos tienen bajo stock?')}
              className="text-[10px] font-bold text-slate-500 dark:text-emerald-500/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-tight bg-slate-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-900/20 hover:border-emerald-500/30"
            >
              Stock Crítico
            </button>
            <button 
              onClick={() => handleSend('Resumen de ventas de hoy')}
              className="text-[10px] font-bold text-slate-500 dark:text-emerald-500/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-tight bg-slate-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-900/20 hover:border-emerald-500/30"
            >
              Ventas Hoy
            </button>
            <button 
              onClick={() => handleSend('Extrae la información de este producto para registrarlo en el catálogo.')}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors uppercase tracking-tight bg-emerald-500/10 dark:bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40"
            >
              Nuevo Producto
            </button>
            <button 
              onClick={() => handleSend('¿Cuáles son las categorías disponibles?')}
              className="text-[10px] font-bold text-slate-500 dark:text-emerald-500/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-tight bg-slate-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-900/20 hover:border-emerald-500/30"
            >
              Categorías
            </button>
            <button 
              onClick={() => handleSend('Analizar rentabilidad del inventario actual')}
              className="text-[10px] font-bold text-slate-500 dark:text-emerald-500/70 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-tight bg-slate-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-900/20 hover:border-emerald-500/30"
            >
              Rentabilidad
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
