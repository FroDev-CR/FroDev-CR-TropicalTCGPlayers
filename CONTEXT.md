# Context.md - Tropical TCG Players

## ¿Qué es Tropical TCG Players?

Tropical TCG Players es una **plataforma web integral para jugadores locales de Trading Card Games (TCG)** que busca conectar a la comunidad de coleccionistas y jugadores de cartas, proporcionando herramientas esenciales para el comercio, organización de eventos y gestión de colecciones.

## Propósito y Objetivos

### Objetivo Principal
Crear un ecosistema completo para la comunidad local de TCG que permita:
- **Comprar y vender cartas** de manera segura entre jugadores locales
- **Organizar y participar en eventos** de la comunidad
- **Gestionar colecciones personales** a través de binders digitales
- **Conectar jugadores** con intereses similares y facilitar el intercambio

### Público Objetivo
- Jugadores locales de TCG (Pokémon, One Piece, Dragon Ball, Magic, etc.)
- Coleccionistas de cartas
- Organizadores de eventos y torneos
- Tiendas locales de cartas

## Funcionalidades Principales

### 🛒 **Marketplace Especializado**
- **Búsqueda específica por TCG**: Pokémon, One Piece, Dragon Ball, Digimon, Magic: The Gathering, Union Arena, Gundam
- **Integración con APIs oficiales**: Conecta con APIs externas para datos actualizados de cartas
- **Vendedores locales**: Sistema completo para que usuarios vendan sus cartas
- **Sistema de carrito**: Compra múltiple con gestión de inventario
- **Filtros avanzados**: Por rareza, condición, precio, tipo, etc.
- **Comparación de precios**: Entre vendedores locales y referencias de mercado

### 📅 **Sistema de Eventos**
- **Calendario interactivo**: Visualización de eventos de la comunidad
- **Panel de administración**: Para organizadores gestionen eventos
- **Gestión completa**: Creación, edición y seguimiento de eventos
- **Participación**: Los usuarios pueden registrarse y participar

### 📁 **Sistema de Binders (Colecciones)**
- **Binders personalizables**: Diferentes tipos (3x3, 4x4, 2x2, Jumbo) y estilos visuales
- **Gestión de colecciones**: Agregar, organizar y mostrar cartas
- **Límite de 4 binders**: Para mantener la plataforma organizada
- **Visualización atractiva**: Diferentes temas de color para personalización

### 👤 **Sistema de Usuarios y Calificaciones**
- **Autenticación completa**: Con Firebase Auth
- **Perfiles de usuario**: Con información, historial y calificaciones
- **Sistema de ratings**: Para vendedores y compradores
- **Historial de transacciones**: Seguimiento de compras y ventas

## Stack Tecnológico

### Frontend
- **React 18**: Framework principal con hooks modernos
- **Create React App**: Para configuración y build
- **React Router DOM 7**: Navegación SPA
- **Bootstrap 5.3**: Framework CSS para diseño responsivo
- **React Bootstrap**: Componentes Bootstrap para React
- **Framer Motion**: Animaciones y transiciones suaves

### Backend y Base de Datos
- **Firebase**: Plataforma backend completa
  - **Firestore**: Base de datos NoSQL para datos en tiempo real
  - **Firebase Auth**: Autenticación de usuarios
  - **Firebase Storage**: Almacenamiento de archivos
  - **Firebase Hosting**: Para deployments

### Librerías y Herramientas
- **React Icons**: Iconografía consistente
- **React Hot Toast**: Notificaciones elegantes
- **React Rating Stars**: Sistema de calificaciones
- **React Calendar**: Componentes de calendario
- **Date-fns & Moment**: Manipulación de fechas
- **React Draggable**: Funcionalidades drag & drop

### APIs Externas
- **Pokémon TCG API**: Datos oficiales de cartas Pokémon
- **TCGAPIS.com**: APIs para One Piece, Dragon Ball, Digimon, Magic, Union Arena, Gundam
- **Proxy personalizado**: Para manejar CORS y centralizar requests

