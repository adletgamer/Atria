# ANÁLISIS COMPLETO DEL PROYECTO MANGOCHAIN

**Fecha de análisis:** Marzo 2026  
**Versión analizada:** Post-pull de main (última actualización)  
**Analista:** Staff Engineer / Systems Architect  

---

## 1. RESUMEN EJECUTIVO

| Aspecto | Estado |
|---------|--------|
| **Fase del proyecto** | MVP funcional en fase de transición a v2.0 |
| **Build status** | ✅ Frontend compila (37.84s) |
| **Smart Contracts** | ✅ 6/6 compilando |
| **Dev Server** | ✅ Corriendo en localhost:8080 |
| **Arquitectura actual** | Híbrida parcial: Web3 + Supabase coexisten |
| **Próximo paso crítico** | Consolidar autenticación y separar bien on/off-chain |

---

## 2. ESTRUCTURA DE CARPETAS Y ARCHIVOS

```
mango-rastreo-chain/
├── 📁 .env, .env.example          # Variables de entorno (Supabase, Web3)
├── 📄 package.json                # 71 dependencias, 23 devDependencies
├── 📄 hardhat.config.cjs          # ✅ Multi-version Solidity (0.8.20 + 0.8.19) con viaIR
├── 📁 contracts/                  # 6 smart contracts
│   ├── MangoSupplyChain.sol      # ^0.8.20 (principal)
│   ├── MangoChainRegistry.sol    # ^0.8.19
│   ├── SupplyChainTracking.sol   # ^0.8.0 (stack profundo, viaIR necesario)
│   ├── QualityCertification.sol  # ^0.8.0
│   ├── MangoRegistry.sol         # ^0.8.0 (legacy)
│   └── Verification.sol          # ^0.8.0
├── 📁 src/
│   ├── 📁 pages/                 # 11 páginas principales
│   │   ├── Index.tsx            # Landing page ✅
│   │   ├── Login.tsx            # Auth Supabase ✅ (nuevo)
│   │   ├── Signup.tsx           # Auth Supabase ✅ (nuevo)
│   │   ├── ResetPassword.tsx    # Auth Supabase ✅ (nuevo)
│   │   ├── Dashboard.tsx        # Panel con stats ⚠️ (datos de localStorage)
│   │   ├── Registrar.tsx        # Registro de lotes ⚠️ (Web3 + Supabase mixto)
│   │   ├── Rastrear.tsx         # Tracking ⚠️ (localStorage + mock data)
│   │   ├── Verify.tsx           # Verificación pública ✅
│   │   ├── Marketplace.tsx      # Marketplace ⚠️ (UI solo, sin backend real)
│   │   └── QRTest.tsx           # Testing QR ✅
│   ├── 📁 hooks/                # 6 hooks personalizados
│   │   ├── useAuth.tsx          # ✅ Supabase Auth implementado
│   │   ├── useMetaMask.tsx      # ✅ Wagmi + RainbowKit funcional
│   │   ├── useLanguage.tsx      # ✅ i18n preparado
│   │   └── useScanTracking.tsx  # ⚠️ LocalStorage-based
│   ├── 📁 services/
│   │   └── batchService.ts      # ✅ CRUD Supabase funcional
│   ├── 📁 config/
│   │   ├── wagmi.ts             # ✅ Polygon Amoy configurado
│   │   └── queryClient.ts       # ✅ TanStack Query
│   ├── 📁 integrations/
│   │   ├── supabase/            # ✅ Cliente auto-generado
│   │   └── lovable/             # ✅ Auth OAuth (Google/Apple)
│   └── 📁 components/           # 54 componentes (UI rica)
├── 📁 supabase/                 # Migraciones SQL
└── 📁 Documentación (17 archivos .md)
```

---

## 3. TECNOLOGÍAS DETECTADAS

### Frontend Core
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.3.1 | SPA principal |
| TypeScript | 5.8.3 | Todo el codebase |
| Vite | 5.4.19 | Build tool (37.84s build) |
| Tailwind CSS | 3.4.17 | Styling |
| Framer Motion | 12.23.24 | Animaciones |

