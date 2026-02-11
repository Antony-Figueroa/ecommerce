# 🏥 Análisis Funcional e Instalación - Ana's Supplements

Este documento detalla las funcionalidades del sistema y proporciona una guía paso a paso para su despliegue.

---

## 1. Propósito del Sistema
Ana's Supplements es un e-commerce diseñado para optimizar la venta de suplementos mediante un modelo híbrido: catálogo digital dinámico con cierre de venta asistido por WhatsApp y un panel administrativo integral.

---

## 2. Guía de Instalación y Configuración

### Requisitos Previos
- **Node.js**: v18 o superior.
- **npm**: v9 o superior.

### Pasos de Instalación
1. **Clonar el repositorio** y entrar en la carpeta del proyecto.
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Configuración de Variables de Entorno**:
   Cree un archivo `.env` en la raíz y otro en la carpeta `server/`. Use los ejemplos en [AGENTS.md](file:///c:/Users/Server%20Admin/Desktop/ecommerce/AGENTS.md).
4. **Preparar la Base de Datos**:
   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed  # Opcional: datos de prueba
   ```
5. **Iniciar en Desarrollo**:
   - Frontend: `npm run dev` (Puerto 5173)
   - Backend: `npm run server` (Puerto 3001)

---

## 3. Funcionalidades Principales

### 👤 Para el Cliente (Frontend)
- **Catálogo Inteligente**: Búsqueda por voz/texto y filtrado por categorías.
- **Precios Multimoneda**: Visualización automática en USD y BS (Tasa BCV).
- **Carrito Persistente**: Los productos se mantienen aunque se recargue la página.

### 🔑 Para el Administrador (Backend)
- **Dashboard en Tiempo Real**: Métricas de ventas, clientes y stock con actualizaciones vía WebSockets.
- **Gestión de Pedidos**: Control total sobre el ciclo de vida de una venta (Pendiente, Procesando, Entregado).
- **Sistema de Cuotas**: Creación y seguimiento de planes de pago fraccionados para ventas internas.
- **Verificación de Pagos**: Módulo para validar comprobantes de transferencia y depósitos cargados por el cliente o admin.
- **Control de Inventario**: Gestión por lotes (Batches) con trazabilidad de fechas de vencimiento y costos de adquisición.
- **Auditoría**: Registro detallado de movimientos de stock y cambios en la configuración del sistema.
- **Configuración Global**: Ajuste de tasa BCV y parámetros del sistema.

---

## 4. Reglas de Negocio Críticas
- **Integridad de Precios**: El sistema prohíbe ventas con precios menores al costo de adquisición.
- **Seguridad**: Acceso administrativo restringido mediante roles (ADMIN/USER) y validación de tokens JWT.
- **Consistencia**: Los pedidos no pueden ser eliminados, solo cancelados o rechazados, para mantener el historial de auditoría.
- **Gestión de Cuotas**: El saldo pendiente de una venta se divide en cuotas quincenales sin interés. El estado de la venta cambia a COMPLETADA solo cuando el saldo llega a cero.
- **Validación de Pagos**: Los pagos parciales actualizan automáticamente el estado de las cuotas (PENDIENTE -> PAGADA/PARCIAL).

---

## 🔗 Enlaces Rápidos
- [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/ARQUITECTURA.md)
- [Referencia API](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/api-reference.md)
- [Manual de Mantenimiento](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/mantenimiento.md)

*Última actualización: 2026-02-11 (v1.3)*
