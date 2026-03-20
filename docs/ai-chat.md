# 🤖 Asistente de Salud AI - Ana's Supplements

Este documento detalla la implementación, arquitectura y configuración del sistema de chat inteligente basado en IA integrado en la plataforma.

---

## 🏗️ Arquitectura del Sistema

El sistema de chat utiliza un modelo híbrido que combina inteligencia artificial generativa con datos en tiempo real extraídos directamente de la base de datos de inventario.

### Stack Tecnológico
- **Motor de IA**: Google Generative AI (`gemini-flash-latest`).
- **Backend**: Service Layer en Express.js con inyección de dependencias.
- **Frontend**: Componente React animado con Framer Motion y soporte para Markdown.
- **Persistencia de Chat**: LocalStorage para el historial del usuario (soporta sesiones de invitados y usuarios registrados).

---

## ⚙️ Funcionamiento Técnico

### 1. Generación de Contexto Dinámico
A diferencia de los chatbots tradicionales, este asistente no tiene un conocimiento estático de los productos. En cada consulta:
1. El `AIChatService` solicita al `InventoryService` la lista completa de productos activos.
2. Se genera un "Contexto de Producto" que incluye: Nombre, Marca, Precio, Categorías y una breve descripción.
3. Este contexto se inyecta en el **System Prompt**, convirtiendo a la IA en un experto actualizado al segundo sobre el stock real.

### 2. System Prompt (Reglas de Comportamiento)
El asistente opera bajo reglas estrictas para garantizar la veracidad:
- **Fuente de Verdad Única**: Solo puede hablar de productos presentes en el contexto enviado.
- **Prevención de Alucinaciones**: Si un producto o marca no existe en el catálogo, el asistente debe informar que no está disponible en lugar de inventar información.
- **Deep Linking**: El asistente encierra los nombres de productos entre dobles corchetes `[[Producto]]`. El frontend intercepta estos patrones y los convierte automáticamente en botones de navegación hacia el catálogo.
- **Estilo**: Respuestas concisas (2-3 frases), tono profesional y cierre obligatorio con una advertencia médica.

---

## 📂 Estructura de Archivos

- **Frontend**:
  - [AIChat.tsx](file:///c:/Users/Server%20Admin/Desktop/ecommerce/src/components/chat/AIChat.tsx): Interfaz de usuario, gestión de historial local y lógica de visualización.
  - [api.ts](file:///c:/Users/Server%20Admin/Desktop/ecommerce/src/lib/api.ts): Cliente para comunicación con el endpoint de chat.
- **Backend**:
  - [ai-chat.service.ts](file:///c:/Users/Server%20Admin/Desktop/ecommerce/server/src/application/services/ai-chat.service.ts): Lógica central, integración con Gemini SDK y generación de prompts.
  - [ai-chat.routes.ts](file:///c:/Users/Server%20Admin/Desktop/ecommerce/server/src/infrastructure/web/routes/ai-chat.routes.ts): Exposición del endpoint `/api/chat`.

---

## 🔐 Seguridad y Privacidad

1. **API Keys**: La clave de Google AI se almacena exclusivamente en las variables de entorno del servidor (`.env`), nunca se expone al cliente.
2. **Visibilidad Configurable**: Los administradores pueden controlar quién ve el chat (Invitados, Clientes, Admins) desde el panel de configuración general.
3. **Validación de Historial**: El servicio de backend valida y sanitiza el historial enviado por el cliente antes de procesarlo con el modelo de IA.

---

## 🛠️ Mantenimiento y Debugging

### Problemas Comunes
- **Error: "API Key Missing"**: Verifique que `GOOGLE_AI_KEY` esté configurado en `server/.env`.
- **Respuestas Irrelevantes**: Asegúrese de que el `InventoryService` esté devolviendo productos. Si el catálogo está vacío, la IA entrará en modo de "No disponibilidad".
- **Lentitud**: El modelo `gemini-flash-latest` es el más rápido disponible. Si hay latencia excesiva, verifique la conectividad con los servicios de Google Cloud.

### Logs de Auditoría
El servicio imprime logs detallados en la consola del servidor:
- `[AIChatService] Initializing`: Estado de la API Key.
- `[AIChatService] Found X products`: Cantidad de productos inyectados en el contexto.
- `[AIChatService] Prompt generated`: Confirmación de creación del prompt de sistema.

---

## 🔗 Enlaces Relacionados
- [Arquitectura General](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/ARQUITECTURA.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Guía de Desarrollo (AGENTS)](file:///c:/Users/Server%20Admin/Desktop/ecommerce/AGENTS.md)

*Última actualización: 2026-02-12*