### UI Components
| Tecnología | Uso |
|------------|-----|
| Radix UI | 25+ componentes primitivos |
| shadcn/ui | Sistema de componentes |
| Lucide React | Iconografía |
| Recharts | Gráficos dashboard |
| Sonner | Toasts/notificaciones |

### Web3 / Blockchain
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Wagmi | 2.14.0 | Interacción Web3 |
| RainbowKit | 2.2.9 | Wallet UI |
| Viem | 2.40.0 | Cliente Ethereum |
| Ethers | 6.15.0 | Compatibilidad |

### Backend / Data
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Supabase | 2.81.1 | Auth + PostgreSQL |
| TanStack Query | 5.83.0 | Caché y fetching |
| @lovable.dev/cloud-auth-js | 0.0.3 | OAuth Google/Apple |

### Blockchain Development
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Hardhat | 2.27.0 | Framework Ethereum |
| @nomicfoundation/hardhat-toolbox | 5.0.0 | Tooling completo |
| Solidity | 0.8.0 - 0.8.20 | Smart contracts (6 archivos) |

---

## 4. ANÁLISIS DE FUNCIONALIDAD

### ✅ LO QUE FUNCIONA

| Feature | Estado | Evidencia |
|---------|--------|-----------|
| **Build de producción** | ✅ Funcional | `npm run build` exitoso, dist/ generado |
| **Dev server** | ✅ Funcional | localhost:8080 activo |
| **Compilación contratos** | ✅ Funcional | 6/6 contratos compilan con multi-version |
| **Auth con Supabase** | ✅ Funcional | Login/Signup/ResetPassword implementados |
| **OAuth (Google/Apple)** | ✅ Funcional | Integración Lovable lista |
| **MetaMask connection** | ✅ Funcional | useMetaMask hook operativo |
| **CRUD de lotes (BD)** | ✅ Funcional | batchService.ts usa Supabase |
| **QR Generation** | ✅ Funcional | qrcode.react integrado |
| **i18n (idiomas)** | ✅ Preparado | useLanguage hook existe |
| **RainbowKit UI** | ✅ Funcional | Selector de wallets visible |

### ⚠️ LO QUE FUNCIONA PARCIALMENTE

| Feature | Estado | Problema | Impacto |
|---------|--------|----------|---------|
| **Dashboard** | ⚠️ Mock data | Lee de localStorage, no de Supabase real | Stats no reflejan BD real |
| **Registro de lotes** | ⚠️ Híbrido confuso | Mezcla Web3 + Supabase sin estrategia clara | Usuario no sabe qué pasa on-chain |
| **Rastrear/Tracking** | ⚠️ LocalStorage | Los datos no persisten en BD real entre sesiones | Pérdida de datos al cerrar navegador |
| **Marketplace** | ⚠️ UI solo | Listado visual pero sin transacciones reales | Feature no operativa para usuarios |
| **Trust/Verification** | ⚠️ No implementado | No hay motor de trust levels | No se distingue dato declarado vs verificado |

### ❌ LO QUE NO FUNCIONA / NO EXISTE

| Feature | Estado | Requerimiento según Arquitectura v2 |
|---------|--------|-------------------------------------|
| **Backend API** | ❌ No existe | Sección 2 propone Node.js + Express API |
| **Anclaje automático** | ❌ Manual | Debería anclar sin que usuario lo note |
| **Trust Levels** | ❌ No hay | Taxonomía declared→evidenced→verified→certified |
| **Custody transfer** | ❌ Mock | Fase 2 propone transferencias reales ancladas |
| **Evidencias (fotos)** | ❌ No implementado | Fase 2: almacenamiento S3/R2 + hashes |
| **Certificaciones** | ❌ UI básica | Fase 3: rol certifier + validación |
| **Panel de auditoría** | ❌ No existe | Fase 5: verificación de integridad |
| **Trust Score** | ❌ No existe | Fase 5: scoring de actores |

---

## 5. FASE DEL PROYECTO

