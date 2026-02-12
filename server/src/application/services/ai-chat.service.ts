import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai'
import { config } from '../../shared/config/index.js'
import { InventoryService } from './inventory.service.js'

export interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string; functionCall?: any; functionResponse?: any }[]
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
      model: 'gemini-2.0-flash-001',
    })
  }

  private async getTools() {
    return [
      {
        functionDeclarations: [
          {
            name: "create_product",
            description: "Registra un nuevo producto en el catálogo. Requiere confirmación previa del usuario con la tabla de datos.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nombre completo" },
                brand: { type: "string", description: "Marca" },
                description: { type: "string", description: "Descripción técnica" },
                format: { type: "string", description: "Polvo, Cápsulas, etc." },
                weight: { type: "string", description: "Peso (ej: 300g)" },
                categoryIds: { type: "array", items: { type: "string" } }
              },
              required: ["name", "brand", "description", "format"]
            }
          },
          {
            name: "get_categories",
            description: "Obtiene IDs de categorías.",
            parameters: { type: "object", properties: {} }
          }
        ]
      }
    ]
  }

  private async executeFunction(name: string, args: any, userId?: string) {
    console.log(`[AIChatService] Executing function: ${name}`, args)
    try {
      if (name === 'create_product') {
        // Si no vienen categorías, intentamos buscar la de 'Vitaminas y Suplementos' o 'Deporte y Energía'
        if (!args.categoryIds || args.categoryIds.length === 0) {
          const { categories } = await (this.inventoryService as any).categoryRepo.findAll()
          const defaultCat = categories.find((c: any) => 
            c.name.toLowerCase().includes('suplementos') || 
            c.name.toLowerCase().includes('deporte')
          )
          args.categoryIds = defaultCat ? [defaultCat.id] : []
        }

        const product = await this.inventoryService.createProduct(args, userId)
        return { 
          success: true, 
          message: `Producto "${product.name}" registrado con éxito. SKU: ${product.sku}.`,
          product: { id: product.id, sku: product.sku, name: product.name }
        }
      }

      if (name === 'get_categories') {
        const { categories } = await (this.inventoryService as any).categoryRepo.findAll()
        return { 
          categories: categories.map((c: any) => ({ id: c.id, name: c.name }))
        }
      }

      throw new Error(`Función no implementada: ${name}`)
    } catch (error: any) {
      console.error(`Error executing ${name}:`, error)
      return { success: false, error: error.message || 'Error desconocido' }
    }
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
        return `- ${p.name}: Marca: ${p.brand}. Precio: $${p.price}. Categorías: ${categories}. Descripción: ${p.description.substring(0, 150)}.`
      }).join('\n')

      return context
    } catch (error) {
      console.error('Error fetching product context for AI:', error)
      return 'ERROR AL CARGAR EL CATÁLOGO.'
    }
  }

  private getSystemPrompt(productContext: string, isAdmin: boolean = false) {
    if (isAdmin) {
      return `SISTEMA DE GESTIÓN INTERNA - ANA'S SUPPLEMENTS (CENTRO DE MANDO)
CATÁLOGO DE PRODUCTOS (CONTEXTO OPERATIVO):
${productContext}

REGLAS PARA EL ADMINISTRADOR:
1. Eres el "Analista de Inteligencia Operativa".
2. Tu misión es AUTOMATIZAR el registro. NUNCA pidas al administrador datos que puedas encontrar tú mismo.
3. FLUJO DE REGISTRO CON IMAGEN (CRÍTICO):
      - Si recibes un mensaje con el prefijo '[CONTEXTO DE ANÁLISIS PREVIO DE IMAGEN: ...]', úsalo como tu fuente primaria de datos.
      - TU DEBER es identificar el producto y USAR GOOGLE SEARCH de inmediato si falta algún dato.
      - ESTÁ PROHIBIDO responder: "Por favor proporcione los datos técnicos", "Dime la marca", etc. 
      - TÚ debes encontrar: Marca, Nombre exacto, Formato (polvo/caps), Peso/Contenido y Beneficios.
      - Una vez encontrados, presenta OBLIGATORIAMENTE la **TABLA DE PRE-REGISTRO**:
        | Campo | Información Detectada (IA + Search) |
        |-------|------------------------------------|
        | Nombre | ... |
        | Marca  | ... |
        | Formato| ... |
        | Peso   | ... |
        | Descripción | (Resumen de beneficios) |
      - Al final de la tabla, pregunta: "¿Deseas que registre este producto con estos datos?".
4. SOLO ejecuta 'create_product' cuando el usuario diga "Sí", "Confirmo", "Dale", etc.
5. ESTILO: Directo, ejecutivo, sin saludos innecesarios. Usa tablas Markdown para todo.`
    }

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

ESTILO:
- Sé EXTREMADAMENTE CONCISO (máximo 2-3 frases).
- No saludes de forma larga.
- No des consejos médicos profundos, solo menciona el producto y su uso básico.
- Finaliza siempre con: "_Consulte a su médico._".
- Responde siempre en español.`
  }

  async analyzeProductImage(image: string) {
    if (!config.googleAiKey) throw new Error('API Key missing')
    
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-001'
      })

      let mimeType = 'image/jpeg'
      let data = image
      if (image.includes(';base64,')) {
        const parts = image.split(';base64,')
        mimeType = parts[0].split(':')[1] || 'image/jpeg'
        data = parts[1]
      }

      const prompt = `
      ANALIZA ESTA IMAGEN DE PRODUCTO PARA REGISTRO EN UN ECOMMERCE DE SUPLEMENTOS Y BIENESTAR.
      
      TAREA 1: Determina si la imagen es un suplemento, vitamina, proteína, producto deportivo o de salud/bienestar.
      TAREA 2: Si es válido, extrae toda la información técnica visible o conocida sobre este producto.
      
      RETORNA EXCLUSIVAMENTE UN OBJETO JSON CON ESTA ESTRUCTURA:
      {
        "isValid": true o false (false si es comida chatarra, ropa, gadgets, mascotas, personas sin producto, etc.),
        "rejectionReason": "Breve explicación si isValid es false",
        "name": "Nombre completo",
        "brand": "Marca",
        "format": "Polvo/Cápsulas/etc",
        "weight": "Peso/Contenido",
        "description": "Descripción técnica breve",
        "benefits": ["beneficio 1", "beneficio 2"]
      }
      `;

      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType, data } }
      ])
      
      const responseText = result.response.text()
      // Extraer JSON si hay markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      return JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch (error: any) {
      console.error('[AIChatService] Error analyzing image:', {
        message: error.message,
        stack: error.stack,
        details: error.errorDetails || error.details,
        status: error.status,
        statusText: error.statusText
      })
      
      // Manejo específico de errores de cuota
      if (error.status === 429) {
        throw new Error('Has alcanzado el límite de uso de la API de Gemini. Por favor, espera unos minutos antes de intentar nuevamente.')
      }
      
      throw error
    }
  }

  async chat(message: string, history: ChatMessage[] = [], isAdmin: boolean = false, userId?: string, image?: string) {
    console.log('[AIChatService] Chat request:', { message: message?.substring(0, 50), historyLength: history.length, isAdmin, hasImage: !!image });
    if (!config.googleAiKey) {
      return {
        response: "Lo siento, el servicio de chat no está configurado correctamente (falta la API Key).",
        usage: { promptLength: 0, responseLength: 0 }
      }
    }

    try {
      const productContext = await this.getProductContext()
      const systemPrompt = this.getSystemPrompt(productContext, isAdmin)
      const tools = isAdmin ? await this.getTools() : []

      console.log('[AIChatService] Prompt generated. Context length:', productContext.length, 'Admin mode:', isAdmin, 'Has image:', !!image)

      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-001',
        systemInstruction: systemPrompt,
        tools: (isAdmin && !image) ? tools as any : undefined
      })
      
      console.log('[AIChatService] Model instance created. Admin:', isAdmin, 'Has image:', !!image, 'Tools applied:', (isAdmin && !image) ? 'YES' : 'NO')
      
      const validHistory = history.filter(msg => 
        (msg.role === 'user' || msg.role === 'model') && 
        msg.parts && msg.parts.length > 0
      ).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: msg.parts.map((p: any) => {
          if (p.text) return { text: p.text };
          if (p.functionCall) return { functionCall: p.functionCall };
          if (p.functionResponse) return { functionResponse: p.functionResponse };
          return null;
        }).filter(Boolean) as any[]
      }));

      if (validHistory.length > 0 && validHistory[0].role !== 'user') {
        validHistory.shift()
      }

      // IMPORTANTE: Si hay una imagen, Gemini no permite usar chatSession.sendMessage con imágenes
      // si la sesión de chat ya tiene historial (a veces da error de "multimodal not supported in chat").
      // Para registros de productos con imagen, lo mejor es usar generateContent directamente o
      // asegurar que el mensaje inicial incluya la imagen.
      
      if (image) {
        console.log('[AIChatService] Multimodal request detected. Processing image...')
        const messageParts: any[] = []
        
        try {
          let mimeType = 'image/jpeg'
          let data = image

          if (image.includes(';base64,')) {
            const parts = image.split(';base64,')
            mimeType = parts[0].split(':')[1] || 'image/jpeg'
            data = parts[1]
          }
          
          console.log('[AIChatService] IMAGE_DATA_DIAGNOSTIC:', {
            mimeType,
            dataPrefix: data.substring(0, 50),
            dataLength: data.length,
            isPureBase64: /^[A-Za-z0-9+/=]+$/.test(data.substring(0, 100).replace(/\s/g, ''))
          })

          messageParts.push({
            inlineData: { mimeType, data }
          })
        } catch (e) {
          console.error('[AIChatService] Error parsing image:', e)
        }

        // Instrucción radicalmente directa para forzar el análisis
        const multimodalPrompt = `
        [INSTRUCCIÓN CRÍTICA: REGISTRO DE PRODUCTO POR IMAGEN]
        ESTÁS VIENDO UNA IMAGEN REAL DE UN PRODUCTO. NO DIGAS QUE NO PUEDES VERLA.
        
        PROTOCOLO OBLIGATORIO:
        1. MIRA la imagen. Extrae el nombre y la marca.
        2. MUESTRA esta tabla Markdown con los datos propuestos:
           | Campo | Valor Propuesto |
           | :--- | :--- |
           | **Nombre** | [Nombre detectado] |
           | **Marca** | [Marca detectada] |
           | **Formato** | [Polvo/Cápsulas/etc] |
           | **Peso** | [Ej: 500g] |
           | **Descripción** | [Resumen técnico] |
        
        3. PREGUNTA: "¿Deseas registrar este producto?".
        
        ADVERTENCIA: NUNCA digas "no puedo procesar imágenes" o "indícame el nombre". Tienes la imagen delante de ti. ÚSALA.
        
        MENSAJE DEL USUARIO: ${message || "Registra este producto."}
        `;
        
        messageParts.push({ text: multimodalPrompt })

        // Para multimodal, limpiamos el historial para evitar confusiones de capacidades
        const contents = [
          { role: 'user', parts: messageParts }
        ]

        console.log('[AIChatService] Sending generateContent (Fresh Context Multimodal).')
        let result = await modelWithSystem.generateContent({ contents })
        let response = await result.response
        
        // Manejar funciones (mismo loop)
        let maxIterations = 5
        while (response.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall) && maxIterations > 0) {
          const functionCalls = response.candidates[0].content.parts.filter((p: any) => p.functionCall)
          const functionResponses = []

          const sessionForFunctions = modelWithSystem.startChat({
            history: [
              ...contents,
              { role: 'model', parts: response.candidates[0].content.parts }
            ]
          })

          for (const call of functionCalls) {
            const fc = (call as any).functionCall
            const { name, args } = fc
            const functionResult = await this.executeFunction(name, args, userId)
            functionResponses.push({
              functionResponse: { name, response: functionResult }
            })
          }

          const resultFn = await sessionForFunctions.sendMessage(functionResponses)
          response = await resultFn.response
          maxIterations--
        }

        const text = response.text()
        return {
          response: text,
          usage: { promptLength: systemPrompt.length + (message?.length || 0), responseLength: text.length }
        }
      }

      // Si no hay imagen, procedemos con el chat normal
      const chatSession = modelWithSystem.startChat({
        history: validHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.parts
        })),
      })

      const messageParts: any[] = [{ text: message }]
      
      // LOG DE DIAGNÓSTICO PARA CHAT NORMAL
      console.log('[AIChatService] Sending sendMessage (Normal Chat). History length:', validHistory.length)
      
      let result = await chatSession.sendMessage(messageParts)
      let response = await result.response
      
      // Manejar múltiples llamadas a funciones si es necesario (loop de razonamiento)
      let maxIterations = 5
      while (response.candidates?.[0]?.content?.parts?.some((p: any) => p.functionCall) && maxIterations > 0) {
        const functionCalls = response.candidates[0].content.parts.filter((p: any) => p.functionCall)
        const functionResponses = []

        for (const call of functionCalls) {
          const fc = (call as any).functionCall
          const { name, args } = fc
          const functionResult = await this.executeFunction(name, args, userId)
          functionResponses.push({
            functionResponse: {
              name,
              response: functionResult
            }
          })
        }

        result = await chatSession.sendMessage(functionResponses)
        response = await result.response
        maxIterations--
      }

      const text = response.text()
      
      return {
        response: text,
        usage: {
          promptLength: systemPrompt.length + message.length,
          responseLength: text.length
        }
      }
    } catch (error: any) {
      console.error('[AIChatService] Error in chat:', {
        message: error.message,
        details: error.errorDetails || error.details,
        status: error.status
      })

      // Manejo de cuota para el chat normal
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        return {
          response: "Has alcanzado el límite de uso de la API de Gemini. Por favor, espera unos minutos antes de intentar nuevamente.",
          usage: { promptLength: 0, responseLength: 0 },
          quotaExceeded: true
        }
      }

      return {
        response: "Hubo un error procesando tu solicitud. Por favor intenta de nuevo.",
        usage: { promptLength: 0, responseLength: 0 }
      }
    }
  }
}
