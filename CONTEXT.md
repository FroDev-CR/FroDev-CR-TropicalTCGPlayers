# 📋 CONTEXTO DEL PROYECTO - TropicalTCGPlayers

## 🎯 **Estado Actual del Proyecto**

### **Completado ✅**
- **Limpieza de Aplicación** - Eliminación de páginas innecesarias
- **Integración Multi-TCG API** - Soporte para 7 juegos de cartas diferentes
- **Sistema de Proxy CORS** - Solución para APIs externas en desarrollo
- **Sistema de Transacciones Integrado** - Movido a página de perfil
- **Sistema de Reputación** - Calificaciones y reportes validados
- **Sistema de Checkout Mejorado** - Modal elegante con múltiples contactos
- **Gestión de Inventario** - Control de stock en tiempo real
- **Despliegue en Producción** - Aplicación funcionando en Vercel

### **En Progreso 🔄**
- **Debug API Pokémon TCG** - Búsquedas infinitas sin resultados
- **Índices de Firestore** - Falta crear índice para transacciones

### **Pendiente ⏳**
- **Dashboard de Vendedor** - Estadísticas y gestión avanzada
- **Sistema de Reservas Temporales** - Stock temporal en carrito
- **Mejoras de UX/UI** - Pulimiento general
- **Seguridad** - Variables de entorno y validaciones

---

## 🏗️ **Arquitectura Implementada**

### **Estructura Actual del Proyecto:**
```
src/
├── components/
│   ├── RatingSystem.js ✅ - Sistema de calificaciones validado
│   ├── ReportSystem.js ✅ - Sistema de reportes de usuarios
│   ├── SellCardModal.js ✅ - Modal venta con 7 TCGs + fallbacks
│   ├── Navbar.js ✅ - Navegación limpia (sin Catalog/LivePage)
│   └── Footer.js ✅ - Footer actualizado
├── pages/
│   ├── Profile.js ✅ - Perfil + transacciones integradas
│   ├── Marketplace.js ✅ - Multi-TCG marketplace con proxy
│   ├── Cart.js ✅ - Carrito con checkout modal
│   └── Binders.js ✅ - Gestión de colecciones
├── hooks/
│   └── useInventory.js ✅ - Hook para gestión de inventario
├── contexts/
│   └── CartContext.js ✅ - Estado global + transacciones
└── setupProxy.js ✅ - Proxy para CORS en desarrollo
```

### **Páginas Eliminadas:**
- ❌ `src/pages/Catalog.js` - Funcionalidad duplicada
- ❌ `src/pages/LivePage.js` - No necesaria en MVP
- ❌ `src/pages/Transactions.js` - Integrada en Profile.js

---

## 🎮 **Sistema Multi-TCG Implementado**

### **APIs Integradas:**
1. **Pokémon TCG** ⚡ - `https://api.pokemontcg.io/v2/cards`
   - ❌ **PROBLEMA ACTUAL:** Búsquedas infinitas sin resultados
   - API Key: `1f1c90be-e3da-4ff5-9753-8a662f20c2f0`

2. **TCG APIs (6 juegos)** ✅ - `https://www.apitcg.com/api/`
   - ✅ One Piece - Funcionando
   - ✅ Dragon Ball Fusion - Funcionando  
   - ✅ Digimon - Funcionando
   - ✅ Magic: The Gathering - Funcionando
   - ✅ Union Arena - Funcionando
   - ✅ Gundam - Funcionando
   - API Key: `dfdafe3318674ef4614e77913b6e2b85f80433d413f03c082503edb68d77ef2b`

### **Configuración de TCGs:**
```javascript
const TCG_CONFIGS = {
  pokemon: { 
    api: 'pokemon', 
    endpoint: 'https://api.pokemontcg.io/v2/cards',
    searchParam: 'name'
  },
  onepiece: { 
    api: 'tcgapis', 
    endpoint: 'https://www.apitcg.com/api/one-piece/cards' 
  },
  dragonball: { 
    api: 'tcgapis', 
    endpoint: 'https://www.apitcg.com/api/dragon-ball-fusion/cards' 
  },
  // ... más configuraciones
};
```

---

## 🌐 **Solución CORS y Proxy**

### **Problema Identificado:**
- APIs externas bloquean requests por CORS policy
- Redirects de `apitcg.com` → `www.apitcg.com` causan errores

### **Solución Implementada:**
```javascript
// setupProxy.js - Para desarrollo local
app.use('/api/tcg', createProxyMiddleware({
  target: 'https://www.apitcg.com',
  changeOrigin: true,
  pathRewrite: { '^/api/tcg': '/api' }
}));

// En componentes - Detección de entorno
const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = isProduction 
  ? config.endpoint 
  : config.endpoint.replace('https://www.apitcg.com/api', '/api/tcg');
```

