# 🔧 Troubleshooting - Guía de Resolución de Problemas

## Problemas Comunes y Soluciones

---

## 🔴 MetaMask No Se Detecta

### Síntoma
```
"MetaMask no está instalado. Por favor instálalo para usar esta aplicación."
```

### Causas Posibles
1. **MetaMask no instalado**
2. **MetaMask deshabilitado**
3. **Navegador no compatible**

### Soluciones

#### ✅ Solución 1: Instalar MetaMask
1. Visitar [metamask.io](https://metamask.io)
2. Seleccionar tu navegador (Chrome, Firefox, Edge, Safari)
3. Hacer click en "Add to [Browser]"
4. Confirmar la instalación
5. Crear o importar wallet
6. Recargar la página web

#### ✅ Solución 2: Verificar que está habilitado
- Abrir extensiones del navegador
- Buscar MetaMask
- Asegurar que está **activado/enabled**
- Hacer click en el ícono de MetaMask en la barra de direcciones

#### ✅ Solución 3: Usar navegador compatible
- ✅ Google Chrome (recomendado)
- ✅ Firefox
- ✅ Microsoft Edge
- ✅ Safari (versión reciente)
- ❌ Internet Explorer (no compatible)

---

## 🔴 Red Incorrecta / Polygon Amoy No Aparece

### Síntoma
```
"Red incorrecta. Cambia a Polygon Amoy Testnet"
"Error cambiando a Polygon Amoy"
```

### Causas Posibles
1. Polygon Amoy no está agregada a MetaMask
2. MetaMask intenta agregar pero falla
3. Versión desactualizada de MetaMask

### Soluciones

#### ✅ Solución 1: Agregar Manual en MetaMask
1. Abrir MetaMask
2. Hacer click en el selector de redes (arriba a la izquierda)
3. Click en "Agregar Red" o "Add Network"
4. Llenar el formulario:
   - **Nombre de la red:** Polygon Amoy Testnet
   - **RPC URL:** `https://rpc-amoy.polygon.technology`
   - **ID de Cadena:** `80002`
   - **Moneda:** MATIC
   - **Explorador:** `https://amoy.polygonscan.com`
5. Guardar
6. Seleccionar la red de la lista

#### ✅ Solución 2: Usar RPC Alternativa
Si el RPC oficial no funciona, probar:
- Alchemy: `https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY`
- QuickNode: `https://quick-amoy.quiknode.pro/YOUR_KEY`

#### ✅ Solución 3: Actualizar MetaMask
1. Abrir navegador
2. Acceder a extensiones
3. Buscar actualizaciones
4. Actualizar MetaMask si está disponible
5. Reiniciar navegador

---

## 🔴 No Tengo MATIC de Testnet

### Síntoma
```
Error al ejecutar transacciones
"Insufficient funds"
Transacción rechazada
```

### Causa
Necesitas MATIC de Polygon Amoy Testnet para pagar gas

### Soluciones

#### ✅ Solución 1: Faucet Oficial de Polygon
1. Visitar [faucet.polygon.technology](https://faucet.polygon.technology)
2. Seleccionar "Polygon Amoy"
3. Pegar dirección de MetaMask:
   - Click en el ícono de cuenta en MetaMask
   - Copy address
4. Hacer click en "Send Me MATIC"
5. Esperar 1-2 minutos
6. Recibir 0.5 MATIC

#### ✅ Solución 2: Faucet Alternativo
- [AllFaucets (Polygon Amoy)](https://www.allfaucets.io/polygon-amoy-testnet/)
- [Polygon Faucet Bot](https://t.me/polygon_mumbai_amoy_bot)

#### ✅ Solución 3: Copiar dirección correctamente
1. Abrir MetaMask
2. Asegurar estar en **Polygon Amoy Testnet** (selector de redes)
3. Hacer click en la dirección (bajo el nombre de cuenta)
4. Se copiará automáticamente
5. Pegar en el faucet

#### ✅ Solución 4: Verificar que se envió
1. Copiar hash de transacción del faucet
2. Visitar [amoy.polygonscan.com](https://amoy.polygonscan.com)
3. Pegar el hash en el buscador
4. Verificar estado: "Success" o "Confirmed"

---

## 🔴 Botón de Conectar No Responde

### Síntoma
```
Click en "Conectar Wallet" no abre MetaMask
Botón no reacciona
Loading infinito
```

### Causas Posibles
1. JavaScript deshabilitado
2. Extensión bloqueando scripts
3. Problema en la consola del navegador

### Soluciones

#### ✅ Solución 1: Verificar JavaScript
1. Abrir Configuración del Navegador
2. Privacidad y Seguridad → Configuración de Sitio
3. JavaScript → Permitido ✅

#### ✅ Solución 2: Desabilitar extensiones de bloqueo
1. Adblocker → Whitelist del sitio
2. uBlock Origin → Agregar a whitelist
3. Ghostery → Deshabilitar para el dominio
4. Privacy Badger → Permitir cookies

#### ✅ Solución 3: Abrir Consola y Buscar Errores
1. Presionar `F12` o `Ctrl+Shift+I`
2. Ir a la pestaña "Consola"
3. Buscar mensajes de error rojos
4. Copiar el error completo
5. Buscar la solución específica

#### ✅ Solución 4: Limpiar caché
1. `Ctrl+Shift+Supr` (historial)
2. Seleccionar "Todo el tiempo"
3. Marcar: "Cookies", "Caché", "Datos de sitios"
4. Borrar
5. Recargar la página

---

## 🔴 MetaMask Abre pero No Se Conecta

### Síntoma
```
MetaMask abre popup de firma
Pero no completa la conexión
Vuelve a pedir conectar
```

### Causas Posibles
1. Usuario rechazó la transacción
2. Popup fue cerrado
3. Problema de compatibilidad

### Soluciones

#### ✅ Solución 1: Aceptar la Solicitud en MetaMask
1. Cuando aparezca el popup de MetaMask
2. **NO cerrar** el popup
3. Leer los detalles
4. Click en "Conectar" (botón azul)
5. Confirmar

#### ✅ Solución 2: Permitir Popups
1. Navegador → Configuración
2. Privacidad → Popups
3. Buscar el dominio
4. Cambiar a "Permitir"
5. Intentar conectar de nuevo

#### ✅ Solución 3: Reiniciar MetaMask
1. Hacer click en el ícono de MetaMask
2. Hacer click en la foto de perfil
3. Click en "Bloquear" o "Lock"
4. Ingresar contraseña
5. Intentar conectar nuevamente

---

## 🔴 Transacción Falla con Error

### Síntoma
```
"Transaction failed"
"Reverted"
Error desconocido
```

### Causas Posibles
1. Insuficientes fondos (gas)
2. Contrato tiene un error
3. Red congestionada

### Soluciones

#### ✅ Solución 1: Verificar Saldo de MATIC
1. Abrir MetaMask
2. Verificar balance en Polygon Amoy
3. Si es menor a 0.1 MATIC → obtener más del faucet
4. Esperar confirmación (1-2 min)

#### ✅ Solución 2: Aumentar Gas Limit
1. Durante la transacción en MetaMask
2. Click en "Edit" (Editar)
3. Tab "Advanced" → "Gas Limit"
4. Aumentar a 500,000 - 1,000,000
5. Confirmar

#### ✅ Solución 3: Ver Detalles del Error
1. Copiar hash de transacción fallida
2. Visitar [amoy.polygonscan.com](https://amoy.polygonscan.com)
3. Buscar el hash
4. Click en "Error"
5. Leer el mensaje específico

---

## 🔴 Página No Carga en Desarrollo

### Síntoma
```
npm run dev falla
Página blanca
"Cannot find module"
```

### Causas Posibles
1. Dependencias no instaladas
2. Puerto 8080 en uso
3. Error en código

### Soluciones

#### ✅ Solución 1: Reinstalar Dependencias
```bash
# Eliminar node_modules
rm -rf node_modules
rm package-lock.json

# Reinstalar
npm install

# O con bun
bun install
```

#### ✅ Solución 2: Cambiar Puerto
```bash
npm run dev -- --port 3000
```

#### ✅ Solución 3: Matar Proceso en Puerto
```bash
# Encontrar proceso
netstat -ano | findstr :8080

# Matar proceso (Windows PowerShell)
taskkill /PID <PID> /F
```

#### ✅ Solución 4: Verificar errores
1. Abrir consola: `npm run dev`
2. Buscar mensajes rojos de error
3. Ir a la línea del error
4. Verificar sintaxis

---

## 🔴 Build Falla

### Síntoma
```
npm run build produce errores
Build incompleto
Archivos no generados
```

### Causas Posibles
1. Errores de TypeScript
2. Módulos faltantes
3. Configuración de Vite

### Soluciones

#### ✅ Solución 1: Verificar Tipos TypeScript
```bash
npx tsc --noEmit
```
Esto mostrará todos los errores de tipo.

#### ✅ Solución 2: Limpiar caché de Vite
```bash
rm -rf .vite
npm run build
```

#### ✅ Solución 3: Ver error completo
```bash
npm run build 2>&1 | tee build.log
```
Esto guarda el error en `build.log`

---

## 📋 Checklist de Diagnóstico Rápido

Si algo no funciona, revisar en orden:

1. **MetaMask Instalado?**
   - [ ] ✅ Sí → Siguiente
   - [ ] ❌ No → Instalar desde metamask.io

2. **MetaMask Desbloqueado?**
   - [ ] ✅ Sí → Siguiente
   - [ ] ❌ No → Ingresar contraseña

3. **En Polygon Amoy?**
   - [ ] ✅ Sí → Siguiente
   - [ ] ❌ No → Cambiar red manualmente

4. **Tienes MATIC?**
   - [ ] ✅ Sí (>0.01) → Siguiente
   - [ ] ❌ No → Obtener del faucet

5. **Consola sin errores rojos?**
   - [ ] ✅ Sí → Siguiente
   - [ ] ❌ No → Revisar error específico

6. **npm run dev funciona?**
   - [ ] ✅ Sí → ¡Listo!
   - [ ] ❌ No → Reinstalar dependencias

---

## 🆘 Si Nada Funciona

1. **Limpiar todo y empezar:**
   ```bash
   rm -rf node_modules .vite dist
   npm install
   npm run dev
   ```

2. **Contactar soporte:**
   - Incluir error exacto de consola (F12)
   - Incluir versión MetaMask
   - Incluir navegador y versión
   - Describir pasos exactos para reproducir

3. **Verificar Issues en GitHub:**
   - Buscar error similar
   - Comentar si tienes el mismo problema

---

**Última actualización:** Feb 2, 2026
**¿No está tu problema aquí?** Crear issue en GitHub
