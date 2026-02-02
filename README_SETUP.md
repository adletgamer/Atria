# 🥭 MangoChain - Supply Chain Tracking en Blockchain

Sistema de rastreo de cadena de suministro para mangos usando Polygon Amoy Testnet con interfaz web moderna.

## 🚀 Stack Tecnológico

### Frontend
- **React 18.3** - UI Library
- **TypeScript 5.8** - Type Safety
- **Vite 5.4** - Build Tool (Lightning Fast ⚡)
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component Library

### Web3 & Blockchain
- **Wagmi 2.14** - React Hooks para Ethereum
- **Viem 2.40** - Ethereum utilities
- **RainbowKit 2.2** - Wallet Connection UI
- **Polygon Amoy Testnet** - Red de prueba

### Backend & Data
- **Supabase** - Base de datos y autenticación
- **Hardhat** - Desarrollo de Smart Contracts
- **Solidity** - Smart Contracts

---

## ⚙️ Instalación Rápida

### Requisitos Previos
- Node.js 18+ o Bun
- Git
- MetaMask u otra wallet compatible

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd mango-rastreo-chain
```

### 2. Instalar Dependencias
```bash
# Con npm
npm install

# O con bun (recomendado)
bun install
```

### 3. Configurar Variables de Entorno

#### A. Crear `.env.local`
```bash
# Copiar template
cp .env.example .env.local
```

#### B. Configurar `.env.local`
```env
# Supabase (del archivo .env existente)
VITE_SUPABASE_PROJECT_ID="nbfyfrpilusttfypglul"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
VITE_SUPABASE_URL="https://nbfyfrpilusttfypglul.supabase.co"

# Blockchain (opcional - usar valores por defecto si no tienes RPC privada)
VITE_POLYGON_AMOY_RPC="https://polygon-amoy.g.alchemy.com/v2/tu-clave"

# Hardhat (solo si deployarás contratos)
DEPLOYER_PRIVATE_KEY="tu-private-key-aqui"
POLYGONSCAN_API_KEY="tu-api-key"
```

**⚠️ IMPORTANTE:**
- Nunca exponer claves privadas en el repositorio
- `.env.local` está en `.gitignore` (automáticamente ignorado)
- Usar `.env` solo para valores públicos

### 4. Ejecutar en Desarrollo
```bash
npm run dev
# O
bun run dev
```

La app estará disponible en: **http://localhost:8080**

---

## 🌐 Configuración de MetaMask

### Primer uso (Polygon Amoy no está en MetaMask)

1. **Instalar MetaMask**
   - Descargar desde [metamask.io](https://metamask.io)
   - Crear wallet o importar existente

2. **Agregar Red Polygon Amoy**
   - Network Name: `Polygon Amoy Testnet`
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency: `MATIC`
   - Explorer: `https://amoy.polygonscan.com`