### Deployment y Hosting
- **Vercel**: Hosting principal con CI/CD automático
- **Variables de entorno**: Configuración segura de API keys

## Arquitectura del Proyecto

### Estructura de Carpetas
```
src/
├── components/          # Componentes reutilizables
├── contexts/           # Context APIs (CarritoContext)
├── hooks/              # Custom hooks
├── pages/              # Páginas principales
├── services/           # Servicios (APIs, utilidades)
├── styles/             # Estilos CSS globales
└── assets/             # Recursos estáticos
```

### Componentes Clave
- **Navbar**: Navegación principal con autenticación
- **Marketplace**: Motor de búsqueda y listado de cartas
- **CardDetailModal**: Vista detallada de cartas con vendedores
- **SellCardModal**: Interface para vender cartas
- **EventCalendar**: Calendario interactivo de eventos
- **AuthModal**: Sistema de login/registro
- **RatingSystem**: Calificaciones de usuarios

### Gestión de Estado
- **Context API**: Para estado global (carrito, usuario)
- **Local Storage**: Persistencia temporal
- **Firebase**: Estado persistente en la nube
- **useState/useEffect**: Estado local de componentes

## Características Técnicas Destacadas

### 🔍 **Búsqueda Inteligente**
- Búsqueda específica por TCG con debouncing
- Normalización de datos de múltiples APIs
- Cache inteligente para mejorar rendimiento
- Fallbacks a datos mock cuando las APIs fallan
- Paginación eficiente

### 🛡️ **Seguridad**
- Autenticación robusta con Firebase
- Validación de permisos en frontend y backend
- Variables de entorno para API keys
- Sanitización de datos de entrada

### 📱 **Experiencia de Usuario**
- **Responsive Design**: Funciona en móviles, tablets y desktop
- **Progressive Enhancement**: Funcionalidades que mejoran gradualmente
- **Loading States**: Spinners y estados de carga elegantes
- **Error Handling**: Manejo graceful de errores con fallbacks

### ⚡ **Performance**
- **Code Splitting**: Carga optimizada de componentes
- **Image Optimization**: Manejo eficiente de imágenes de cartas
- **API Caching**: Cache inteligente con timeouts
- **Debounced Search**: Búsquedas optimizadas

## Estado Actual del Proyecto

### ✅ **Funcionalidades Completadas**
- Marketplace completamente funcional con búsqueda especializada
- Sistema de usuarios y autenticación
- Sistema de eventos con panel administrativo
- Sistema de binders para colecciones
- Sistema de carrito y transacciones
- Integración completa con APIs de TCG
- Interface responsive y moderna

### 🚧 **En Desarrollo/Mejoras Pendientes**
- Optimizaciones para producción en el marketplace
- Sistema de calificaciones más robusto
- Mejoras en el sistema de reportes
- Funcionalidades adicionales de filtrado
- Integración con métodos de pago

### 🎯 **Próximos Pasos**
El proyecto está en fase avanzada de desarrollo, con el marketplace siendo la funcionalidad principal que necesita optimización para el lanzamiento público. La aplicación está lista para ser desplegada y usada por la comunidad local de TCG.

## Configuración de Desarrollo

