# 🎯 Tropical TCG Players - Contexto del Proyecto

## 📋 Descripción General
**Tropical TCG Players** es una aplicación web React completa para una comunidad local de jugadores de Trading Card Games (TCG) en Costa Rica. La plataforma permite a los usuarios comprar, vender, intercambiar cartas y gestionar sus colecciones de múltiples TCGs.

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con Create React App
- **Bootstrap 5.3** + React Bootstrap para UI
- **React Router** para navegación
- **Firebase SDK** para autenticación y base de datos
- **Framer Motion** para animaciones
- **React Icons** para iconografía

### Backend/Servicios
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Authentication** - Autenticación de usuarios
- **APIs Externas:** Multiple TCG APIs para datos de cartas

### Servicios de API
- **Pokemon TCG API v2** (https://api.pokemontcg.io/v2/)
- **TCG APIs** (https://apitcg.com/api/) para otros juegos

## 📁 Estructura del Proyecto

### Componentes Principales
```
src/
├── components/
│   ├── CardDetailModal.js      # Modal detallado de cartas (RECIENTEMENTE MEJORADO)
│   ├── SellCardModal.js        # Modal para vender cartas
│   ├── MarketplaceFilters.js   # Filtros del marketplace
│   ├── LatestCards.js          # Últimas cartas añadidas
│   └── FeaturedSections.js     # Secciones destacadas
├── pages/
│   ├── Marketplace.js          # Marketplace principal (RECIENTEMENTE OPTIMIZADO)
│   ├── CreateListing.js        # Crear listados de venta
│   ├── Dashboard.js            # Panel de usuario
│   └── BinderView.js           # Vista de carpetas/binders
├── contexts/
│   └── CartContext.js          # Contexto global del carrito
├── services/
│   └── apiSearchService.js     # Servicio de búsqueda de APIs (RECIENTEMENTE ARREGLADO)
└── styles/
    └── fonts.css               # Estilos globales y glassmorphism
```

## 🗃️ Estructura de la Base de Datos (Firebase Firestore) - ACTUALIZADA P2P

### Colecciones Principales

#### `users` *(ACTUALIZADA)*
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  username: string,
  phone: string,                    // REQUERIDO + verificado
  cedula: string,                   // NUEVO: Cédula obligatoria
  location: string,
  createdAt: timestamp,
  cart: array,                      // Carrito de compras
  binders: array,                   // IDs de carpetas
  listings: array,                  // IDs de listados activos
  rating: number,                   // Calificación promedio
  reviews: number,                  // Número de reseñas
  completedSales: number,           // NUEVO: Contador de ventas
  completedPurchases: number,       // NUEVO: Contador de compras
  recommendations: number,          // NUEVO: Cantidad de "likes" recibidos
  verificationStatus: {             // NUEVO: Estado de verificación
    phone: boolean,
    cedula: boolean,
    email: boolean
  },
  suspensionStatus: {               // NUEVO: Sistema de sanciones
    suspended: boolean,
    reason: string,
    until: timestamp
  }
}
```

#### `listings` *(ACTUALIZADA)*
```javascript
{
  cardId: string,        
  cardName: string,      
  cardImage: string,     
  tcgType: string,       
  setName: string,       
  rarity: string,        
  price: number,         
  condition: string,     
  quantity: number,      
  availableQuantity: number,         // Disponible para venta
  reservedQuantity: number,          // NUEVO: En transacciones pendientes
  description: string,   
  location: string,      
  sellerId: string,      
  sellerName: string,    
  userPhone: string,     
  userEmail: string,
  shippingIncluded: boolean,         // NUEVO: Si incluye envío gratis
  originStore: string,               // NUEVO: Tienda de origen
  status: string,                    // 'active', 'sold_out', 'inactive'
  createdAt: timestamp,
  updatedAt: timestamp,
  reservations: [                    // NUEVO: Array de reservas activas
    {
      transactionId: string,
      quantity: number,
      expiresAt: timestamp
    }
  ]
}
```

#### `transactions` *(COMPLETAMENTE REDISEÑADA)*
```javascript
{
  id: string,                       // ID único de transacción
  buyerId: string,                  // UID del comprador
  sellerId: string,                 // UID del vendedor
  buyerName: string,                // Nombre del comprador
  sellerName: string,               // Nombre del vendedor
  
  items: [                          // Items de la transacción
    {
      listingId: string,
      cardId: string,
      cardName: string,
      cardImage: string,
      quantity: number,
      price: number,
      condition: string
    }
  ],
  
  totalAmount: number,              // Total en colones
  shippingCost: number,             // Costo de envío (₡600 o ₡0)
  finalTotal: number,               // Total + envío
  
  status: string,                   // Ver estados completos abajo
  
  timeline: {                       // Timeline completo de la transacción
    created: timestamp,
    sellerDeadline: timestamp,      // +24h desde created
    sellerResponded: timestamp,
    deliveryDeadline: timestamp,    // +6 días desde accepted
    delivered: timestamp,
    paymentRequested: timestamp,
    paymentConfirmed: timestamp,
    buyerDeadline: timestamp,       // +10 días desde delivered
    buyerConfirmed: timestamp,
    ratingDeadline: timestamp,      // +7 días desde confirmed
    completed: timestamp
  },
  
  deliveryInfo: {                   // Información de entrega
    originStore: string,            // Tienda donde deja vendedor
    destinationStore: string,       // Tienda donde recoge comprador
    deliveryProof: {                // Foto de prueba
      imageUrl: string,
      uploadedAt: timestamp
    }
  },
  
  paymentInfo: {                    // Información de pago
    method: string,                 // 'sinpe', 'cash', 'trade', 'other'
    paymentProof: {                 // Comprobante del vendedor
      imageUrl: string,
      uploadedAt: timestamp
    },
    buyerConfirmed: boolean         // Si comprador confirmó pago
  },
  
  ratings: {                        // Calificaciones mutuas
    buyerToSeller: {
      stars: number,                // 1-5
      comment: string,              // Opcional
      timestamp: timestamp
    },
    sellerToBuyer: {
      stars: number,
      comment: string,
      timestamp: timestamp
    }
  },
  
  cancellationInfo: {               // Info si se cancela
    cancelledBy: string,            // 'buyer', 'seller', 'system', 'admin'
    reason: string,
    timestamp: timestamp
  },
  
  contactMethod: string,            // 'whatsapp' (principal)
  buyerNotes: string,               // Notas del comprador
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **🆕 NUEVAS COLECCIONES REQUERIDAS**

#### `pendingTransactions`
```javascript
{
  id: string,                       // Mismo ID que en transactions
  listingReservations: [            // Reservas de inventario
    {
      listingId: string,
      reservedQuantity: number,
      expiresAt: timestamp          // Para liberación automática
    }
  ],
  status: string,                   // Para tracking de reservas
  createdAt: timestamp
}
```

#### `notifications`
```javascript
{
  id: string,
  userId: string,                   // Destinatario
  type: string,                     // Tipo de notificación
  title: string,                    // Título
  message: string,                  // Mensaje completo
  
  relatedTransaction: string,       // ID de transacción relacionada
  
  channels: {                       // Canales de envío
    inApp: boolean,                 // Mostrar in-app
    whatsapp: boolean,              // Enviar por WhatsApp
    email: boolean,                 // Enviar por email
    sms: boolean                    // Enviar por SMS (futuro)
  },
  
  deliveryStatus: {                 // Estado de entrega
    inApp: {
      sent: boolean,
      read: boolean,
      readAt: timestamp
    },
    whatsapp: {
      sent: boolean,
      delivered: boolean,
      error: string
    },
    email: {
      sent: boolean,
      delivered: boolean,
      error: string
    }
  },
  
  actionRequired: boolean,          // Si requiere acción del usuario
  actionUrl: string,                // URL para acción requerida
  
  priority: string,                 // 'low', 'medium', 'high', 'urgent'
  expiresAt: timestamp,             // Para limpiar notificaciones viejas
  
  createdAt: timestamp
}
```

#### `disputes`
```javascript
{
  id: string,
  transactionId: string,            // Transacción en disputa
  reportedBy: string,               // UID de quien reporta
  reportedAgainst: string,          // UID del reportado
  
  type: string,                     // Tipo de disputa
  category: string,                 // Categoría específica
  description: string,              // Descripción del problema
  
  evidence: [                       // Evidencia adjunta
    {
      type: string,                 // 'image', 'screenshot', 'text'
      url: string,                  // URL del archivo (si aplica)
      description: string           // Descripción de la evidencia
    }
  ],
  
  status: string,                   // 'open', 'investigating', 'resolved', 'closed'
  priority: string,                 // 'low', 'medium', 'high'
  
  adminNotes: string,               // Notas internas del admin
  resolution: string,               // Resolución final
  actionsTaken: string,             // Acciones correctivas aplicadas
  
  createdAt: timestamp,
  resolvedAt: timestamp
}
```

#### `userRecommendations`
```javascript
{
  id: string,
  recommendedUserId: string,        // Usuario recomendado
  recommendingUserId: string,       // Usuario que recomienda
  createdAt: timestamp
}
```

#### `stores` *(NUEVA - Red de Tiendas)*
```javascript
{
  id: string,
  name: string,                     // Nombre de la tienda
  province: string,                 // Provincia
  city: string,                     // Ciudad
  address: string,                  // Dirección completa
  phone: string,                    // Teléfono de contacto
  email: string,                    // Email
  
  operatingHours: {                 // Horarios
    monday: { open: string, close: string },
    tuesday: { open: string, close: string },
    // ... resto de días
    sunday: { open: string, close: string }
  },
  
  isActive: boolean,                // Si está operativa
  acceptsDeliveries: boolean,       // Si acepta entregas de vendedores
  acceptsPickups: boolean,          // Si permite recoger compras
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **📊 ESTADOS DE TRANSACCIÓN COMPLETOS**
```javascript
const TRANSACTION_STATES = {
  // Fase inicial
  'pending_seller_response': 'Esperando respuesta del vendedor (24h)',
  
  // Vendedor acepta
  'accepted_pending_delivery': 'Aceptada, pendiente de entrega (6 días)',
  'delivered_pending_payment': 'Entregada, pendiente de pago',
  'payment_confirmed': 'Pago confirmado, pendiente recibo comprador (10 días)',
  
  // Estados finales
  'completed': 'Transacción completada con ratings',
  'completed_no_rating': 'Completada sin calificación mutua',
  
  // Cancelaciones
  'cancelled_by_seller': 'Cancelada por vendedor',
  'cancelled_by_buyer': 'Cancelada por comprador', 
  'cancelled_timeout_seller': 'Cancelada por timeout vendedor (24h)',
  'cancelled_timeout_delivery': 'Cancelada por timeout entrega (6 días)',
  'cancelled_by_admin': 'Cancelada por administrador',
  
  // Disputas
  'disputed': 'En disputa - bajo investigación',
  'resolved_favour_buyer': 'Disputa resuelta a favor del comprador',
  'resolved_favour_seller': 'Disputa resuelta a favor del vendedor'
};
```

## 🔗 APIs y Documentación

### Documentación de APIs TCG
- **Ubicación:** `.claude/TCG APIS DOCUMENTATION.txt`
- **APIs Soportadas:**
  - Pokémon TCG (api.pokemontcg.io)
  - One Piece TCG (apitcg.com)
  - Dragon Ball Fusion (apitcg.com)
  - Digimon TCG (apitcg.com)
  - Magic: The Gathering (apitcg.com)
  - Union Arena (apitcg.com)
  - Gundam TCG (apitcg.com)

### Variables de Entorno Requeridas
```
REACT_APP_POKEMON_API_KEY=your_pokemon_api_key
REACT_APP_TCG_API_KEY=your_tcg_api_key
```

## 🎨 Sistema de Diseño

### Tema Visual
- **Glassmorphism** - Efectos de cristal con `backdrop-filter: blur()`
- **Transparencias** - `rgba()` para fondos semi-transparentes
- **Tipografía** - Montserrat Alternates para títulos, Montserrat para texto
- **Background** - Imagen "background celeeste.png"

### Componentes Estilizados
- Cards transparentes con bordes redondeados
- Botones con efectos glassmorphism
- Modales con background blur
- Badges y elementos con transparencias

## 🚀 Funcionalidades Implementadas

### ✅ Completadas
1. **Sistema de Autenticación** - Firebase Auth completo
2. **Marketplace Avanzado** - Búsqueda multi-API con 48 resultados por página
3. **Modal de Cartas Mejorado** - 3 pestañas: Detalles, Precios, Vendedores
4. **Carrito de Compras** - Contexto global con Firebase sync
5. **Sistema de Listados** - Crear/editar/gestionar ventas
6. **Búsqueda de APIs** - Servicio unificado para todos los TCGs
7. **Sistema de Carpetas** - Binders personalizables
8. **Formateo de Datos** - JSON objects convertidos a texto limpio

### 🔧 Funcionalidades Principales

#### Marketplace (`src/pages/Marketplace.js`)
- Búsqueda específica por TCG (obligatorio seleccionar juego)
- 48 cartas por página (incrementado recientemente)
- Filtros avanzados con sidebar
- Integración con vendedores locales
- Precios comparativos

#### Modal de Cartas (`src/components/CardDetailModal.js`)
- **Header:** Nombre centrado y grande + botón corazón para favoritos
- **Pestaña Detalles:** Información específica por TCG
- **Pestaña Precios:** TCGPlayer.com + Mercado CR (ponderado local)
- **Pestaña Vendedores:** Lista completa con contacto y carrito
- Fondo glassmorphism en toda la interfaz

#### Servicio de APIs (`src/services/apiSearchService.js`)
- Búsqueda unificada en múltiples TCG APIs
- Normalización de datos entre diferentes APIs
- Formateo automático de objetos complejos (sets, precios)
- Cache inteligente y fallbacks

## 🐛 Problemas Resueltos Recientemente

### Formateo de Objetos JSON ✅
- **Problema:** Las APIs devolvían objetos complejos que se mostraban como JSON crudo
- **Solución:** Implementado `formatSetInfo()` y `safeString()` para mostrar texto limpio
- **Resultado:** Ahora muestra "Champion's Path, Sword & Shield" en lugar de JSON

### Límites de Búsqueda ✅
- **Problema:** Solo 12 resultados por búsqueda
- **Solución:** Incrementado a 48 cartas por página + mínimo 50 por API
- **Resultado:** Más cartas disponibles en cada búsqueda

### Restructuración de Modal ✅
- **Problema:** Interfaz desorganizada, pestañas inconsistentes
- **Solución:** 3 pestañas uniformes para todos los TCG, botón favoritos optimizado
- **Resultado:** UX consistente y profesional

## 🔄 **NUEVO FLUJO P2P COMPLETO - EN IMPLEMENTACIÓN**

### 🎯 **FLUJO DE COMPRA/VENTA PEER-TO-PEER**

Se ha definido un **sistema completo de transacciones P2P** que reemplaza el sistema básico anterior:

#### **FASES DEL FLUJO:**
1. **🛒 COMPRA:** Carrito multi-vendedor → Checkout separado por vendedor
2. **⏰ RESPUESTA (24h):** Vendedor acepta/rechaza → Auto-cancel si no responde  
3. **📦 ENTREGA (6 días):** Red de tiendas CR → Foto de confirmación obligatoria
4. **💳 PAGO:** Templates WhatsApp → Comprobante obligatorio
5. **📋 CONFIRMACIÓN (10 días):** Comprador confirma recibo → Auto-confirmar
6. **⭐ RATINGS:** Calificación mutua obligatoria (7 días) + Sistema de recomendaciones

### **🆕 NUEVAS FUNCIONALIDADES REQUERIDAS:**

#### **A. SISTEMA DE TRANSACCIONES AVANZADO**
- **Estados múltiples:** 8 estados diferentes con timeouts automáticos
- **Verificación atómica:** Prevención de sobreventa con reservas temporales
- **Gestión de inventario:** Restauración automática en cancelaciones
- **Checkout multi-vendedor:** UI separada por vendedor con opciones de envío

#### **B. SISTEMA DE NOTIFICACIONES COMPLETO**
- **WhatsApp API:** Templates automáticos para cada fase
- **Email backup:** Integración con Brevo API
- **In-app notifications:** Notificaciones tiempo real
- **Cloud Functions:** Timers automáticos y auto-cancelaciones

#### **C. SISTEMA DE SEGURIDAD Y VERIFICACIÓN**
- **Verificación obligatoria:** Cédula + teléfono para todos los usuarios
- **Fotos de prueba:** Validación de entregas con datos del comprador
- **Sistema anti-fraude:** Tracking de comportamiento + penalizaciones
- **Una cuenta por cédula:** Prevención de cuentas múltiples

#### **D. SISTEMA DE REPUTACIÓN AVANZADO**
- **Ratings mutuos:** Comprador ↔ Vendedor obligatorios
- **Sistema de recomendaciones:** "Likes" reversibles a perfiles
- **Consecuencias visibles:** Mayor/menor visibilidad según rating
- **Perfil público completo:** Stats detalladas de cada usuario

#### **E. SISTEMA DE ENVÍOS**
- **Red de tiendas:** 2+ tiendas por provincia en Costa Rica
- **Gestión manual:** Sistema de tracking propio (futuro)
- **Costos fijos:** ₡600 por envío entre tiendas
- **Selección flexible:** Vendedor elige origen, comprador elige destino

#### **F. SISTEMA DE DISPUTAS Y MODERACIÓN**
- **Reportes estructurados:** Diferentes tipos de disputas
- **Panel admin:** Herramientas de moderación y resolución
- **Medidas correctivas:** Warnings → suspensiones → bans permanentes
- **Investigación con evidencia:** Screenshots, fotos, historiales

### **📊 ESTADO ACTUAL DE IMPLEMENTACIÓN:**

#### **✅ COMPLETADO (Base Existente):**
- Sistema básico de carrito y transacciones
- Autenticación con Firebase
- Marketplace con búsqueda multi-API
- Modal de cartas con vendedores
- Base de datos estructurada

#### **🔄 EN PLANIFICACIÓN (Este Sprint):**
- **Nuevas colecciones BD:** `pendingTransactions`, `notifications`, `disputes`, `userRecommendations`
- **Cloud Functions:** Timeouts automáticos, envío de notificaciones
- **UI Components:** Checkout multi-vendedor, modales de rating, panel de transacciones
- **API Integration:** WhatsApp Business API, Email API (Brevo)
- **Security Layer:** Verificación de cédula, validación de fotos

## 📋 Pendientes para Producción

### 🎯 Próximas Mejoras
1. **Modo Offline** - PWA con Service Workers
2. **Análisis de Precios** - Gráficos históricos de precios
3. **Sistema de Intercambios** - Trading entre usuarios
4. **Wishlist Avanzada** - Notificaciones de cartas deseadas
5. **Geolocalización** - Vendedores cercanos

### 🔧 Optimizaciones Técnicas
1. **Code Splitting** - Lazy loading de componentes
2. **Image Optimization** - WebP y lazy loading
3. **Bundle Analysis** - Reducir tamaño de app
4. **Performance Monitoring** - Analytics y métricas

## 🎮 TCGs Soportados

| TCG | API | Status | Campos Específicos |
|-----|-----|--------|-------------------|
| Pokémon | Pokemon TCG API v2 | ✅ Activo | HP, tipos, ataques, habilidades |
| One Piece | TCG APIs | ✅ Activo | Costo, poder, counter, familia |
| Dragon Ball | TCG APIs | ✅ Activo | Poder, costo, características |
| Digimon | TCG APIs | ✅ Activo | DP, nivel, atributo |
| Magic | TCG APIs | ✅ Activo | Costo, tipo, habilidades |
| Union Arena | TCG APIs | ✅ Activo | AP, BP, efecto |
| Gundam | TCG APIs | ✅ Activo | HP, nivel, zona |

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm start

# Build para producción
npm run build

# Ejecutar tests
npm test

# Linting (si está configurado)
npm run lint

# Type checking (si está configurado) 
npm run typecheck
```

## 📝 Notas para Sesiones Futuras

### Estado Actual del Proyecto
- **Modal de cartas:** Completamente optimizado y listo para producción
- **Marketplace:** Búsqueda funcionando con 48 resultados por página
- **APIs:** Formateo de datos funcionando correctamente
- **Base de datos:** Estructura estable y escalable

### Próximos Pasos Recomendados
1. **Sistema de calificaciones** para vendedores
2. **Optimización de rendimiento** (lazy loading, code splitting)
3. **Panel de administración** para moderación
4. **Sistema de pagos** integrado
5. **Testing automatizado** (Jest, Cypress)

### **📂 ARCHIVOS CRÍTICOS PARA EL NUEVO FLUJO P2P**

#### **🔄 ARCHIVOS A MODIFICAR**
- `src/contexts/CartContext.js` - Extender con lógica de reservas y transacciones P2P
- `src/pages/Marketplace.js` - Integrar con nuevo sistema de disponibilidad
- `src/components/SellCardModal.js` - Agregar opción de envío incluido

#### **🆕 ARCHIVOS A CREAR**
- `src/contexts/TransactionContext.js` - Contexto para manejo de transacciones P2P
- `src/components/TransactionModal.js` - Modal principal de gestión de transacciones
- `src/components/CheckoutMultiVendor.js` - Checkout separado por vendedor
- `src/components/RatingModal.js` - Modal de calificaciones mutuas
- `src/components/NotificationPanel.js` - Panel de notificaciones in-app
- `src/components/DisputeModal.js` - Modal para reportar disputas
- `src/pages/TransactionDashboard.js` - Dashboard de transacciones del usuario
- `src/services/notificationService.js` - Servicio de notificaciones
- `src/services/whatsappService.js` - Integración con WhatsApp API
- `src/hooks/useTransactions.js` - Hook personalizado para transacciones
- `src/utils/transactionHelpers.js` - Utilidades y helpers

#### **☁️ CLOUD FUNCTIONS A CREAR**
- `functions/transactionTimeouts.js` - Auto-cancelar transacciones vencidas
- `functions/notificationSender.js` - Envío automático de notificaciones
- `functions/inventoryManager.js` - Gestión automática de inventario
- `functions/ratingEnforcer.js` - Penalizar usuarios sin calificar

#### **🗂️ ARCHIVOS DE CONFIGURACIÓN**
- `.env` - Agregar WhatsApp API keys, Brevo API keys
- `firebase.json` - Configurar nuevas Cloud Functions
- `firestore.rules` - Actualizar reglas de seguridad para nuevas colecciones

### **🚀 PLAN DE IMPLEMENTACIÓN RECOMENDADO**

#### **Sprint 1: Base de Datos y Backend**
1. Crear nuevas colecciones en Firestore
2. Actualizar colecciones existentes
3. Implementar Cloud Functions básicas
4. Configurar APIs externas (WhatsApp, Email)

#### **Sprint 2: Contextos y Servicios**
1. Crear TransactionContext
2. Extender CartContext
3. Implementar servicios de notificación
4. Crear hooks personalizados

#### **Sprint 3: UI/UX Components**
1. Checkout multi-vendedor
2. Dashboard de transacciones
3. Modales de rating y disputas
4. Panel de notificaciones

#### **Sprint 4: Integración y Testing**
1. Integrar todos los componentes
2. Testing exhaustivo de flujos
3. Optimización y pulimiento
4. Deploy y monitoreo

---

## 🚀 **PLAN DETALLADO DE IMPLEMENTACIÓN - 4 SPRINTS**

### **📋 INSTRUCCIONES PARA CONTINUIDAD DE IA:**

**IMPORTANTE:** Este plan permite a cualquier IA continuar la implementación desde cualquier punto. Cada sprint es independiente y tiene todo el contexto necesario.

**CONTEXTO REQUERIDO:**
- Leer completamente `Context.md` y `CLAUDE.md`
- Entender flujo P2P de 6 fases definido
- Conocer estructura actual del proyecto React + Firebase
- Revisar código existente en `src/contexts/CartContext.js` y `src/pages/Marketplace.js`

---

## 🏗️ **SPRINT 1: FOUNDATION - BASE DE DATOS Y BACKEND**
**Duración estimada:** 3-4 días
**Objetivo:** Crear infraestructura backend completa para el sistema P2P

### **FASE 1.1: ACTUALIZACIÓN DE COLECCIONES EXISTENTES** ⏱️ 1 día

#### **A. Actualizar colección `users`**
```javascript
// ACCIÓN: Agregar campos nuevos a documentos existentes
// UBICACIÓN: Firebase Console o Cloud Function de migración

// CAMPOS A AGREGAR:
{
  cedula: string,                   // Cédula verificada
  completedSales: 0,               // Inicializar en 0
  completedPurchases: 0,           // Inicializar en 0  
  recommendations: 0,              // Inicializar en 0
  verificationStatus: {            // Estado verificación
    phone: false,
    cedula: false,
    email: true                    // Ya verificado por Firebase Auth
  },
  suspensionStatus: {              // Sistema sanciones
    suspended: false,
    reason: "",
    until: null
  }
}

// MIGRACIÓN REQUERIDA:
// 1. Crear Cloud Function: migrateUsers()
// 2. Ejecutar sobre todos los documentos usuarios existentes
// 3. Mantener compatibilidad con código actual
```

#### **B. Actualizar colección `listings`**
```javascript
// ACCIÓN: Extender estructura de listings

// CAMPOS A AGREGAR:
{
  reservedQuantity: 0,             // Cantidad reservada en transacciones
  shippingIncluded: false,         // Por defecto sin envío incluido
  originStore: "",                 // Tienda de origen (vacío inicialmente)
  reservations: []                 // Array vacío inicialmente
}

// MIGRACIÓN:
// 1. Función: migrateListings()
// 2. Verificar que availableQuantity = quantity - reservedQuantity
// 3. Mantener compatibilidad con SellCardModal.js existente
```

#### **C. Reestructurar colección `transactions`**
```javascript
// ACCIÓN: Migrar transacciones existentes al nuevo formato

// MIGRACIÓN COMPLEJA REQUERIDA:
// 1. Backup de transactions actuales
// 2. Crear nuevas transactions con formato P2P completo
// 3. Mapear campos antiguos a nuevos:
//    - buyerId, buyerName, items → mantener
//    - status → convertir a nuevos estados P2P
//    - agregar campos: timeline, deliveryInfo, paymentInfo, ratings
```

### **FASE 1.2: CREAR NUEVAS COLECCIONES** ⏱️ 0.5 días

#### **A. Colección `pendingTransactions`**
```javascript
// PROPÓSITO: Manejar reservas temporales de inventario
// CREACIÓN: Automática con primera transacción P2P

// REGLAS FIRESTORE REQUERIDAS:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pendingTransactions/{transactionId} {
      allow read, write: if request.auth != null 
        && (request.auth.uid == resource.data.buyerId 
        || request.auth.uid == resource.data.sellerId);
    }
  }
}
```

#### **B. Colección `notifications`**
```javascript
// PROPÓSITO: Sistema notificaciones multi-canal
// ÍNDICES REQUERIDOS:
// - userId + createdAt (desc) 
// - type + createdAt (desc)
// - expiresAt (para cleanup automático)

// REGLAS FIRESTORE:
match /notifications/{notificationId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.userId;
}
```

#### **C. Colecciones adicionales**
```javascript
// disputes, userRecommendations, stores
// Ver especificación completa en sección "Base de Datos"
// Crear con reglas de seguridad apropiadas
```

### **FASE 1.3: CLOUD FUNCTIONS BÁSICAS** ⏱️ 2 días

#### **A. Función: transactionTimeouts.js**
```javascript
// UBICACIÓN: functions/transactionTimeouts.js
// TRIGGER: Pub/Sub cada 5 minutos

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.processTimeouts = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // 1. Buscar transacciones con sellerDeadline vencida
    const expiredSellerResponse = await admin.firestore()
      .collection('transactions')
      .where('status', '==', 'pending_seller_response')
      .where('timeline.sellerDeadline', '<', now)
      .get();
      
    // 2. Auto-cancelar y restaurar inventario
    for (const doc of expiredSellerResponse.docs) {
      await cancelTransactionAndRestoreInventory(doc.id, 'timeout_seller');
    }
    
    // 3. Repetir para otros timeouts: delivery, rating, etc.
    // Ver implementación completa requerida
  });

// FUNCIÓN HELPER CRÍTICA:
async function cancelTransactionAndRestoreInventory(transactionId, reason) {
  // 1. Obtener transaction data
  // 2. Restaurar availableQuantity en listings
  // 3. Eliminar reservations
  // 4. Actualizar estado transaction
  // 5. Crear notificación para usuario
  // 6. Aplicar penalización si corresponde
}
```

#### **B. Función: notificationSender.js**
```javascript
// UBICACIÓN: functions/notificationSender.js
// TRIGGER: Firestore onCreate en /notifications/{notificationId}

exports.sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    // 1. WhatsApp (si channels.whatsapp = true)
    if (notification.channels.whatsapp) {
      await sendWhatsApp(notification);
    }
    
    // 2. Email (si channels.email = true)  
    if (notification.channels.email) {
      await sendEmail(notification);
    }
    
    // 3. Actualizar deliveryStatus
    await snap.ref.update({
      'deliveryStatus.inApp.sent': true
    });
  });

// APIs REQUERIDAS:
// - WhatsApp Business API
// - Brevo/SendGrid para email
// Variables de entorno en .env
```

### **FASE 1.4: CONFIGURACIÓN DE APIS EXTERNAS** ⏱️ 0.5 días

#### **A. Variables de entorno requeridas (.env)**
```bash
# WhatsApp Business API
REACT_APP_WHATSAPP_API_URL=https://graph.facebook.com/v17.0/
REACT_APP_WHATSAPP_ACCESS_TOKEN=tu_token_aqui
REACT_APP_WHATSAPP_PHONE_ID=tu_phone_id

# Email API (Brevo)
REACT_APP_BREVO_API_KEY=tu_api_key
REACT_APP_BREVO_SENDER_EMAIL=noreply@tropicaltcg.com

# Firebase Functions
FIREBASE_PROJECT_ID=tu-proyecto-id
```

#### **B. Configurar firebase.json**
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "predeploy": ["npm --prefix functions run build"]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### **ENTREGABLES SPRINT 1:**
✅ Colecciones actualizadas y migradas
✅ 6 nuevas colecciones creadas con reglas de seguridad
✅ 2 Cloud Functions deployadas y funcionando
✅ APIs externas configuradas y probadas
✅ Variables de entorno documentadas

---

## 🔧 **SPRINT 2: SERVICIOS Y CONTEXTOS**
**Duración estimada:** 3-4 días  
**Objetivo:** Crear lógica de negocio y contextos React para P2P

### **FASE 2.1: EXTENDER CARTCONTEXT** ⏱️ 1.5 días

#### **A. Agregar funciones de reserva**
```javascript
// UBICACIÓN: src/contexts/CartContext.js
// AGREGAR AL CONTEXTO EXISTENTE:

// NUEVA FUNCIÓN: createPendingTransaction()
const createPendingTransaction = async (vendorItems, destinationStore) => {
  try {
    // 1. Verificar disponibilidad atómica de todos los items
    const availability = await Promise.all(
      vendorItems.map(item => checkAtomicAvailability(item.listingId, item.quantity))
    );
    
    if (!availability.every(a => a.available)) {
      throw new Error('Algunos items ya no están disponibles');
    }
    
    // 2. Crear reservas temporales
    const reservations = await createTemporaryReservations(vendorItems);
    
    // 3. Crear transaction con estado pending_seller_response
    const transaction = await createTransactionDocument(vendorItems, destinationStore);
    
    // 4. Programar timeout automático (24h)
    await scheduleSellerTimeout(transaction.id);
    
    // 5. Enviar notificación al vendedor
    await createSellerNotification(transaction);
    
    return transaction.id;
    
  } catch (error) {
    // Rollback cualquier reserva creada
    await rollbackReservations(reservations);
    throw error;
  }
};

// FUNCIÓN CRÍTICA: checkAtomicAvailability()
const checkAtomicAvailability = async (listingId, requestedQuantity) => {
  return await admin.firestore().runTransaction(async (transaction) => {
    const listingRef = admin.firestore().doc(`listings/${listingId}`);
    const listing = await transaction.get(listingRef);
    
    if (!listing.exists) {
      return { available: false, reason: 'Listing no existe' };
    }
    
    const data = listing.data();
    const available = (data.availableQuantity || 0) - (data.reservedQuantity || 0);
    
    if (available >= requestedQuantity) {
      // Incrementar reservedQuantity atómicamente
      transaction.update(listingRef, {
        reservedQuantity: (data.reservedQuantity || 0) + requestedQuantity
      });
      return { available: true };
    } else {
      return { available: false, reason: `Solo ${available} disponibles` };
    }
  });
};
```

#### **B. Actualizar funciones existentes**
```javascript
// MODIFICAR: addToCart() existente
// AGREGAR: Validaciones de reservas activas
// MODIFICAR: removeFromCart() existente  
// AGREGAR: Liberar reservas si es necesario

// NUEVA FUNCIÓN: getCartByVendor()
const getCartByVendor = () => {
  const cartByVendor = {};
  cart.forEach(item => {
    const vendorId = item.sellerId;
    if (!cartByVendor[vendorId]) {
      cartByVendor[vendorId] = {
        vendor: {
          id: vendorId,
          name: item.sellerName,
          location: item.location
        },
        items: [],
        totalAmount: 0,
        shippingCost: 0,
        finalTotal: 0
      };
    }
    cartByVendor[vendorId].items.push(item);
    cartByVendor[vendorId].totalAmount += item.price * item.quantity;
    
    // Calcular envío (₡600 si no está incluido)
    if (!item.shippingIncluded) {
      cartByVendor[vendorId].shippingCost = 600;
    }
    cartByVendor[vendorId].finalTotal = 
      cartByVendor[vendorId].totalAmount + cartByVendor[vendorId].shippingCost;
  });
  return cartByVendor;
};
```

### **FASE 2.2: CREAR TRANSACTIONCONTEXT** ⏱️ 1.5 días

#### **A. Nuevo contexto completo**
```javascript
// UBICACIÓN: src/contexts/TransactionContext.js
// CREAR ARCHIVO NUEVO

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from './CartContext';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [userTransactions, setUserTransactions] = useState([]);
  const [activeTransactions, setActiveTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useCart();

  // FUNCIÓN: getUserTransactions()
  const getUserTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Obtener transacciones donde el usuario es comprador O vendedor
      const buyerQuery = query(
        collection(db, 'transactions'),
        where('buyerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const sellerQuery = query(
        collection(db, 'transactions'),  
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const [buyerDocs, sellerDocs] = await Promise.all([
        getDocs(buyerQuery),
        getDocs(sellerQuery)
      ]);
      
      const allTransactions = [
        ...buyerDocs.docs.map(doc => ({ id: doc.id, ...doc.data(), userRole: 'buyer' })),
        ...sellerDocs.docs.map(doc => ({ id: doc.id, ...doc.data(), userRole: 'seller' }))
      ];
      
      // Ordenar por fecha
      allTransactions.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      
      setUserTransactions(allTransactions);
      
      // Filtrar transacciones activas (no completadas/canceladas)
      const active = allTransactions.filter(t => 
        !['completed', 'cancelled_by_seller', 'cancelled_by_buyer', 'cancelled_timeout_seller'].includes(t.status)
      );
      setActiveTransactions(active);
      
    } catch (error) {
      console.error('Error getting transactions:', error);
    }
    setLoading(false);
  };

  // FUNCIÓN: updateTransactionStatus()
  const updateTransactionStatus = async (transactionId, newStatus, additionalData = {}) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        ...additionalData
      };
      
      await updateDoc(doc(db, 'transactions', transactionId), updateData);
      
      // Refrescar transacciones
      await getUserTransactions();
      
      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  };

  // FUNCIÓN: acceptTransaction() - Para vendedores
  const acceptTransaction = async (transactionId, originStore) => {
    try {
      const now = new Date();
      const deliveryDeadline = new Date(now.getTime() + (6 * 24 * 60 * 60 * 1000)); // +6 días
      
      const success = await updateTransactionStatus(transactionId, 'accepted_pending_delivery', {
        'timeline.sellerResponded': now,
        'timeline.deliveryDeadline': deliveryDeadline,
        'deliveryInfo.originStore': originStore
      });
      
      if (success) {
        // Crear notificación para comprador
        await createBuyerNotification(transactionId, 'transaction_accepted');
        // Programar timeout de entrega
        await scheduleDeliveryTimeout(transactionId);
      }
      
      return success;
    } catch (error) {
      console.error('Error accepting transaction:', error);
      return false;
    }
  };

  // FUNCIÓN: rejectTransaction() - Para vendedores  
  const rejectTransaction = async (transactionId, reason) => {
    try {
      const success = await updateTransactionStatus(transactionId, 'cancelled_by_seller', {
        'timeline.sellerResponded': new Date(),
        'cancellationInfo.cancelledBy': 'seller',
        'cancellationInfo.reason': reason,
        'cancellationInfo.timestamp': new Date()
      });
      
      if (success) {
        // Restaurar inventario
        await restoreTransactionInventory(transactionId);
        // Notificar comprador
        await createBuyerNotification(transactionId, 'transaction_rejected');
      }
      
      return success;
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      return false;
    }
  };

  // ... [más funciones: confirmDelivery, confirmPayment, submitRating, etc.]

  return (
    <TransactionContext.Provider value={{
      userTransactions,
      activeTransactions,
      loading,
      getUserTransactions,
      updateTransactionStatus,
      acceptTransaction,
      rejectTransaction,
      // ... más funciones
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionContext);
}
```

### **FASE 2.3: SERVICIOS DE NOTIFICACIÓN** ⏱️ 1 día

#### **A. Servicio de notificaciones**
```javascript
// UBICACIÓN: src/services/notificationService.js
// CREAR ARCHIVO NUEVO

class NotificationService {
  // FUNCIÓN: createNotification()
  async createNotification(userId, type, title, message, options = {}) {
    const notification = {
      userId,
      type,
      title,
      message,
      relatedTransaction: options.transactionId || null,
      channels: {
        inApp: true,
        whatsapp: options.whatsapp || false,
        email: options.email || false,
        sms: false
      },
      deliveryStatus: {
        inApp: { sent: false, read: false, readAt: null },
        whatsapp: { sent: false, delivered: false, error: null },
        email: { sent: false, delivered: false, error: null }
      },
      actionRequired: options.actionRequired || false,
      actionUrl: options.actionUrl || null,
      priority: options.priority || 'medium',
      expiresAt: options.expiresAt || null,
      createdAt: new Date()
    };
    
    try {
      const docRef = await addDoc(collection(db, 'notifications'), notification);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // FUNCIÓN: getWhatsAppUrl()
  getWhatsAppUrl(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  // TEMPLATES PREDEFINIDOS
  getTemplate(type, data) {
    const templates = {
      seller_new_purchase: {
        title: "🎯 Nueva compra",
        message: `Tienes una nueva solicitud de compra de ${data.cardName} por ₡${data.price}. Tienes 24 horas para responder.`,
        whatsapp: true
      },
      buyer_accepted: {
        title: "✅ Compra aceptada", 
        message: `Tu compra de ${data.cardName} fue aceptada por ${data.sellerName}. Coordinen la entrega.`,
        whatsapp: true
      },
      // ... más templates
    };
    
    return templates[type] || null;
  }
}

export default new NotificationService();
```

### **ENTREGABLES SPRINT 2:**
✅ CartContext extendido con funciones P2P
✅ TransactionContext completo creado
✅ NotificationService implementado
✅ WhatsAppService básico funcionando  
✅ Hooks personalizados creados

---

## 🎨 **SPRINT 3: COMPONENTES UI/UX**
**Duración estimada:** 4-5 días
**Objetivo:** Crear interfaces completas para el flujo P2P

### **FASE 3.1: CHECKOUT MULTI-VENDEDOR** ⏱️ 2 días

#### **A. Componente principal**
```javascript
// UBICACIÓN: src/components/CheckoutMultiVendor.js
// CREAR ARCHIVO NUEVO

import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Form } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import StoreSelector from './StoreSelector';

export default function CheckoutMultiVendor({ show, onHide }) {
  const { cart, getCartByVendor } = useCart();
  const [selectedStores, setSelectedStores] = useState({});
  const [processing, setProcessing] = useState(false);
  
  const cartByVendor = getCartByVendor();

  const handleConfirmPurchase = async (vendorId) => {
    setProcessing(true);
    try {
      const vendorCart = cartByVendor[vendorId];
      const destinationStore = selectedStores[vendorId];
      
      if (!destinationStore) {
        alert('Selecciona una tienda de destino');
        return;
      }
      
      // Crear transacción P2P
      const transactionId = await createPendingTransaction(vendorCart.items, destinationStore);
      
      if (transactionId) {
        // Remover items del carrito
        vendorCart.items.forEach(item => removeFromCart(item.listingId));
        
        alert(`Solicitud enviada a ${vendorCart.vendor.name}. Te notificaremos su respuesta.`);
      }
    } catch (error) {
      alert('Error procesando compra: ' + error.message);
    }
    setProcessing(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>🛒 Confirmar Compras</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {Object.entries(cartByVendor).map(([vendorId, vendorData]) => (
          <Card key={vendorId} className="mb-4">
            <Card.Header>
              <h5>📦 {vendorData.vendor.name}</h5>
              <small className="text-muted">{vendorData.vendor.location}</small>
            </Card.Header>
            <Card.Body>
              {/* Lista de items */}
              {vendorData.items.map(item => (
                <Row key={item.listingId} className="align-items-center mb-2">
                  <Col md={2}>
                    <img src={item.cardImage} alt={item.cardName} style={{width: '40px'}} />
                  </Col>
                  <Col md={6}>
                    <strong>{item.cardName}</strong>
                    <br />
                    <small>{item.condition} - {item.setName}</small>
                  </Col>
                  <Col md={2}>
                    {item.quantity}x
                  </Col>
                  <Col md={2}>
                    ₡{(item.price * item.quantity).toLocaleString()}
                  </Col>
                </Row>
              ))}
              
              <hr />
              
              {/* Resumen de costos */}
              <Row>
                <Col md={8}>
                  <strong>Subtotal:</strong><br />
                  <strong>Envío:</strong><br />
                  <h5>Total:</h5>
                </Col>
                <Col md={4} className="text-end">
                  ₡{vendorData.totalAmount.toLocaleString()}<br />
                  {vendorData.shippingCost > 0 ? `₡${vendorData.shippingCost}` : 'Gratis'}<br />
                  <h5>₡{vendorData.finalTotal.toLocaleString()}</h5>
                </Col>
              </Row>
              
              {/* Selector de tienda */}
              <Form.Group className="mt-3">
                <Form.Label>Tienda de destino:</Form.Label>
                <StoreSelector 
                  selectedStore={selectedStores[vendorId]}
                  onStoreSelect={(store) => setSelectedStores({...selectedStores, [vendorId]: store})}
                />
              </Form.Group>
              
              {/* Botón de confirmación */}
              <Button 
                variant="success" 
                className="w-100 mt-3"
                onClick={() => handleConfirmPurchase(vendorId)}
                disabled={processing || !selectedStores[vendorId]}
              >
                {processing ? 'Procesando...' : `Confirmar compra con ${vendorData.vendor.name}`}
              </Button>
            </Card.Body>
          </Card>
        ))}
      </Modal.Body>
    </Modal>
  );
}
```

#### **B. Componente selector de tiendas**
```javascript
// UBICACIÓN: src/components/StoreSelector.js
// CREAR ARCHIVO NUEVO

import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { collection, getDocs, where, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function StoreSelector({ selectedStore, onStoreSelect }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesQuery = query(
          collection(db, 'stores'),
          where('isActive', '==', true),
          where('acceptsPickups', '==', true)
        );
        
        const storesSnapshot = await getDocs(storesQuery);
        const storesData = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
      setLoading(false);
    };

    fetchStores();
  }, []);

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const store = stores.find(s => s.id === storeId);
    onStoreSelect(store);
  };

  if (loading) return <Form.Select disabled><option>Cargando tiendas...</option></Form.Select>;

  return (
    <Form.Select value={selectedStore?.id || ''} onChange={handleStoreChange}>
      <option value="">Selecciona una tienda...</option>
      {stores.map(store => (
        <option key={store.id} value={store.id}>
          {store.name} - {store.city}, {store.province}
        </option>
      ))}
    </Form.Select>
  );
}
```

### **FASE 3.2: DASHBOARD DE TRANSACCIONES** ⏱️ 2 días

#### **A. Página principal del dashboard**
```javascript
// UBICACIÓN: src/pages/TransactionDashboard.js  
// CREAR ARCHIVO NUEVO

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Tabs, Tab } from 'react-bootstrap';
import { useTransactions } from '../contexts/TransactionContext';
import TransactionCard from '../components/TransactionCard';
import RatingModal from '../components/RatingModal';

export default function TransactionDashboard() {
  const { userTransactions, activeTransactions, loading, getUserTransactions } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    getUserTransactions();
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_seller_response': { variant: 'warning', text: 'Esperando vendedor' },
      'accepted_pending_delivery': { variant: 'info', text: 'Pendiente entrega' },
      'delivered_pending_payment': { variant: 'primary', text: 'Pendiente pago' },
      'payment_confirmed': { variant: 'success', text: 'Pago confirmado' },
      'completed': { variant: 'success', text: 'Completada' },
      // ... más estados
    };
    
    return statusMap[status] || { variant: 'secondary', text: status };
  };

  const getActionButton = (transaction) => {
    const { status, userRole } = transaction;
    
    if (userRole === 'seller' && status === 'pending_seller_response') {
      return (
        <Button 
          variant="success" 
          size="sm"
          onClick={() => handleSellerResponse(transaction.id)}
        >
          Responder
        </Button>
      );
    }
    
    if (userRole === 'seller' && status === 'accepted_pending_delivery') {
      return (
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => handleConfirmDelivery(transaction.id)}
        >
          Confirmar Entrega
        </Button>
      );
    }
    
    if (status === 'completed' && !transaction.ratings?.[userRole === 'buyer' ? 'buyerToSeller' : 'sellerToBuyer']) {
      return (
        <Button 
          variant="warning" 
          size="sm"
          onClick={() => openRatingModal(transaction)}
        >
          Calificar
        </Button>
      );
    }
    
    return null;
  };

  return (
    <Container className="py-4">
      <h2>📊 Mis Transacciones</h2>
      
      <Tabs defaultActiveKey="active" className="mb-4">
        <Tab eventKey="active" title={`Activas (${activeTransactions.length})`}>
          <Row>
            {activeTransactions.map(transaction => (
              <Col key={transaction.id} md={6} lg={4} className="mb-3">
                <TransactionCard 
                  transaction={transaction}
                  onAction={getActionButton(transaction)}
                />
              </Col>
            ))}
          </Row>
        </Tab>
        
        <Tab eventKey="all" title={`Todas (${userTransactions.length})`}>
          <Row>
            {userTransactions.map(transaction => (
              <Col key={transaction.id} md={6} lg={4} className="mb-3">
                <TransactionCard 
                  transaction={transaction}
                  onAction={getActionButton(transaction)}
                />
              </Col>
            ))}
          </Row>
        </Tab>
        
        <Tab eventKey="completed" title="Completadas">
          {/* Filtrar solo completadas */}
        </Tab>
      </Tabs>

      {/* Modal de calificación */}
      <RatingModal 
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        transaction={selectedTransaction}
      />
    </Container>
  );
}
```

### **FASE 3.3: MODAL DE CALIFICACIONES** ⏱️ 1 día

#### **A. Modal de rating completo**
```javascript
// UBICACIÓN: src/components/RatingModal.js
// CREAR ARCHIVO NUEVO

import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useTransactions } from '../contexts/TransactionContext';

export default function RatingModal({ show, onHide, transaction }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { submitRating } = useTransactions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Debes seleccionar una calificación');
      return;
    }
    
    setSubmitting(true);
    try {
      await submitRating(transaction.id, rating, comment.trim());
      alert('Calificación enviada exitosamente');
      onHide();
    } catch (error) {
      alert('Error enviando calificación: ' + error.message);
    }
    setSubmitting(false);
  };

  const isOtherUser = transaction?.userRole === 'buyer' ? 
    transaction.sellerName : 
    transaction.buyerName;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>⭐ Calificar Transacción</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="text-center mb-4">
            <h5>¿Cómo fue tu experiencia con {isOtherUser}?</h5>
            <p className="text-muted">Tu calificación es obligatoria para completar la transacción</p>
          </div>
          
          {/* Sistema de estrellas */}
          <div className="text-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                size={32}
                style={{ 
                  cursor: 'pointer', 
                  color: star <= (hoverRating || rating) ? '#ffc107' : '#e4e5e9',
                  marginRight: '8px'
                }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
          
          {/* Labels para estrellas */}
          <div className="text-center mb-4">
            {rating > 0 && (
              <p className="mb-0">
                {rating === 1 && "😞 Muy malo"}
                {rating === 2 && "🙁 Malo"}  
                {rating === 3 && "😐 Regular"}
                {rating === 4 && "🙂 Bueno"}
                {rating === 5 && "😄 Excelente"}
              </p>
            )}
          </div>
          
          {/* Comentario opcional */}
          <Form.Group>
            <Form.Label>Comentario (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Comparte tu experiencia con otros usuarios..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {comment.length}/500 caracteres
            </Form.Text>
          </Form.Group>
          
          {/* Resumen de la transacción */}
          {transaction && (
            <div className="bg-light p-3 rounded mt-3">
              <h6>Resumen de la transacción:</h6>
              <small>
                • {transaction.items?.length} item(s)<br />
                • Total: ₡{transaction.finalTotal?.toLocaleString()}<br />
                • Fecha: {transaction.createdAt?.toDate?.()?.toLocaleDateString()}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="success" type="submit" disabled={submitting || rating === 0}>
            {submitting ? 'Enviando...' : 'Enviar Calificación'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
```

### **ENTREGABLES SPRINT 3:**
✅ CheckoutMultiVendor funcionando completamente
✅ TransactionDashboard con todas las vistas
✅ RatingModal con sistema de estrellas
✅ StoreSelector integrado
✅ NotificationPanel básico implementado

---

## 🔗 **SPRINT 4: INTEGRACIÓN Y TESTING**
**Duración estimada:** 2-3 días
**Objetivo:** Integrar todo y realizar testing exhaustivo

### **FASE 4.1: INTEGRACIÓN COMPLETA** ⏱️ 1.5 días

#### **A. Actualizar componentes existentes**
```javascript
// MODIFICAR: src/components/SellCardModal.js
// AGREGAR: Campo para incluir envío
<Form.Check 
  type="checkbox"
  label="Incluir envío gratis (₡600)"
  checked={shippingIncluded}
  onChange={(e) => setShippingIncluded(e.target.checked)}
/>

// AGREGAR: Selector de tienda de origen  
<Form.Group>
  <Form.Label>Tienda de origen (donde dejarás la carta)</Form.Label>
  <StoreSelector 
    selectedStore={originStore}
    onStoreSelect={setOriginStore}
    filterBy="acceptsDeliveries"
  />
</Form.Group>
```

```javascript
// MODIFICAR: src/pages/Marketplace.js
// ACTUALIZAR: Lógica de disponibilidad
// CONSIDERAR: reservedQuantity en cálculos
const actualAvailable = listing.availableQuantity - (listing.reservedQuantity || 0);
```

#### **B. Integrar contextos**
```javascript
// MODIFICAR: src/App.js
// AGREGAR: TransactionProvider

import { TransactionProvider } from './contexts/TransactionContext';

function App() {
  return (
    <CartProvider>
      <TransactionProvider>
        {/* resto de la app */}
      </TransactionProvider>
    </CartProvider>
  );
}
```

### **FASE 4.2: TESTING DE FLUJOS** ⏱️ 1 día

#### **A. Test del flujo completo P2P**
```javascript
// CREAR: src/tests/p2pFlow.test.js
// PRUEBAS REQUERIDAS:

// 1. Test compra exitosa completa
describe('P2P Complete Flow', () => {
  test('successful transaction from cart to rating', async () => {
    // 1. Agregar carta al carrito
    // 2. Proceder al checkout multi-vendedor
    // 3. Confirmar compra (crear transacción)
    // 4. Vendedor acepta
    // 5. Vendedor confirma entrega
    // 6. Comprador confirma recibo
    // 7. Ambos califican
    // 8. Verificar estado final 'completed'
  });
  
  // 2. Test cancelación por timeout
  test('seller timeout cancellation', async () => {
    // Simular que pasan 24h sin respuesta del vendedor
    // Verificar auto-cancelación
    // Verificar restauración de inventario
  });
  
  // 3. Test reservas de inventario
  test('inventory reservation system', async () => {
    // Verificar que reservedQuantity se actualiza
    // Verificar que availableQuantity se reduce
    // Verificar liberación en cancelación
  });
});
```

#### **B. Testing de componentes**
```javascript
// TESTS MÍNIMOS REQUERIDOS:
// - CheckoutMultiVendor.test.js
// - TransactionDashboard.test.js  
// - RatingModal.test.js
// - StoreSelector.test.js
// - TransactionContext.test.js
```

### **FASE 4.3: OPTIMIZACIÓN Y DEPLOY** ⏱️ 0.5 días

#### **A. Optimizaciones finales**
```javascript
// 1. Lazy loading de componentes grandes
const TransactionDashboard = lazy(() => import('./pages/TransactionDashboard'));
const CheckoutMultiVendor = lazy(() => import('./components/CheckoutMultiVendor'));

// 2. Memoización de cálculos pesados
const cartByVendor = useMemo(() => getCartByVendor(), [cart]);

// 3. Debouncing en búsquedas
const debouncedSearch = useCallback(
  debounce((term) => performSearch(term), 300),
  []
);
```

#### **B. Deploy y configuración**
```bash
# 1. Deploy Cloud Functions
firebase deploy --only functions

# 2. Deploy Firestore rules
firebase deploy --only firestore:rules

# 3. Deploy aplicación  
npm run build
firebase deploy --only hosting

# 4. Configurar variables de entorno en producción
# 5. Poblar colección stores con tiendas reales
# 6. Configurar índices de Firestore requeridos
```

### **ENTREGABLES SPRINT 4:**
✅ Sistema P2P completamente integrado y funcional
✅ Todos los componentes trabajando juntos  
✅ Testing exhaustivo completado
✅ Deploy en producción exitoso
✅ Documentación actualizada

---

## 📋 **CHECKLIST FINAL PARA CONTINUIDAD DE IA**

### **DOCUMENTOS QUE LEER ANTES DE CONTINUAR:**
- [ ] `Context.md` - Especificación completa del flujo P2P
- [ ] `CLAUDE.md` - Documentación técnica y estructura BD
- [ ] Este plan de sprints completo
- [ ] Código existente en `src/contexts/CartContext.js`
- [ ] Código existente en `src/pages/Marketplace.js`

### **VERIFICACIONES ANTES DE EMPEZAR CADA SPRINT:**
- [ ] Firebase está configurado y conectado
- [ ] Variables de entorno están definidas
- [ ] Dependencias npm están instaladas
- [ ] Se tiene acceso a Firebase Console
- [ ] Se conoce la estructura actual de las colecciones

### **PUNTOS CRÍTICOS A NO OLVIDAR:**
- [ ] **Atomicidad:** Todas las operaciones de inventario deben ser transaccionales
- [ ] **Timeouts:** Cada transacción DEBE tener timeouts automáticos
- [ ] **Rollbacks:** Si algo falla, restaurar el estado anterior
- [ ] **Notificaciones:** Crear notificación para cada cambio de estado  
- [ ] **Seguridad:** Validar permisos en todas las operaciones

### **ESTADO ACTUAL AL FINALIZAR DOCUMENTACIÓN:**
- [x] Flujo P2P completamente especificado
- [x] Base de datos diseñada con 11 colecciones
- [x] Plan de 4 sprints detallado
- [x] 15+ archivos nuevos planificados
- [x] Cloud Functions especificadas  
- [x] APIs externas identificadas
- [ ] **PRÓXIMO PASO:** Ejecutar Sprint 1 - Fase 1.1

---

### **🔧 RESPUESTA FINAL A IMPLEMENTACIÓN TÉCNICA:**
1. **Firebase existente es suficiente** - No backend separado necesario
2. **Empezar por Sprint 1** - Base de datos y Cloud Functions primero
3. **Cada sprint es autocontenido** - Puede pausarse/continuarse en cualquier punto
4. **Testing continuo** - Probar cada funcionalidad antes de continuar

--- 
*Status: **Plan Completo de Implementación** - Listo para ejecución inmediata*