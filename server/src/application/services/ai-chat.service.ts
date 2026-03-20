import OpenAI from 'openai'
import { config } from '../../shared/config/index.js'
import { InventoryService } from './inventory.service.js'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_calls?: any[]
  tool_call_id?: string
  name?: string
}

export class AIChatService {
  private openai: OpenAI
  private inventoryService: InventoryService

  constructor(inventoryService: InventoryService) {
    this.inventoryService = inventoryService
    console.log(`[AIChatService] Initializing with ${config.aiModel} (OpenAI Compatible API)`)
    console.log('[AIChatService] Base URL:', config.aiBaseUrl)
    console.log('[AIChatService] Model:', config.aiModel)
    console.log('[AIChatService] API Key defined:', !!config.aiApiKey)
    if (config.aiApiKey) {
      console.log('[AIChatService] API Key prefix:', config.aiApiKey.substring(0, 7) + '...')
    }
    
    this.openai = new OpenAI({
      apiKey: config.aiApiKey,
      baseURL: config.aiBaseUrl
    })
  }

  async createChatCompletion(messages: any[]) {
    try {
      console.log('[AIChatService] Making request to:', config.aiBaseUrl)
      console.log('[AIChatService] With model:', config.aiModel)
      
      const response = await this.openai.chat.completions.create({
        model: config.aiModel,
        messages: messages,
        temperature: 0.7,
      })

      console.log('[AIChatService] Success! Usage:', response.usage)
      return response.choices[0].message.content
    } catch (error: any) {
      console.error('[AIChatService] Error in createChatCompletion:')
      if (error.status) {
        console.error('[AIChatService] HTTP Status:', error.status)
      }
      if (error.response) {
        console.error('[AIChatService] Response Data:', JSON.stringify(error.response.data || error.response, null, 2))
      }
      console.error('[AIChatService] Error Message:', error.message)
      throw error
    }
  }

  private getTools(): OpenAI.Chat.ChatCompletionTool[] {
    return [
      {
        type: "function",
        function: {
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
        }
      },
      {
        type: "function",
        function: {
          name: "get_categories",
          description: "Obtiene IDs de categorías.",
          parameters: { type: "object", properties: {} }
        }
      }
    ]
  }