### Variables de Entorno Requeridas
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_POKEMON_API_KEY=
REACT_APP_TCG_API_KEY=
```

### Comandos Principales
```bash
npm start          # Servidor de desarrollo
npm run build      # Build para producción  
npm test           # Tests unitarios
```

## Valor de la Plataforma

Tropical TCG Players no es solo una aplicación de compra-venta, es un **hub completo para la comunidad TCG local** que:

- **Reduce la fragmentación** del mercado local de cartas
- **Facilita el discovery** de eventos y actividades
- **Proporciona herramientas profesionales** para gestión de colecciones
- **Crea confianza** a través del sistema de ratings
- **Centraliza la información** relevante para jugadores
- **Fomenta la comunidad** local de TCG

La plataforma está diseñada para ser escalable y adaptarse a diferentes mercados locales, siendo Costa Rica el mercado piloto inicial.

---

## 🎉 **ACTUALIZACIÓN DE IMPLEMENTACIÓN - ENERO 2025**

### ✅ **SPRINT 1 COMPLETADO - BASE DE DATOS Y BACKEND**

**Fecha de finalización:** Enero 2025
**Estado:** ✅ COMPLETAMENTE IMPLEMENTADO

#### **FASES IMPLEMENTADAS:**

**FASE 1.1: ACTUALIZACIÓN DE COLECCIONES EXISTENTES** ✅
- ✅ Colección `users` migrada con 6 campos nuevos para P2P
- ✅ Colección `listings` extendida con campos de reservas y envío
- ✅ Colección `transactions` completamente reestructurada para flujo P2P

**FASE 1.2: NUEVAS COLECCIONES CREADAS** ✅  
- ✅ `stores` - 12 tiendas configuradas en Costa Rica (2 por provincia)
- ✅ `pendingTransactions` - Sistema de reservas temporales
- ✅ `notifications` - Sistema de notificaciones multi-canal
- ✅ `disputes` - Sistema de reportes y disputas
- ✅ `userRecommendations` - Sistema de "likes" a perfiles

**FASE 1.3: CLOUD FUNCTIONS BÁSICAS** ✅
- ✅ 3 Funciones de migración implementadas y probadas
- ✅ 3 Funciones de población de datos operativas
- ✅ 2 Funciones de verificación y status
- ✅ Node.js 18 + TypeScript + Firebase Admin SDK

**FASE 1.4: CONFIGURACIÓN APIS EXTERNAS** ✅
- ✅ Firebase Functions configurado en `firebase.json`
- ✅ Firestore Rules actualizadas para todas las colecciones P2P
- ✅ Firestore Indexes optimizados para consultas P2P
- ✅ Variables de entorno completas en `.env.example`
- ✅ MigrationHelper creado para ejecutar configuración completa

#### **ARCHIVOS IMPLEMENTADOS:**
- ✅ `functions/` - Directorio completo de Cloud Functions
- ✅ `src/utils/migrationHelper.js` - Helper para migraciones
- ✅ `SPRINT1_COMPLETED.md` - Documentación completa de implementación
- ✅ `firestore.rules` - Reglas de seguridad actualizadas
- ✅ `firestore.indexes.json` - Índices optimizados

#### **CÓMO EJECUTAR LA CONFIGURACIÓN:**
```javascript
// En consola del navegador (una vez desplegadas las Cloud Functions)
window.migrationHelper.runCompleteSetup()
```

#### **PRÓXIMO PASO:**
🚀 **SPRINT 3 - COMPONENTES UI** (Listo para implementar)

---

### ✅ **SPRINT 2 COMPLETADO - SERVICIOS Y CONTEXTOS**

**Fecha de finalización:** Enero 2025
**Estado:** ✅ COMPLETAMENTE IMPLEMENTADO

#### **FASES IMPLEMENTADAS:**

**FASE 2.1: EXTENSIÓN DE CARTCONTEXT** ✅
- ✅ 10 nuevas funciones P2P agregadas al CartContext
- ✅ Verificación atómica de disponibilidad
- ✅ Sistema de transacciones P2P con reserva de inventario
- ✅ Agrupación multi-vendedor del carrito
- ✅ Integración completa con Cloud Functions

**FASE 2.2: TRANSACTIONCONTEXT COMPLETO** ✅  
- ✅ Context dedicado para transacciones P2P
- ✅ Escucha en tiempo real de transacciones
- ✅ 8 funciones principales para gestión de transacciones
- ✅ Funciones de utilidad para UI (estados, tiempos, acciones)
- ✅ Sistema de notificaciones no leídas automático

**FASE 2.3: SERVICIO DE NOTIFICACIONES** ✅
- ✅ NotificationService centralizado multi-canal
- ✅ 8 tipos de notificaciones P2P automatizadas  
- ✅ Templates específicos para cada fase de transacción
- ✅ Sistema de fallbacks y manejo de errores
- ✅ Configuración desde variables de entorno

**FASE 2.4: WHATSAPP Y EMAIL SERVICES** ✅
- ✅ WhatsAppService con 9 templates de mensajes
- ✅ Integración WhatsApp Business API completa
- ✅ EmailService con templates HTML profesionales
- ✅ Integración Brevo API para emails
- ✅ Sistema de pruebas para desarrollo

**FASE 2.5: HOOKS PERSONALIZADOS** ✅
- ✅ useP2PTransactions: Hook maestro para transacciones
- ✅ useNotifications: Hook para sistema de notificaciones
- ✅ 15+ funciones de utilidad para componentes UI
- ✅ Validación de datos y manejo de errores
- ✅ Estadísticas y filtros avanzados

#### **ARCHIVOS IMPLEMENTADOS:**
- ✅ `src/contexts/CartContext.js` - Extendido con 10 funciones P2P
- ✅ `src/contexts/TransactionContext.js` - Context completo para transacciones
- ✅ `src/services/NotificationService.js` - Servicio centralizado de notificaciones
- ✅ `src/services/WhatsAppService.js` - Servicio especializado WhatsApp
- ✅ `src/services/EmailService.js` - Servicio especializado Email
- ✅ `src/hooks/useP2PTransactions.js` - Hook principal para P2P
- ✅ `src/hooks/useNotifications.js` - Hook para notificaciones

#### **INTEGRACIÓN COMPLETA:**
- ✅ Todos los servicios integrados con Cloud Functions
- ✅ Sistema de configuración desde .env variables
- ✅ Manejo de errores y fallbacks en toda la cadena
- ✅ Hooks listos para usar en componentes UI
- ✅ Sistema de notificaciones multi-canal operativo

---

## 🔄 **FLUJO COMPLETO DE COMPRA/VENTA P2P**

### Objetivo del Sistema
Sistema **peer-to-peer (P2P)** completo que permite a usuarios comprar y vender cartas de forma segura mediante un flujo estructurado con verificaciones, notificaciones automáticas y sistema de calificaciones mutuas.

### 🛒 **FASE 1: PROCESO DE COMPRA**

#### 1.1 Agregar al Carrito
- **Verificación atómica:** Al confirmar compra se verifica stock real en tiempo real
- **Reserva temporal:** Reduce `availableQuantity` inmediatamente para evitar sobreventa
- **Carrito multi-vendedor:** Agrupa items por vendedor automáticamente

#### 1.2 Checkout por Vendedor
**Layout del Checkout:**
```
🛒 CONFIRMAR COMPRAS

