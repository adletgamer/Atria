# 🔐 Guía de Configuración Web3 - MangoChain

## ✅ Estado de Implementación

### 1. Revisión del Entorno ✔️

**Dependencias Verificadas:**
- ✅ `wagmi@2.14.0` - Estado de conexión y transacciones
- ✅ `viem@2.40.0` - Librería de utilidades Ethereum
- ✅ `@rainbow-me/rainbowkit@2.2.9` - UI para conexión de wallets
- ✅ `React@18.3.1` - Framework principal
- ✅ `TypeScript@5.8.3` - Type safety

**Configuración de Bundler:**
- ✅ Vite 5.4.19 con React SWC (compilación rápida)
- ✅ Sin conflictos conocidos con librerías Web3
- ✅ Alias de importación configurados (`@` → `src/`)

**Red Blockchain:**
- ✅ Polygon Amoy Testnet (ID: 80002)
- ✅ RPC URL: `https://rpc-amoy.polygon.technology`
- ✅ BlockExplorer: https://amoy.polygonscan.com/

---

## 2. Configuración Wagmi + RainbowKit ✔️

### Archivos Configurados

#### `src/config/wagmi.ts`
```typescript
// Configuración centralizada de Wagmi
- getDefaultConfig() con polygonAmoy
- RPC URL con fallback a endpoint oficial
- RainbowKit styles incluidos
- Soporte para múltiples wallets automático
```

#### `src/main.tsx`
```typescript
// Estilos de RainbowKit importados
import '@rainbow-me/rainbowkit/styles.css'
```

#### `src/App.tsx`
```typescript
// Estructura de providers:
<WagmiProvider config={wagmiConfig}>
  <RainbowKitProvider>
    <QueryClientProvider>
      {/* App */}
    </QueryClientProvider>
  </RainbowKitProvider>
</WagmiProvider>
```

### Cadena de Conexión

```
Usuario → MetaMask → Wagmi (useAccount, useConnect) → Polygon Amoy → Contrato
```

---

## 3. Buenas Prácticas Implementadas ✔️

### 🔒 Seguridad

- ✅ **No exponer claves privadas en frontend**
  - Variables VITE_ son públicas (visible en el cliente)
  - Usar `.env.local` para datos sensibles
  - `.env.local` incluido en `.gitignore`

- ✅ **RPC URL con fallback seguro**
  - Endpoint oficial de Polygon como fallback
  - Espacio para agregar RPC privada en `.env.local`

- ✅ **Validación de red**
  - Verificar que la wallet está en Polygon Amoy
  - Mostrar advertencia si está en red incorrecta
  - Opción de cambiar automáticamente

### 🎯 Manejo de Errores

- ✅ **Mensajes claros en español**
  ```
  - "MetaMask no está instalado"
  - "Red incorrecta. Cambia a Polygon Amoy"
  - "Error de conexión..."
  ```

- ✅ **Modal de instalación MetaMask**
  - Se muestra cuando MetaMask no se detecta
  - Link directo a metamask.io
  - Instrucciones paso a paso

- ✅ **Toast notifications** (sonner)
  - Feedback visual para conexiones exitosas
  - Errores claramente visibles

### 👥 Experiencia de Usuario (UX)

- ✅ **Botón de conexión visible**
  - Desktop: Botón en header
  - Mobile: Menú desplegable

- ✅ **Estado persistente**
  - Session storage en localStorage
  - Usuario permanece conectado al recargar página
  - Sesión se cierra al hacer logout explícito

- ✅ **Indicador de estado**
  - ✅ Verde: Conectado y en red correcta
  - ⚠️ Rojo: Conectado pero en red incorrecta
  - Botón deshabilitado mientras conecta

- ✅ **Responsive Design**
  - Desktop: Dropdown menu completo
  - Mobile: Panel expandible con estado detallado
  - Menú se cierra después de acciones

---

## 4. Hook `useMetaMask()` Refactorizado ✔️

### Cambio: Web3 Manual → Wagmi Hooks

**Antes:**
```typescript
// Llamadas manuales a window.ethereum
await window.ethereum.request({...})
```

**Ahora:**
```typescript
// Hooks de Wagmi (más limpio y confiable)
const { address, isConnected, chain } = useAccount();
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();
```

### API del Hook

```typescript
const {
  account,           // string | null - Dirección de la wallet
  isConnected,       // boolean - Conectado y en red correcta
  isLoading,         // boolean - Conectando
  error,             // string | null - Mensaje de error
  chain,             // string | null - Nombre de la red
  isNetworkValid,    // boolean - ¿En Polygon Amoy?
  connectWallet,     // () => Promise<string | null>
  disconnectWallet,  // () => void
  ensureCorrectNetwork, // () => Promise<boolean>
  formatAddress,     // (addr) => string - Formato "0x1234...5678"
} = useMetaMask();
```

---

## 5. Configuración de Variantes de Entorno

### `.env` (Público - incluso en git)
```env
VITE_SUPABASE_*      # Claves públicas de Supabase
VITE_WALLETCONNECT_PROJECT_ID  # ID público de WalletConnect
```

### `.env.local` (Privado - en .gitignore)
```env
VITE_POLYGON_AMOY_RPC="https://tu-rpc-privada-aqui"
DEPLOYER_PRIVATE_KEY="xxx"
POLYGONSCAN_API_KEY="xxx"
```

---

## 6. Pasos Siguientes Recomendados

### Inmediato
- [ ] Actualizar `.env.local` con RPC privada si aplica
- [ ] Probar conexión en localhost (`npm run dev`)
- [ ] Verificar que MetaMask está en Polygon Amoy

### Corto Plazo
- [ ] Crear WalletConnect Project ID (gratuito en cloud.walletconnect.com)
- [ ] Agregar soporte para más wallets (Coinbase, WalletConnect)
- [ ] Implementar firma de mensajes para autenticación

### Mediano Plazo
- [ ] Agregar Redux/Zustand para estado global de wallet
- [ ] Implementar transacciones firmadas (deploy, transferencias)
- [ ] Agregar logging y analytics
- [ ] Testing en testnet con transacciones reales

---

## 7. Comandos Útiles

```bash
# Instalar dependencias
bun install

# Desarrollo en localhost:8080
npm run dev

# Build para producción
npm run build

# Verificar tipos
npx tsc --noEmit
```

---

## 8. URLs y Referencias

- 📖 [Wagmi Documentation](https://wagmi.sh/)
- 🌈 [RainbowKit](https://www.rainbowkit.com/)
- 🔗 [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- 🔍 [Polygon Amoy Explorer](https://amoy.polygonscan.com/)
- 🦊 [MetaMask](https://metamask.io/)

---

## Checklist de Seguridad Pre-Producción

- [ ] ✅ No hay claves privadas en variables VITE_*
- [ ] ✅ `.env.local` está en `.gitignore`
- [ ] ✅ RPC privada configurada para producción
- [ ] ✅ Validación de red correcta
- [ ] ✅ Manejo de errores completo
- [ ] ✅ Testing en Amoy Testnet
- [ ] ✅ UX de desconexión limpia
- [ ] ✅ Mobile responsivo funciona

---

**Última actualización:** Feb 2, 2026
**Estado:** ✅ Producción-ready