  private async executeFunction(name: string, args: any, userId?: string) {
    console.log(`[AIChatService] Executing function: ${name}`, args)
    try {
      if (name === 'create_product') {
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
        const categories = await (this.inventoryService as any).categoryRepo.findAll()
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
      console.log('[AIChatService] Fetching product context...');
      const result = await this.inventoryService.getPublicProducts({ limit: 50 })
      const products = result.products
      
      if (!products || products.length === 0) {
        console.warn('[AIChatService] No products found in database for context.')
        return 'EL CATÁLOGO ESTÁ ACTUALMENTE VACÍO.'
      }

      console.log(`[AIChatService] Found ${products.length} products for context.`) 

      const context = (products as any[]).map((p: any) => {
        return `- ${p.name} (${p.brand}): $${p.price}`
      }).join('\n')

      return context
    } catch (error) {
      console.error('[AIChatService] Error fetching product context for AI:', error)
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
      - Si recibes un mensaje con el prefijo '[REGISTRO POR IMAGEN]', úsalo como tu fuente primaria de datos.
      - TU DEBER es identificar el producto y buscar información si falta algún dato.
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
5. ESTILO: Directo, ejecutivo, sin saludos innecesarios. Usa tablas Markdown para todo.
      - IMPORTANTE: Cuando menciones un producto del catálogo, ponlo entre corchetes dobles como [[Nombre del Producto]] para que el sistema lo resalte.
      - IMPORTANTE: No uses comillas invertidas extrañas para envolver las tablas o el texto.`
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
- Agrega "_Consulte a su médico._" al final SOLO si estás recomendando un producto o dando información sobre su uso. No lo incluyas en saludos o respuestas triviales.
- Responde siempre en español.
- IMPORTANTE: Cuando recomiendes un producto del catálogo, ponlo entre corchetes dobles como [[Nombre del Producto]] para que el usuario pueda verlo resaltado.
- IMPORTANTE: No uses comillas invertidas extrañas para envolver el texto.`
  }

  async analyzeProductImage(image: string) {
    if (!config.aiApiKey) throw new Error('API Key missing')
    
    try {
      // Gemma 3 is multimodal and supports vision directly
      const visionModel = config.aiModel || 'gemma-3-27b-it'
      
      let base64Image = image
      if (image.includes(';base64,')) {
        base64Image = image.split(';base64,')[1]
      }

      console.log('[AIChatService] Analyzing image with Vision model:', visionModel)

      const response = await this.openai.chat.completions.create({
        model: visionModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `
                ANALIZA ESTA IMAGEN DE PRODUCTO PARA REGISTRO EN UN ECOMMERCE DE SUPLEMENTOS Y BIENESTAR.
                
                TAREA 1: Determina si la imagen es un suplemento, vitamina, proteína, producto deportivo o de salud/bienestar.
                TAREA 2: Si es válido, extrae toda la información técnica visible o conocida sobre este producto.
                
                RETORNA EXCLUSIVAMENTE UN OBJETO JSON CON ESTA ESTRUCTURA:
                {
                  "isValid": true,
                  "rejectionReason": "Breve explicación si isValid es false",
                  "name": "Nombre completo",
                  "brand": "Marca",
                  "format": "Polvo/Cápsulas/etc",
                  "weight": "Peso/Contenido",
                  "description": "Descripción técnica breve",
                  "benefits": ["beneficio 1", "beneficio 2"]
                }` },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        // Google AI Studio OpenAI endpoint might not support response_format: { type: "json_object" } yet for all models
        // but we can try or just rely on the prompt instructions.
      })

      const responseText = response.choices[0].message.content || '{}'
      console.log('[AIChatService] Vision analysis response received')
      return JSON.parse(responseText)
    } catch (error: any) {
      console.error('[AIChatService] Error in analyzeProductImage:', error.message)
      // Fallback simple si Vision falla
      return {
        isValid: false,
        rejectionReason: "Error al procesar la imagen con el servicio de IA: " + error.message,
        name: "",
        brand: "",
        format: "",
        weight: "",
        description: "",
        benefits: []
      }
    }
  }

  async processChat(messages: ChatMessage[], isAdmin: boolean = false, userId?: string) {
    try {
      console.log(`[AIChatService] Processing chat (isAdmin: ${isAdmin})`)
      const productContext = await this.getProductContext()
      const systemPrompt = this.getSystemPrompt(productContext, isAdmin)
      
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ]

      console.log('[AIChatService] Calling Chat Completion API...')
      const response = await this.openai.chat.completions.create({
        model: config.aiModel,
        messages: fullMessages as any,
        tools: isAdmin ? this.getTools() : undefined,
        tool_choice: isAdmin ? "auto" : undefined,
        temperature: 0.7,
      })

      let assistantMessage = response.choices[0].message
      
      // Manejar llamadas a funciones (tools)
      if (isAdmin && assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`[AIChatService] Tool calls detected: ${assistantMessage.tool_calls.length}`)
        const toolMessages = [...fullMessages]
        toolMessages.push(assistantMessage as any)

        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;
          
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          
          const result = await this.executeFunction(functionName, functionArgs, userId)
          
          toolMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(result)
          } as any)
        }

        console.log('[AIChatService] Calling Chat Completion API again with tool results...')
        const secondResponse = await this.openai.chat.completions.create({
          model: config.aiModel,
          messages: toolMessages as any,
          temperature: 0.7,
        })

        return secondResponse.choices[0].message.content
      }

      return assistantMessage.content
    } catch (error: any) {
      console.error('[AIChatService] Error in processChat:', error.message)
      throw error
    }
  }

  async chat(message: string, history: any[] = [], isAdmin: boolean = false, userId?: string, image?: string) {
    console.log('[AIChatService] Chat request:', { message: message?.substring(0, 50), historyLength: history.length, isAdmin, hasImage: !!image });
    console.log('[AIChatService] Using API Key:', config.aiApiKey ? `${config.aiApiKey.substring(0, 10)}...` : 'MISSING');
    
    if (!config.aiApiKey) {
      return {
        response: "Lo siento, el servicio de chat no está configurado correctamente (falta la API Key).",
        usage: { promptLength: 0, responseLength: 0 }
      }
    }

    try {
      console.log('[AIChatService] Preparing chat messages...')
      const productContext = await this.getProductContext()
      const systemPrompt = this.getSystemPrompt(productContext, isAdmin)
      const isGoogleAI = config.aiBaseUrl?.includes('generativelanguage.googleapis.com');
      
      // Convertir historial al formato estándar de OpenAI
      const messages: any[] = []
      
      if (!isGoogleAI) {
        messages.push({ role: 'system', content: systemPrompt })
      }
      
      console.log('[AIChatService] System prompt length:', systemPrompt.length)

      history.forEach(msg => {
        // Mapeo de roles a formato OpenAI
        const role = (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : msg.role
        
        // Manejar estructura de mensajes (soporte para historial previo y estándar OpenAI)
        if (msg.parts && Array.isArray(msg.parts)) {
          msg.parts.forEach((p: any) => {
            if (p.text) messages.push({ role, content: p.text })
            // Soporte para llamadas a funciones en el historial
            if (p.functionCall) {
              const callId = p.functionCall.id || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              messages.push({
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: callId,
                  type: 'function',
                  function: {
                    name: p.functionCall.name,
                    arguments: typeof p.functionCall.args === 'string' ? p.functionCall.args : JSON.stringify(p.functionCall.args)
                  }
                }]
              })
            }
            if (p.functionResponse) {
              messages.push({
                role: 'tool',
                tool_call_id: p.functionResponse.id || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content: typeof p.functionResponse.response === 'string' ? p.functionResponse.response : JSON.stringify(p.functionResponse.response)
              })
            }
          })
        } else if (msg.content) {
          // Formato estándar OpenAI
          messages.push({ role, content: msg.content })
        }
      })

      // Agregar mensaje actual
      if (image) {
        let base64Image = image
        if (image.includes(';base64,')) {
          base64Image = image.split(';base64,')[1]
        }
        
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: `[REGISTRO POR IMAGEN] ${message || 'Analiza este producto'}` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        })
      } else {
        messages.push({ role: 'user', content: message })
      }

      // Si es Google AI, inyectar el system prompt en el primer mensaje de usuario
      if (isGoogleAI) {
        const firstUserMsgIndex = messages.findIndex(m => m.role === 'user');
        if (firstUserMsgIndex !== -1) {
          const firstUserMsg = messages[firstUserMsgIndex];
          const systemPrefix = `[INSTRUCCIONES DE SISTEMA]\n${systemPrompt}\n\n[MENSAJE DE USUARIO]\n`;
          
          if (typeof firstUserMsg.content === 'string') {
            firstUserMsg.content = systemPrefix + firstUserMsg.content;
          } else if (Array.isArray(firstUserMsg.content)) {
            const textPart = firstUserMsg.content.find((p: any) => p.type === 'text');
            if (textPart) {
              textPart.text = systemPrefix + textPart.text;
            } else {
              firstUserMsg.content.unshift({ type: 'text', text: systemPrefix });
            }
          }
        }
      }

      const tools = isAdmin ? this.getTools() : undefined
      let model = config.aiModel || 'gemma-3-27b-it'
      
      // Fallback para herramientas: Gemma 3 no soporta tools via OpenAI shim todavía
      if (tools && model.includes('gemma')) {
        console.log(`[AIChatService] Switching from ${model} to gemini-1.5-flash for tool support`)
        model = 'gemini-1.5-flash'
      }

      // Si es una consulta simple (sin tools) y el modelo es Gemma, forzamos Gemini Flash para mayor estabilidad
      if (!tools && model.includes('gemma')) {
        model = 'gemini-1.5-flash'
      }

      console.log(`[AIChatService] Calling ${model} at ${config.aiBaseUrl}...`)

      let response;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          response = await this.openai.chat.completions.create({
            model: model,
            messages,
            tools,
            tool_choice: tools ? 'auto' : undefined,
            temperature: 0.7,
          })
          break; // Si tiene éxito, salir del bucle
        } catch (error: any) {
          attempts++;
          const isQuotaError = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
          
          if (isQuotaError && attempts < maxAttempts) {
            const delay = attempts * 2000; // 2s, 4s...
            console.warn(`[AIChatService] Quota exceeded (429). Retrying in ${delay}ms... (Attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // En el segundo intento, si falló con Gemma, forzar Gemini Flash que suele tener más cuota
            if (model.includes('gemma')) {
              console.log('[AIChatService] Retrying with gemini-1.5-flash for better quota');
              model = 'gemini-1.5-flash';
            }
            continue;
          }
          throw error; // Si no es error de cuota o ya agotamos intentos, lanzar el error
        }
      }

      console.log('[AIChatService] API response received successfully')

      if (!response) {
        throw new Error('No se pudo obtener respuesta de la API tras varios intentos');
      }

      let responseMessage = response.choices[0].message
      let maxIterations = 5

      while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0 && maxIterations > 0) {
        messages.push(responseMessage as any)
        
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          const functionResponse = await this.executeFunction(functionName, functionArgs, userId)
          
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResponse)
          } as any)
        }

        let secondAttempts = 0;
        while (secondAttempts < maxAttempts) {
          try {
            response = await this.openai.chat.completions.create({
              model: model,
              messages,
              tools,
              temperature: 0.7
            })
            break;
          } catch (error: any) {
            secondAttempts++;
            const isQuotaError = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
            if (isQuotaError && secondAttempts < maxAttempts) {
              const delay = secondAttempts * 2000;
              console.warn(`[AIChatService] Quota exceeded (429) in tool loop. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw error;
          }
        }
        
        if (!response) {
          throw new Error('No se pudo obtener respuesta de la API en el bucle de herramientas');
        }

        responseMessage = response.choices[0].message
        maxIterations--
      }

      const text = responseMessage.content || ''
      
      console.log('[AIChatService] Final response length:', text.length)
      
      return {
        response: text,
        usage: {
          promptLength: systemPrompt.length + message.length,
          responseLength: text.length
        }
      }

    } catch (error: any) {
      console.error('[AIChatService] Error in chat:', error)

      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        return {
          response: "Lo siento, el servicio de IA está experimentando una alta demanda en este momento. Por favor, intenta de nuevo en unos minutos.",
          usage: { promptLength: 0, responseLength: 0 },
          quotaExceeded: true
        }
      }

      if (error.status === 403 || error.message?.includes('Access denied')) {
        return {
          response: `Error de acceso a la API (403). Es posible que el servicio esté bloqueando la conexión desde este servidor. Por favor verifica tu API Key o intenta más tarde.`,
          usage: { promptLength: 0, responseLength: 0 }
        }
      }

      return {
        response: `Hubo un error procesando tu solicitud con ${config.aiModel}. Por favor intenta de nuevo.`,
        usage: { promptLength: 0, responseLength: 0 }
      }
    }
  }
}
