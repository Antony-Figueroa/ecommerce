import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai'
import { config } from '../../shared/config/index.js'
import { InventoryService } from './inventory.service.js'

export interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export class AIChatService {
  private genAI: GoogleGenerativeAI
  private model: any
  private inventoryService: InventoryService

  constructor(inventoryService: InventoryService) {
    this.inventoryService = inventoryService
    console.log('[AIChatService] Initializing with API Key:', config.googleAiKey ? 'PRESENT' : 'MISSING')
    this.genAI = new GoogleGenerativeAI(config.googleAiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
    })
  }

  private async getProductContext() {
    try {
      // Obtenemos todos los productos activos sin límite estricto para tener contexto completo
      const products = await this.inventoryService.getPublicProducts({ limit: 500 })
      
      if (!products || products.length === 0) {
        console.warn('[AIChatService] No products found in database for context.')
        return 'EL CATÁLOGO ESTÁ ACTUALMENTE VACÍO.'
      }

      console.log(`[AIChatService] Found ${products.length} products for context.`) 

      // Mapeo detallado para que la IA tenga toda la info necesaria
      const context = (products as any[]).map((p: any) => {
        const categories = p.categories?.map((c: any) => c.name).join(', ') || 'N/A'
        return `- [[${p.name}]]: Marca: ${p.brand}. Precio: $${p.price}. Categorías: ${categories}. Descripción: ${p.description.substring(0, 150)}.`
      }).join('\n')

      return context
    } catch (error) {
      console.error('Error fetching product context for AI:', error)
      return 'ERROR AL CARGAR EL CATÁLOGO.'
    }
  }

  private getSystemPrompt(productContext: string) {
    return `CATÁLOGO REAL DE PRODUCTOS (TU ÚNICA FUENTE DE VERDAD):
${productContext}

REGLAS CRÍTICAS DE RESPUESTA:
1. Eres el "Asistente de Salud AI" de Ana's Supplements.
2. TU ÚNICA MISIÓN es responder sobre productos que EXISTAN en el "CATÁLOGO REAL" de arriba.
3. SI UN PRODUCTO O MARCA NO ESTÁ EN EL CATÁLOGO REAL:
   - Di: "Lo sentimos, actualmente no tenemos productos de esa marca/tipo en nuestro catálogo físico."
   - PROHIBIDO inventar stock, sugerir que "probablemente" lo tengamos, o decir que visitemos la web para ver si hay más.
   - NUNCA menciones marcas populares (como Nutrex, Optimum Nutrition, etc.) si no están en la lista de arriba.
4. NUNCA digas: "No tengo acceso en tiempo real", "Soy una IA", "Mi entrenamiento llega hasta...", o "Visita la web para confirmar". TÚ ERES EL CATÁLOGO.
5. Si el usuario pregunta por una marca específica (ej: Nutrex), busca en el CATÁLOGO REAL. Si no hay nada, aplica la regla 3.
6. Usa OBLIGATORIAMENTE [[Nombre Exacto]] para cada producto mencionado. Ejemplo: "Contamos con [[Proteína Whey]] ($50)".

ESTILO:
- Sé EXTREMADAMENTE CONCISO (máximo 2-3 frases).
- No saludes de forma larga.
- No des consejos médicos profundos, solo menciona el producto y su uso básico.
- Finaliza siempre con: "_Consulte a su médico._".
- Responde siempre en español.`
  }

  async chat(message: string, history: ChatMessage[] = []) {
    if (!config.googleAiKey) {
      return {
        response: "Lo siento, el servicio de chat no está configurado correctamente (falta la API Key).",
        usage: { promptLength: 0, responseLength: 0 }
      }
    }

    try {
      const productContext = await this.getProductContext()
      const systemPrompt = this.getSystemPrompt(productContext)

      console.log('[AIChatService] Prompt generated. Context length:', productContext.length)

      // Usamos systemInstruction para inyectar el prompt de sistema de forma robusta
      // Simplificamos a string para evitar problemas de tipos/roles
      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        systemInstruction: systemPrompt
      })
      
      // Validar que el historial sea válido para Gemini
      const validHistory = history.filter(msg => 
        (msg.role === 'user' || msg.role === 'model') && 
        msg.parts && msg.parts.length > 0 && msg.parts[0].text
      )

      // Asegurar que el historial empiece con 'user' si no está vacío
      if (validHistory.length > 0 && validHistory[0].role !== 'user') {
        validHistory.shift()
      }

      const chatSession = modelWithSystem.startChat({
        history: validHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.parts
        })),
      })

      const result = await chatSession.sendMessage(message)
      const response = await result.response
      const text = response.text()
      
      return {
        response: text,
        usage: {
          promptLength: systemPrompt.length + message.length,
          responseLength: text.length
        }
      }
    } catch (error: any) {
      console.error('Error in AIChatService:', error)
      return {
        response: `Lo siento, hubo un error al procesar tu consulta (${error.message || 'Error desconocido'}).`,
        usage: { promptLength: 0, responseLength: 0 }
      }
    }
  }
}