### **Fallback System:**
- ✅ Datos de ejemplo cuando CORS falla
- ✅ Manejo elegante de errores
- ✅ URLs corregidas con `www` prefix

---

## 🔧 **Funcionalidades Implementadas**

### **Sistema de Transacciones Integrado:**
```javascript
// Ahora en Profile.js
Estados: initiated → contacted → completed → rated
Tabs: "Mis Compras" | "Mis Ventas"
Componentes: StatusBadge, TransactionCard, RatingSystem
```

### **Sistema Multi-TCG:**
```javascript
// SellCardModal.js y Marketplace.js
- Selector de juego con iconos
- APIs específicas por juego
- Búsqueda inteligente con fallbacks
- Manejo de diferentes estructuras de respuesta
```

### **Sistema de Inventario:**
```javascript
Campos en listings:
- quantity: Cantidad original
- availableQuantity: Stock actual disponible  
- status: 'active' | 'sold_out' | 'inactive'
```

---

## 🚀 **Despliegue y Producción**

### **Estado del Despliegue:**
- ✅ **Vercel:** Aplicación deployada y funcionando
- ✅ **Firebase:** Base de datos conectada
- ✅ **TCG APIs:** 6/7 funcionando correctamente
- ❌ **Pokémon API:** Requiere debugging

### **Variables de Entorno Necesarias:**
```bash
# Para producción futura
REACT_APP_POKEMON_API_KEY=1f1c90be-e3da-4ff5-9753-8a662f20c2f0
REACT_APP_TCG_API_KEY=dfdafe3318674ef4614e77913b6e2b85f80433d413f03c082503edb68d77ef2b
```

---

## 🐛 **Problemas Conocidos y Debugging**

### **CRÍTICO - API Pokémon TCG:**
```
❌ Síntomas: Búsqueda infinita sin resultados ni errores
❌ Ubicación: SellCardModal.js - pestaña Pokémon
❌ Logs Agregados: Console debugging para diagnosis
❌ Posibles Causas:
   - Sintaxis de query incorrecta
   - Headers malformados
   - Encoding issues
   - Rate limiting silencioso
```

### **PENDIENTE - Firestore Índices:**
```
❌ Error: "The query requires an index"
❌ Solución: Crear índice compuesto en Firebase Console
❌ Colección: transactions
❌ Campos: buyerId + createdAt (desc)
```

### **Debugging Agregado:**
```javascript
// En SellCardModal.js
console.log('🔍 Pokémon API - URL:', url);
console.log('🔍 Pokémon API - Query term:', queryTerm);
console.log('🔍 Pokémon API - Headers:', config.headers);
console.log('🔍 Pokémon API - Response data:', data);
```

---

## 📊 **Estructura de Datos Firestore**

### **Colección: transactions**
```javascript
{
  id: "auto-generated",
  buyerId: "user-uid",
  buyerName: "Username", 
  buyerNotes: "Notas opcionales",
  items: [{
    listingId: "listing-id",
    cardId: "pokemon-card-id", 
    cardName: "Charizard ex",
    sellerId: "seller-uid",
    tcgType: "pokemon", // NUEVO: identifica el tipo de TCG
    price: 25.00,
    quantity: 1,
    condition: "NM"
  }],
  totalAmount: 25.00,
  contactMethod: "whatsapp",
  status: "initiated",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Colección: listings (actualizada)**
```javascript
{
  // Campos existentes...
  tcgType: "pokemon", // NUEVO: identifica el tipo de TCG
  quantity: 3,
  availableQuantity: 2, 
  status: "active",
  // Soporte multi-TCG agregado
}
```

---

## 🚀 **Próximos Pasos Prioritarios**

### **URGENTE (Fixes):**
1. **🔍 Debug API Pokémon TCG**
   - Revisar console logs agregados
   - Probar diferentes formatos de query
   - Verificar headers y authentication
   - Considerar rate limiting

2. **📊 Crear Índice Firestore**
   - Firebase Console → Firestore → Índices
   - Colección: `transactions`
   - Campos: `buyerId` (asc) + `createdAt` (desc)

### **IMPORTANTE (Features):**
3. **🎛️ Dashboard de Vendedor**
   - Crear `/dashboard` route
   - Estadísticas de ventas por TCG
   - Gestión avanzada de listings
   - Gráficos de rendimiento

4. **🔒 Seguridad para Producción**
   - Mover API keys a variables de entorno
   - Validaciones de entrada
   - Permisos Firestore más restrictivos

### **NICE-TO-HAVE:**
5. **⏰ Sistema de Reservas**
   - Stock temporal en carrito (15 min)
   - Liberación automática
   - Notificaciones de expiración

---

## 🛠️ **Comandos de Desarrollo**

### **Local:**
```bash
npm start                 # Servidor de desarrollo (con proxy)
npm run build            # Build para producción
npm test                 # Tests
```

### **Debugging:**
```bash
# Abrir DevTools → Console para ver logs de Pokémon API
# Revisar Network tab para requests fallidos
# Verificar Headers y Response en failed requests
```

### **Deployment:**
```bash
git add .
git commit -m "fix: resolver problema API Pokémon TCG"
git push                 # Auto-deploy en Vercel
```

---

## 📱 **Rutas Actuales**

```javascript
✅ / - Home
✅ /marketplace - Marketplace multi-TCG principal  
✅ /perfil - Perfil + transacciones integradas
✅ /binders - Gestión de colecciones
✅ /binder/:id - Vista de binder específico
✅ /carrito - Carrito con checkout modal

