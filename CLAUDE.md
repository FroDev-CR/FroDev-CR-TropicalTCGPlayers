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

## 🗃️ Estructura de la Base de Datos (Firebase Firestore)

### Colecciones Principales

#### `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  username: string,
  phone: string,
  location: string,
  createdAt: timestamp,
  cart: array,           // Carrito de compras
  binders: array,        // IDs de carpetas
  listings: array,       // IDs de listados activos
  rating: number,        // Calificación promedio
  reviews: number        // Número de reseñas
}
```

#### `listings`
```javascript
{
  cardId: string,        // ID de la carta en API
  cardName: string,      // Nombre de la carta
  cardImage: string,     // URL imagen de la carta
  tcgType: string,       // 'pokemon', 'onepiece', etc.
  setName: string,       // Nombre del set (FORMATEADO)
  rarity: string,        // Rareza de la carta
  price: number,         // Precio en colones
  condition: string,     // 'NM', 'GOOD', 'POOR'
  quantity: number,      // Cantidad total
  availableQuantity: number, // Cantidad disponible
  description: string,   // Descripción opcional
  location: string,      // Ubicación del vendedor
  sellerId: string,      // UID del vendedor
  sellerName: string,    // Nombre del vendedor
  userPhone: string,     // Teléfono del vendedor
  userEmail: string,     // Email del vendedor
  status: string,        // 'active', 'sold_out', 'inactive'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `binders`
```javascript
{
  name: string,          // Nombre de la carpeta
  description: string,   // Descripción opcional
  type: string,          // '3x3', '4x4', '2x2', 'Jumbo'
  userId: string,        // UID del propietario
  cards: array,          // Array de objetos carta
  createdAt: timestamp,
  isPublic: boolean      // Si es visible públicamente
}
```

#### `transactions`
```javascript
{
  buyerId: string,       // UID del comprador
  buyerName: string,     // Nombre del comprador
  buyerNotes: string,    // Notas del comprador
  items: array,          // Items de la transacción
  totalAmount: number,   // Total en colones
  contactMethod: string, // 'whatsapp', 'email', 'phone'
  status: string,        // 'initiated', 'contacted', 'completed', 'rated'
  createdAt: timestamp,
  updatedAt: timestamp
}
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

## 📋 Pendientes para Producción

### 🔄 En Desarrollo
1. **Sistema de Calificaciones** - Rating de vendedores
2. **Chat/Mensajería** - Comunicación entre usuarios
3. **Notificaciones Push** - Alertas de nuevas cartas/ofertas
4. **Panel Admin** - Moderación y estadísticas
5. **Integración de Pagos** - Sinpe/Stripe para transacciones

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

### Archivos Críticos a Revisar
- `src/components/CardDetailModal.js` - Modal principal (recientemente actualizado)
- `src/pages/Marketplace.js` - Marketplace (recientemente optimizado) 
- `src/services/apiSearchService.js` - Servicio de APIs (recientemente arreglado)
- `src/contexts/CartContext.js` - Contexto global del carrito
- `.claude/TCG APIS DOCUMENTATION.txt` - Documentación de APIs

---
*Última actualización: Enero 2025*  
*Status: Lista la funcionalidad core, preparando para producción*