3. **Obtener Testnet MATIC**
   - Visitar [Polygon Faucet](https://faucet.polygon.technology/)
   - Seleccionar "Polygon Amoy"
   - Pegar dirección MetaMask
   - Recibir 0.5 MATIC de prueba

4. **Conectar Wallet en la App**
   - Click en "Conectar Wallet" (navbar)
   - Seleccionar MetaMask
   - Autorizar en el popup
   - ¡Listo! Ya puedes usar la app

---

## 🏗️ Estructura del Proyecto

```
mango-rastreo-chain/
├── src/
│   ├── config/
│   │   └── wagmi.ts              # Configuración Wagmi + RainbowKit
│   ├── hooks/
│   │   └── useMetaMask.tsx       # Hook para conexión de wallet
│   ├── components/
│   │   ├── Navbar.tsx            # Navegación + Botón de wallet
│   │   ├── QRGenerator.tsx       # Generador de códigos QR
│   │   └── ui/                   # Componentes shadcn/ui
│   ├── pages/
│   │   ├── Index.tsx             # Home
│   │   ├── Registrar.tsx         # Registrar lote de mangos
│   │   ├── Rastrear.tsx          # Rastrear un lote (QR)
│   │   ├── Dashboard.tsx         # Estadísticas
│   │   └── Verify.tsx            # Verificar certificados
│   ├── integrations/
│   │   └── supabase/             # Cliente de Supabase
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── contracts/
│   ├── MangoChainRegistry.sol    # Registry principal
│   ├── SupplyChainTracking.sol   # Tracking logic
│   ├── QualityCertification.sol  # Certificados
│   └── Verification.sol          # Verificación
├── .env                          # Variables públicas
├── .env.example                  # Template de variables
├── .env.local                    # Variables privadas (NO commitear)
├── vite.config.ts                # Configuración Vite
├── hardhat.config.cjs            # Configuración Hardhat
├── WEB3_CONFIG_GUIDE.md          # Guía detallada de Web3
└── README.md                     # Este archivo
```

---

## 🔐 Seguridad y Buenas Prácticas

### ✅ Implementadas

1. **Gestión de Variables de Entorno**
   - Variables públicas (`VITE_*`) solo en `.env`
   - Variables privadas en `.env.local`
   - `.env.local` en `.gitignore`

2. **Validación de Cadena**
   - Verifica automáticamente que estés en Polygon Amoy
   - Opción para cambiar manualmente si es necesario
   - Advertencia clara si la red es incorrecta

3. **Manejo de Errores**
   - Modal si MetaMask no está instalado
   - Mensajes claros en español
   - Toast notifications para feedback

4. **Gestión de Sesión**
   - Sesión persistente con localStorage
   - Disconnect manual o automático
   - Limpiar datos sensibles al logout

5. **No Exponer Claves Privadas**
   - Uso de Wagmi para manejo seguro
   - Variables de wallet nunca en localStorage
   - RPC con fallback seguro

---

## 📚 Scripts Disponibles

```bash
# Desarrollo
npm run dev           # Inicia servidor de desarrollo
npm run build         # Build para producción
npm run build:dev     # Build en modo desarrollo
npm run preview       # Preview del build
npm run lint          # Ejecutar ESLint

# Smart Contracts (Hardhat)
npx hardhat compile   # Compilar contratos
npx hardhat deploy    # Deploy a testnet
npx hardhat verify    # Verificar en PolygonScan
```

---

## 🧪 Testing

### Flujo de Conexión
1. Abrir http://localhost:8080
2. Click en "Conectar Wallet"
3. Seleccionar MetaMask
4. Autorizar conexión
5. Verificar que:
   - ✅ Dirección aparece en navbar
   - ✅ Estado dice "Conectado"
   - ✅ Estás en Polygon Amoy

### Flujo de Rastreo
1. Ir a "Rastrear"
2. Escanear QR o ingresar Batch ID
3. Ver historial de transacciones en blockchain
4. Verificar certificados de calidad

### Flujo de Registro
1. Ir a "Registrar"
2. Ingresar datos del lote
3. Generar QR
4. Registrar en blockchain (requiere MATIC)
5. Recibir Batch ID y hash de transacción

---

## 🚀 Deployment

### Producción (Recomendado)
```bash
# Build optimizado
npm run build

# Servir con un servidor web
# (Vercel, Netlify, GitHub Pages, etc.)
```

### Variables de Entorno en Producción
- Usar servicios seguros como Vercel Secrets o GitHub Secrets
- Mantener `.env.local` fuera de repositorio
- Rotar llaves periódicamente
- Usar RPC privada para mejor rendimiento

---

## 🔗 Enlaces Útiles

- **Polygon Amoy Testnet**
  - RPC: https://rpc-amoy.polygon.technology
  - Explorer: https://amoy.polygonscan.com
  - Faucet: https://faucet.polygon.technology

- **Documentación Web3**
  - [Wagmi Docs](https://wagmi.sh/)
  - [Viem Docs](https://viem.sh/)
  - [RainbowKit](https://www.rainbowkit.com/)

- **Herramientas**
  - [MetaMask](https://metamask.io/)
  - [Hardhat](https://hardhat.org/)
  - [Supabase](https://supabase.com/)

---

## 📋 Checklist de Desarrollo

- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] MetaMask instalado y en Polygon Amoy
- [ ] MATIC de testnet en wallet
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Conexión de wallet funciona
- [ ] Botones interactivos responden
- [ ] Responsive en mobile
- [ ] Contratos compilados y en desarrollo

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Proyecto privado - todos los derechos reservados.

---

## 👨‍💻 Soporte

Para preguntas o problemas:
- 📧 Email: [Email de contacto]
- 🐛 Issues: Crear issue en GitHub
- 💬 Discussiones: GitHub Discussions

---

**Última actualización:** Feb 2, 2026
**Versión:** 1.0.0
**Estado:** ✅ Production-Ready