❌ Eliminadas:
   /catalogo - Funcionalidad duplicada
   /live - No necesaria en MVP
   /transacciones - Integrada en /perfil

🔄 Pendientes:
   /dashboard - Dashboard de vendedor
```

---

## 🎨 **Stack Tecnológico**

### **Frontend:**
- ⚛️ React 18 + Hooks
- 🎨 Bootstrap 5 + react-bootstrap
- 🎭 React Icons + Framer Motion
- 🔥 Firebase v11 (Auth + Firestore)

### **APIs Externas:**
- 🐉 Pokémon TCG API v2
- 🏴‍☠️ TCG APIs (One Piece, Dragon Ball, etc.)
- 📱 WhatsApp Business Links
- 📧 Mailto: protocol

### **Deployment:**
- ▲ Vercel (Frontend + Auto-deploy)
- 🔥 Firebase (Backend + Database)
- 🌍 Custom Domain (configuración pendiente)

---

## 🔍 **Testing y QA**

### **Funcionalidades a Probar:**
1. **Multi-TCG Search:**
   - ✅ One Piece, Dragon Ball, Digimon, Magic, Union Arena, Gundam
   - ❌ Pokémon (requiere fix)

2. **Sistema de Transacciones:**
   - ✅ Crear transacción desde carrito
   - ✅ Ver historial en perfil (compras/ventas)
   - ✅ Sistema de calificaciones
   - ❌ Índice de Firestore (crear manualmente)

3. **Gestión de Inventario:**
   - ✅ Control de stock
   - ✅ Productos agotados
   - ✅ Transacciones atómicas

### **Browsers Soportados:**
- ✅ Chrome, Firefox, Safari, Edge (últimas versiones)
- ✅ Mobile responsive
- ✅ PWA ready (configuración básica)

---

## 📝 **Notas del Desarrollador**

### **Cambios Arquitecturales Importantes:**
1. **Eliminación de páginas redundantes** → App más enfocada
2. **Transacciones integradas en perfil** → UX más coherente  
3. **Sistema multi-TCG unificado** → Escalabilidad mejorada
4. **Proxy CORS para desarrollo** → Mejor DX

### **Decisiones de Diseño:**
- **Pokémon como TCG principal** → Más popular
- **Fallback data para CORS** → Mejor UX durante errores
- **Console logging temporal** → Debugging más fácil
- **Proxy solo en desarrollo** → Producción usa URLs directas

### **Deuda Técnica:**
- 🔧 Logs de debugging pendientes de limpiar
- 🔧 Hardcoded API keys (mover a .env)
- 🔧 Falta testing automatizado
- 🔧 Bundle size optimization pendiente

---

## 🎯 **Métricas de Éxito**

### **Objetivos Técnicos:**
- ✅ 7 TCG APIs integradas (6/7 funcionando)
- ✅ 0 errores CORS en producción
- ✅ App deployada y accessible
- ❌ Pokémon API funcional (pendiente)

### **Objetivos UX:**
- ✅ Navegación simplificada
- ✅ Transacciones centralizadas
- ✅ Multi-TCG en un solo lugar
- ✅ Feedback visual en todas las acciones

### **KPIs a Monitorear:**
- 📊 Búsquedas exitosas por TCG
- 📊 Transacciones completadas
- 📊 Tiempo de carga promedio
- 📊 Errores de API vs éxito

---

**📅 Última Actualización:** 2025-01-04  
**👨‍💻 Desarrollado con:** Claude Code  
**🎯 Objetivo Inmediato:** Fix API Pokémon TCG + Crear Índice Firestore  
**🚀 Estado del Deploy:** LIVE en Vercel (6/7 TCGs funcionando)