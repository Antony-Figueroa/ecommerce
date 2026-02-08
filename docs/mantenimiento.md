# 🛠️ Guía de Mantenimiento y Resolución de Problemas

Este documento proporciona instrucciones para asegurar la operatividad continua del sistema Ana's Supplements.

---

## 📋 Tareas de Mantenimiento Periódico

### 1. Respaldo de Base de Datos
Dado que el sistema utiliza **SQLite**, el respaldo consiste en copiar el archivo de base de datos.
- **Archivo**: `server/prisma/dev.db`
- **Frecuencia**: Diaria (recomendado).
- **Procedimiento**: Detener el servidor y copiar el archivo a una ubicación segura o almacenamiento en la nube.

### 2. Actualización de Dependencias
Para mantener el sistema seguro y optimizado:
```bash
npm update
cd server && npm update
```

### 3. Limpieza de Logs
Si el sistema genera archivos de log voluminosos, asegúrese de rotarlos o limpiarlos periódicamente para evitar saturar el disco.

---

## 🔍 Resolución de Problemas Comunes (Troubleshooting)

### El Dashboard no carga (Error 500)
- **Causa**: Problema de conexión con la base de datos o error en el cálculo de métricas.
- **Solución**: 
  1. Verifique que el archivo `dev.db` exista y no esté corrupto.
  2. Ejecute `npx prisma generate` en la carpeta `server` para sincronizar el cliente.
  3. Revise los logs de la consola del servidor para identificar el servicio específico que falla.

### Error de Conexión WebSocket
- **Síntoma**: El Dashboard no se actualiza en tiempo real o muestra errores de conexión.
- **Solución**:
  1. Asegúrese de que el puerto `3001` esté abierto.
  2. Verifique la configuración de `CORS` en `server/src/infrastructure/socket.service.ts`. Debe incluir el dominio o IP exacto desde donde accede el frontend.

### El Frontend no refleja cambios de Precios
- **Causa**: La tasa BCV no se ha actualizado o hay caché en el navegador.
- **Solución**:
  1. Actualice la tasa desde el panel administrativo.
  2. Limpie la caché del navegador (`Ctrl + F5`).

---

## 🚀 Procedimiento de Recuperación

En caso de fallo crítico del servidor:
1. **Reiniciar Proceso**: Use un gestor de procesos como `PM2` para asegurar que el servidor se reinicie automáticamente.
   ```bash
   pm2 restart ana-server
   ```
2. **Re-generar Base de Datos**: Si la DB está corrupta y tiene un respaldo:
   - Reemplace `dev.db` con la copia de seguridad.
   - Ejecute `npm run db:generate`.

---

## 🔗 Contacto Técnico
Para soporte avanzado, consulte la [Arquitectura Técnica](file:///c:/Users/Server%20Admin/Desktop/ecommerce/docs/ARQUITECTURA.md) o contacte al equipo de desarrollo.

*Última actualización: 2026-02-08*
