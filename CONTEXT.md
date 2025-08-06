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