📦 VENDEDOR A (Juan Pérez) - Total: ₡15,000
├── 2x Charizard ₡5,000 c/u
└── 3x Luffy ₡1,500 c/u
[Confirmar compra con Vendedor A] [Envío: +₡600]

📦 VENDEDOR B (María López) - Total: ₡3,000  
└── 1x Pikachu ₡3,000
[Confirmar compra con Vendedor B] [Envío gratis]
```

- **Transacciones separadas:** Una transacción independiente por cada vendedor
- **Confirmación individual:** Cada vendedor maneja su propia transacción
- **Gestión de envío:** El vendedor define si cobra envío (₡600 fijos) al crear listing

#### 1.3 Confirmación de Compra
- **Estado inicial:** `pending_seller_response`
- **Notificación inmediata:** WhatsApp automático al vendedor con template predefinido
- **Timer de 24 horas:** Inicia countdown para respuesta del vendedor

### ⏰ **FASE 2: RESPUESTA DEL VENDEDOR (24h límite)**

#### 2.1 Opciones del Vendedor
- **✅ Acepta la compra:**
  - Estado → `accepted_pending_delivery`
  - Notificación WhatsApp al comprador con datos del vendedor
  - Timer de 6 días para entrega
  
- **❌ Rechaza la compra:**
  - Estado → `cancelled`
  - Restaurar `availableQuantity` al inventario
  - Notificación al comprador del rechazo
  
- **⏰ No responde en 24h:**
  - Auto-cancelación por Cloud Function
  - Restaurar inventario automáticamente
  - Penalización leve al vendedor

### 📦 **FASE 3: PROCESO DE ENTREGA (6 días límite)**

#### 3.1 Coordinación de Entrega
- **Red de tiendas:** Costa Rica tiene tiendas afiliadas en todas las provincias (mínimo 2 por provincia)
- **Selección de tiendas:**
  - **Vendedor:** Selecciona tienda de origen para dejar la carta
  - **Comprador:** Selecciona tienda de destino para recoger
- **Envío entre tiendas:** Sistema manual de envíos (futuro: sistema propio de tracking)

#### 3.2 Confirmación de Entrega
- **Vendedor debe:**
  1. **Ir a la tienda** y entregar la carta
  2. **Subir foto como prueba:** Sobre con nombre del comprador + las cartas compradas
  3. **Confirmar entrega** en la app
  
- **Al confirmar entrega:**
  - Estado → `delivered_pending_payment`
  - Se activa modal de solicitud de pago

#### 3.3 Timeout de Entrega
- **Si no entrega en 6 días:**
  - Auto-cancelación por Cloud Function
  - **Penalización severa** al vendedor (pérdida de puntos significativa)
  - Posible suspensión temporal
  - Restaurar inventario

### 💳 **FASE 4: PROCESO DE PAGO**

#### 4.1 Solicitud de Pago
**Modal post-entrega con opciones:**
- **Opción recomendada:** Botón WhatsApp con template de solicitud de pago
- **Opción alternativa:** "Ya pagado" (si se negoció pago presencial)

#### 4.2 Métodos de Pago Aceptados
- **Sinpe Móvil** (principal)
- **Efectivo** (coordinado presencialmente)
- **Intercambio de cartas** (trueque con foto de prueba)
- **Otros métodos** negociados por WhatsApp

#### 4.3 Confirmación de Pago
- **Vendedor:** Debe subir comprobante de pago recibido (screenshot Sinpe, etc.)
- **Comprador:** Debe confirmar que el pago fue realizado correctamente
- **Estado:** `payment_confirmed` → Listo para finalización

### 📋 **FASE 5: CONFIRMACIÓN DE RECIBO (10 días límite)**

#### 5.1 Confirmación del Comprador
- **Comprador debe:** Ir a la tienda de destino y recoger la carta
- **Confirmar recibo** en la app
- **Auto-confirmación:** Si no confirma en 10 días, se confirma automáticamente

### ⭐ **FASE 6: SISTEMA DE CALIFICACIONES MUTUAS**

#### 6.1 Rating Obligatorio (7 días límite)
**Al completarse la transacción, aparecen 2 modales:**

```
Modal Comprador: "Califica al vendedor Juan (OBLIGATORIO)"
├── Estrellas: 1-5 (obligatorio)
└── Comentario: texto libre (opcional)