### Diagnóstico: **Transición v1 → v2 incompleta**

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE ACTUAL: MVP v1.5                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Completado de v1:                                        │
│     • Frontend React funcional                              │
│     • Smart contracts desplegables                          │
│     • Conexión MetaMask                                     │
│     • QR codes generables                                   │
│     • UI básica de registro/tracking                        │
│                                                              │
│  ✅ Completado post-pull reciente:                          │
│     • Auth con Supabase (Login/Signup)                      │
│     • OAuth Google/Apple                                     │
│     • CRUD de lotes en PostgreSQL                           │
│     • Marketplace UI                                         │
│                                                              │
│  ⚠️ En progreso (parcial):                                  │
│     • Separación on-chain/off-chain                         │
│     • Backend API                                            │
│     • Trust levels                                           │
│                                                              │
│  ❌ Pendiente de v2.0:                                       │
│     • Anclaje automático sin wallet                         │
│     • Capa de verificación                                  │
│     • Custodia transferible                                 │
│     • Evidencias adjuntas                                   │
│     • Panel de auditoría                                    │
│     • Trust Score                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Timeline Sugerida Realista

| Fase | Duración | Entregable |
|------|----------|------------|
| **Actual** | - | v1.5: Auth + BD básica |
| **Fase 2 real** | 4-6 semanas | API Node.js + anclaje automático |
| **Fase 3 real** | 3-4 semanas | Trust levels + evidencias |
| **Fase 4 real** | 2-3 semanas | QR público + verificación |
| **Fase 5 real** | 2-3 semanas | Auditoría + trust score |
| **Total v2.0** | ~12-16 semanas | Sistema híbrido completo |

---

## 6. RECONSIDERACIONES DE SECCIÓN 2 (ARCHITECTURE_V2.md)

Tras analizar el estado actual del proyecto vs. la arquitectura propuesta, estos elementos de la Sección 2 necesitan reconsideración:

### 6.1 Roadmap: Timeline poco realista

**Recomendación:** Las 6 fases en 20 semanas son agresivas. Con el equipo actual y la deuda técnica acumulada, sugiero:

| Original | Reconsideración |
|----------|-----------------|
| 6 fases, 20 semanas | **4 fases, 16 semanas** |
| Fase 1: 3 semanas | **Fase 1: 4 semanas** (Backend API es crítico) |
| Fase 2-3 separadas | **Fusionar en "Core híbrido"** (6 semanas) |
| Fase 4-5 separadas | **Fusionar en "Verificación + QR"** (4 semanas) |
| Fase 6: 3 semanas | **Fase 4: Hardening** (2 semanas, paralelo) |

### 6.2 Stack tecnológico: Simplificación necesaria

**Recomendaciones específicas:**

| Propuesto | Reconsideración | Razón |
|-----------|-----------------|-------|
| Cloudflare R2 | **Supabase Storage** | Ya usan Supabase, mantener stack unificado |
| Resend email | **Supabase Auth emails** | Reducir vendors, usar built-in |
| Railway/Render | **Vercel (frontend) + Supabase (backend)** | Deploy más simple |
| Prisma ORM | **Supabase Client directo** | Ya está funcionando, no cambiar |

### 6.3 Smart Contracts: Over-engineering detectado

**Problema:** 6 contratos con versiones mixtas y funcionalidad solapada.

**Recomendación:** Consolidar a **2 contratos máximo** para v2.0:

```solidity
// 1. MangoChainAnchor.sol (nuevo, ~150 líneas)
//    - Anclaje de hashes de lotes
//    - Eventos: BatchCreated, CustodyTransferred, Certified

// 2. MangoSupplyChain.sol (existente, refactorizado)
//    - Lógica de negocio on-chain mínima
//    - Compatibility con datos legacy
```

**Eliminar:** MangoRegistry, QualityCertification, SupplyChainTracking, Verification (migrar lógica off-chain).

### 6.4 Backend: Arquitectura propuesta es correcta pero priorizar

**Lo que sí está bien:**
- ✅ Node.js + Express es apropiado
- ✅ Estructura de entidades (batches, actors, events, evidences)
- ✅ APIs REST con dominios separados

**Cambios prioritarios:**
- ⚠️ **NO implementar certificaciones en Fase 2** — requiere integración SENASA que no existe
- ⚠️ **NO implementar sensores IoT** — hardware no disponible
- ✅ **SÍ priorizar:** Auth completa, CRUD lotes, anclaje simple