Modal Vendedor: "Califica al comprador María (OBLIGATORIO)"  
├── Estrellas: 1-5 (obligatorio)
└── Comentario: texto libre (opcional)
```

#### 6.2 Consecuencias del Rating
- **No calificar en 7 días:** Penalización automática (-0.1 puntos del rating personal)
- **Ratings positivos (4-5⭐):** Mayor visibilidad en marketplace
- **Ratings negativos (1-2⭐):** Menor visibilidad + investigación admin
- **Estado final:** `completed` cuando ambos califican

### 🏆 **SISTEMA DE REPUTACIÓN Y RECOMENDACIONES**

#### Sistema de "Likes" al Perfil
- **1 recomendación por usuario:** Cada usuario puede dar máximo 1 "like" a otro perfil
- **Reversible:** Se puede quitar y volver a dar
- **Visible públicamente:** Contador en perfil + lista de quién recomendó

#### Perfil Público del Usuario
```
👤 Juan Pérez (@juanp)
📋 Cédula verificada ✅ | 📱 Teléfono verificado ✅
⭐ 4.8/5 (127 valoraciones)
👍 23 recomendaciones  
📦 89 ventas completadas
🛒 12 compras realizadas
📅 Miembro desde: Enero 2024
📍 San José, Costa Rica
```

### 🛡️ **SISTEMA DE SEGURIDAD Y VERIFICACIÓN**

#### Verificación Obligatoria
- **Cédula de identidad:** Obligatoria (mayores de 12 años)
- **Número de teléfono:** Verificación por SMS
- **Una cuenta por cédula:** Evita cuentas múltiples

#### Sistema Anti-Fraude
- **Fotos de entrega:** Obligatorias con datos del comprador visible
- **Comprobantes de pago:** Screenshot obligatorio
- **Historial de comportamiento:** Tracking de cancelaciones, entregas tardías
- **Penalizaciones progresivas:** Desde warnings hasta suspensión permanente

### 📱 **SISTEMA DE NOTIFICACIONES**

#### Canales de Notificación
1. **WhatsApp (principal):** Templates automáticos para cada fase
2. **Email (backup):** Usando Brevo API o similar 
3. **In-app (web):** Notificaciones en tiempo real
4. **SMS (futuro):** Para casos críticos

#### Templates de WhatsApp
```
📱 Al vendedor: "🎯 Nueva compra de [cardName] por ₡[price]. Tienes 24h para responder: [appLink]"
📱 Al comprador: "✅ Tu compra fue aceptada por [sellerName]. Coordina entrega: [sellerPhone]"
📱 Recordatorio entrega: "⏰ Recordatorio: Tienes 2 días restantes para entregar [cardName]"
📱 Pago solicitado: "💰 [sellerName] confirmó la entrega. Procede con el pago acordado"
```

### 🚨 **SISTEMA DE DISPUTAS Y MODERACIÓN**

#### Tipos de Disputas
- **Producto no recibido**
- **Producto diferente al descrito**
- **Pago no recibido** 
- **Problemas de comunicación**

#### Proceso de Disputa
1. **Reporte por usuario** con evidencia
2. **Revisión admin** (inicialmente manual)
3. **Investigación** con ambas partes
4. **Resolución** con compensación si aplica
5. **Medidas correctivas** (warnings, suspensiones)

### 🔄 **ESTADOS DE TRANSACCIÓN COMPLETOS**

```
📊 FLUJO DE ESTADOS:
pending_seller_response (24h límite)
    ├── accepted_pending_delivery (6 días límite)
    │   ├── delivered_pending_payment
    │   │   ├── payment_confirmed
    │   │   │   ├── completed (con ratings)
    │   │   │   └── disputed
    │   │   └── payment_disputed
    │   └── delivery_timeout (auto-cancel)
    ├── cancelled_by_seller
    └── timeout_cancelled (auto-cancel)
```

### ⚙️ **IMPLEMENTACIÓN TÉCNICA REQUERIDA**

#### Cloud Functions Necesarias
1. **Transaction Timeouts:** Auto-cancelar transacciones vencidas
2. **Notification Sender:** Envío automático de WhatsApp/Email
3. **Inventory Manager:** Restaurar stock en cancelaciones
4. **Rating Enforcer:** Penalizar usuarios que no califican

#### Nuevas Colecciones Firebase
```javascript
// pendingTransactions: Manejo de reservas temporales
// notifications: Sistema de notificaciones
// disputes: Sistema de reportes
// userRecommendations: Sistema de "likes" a perfiles
```

---