### 6.5 Verificación Engine: Simplificar para MVP

**Propuesta original:** Motor complejo con reglas de negocio sofisticadas.

**Reconsideración:** Implementar en 3 niveles progresivos:

```typescript
// Nivel 1 (Fase 2): Simple
interface TrustLevel {
  level: 'declared' | 'verified' | 'certified';
  verifiedBy?: string; // user_id si no es self
}

// Nivel 2 (Fase 3): Evidencias
// Agregar: evidenceCount, evidenceTypes[]

// Nivel 3 (Fase 4): Score completo
// Implementar fórmula de Sección 7 completa
```

### 6.6 Trust Score: Postergar hasta tener datos

**Recomendación:** No implementar en Fase 5. Con menos de 100 lotes reales, el score no tiene significado estadístico. Implementar cuando:
- ✅ >50 actores registrados
- ✅ >500 lotes completados
- ✅ >6 meses de operación

---

## 7. PROBLEMAS CRÍTICOS IDENTIFICADOS

### Problema #1: Arquitectura híbrida incompleta
**Impacto:** ALTO  
**Descripción:** El sistema tiene Supabase para auth y CRUD básico, pero aún depende de MetaMask para operaciones core. Esto crea fricción.  
**Solución:** Implementar backend wallet ASAP (Fase 2 real).

### Problema #2: Datos fragmentados
**Impacto:** MEDIO-ALTO  
**Descripción:** Dashboard lee localStorage, Registrar guarda en Supabase, Rastrear usa localStorage. No hay fuente única de verdad.  
**Solución:** Migrar todo a Supabase con migración de datos legacy.

### Problema #3: Sin backend API propio
**Impacto:** ALTO  
**Descripción:** La arquitectura v2 propone anclaje automático, pero no hay servicio backend para hacerlo.  
**Solución:** Crear API Node.js (prioridad P0).

### Problema #4: Smart contracts sin unificar
**Impacto:** MEDIO  
**Descripción:** 6 contratos con solapamiento de funcionalidad. Mantenimiento costoso.  
**Solución:** Consolidar a 2 contratos, migrar lógica off-chain.

### Problema #5: Trust/verification ausente
**Impacto:** ALTO  
**Descripción:** No hay forma de distinguir dato declarado de dato verificado. El QR muestra todo igual.  
**Solución:** Implementar trust badges básicos (Nivel 1) en Fase 2.

---

## 8. RECOMENDACIONES PRIORITARIAS

### Para esta semana (inmediato):
1. ✅ Mantener build estable (ya está)
2. 🔧 Crear script de migración de localStorage → Supabase
3. 🔧 Unificar lectura de datos: todo debe venir de Supabase

### Para las próximas 4 semanas (Fase 1 real):
1. 🏗️ Crear backend Node.js con Express
2. 🏗️ Implementar wallet del sistema para anclajes
3. 🏗️ Migrar smart contracts a 2 contratos unificados
4. 🔧 Crear tabla `batch_events` para tracking real

### Para las siguientes 6 semanas (Fase 2-3 real):
1. 🏗️ Implementar trust levels básicos (declared/verified)
2. 🏗️ Evidencias con Supabase Storage
3. 🔧 Custody transfers anclados
4. 🔧 QR público con datos verificados

---

## 9. CONCLUSIÓN

El proyecto **MangoChain está en transición saludable** de v1 a v2, pero con trabajo significativo pendiente. El reciente pull trajo mejoras importantes (Auth Supabase, OAuth, Marketplace UI), pero la arquitectura híbrida propuesta en `ARCHITECTURE_V2.md` **requiere simplificación y priorización** para ser ejecutable.

**Veredicto:** El proyecto tiene base sólida, documentación excelente, y equipo técnico capaz. El riesgo principal es intentar implementar todo el plan v2.0 de golpe. La estrategia "MVP incremental" con backend Node.js como próximo hito es el camino correcto.

**Estado general: 🟡 FUNCIONAL pero REQUIERE CONSOLIDACIÓN**

---

*Fin del análisis*
