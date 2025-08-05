// src/pages/Marketplace.js
import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Spinner, ListGroup, Button, Pagination, Modal, Alert } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import SellCardModal from '../components/SellCardModal';
import MarketplaceFilters from '../components/MarketplaceFilters';
import FeaturedSections from '../components/FeaturedSections';
import PriceComparator from '../components/PriceComparator';
import { FaShoppingCart, FaWhatsapp, FaHeart, FaSearch, FaUser, FaTag, FaStar, FaExchangeAlt, FaFilter } from 'react-icons/fa';
import ReactStars from "react-rating-stars-component";

const POKEMON_API_KEY = process.env.REACT_APP_POKEMON_API_KEY;
const TCG_API_KEY = process.env.REACT_APP_TCG_API_KEY;

// Configuración de juegos TCG - SEPARADAS CORRECTAMENTE
const TCG_GAMES = {
  // API OFICIAL DE POKÉMON (api.pokemontcg.io) - La más completa para Pokémon
  pokemon: {
    name: 'Pokémon TCG',
    apiUrl: 'https://api.pokemontcg.io/v2/cards',
    apiKey: POKEMON_API_KEY,
    searchParam: 'q', // Usa parámetro 'q' con sintaxis especial
    icon: '🔥',
    available: !!POKEMON_API_KEY, // Solo disponible si hay API key
    apiType: 'pokemon'
  },
  
  // TCGS API (apitcg.com) - Todos los TCGs disponibles
  onepiece: {
    name: 'One Piece',
    apiUrl: 'https://apitcg.com/api/one-piece/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🏴‍☠️',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  },
  dragonball: {
    name: 'Dragon Ball',
    apiUrl: 'https://apitcg.com/api/dragon-ball-fusion/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🐉',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  },
  digimon: {
    name: 'Digimon',
    apiUrl: 'https://apitcg.com/api/digimon/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🦖',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  },
  magic: {
    name: 'Magic: The Gathering',
    apiUrl: 'https://apitcg.com/api/magic/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🪄',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  },
  unionarena: {
    name: 'Union Arena',
    apiUrl: 'https://apitcg.com/api/union-arena/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '⚔️',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  },
  gundam: {
    name: 'Gundam',
    apiUrl: 'https://apitcg.com/api/gundam/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🤖',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  },
  // Pokémon también está disponible en TCGS API (alternativa)
  pokemonTcgs: {
    name: 'Pokémon (TCGS)',
    apiUrl: 'https://apitcg.com/api/pokemon/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🔥',
    available: !!TCG_API_KEY,
    apiType: 'tcgapi'
  }
};

const rateUser = async (userId, newRating) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentRating = userData.rating || 0;
      const currentReviews = userData.reviews || 0;

      const updatedReviews = currentReviews + 1;
      const updatedRating = (currentRating * currentReviews + newRating) / updatedReviews;

      await updateDoc(userRef, {
        rating: updatedRating,
        reviews: updatedReviews,
      });
    }
  } catch (error) {
    console.error("Error al calificar:", error);
    alert("Hubo un error al calificar.");
  }
};

const SellerRating = ({ sellerId }) => {
  const [rating, setRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    const fetchSellerData = async () => {
      if (sellerId) {
        const userRef = doc(db, 'users', sellerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRating(userData.rating || 0);
          setReviewsCount(userData.reviews || 0);
        }
      }
    };
    fetchSellerData();
  }, [sellerId]);

  const handleRating = (newRating) => {
    rateUser(sellerId, newRating).then(() => {
      setRating((prev) => (prev * reviewsCount + newRating) / (reviewsCount + 1));
      setReviewsCount(prev => prev + 1);
    });
  };

  return (
    <div className="d-flex align-items-center gap-2 mt-1">
      <ReactStars
        count={5}
        value={rating}
        size={20}
        activeColor="#ffd700"
        edit={true}
        onChange={handleRating}
      />
      <small className="text-muted">
        ({rating.toFixed(1)} · {reviewsCount} calificaciones)
      </small>
    </div>
  );
};

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showSellModal, setShowSellModal] = useState(false);
  const [searchCache, setSearchCache] = useState({});
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Nuevos estados para las funcionalidades mejoradas
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tcgTypes: [],
    priceRange: null,
    conditions: [],
    rarities: [],
    minRating: 0,
    sortBy: 'newest'
  });
  const [showComparator, setShowComparator] = useState(false);
  const [comparatorCard, setComparatorCard] = useState(null);
  
  // Estado para controlar qué APIs usar
  const [enabledAPIs, setEnabledAPIs] = useState({
    pokemon: true,           // Pokémon API oficial
    onepiece: true,         // TCGS API - One Piece
    dragonball: true,       // TCGS API - Dragon Ball
    digimon: true,          // TCGS API - Digimon  
    magic: true,            // TCGS API - Magic (ahora con URL correcta)
    unionarena: true,       // TCGS API - Union Arena
    gundam: true,           // TCGS API - Gundam
    pokemonTcgs: false      // Pokémon alternativo (TCGS API) - deshabilitado para evitar duplicados
  });
  
  const { addToCart } = useCart();

  const [latestListings, setLatestListings] = useState([]);

  // Función para aplicar filtros avanzados (actualizada para cartas unificadas)
  const applyFilters = (cards, activeFilters) => {
    let filtered = [...cards];

    // Filtro por TCG Types
    if (activeFilters.tcgTypes.length > 0) {
      filtered = filtered.filter(card => 
        activeFilters.tcgTypes.includes(card.tcgType)
      );
    }

    // Filtro por precio (basado en precio promedio de la carta)
    if (activeFilters.priceRange) {
      const priceRanges = {
        'under10': { min: 0, max: 10 },
        '10to25': { min: 10, max: 25 },
        '25to50': { min: 25, max: 50 },
        '50to100': { min: 50, max: 100 },
        'over100': { min: 100, max: 9999 }
      };
      
      const range = priceRanges[activeFilters.priceRange];
      if (range) {
        filtered = filtered.filter(card => {
          const price = card.averagePrice || card.minPrice || 0;
          return price >= range.min && price <= range.max;
        });
      }
    }

    // Filtro por condición (si tiene vendedores con esa condición)
    if (activeFilters.conditions.length > 0) {
      filtered = filtered.filter(card => 
        card.sellers && card.sellers.some(seller => 
          activeFilters.conditions.includes(seller.condition)
        )
      );
    }

    // Filtro por rareza
    if (activeFilters.rarities.length > 0) {
      filtered = filtered.filter(card => 
        activeFilters.rarities.includes(card.rarity)
      );
    }

    // Filtro por rating mínimo del vendedor (simulado)
    if (activeFilters.minRating > 0) {
      // Por ahora simulamos el rating, después se puede implementar con datos reales
      filtered = filtered.filter(() => Math.random() > (activeFilters.minRating / 5 - 0.3));
    }

    // Filtro adicional: solo cartas con vendedores
    const onlyWithSellers = activeFilters.onlyWithSellers || false;
    if (onlyWithSellers) {
      filtered = filtered.filter(card => card.sellers && card.sellers.length > 0);
    }

    // Ordenamiento
    switch (activeFilters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.maxPrice || 0) - (a.maxPrice || 0));
        break;
      case 'name-az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'sellers-most':
        filtered.sort((a, b) => (b.sellers?.length || 0) - (a.sellers?.length || 0));
        break;
      case 'sellers-least':
        filtered.sort((a, b) => (a.sellers?.length || 0) - (b.sellers?.length || 0));
        break;
      case 'newest':
      default:
        // Ordenar por carta más reciente (basado en el listing más reciente)
        filtered.sort((a, b) => {
          const aLatest = a.sellers?.length > 0 ? Math.max(...a.sellers.map(s => s.createdAt?.seconds || 0)) : 0;
          const bLatest = b.sellers?.length > 0 ? Math.max(...b.sellers.map(s => s.createdAt?.seconds || 0)) : 0;
          return bLatest - aLatest;
        });
        break;
    }

    return filtered;
  };

  // Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.tcgTypes.length > 0) count++;
    if (filters.priceRange) count++;
    if (filters.conditions.length > 0) count++;
    if (filters.rarities.length > 0) count++;
    if (filters.minRating > 0) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  useEffect(() => {
    const fetchLatestListings = async () => {
      try {
        const latestQuery = query(
          collection(db, 'listings'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const querySnapshot = await getDocs(latestQuery);
        setLatestListings(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error al obtener últimas cartas publicadas:', error);
      }
    };
    
    if (!searchTerm.trim()) {
      fetchLatestListings();
    }
  }, [searchTerm]);

  // Función unificada para buscar en ambas APIs
  const searchCardsInAPIs = async (searchTerm, page = 1) => {
    const sanitizedTerm = searchTerm
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s\-']/g, '')
      .replace(/\s+/g, ' ');
    
    console.log(`🔍 Iniciando búsqueda: "${sanitizedTerm}" (página ${page})`);
    console.log(`🔑 APIs disponibles:`, {
      pokemon: !!POKEMON_API_KEY,
      tcgGeneral: !!TCG_API_KEY
    });
    
    const allCards = [];
    const errors = [];

    // Verificar que tenemos las API keys
    if (!POKEMON_API_KEY && !TCG_API_KEY) {
      errors.push('⚠️ No se encontraron claves de API configuradas en las variables de entorno');
      return { cards: [], errors };
    }

    // Verificar que al menos una API está habilitada
    const hasEnabledAPI = Object.values(enabledAPIs).some(enabled => enabled);
    if (!hasEnabledAPI) {
      errors.push('⚠️ Todas las APIs están deshabilitadas. Habilita al menos una en los filtros de arriba.');
      return { cards: [], errors };
    }

    // Buscar en todas las APIs configuradas
    for (const [gameKey, gameConfig] of Object.entries(TCG_GAMES)) {
      if (!gameConfig.available) continue;
      
      // Skip si no tenemos la API key necesaria
      if (gameConfig.apiType === 'pokemon' && !POKEMON_API_KEY) continue;
      if (gameConfig.apiType === 'tcgapi' && !TCG_API_KEY) continue;
      
      // Skip si la API está deshabilitada por el usuario
      if (!enabledAPIs[gameKey]) {
        console.log(`⏭️ Saltando ${gameConfig.name} - deshabilitada por el usuario`);
        continue;
      }
      
      console.log(`🔎 Buscando en ${gameConfig.name}...`);
      
      try {
        let response;
        let data;
        
        if (gameConfig.apiType === 'pokemon') {
          // Pokemon TCG API OFICIAL - Sintaxis especial según documentación
          let queryTerm;
          
          // Si contiene espacios, usar búsqueda exacta con comillas
          if (sanitizedTerm.includes(' ')) {
            queryTerm = `name:"${sanitizedTerm}"`;
          } else {
            // Para términos simples, usar wildcard para encontrar más resultados
            queryTerm = `name:${sanitizedTerm}*`;
          }
          
          const url = `${gameConfig.apiUrl}?q=${encodeURIComponent(queryTerm)}&page=${page}&pageSize=15`;
          
          // Crear controlador de abort y timeout más robusto
          const controller = new AbortController();
          let timeoutId;
          
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              controller.abort();
              reject(new Error('Pokemon API: Timeout después de 10 segundos'));
            }, 10000);
          });
          
          const fetchPromise = fetch(url, { 
            headers: {
              'X-Api-Key': gameConfig.apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: controller.signal
          });
          
          response = await Promise.race([fetchPromise, timeoutPromise]);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Pokemon API: HTTP ${response.status}`);
          }
          
          data = await response.json();
          
          // Verificar que la respuesta tenga el formato esperado
          if (!data.data) {
            throw new Error('Pokemon API: Invalid response format');
          }
          
          // Adaptar formato Pokemon TCG
          const adaptedCards = data.data?.map(card => ({
            id: card.id,
            name: card.name,
            images: { 
              small: card.images?.small || 'https://via.placeholder.com/200',
              large: card.images?.large || card.images?.small || 'https://via.placeholder.com/400'
            },
            set: { name: card.set?.name || 'Desconocido' },
            rarity: card.rarity || 'Common',
            tcgType: gameKey,
            tcgName: gameConfig.name,
            // Pokemon specific fields
            supertype: card.supertype,
            subtypes: card.subtypes,
            hp: card.hp,
            types: card.types,
            abilities: card.abilities,
            attacks: card.attacks,
            weaknesses: card.weaknesses,
            resistances: card.resistances,
            retreatCost: card.retreatCost,
            artist: card.artist,
            flavorText: card.flavorText,
            nationalPokedexNumbers: card.nationalPokedexNumbers
          })) || [];
          
          allCards.push(...adaptedCards);
          
        } else if (gameConfig.apiType === 'tcgapi') {
          // TCGS API para otros juegos 
          const isProduction = process.env.NODE_ENV === 'production';
          const apiUrl = isProduction 
            ? gameConfig.apiUrl 
            : gameConfig.apiUrl.replace('https://apitcg.com/api', '/api/tcg');
          
          // Construir URL con parámetros según documentación de TCGS API
          const searchUrl = `${apiUrl}?name=${encodeURIComponent(sanitizedTerm)}&limit=15&page=${page}`;
          
          // Crear controlador de abort y timeout más robusto
          const controller = new AbortController();
          let timeoutId;
          
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              controller.abort();
              reject(new Error(`${gameConfig.name}: Timeout después de 8 segundos`));
            }, 8000);
          });
          
          const fetchPromise = fetch(searchUrl, { 
            method: 'GET',
            headers: isProduction ? {
              'x-api-key': gameConfig.apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            } : {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            mode: 'cors',
            signal: controller.signal
          });
          
          response = await Promise.race([fetchPromise, timeoutPromise]);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`${gameConfig.name} API: HTTP ${response.status}`);
          }
          
          data = await response.json();
          console.log(`📊 ${gameConfig.name} raw response:`, data);
          
          // Verificar que la respuesta tenga el formato esperado
          if (!data.data || !Array.isArray(data.data)) {
            console.warn(`⚠️ ${gameConfig.name}: Formato de respuesta inesperado`, data);
            throw new Error(`${gameConfig.name} API: Invalid response format - expected data array`);
          }
          
          // Adaptar formato TCGS API
          const adaptedCards = data.data?.map(card => ({
            id: card.id || card.code,
            name: card.name,
            images: { 
              small: card.images?.small || card.images?.large || 'https://via.placeholder.com/200',
              large: card.images?.large || card.images?.small || 'https://via.placeholder.com/400'
            },
            set: { name: card.set?.name || 'Desconocido' },
            rarity: card.rarity || 'Common',
            tcgType: gameKey,
            tcgName: gameConfig.name,
            // TCGS specific fields
            type: card.type,
            cost: card.cost,
            power: card.power,
            counter: card.counter,
            color: card.color,
            attribute: card.attribute?.name || card.attribute,
            ability: card.ability,
            family: card.family,
            features: card.features,
            trigger: card.trigger
          })) || [];
          
          console.log(`✅ ${gameConfig.name}: ${adaptedCards.length} cartas encontradas`);
          allCards.push(...adaptedCards);
        }
        
      } catch (error) {
        console.warn(`❌ Error searching ${gameConfig.name}:`, error);
        
        if (error.name === 'AbortError') {
          errors.push(`${gameConfig.name}: Timeout - API muy lenta`);
        } else if (error.message.includes('HTTP 401')) {
          errors.push(`${gameConfig.name}: API Key inválida`);
        } else if (error.message.includes('HTTP 429')) {
          errors.push(`${gameConfig.name}: Límite de requests excedido`);
        } else if (error.message.includes('HTTP 404')) {
          errors.push(`${gameConfig.name}: No se encontraron resultados`);
        } else {
          errors.push(`${gameConfig.name}: ${error.message}`);
        }
      }
    }
    
    return { cards: allCards, errors };
  };

  const searchCards = useCallback(async (page = 1, skipCache = false) => {
    if (!searchTerm.trim()) {
      setCards([]);
      setListings([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    setLoading(true);
    setSearchError('');
    
    try {
      const sanitizedTerm = searchTerm
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s\-']/g, '')
        .replace(/\s+/g, ' ');
      
      if (!sanitizedTerm) {
        throw new Error('Por favor ingresa un término de búsqueda válido');
      }

      // Check cache first
      const cacheKey = `unified-search-${sanitizedTerm}-${page}`;
      if (!skipCache && searchCache[cacheKey]) {
        const cached = searchCache[cacheKey];
        setCards(cached.cards);
        setListings(cached.listings);
        setTotalResults(cached.totalResults);
        setTotalPages(cached.totalPages);
        setCurrentPage(page);
        setLoading(false);
        return;
      }

      // 1. Buscar cartas en las APIs externas
      const { cards: apiCards, errors: apiErrors } = await searchCardsInAPIs(sanitizedTerm, page);
      
      // 2. Buscar listings existentes en Firestore
      const listingsQuery = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      
      const listingsSnapshot = await getDocs(listingsQuery);
      let allListings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtrar listings por término de búsqueda
      if (sanitizedTerm) {
        allListings = allListings.filter(listing => 
          listing.cardName && listing.cardName.toLowerCase().includes(sanitizedTerm.toLowerCase())
        );
      }
      
      // 3. Combinar cartas de API con listings para crear resultados unificados
      const cardMap = new Map();
      
      // Agregar cartas de APIs
      apiCards.forEach(card => {
        if (!cardMap.has(card.id)) {
          cardMap.set(card.id, {
            ...card,
            sellers: [],
            averagePrice: 0,
            minPrice: 0,
            maxPrice: 0,
            totalStock: 0
          });
        }
      });
      
      // Agregar listings como vendedores de las cartas
      allListings.forEach(listing => {
        const cardId = listing.cardId;
        
        // Si no existe la carta en el mapa, crearla basada en el listing
        if (!cardMap.has(cardId)) {
          cardMap.set(cardId, {
            id: cardId,
            name: listing.cardName,
            images: { 
              small: listing.cardImage,
              large: listing.cardImage
            },
            set: { name: listing.setName || 'Desconocido' },
            rarity: listing.rarity || 'Sin rareza',
            tcgType: listing.tcgType || 'unknown',
            tcgName: TCG_GAMES[listing.tcgType]?.name || 'Desconocido',
            sellers: [],
            averagePrice: 0,
            minPrice: 0,
            maxPrice: 0,
            totalStock: 0
          });
        }
        
        // Agregar el listing como vendedor
        const card = cardMap.get(cardId);
        card.sellers.push({
          listingId: listing.id,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          price: listing.price,
          condition: listing.condition,
          quantity: listing.availableQuantity || listing.quantity || 1,
          createdAt: listing.createdAt,
          userPhone: listing.userPhone
        });
      });
      
      // 4. Calcular precios ponderados para cada carta
      cardMap.forEach((card, cardId) => {
        if (card.sellers.length > 0) {
          const prices = card.sellers.map(s => s.price);
          const quantities = card.sellers.map(s => s.quantity);
          
          card.minPrice = Math.min(...prices);
          card.maxPrice = Math.max(...prices);
          card.totalStock = quantities.reduce((sum, q) => sum + q, 0);
          
          // Precio ponderado por cantidad disponible
          const totalWeightedPrice = card.sellers.reduce((sum, seller) => {
            return sum + (seller.price * seller.quantity);
          }, 0);
          card.averagePrice = totalWeightedPrice / card.totalStock;
          
          // Ordenar vendedores por precio
          card.sellers.sort((a, b) => a.price - b.price);
        }
      });
      
      // 5. Convertir a array y aplicar filtros
      let finalCards = Array.from(cardMap.values());
      
      // Aplicar filtros avanzados
      finalCards = applyFilters(finalCards, filters);
      
      // 6. Paginación
      const itemsPerPage = 12;
      const totalCount = finalCards.length;
      const calculatedPages = Math.ceil(totalCount / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const paginatedCards = finalCards.slice(startIndex, startIndex + itemsPerPage);
      
      // Cache results
      const cacheData = {
        cards: paginatedCards,
        listings: allListings,
        totalResults: totalCount,
        totalPages: calculatedPages
      };
      
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: cacheData
      }));

      setCards(paginatedCards);
      setListings(allListings);
      setTotalResults(totalCount);
      setTotalPages(calculatedPages);
      setCurrentPage(page);

      if (paginatedCards.length === 0) {
        const errorMsg = apiErrors.length > 0 
          ? `No se encontraron cartas. Errores de API: ${apiErrors.join(', ')}`
          : 'No se encontraron cartas que coincidan con tu búsqueda.';
        setSearchError(errorMsg);
      }

    } catch (error) {
      console.error('Error searching cards:', error);
      setCards([]);
      setListings([]);
      setTotalResults(0);
      setTotalPages(1);
      setSearchError(error.message || 'Error al buscar cartas. Inténtalo de nuevo.');
    }
    setLoading(false);
  }, [searchTerm, filters]); // Remover searchCache de dependencies

  // Función de búsqueda simple sin bucles
  const performSearch = useCallback(async (term, page = 1) => {
    if (!term.trim()) {
      setCards([]);
      setListings([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    setLoading(true);
    setSearchError('');
    
    try {
      // 1. Buscar cartas en las APIs externas
      const { cards: apiCards, errors: apiErrors } = await searchCardsInAPIs(term, page);
      
      // 2. Buscar listings existentes en Firestore
      const listingsQuery = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      
      const listingsSnapshot = await getDocs(listingsQuery);
      let allListings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtrar listings por término de búsqueda
      allListings = allListings.filter(listing => 
        listing.cardName && listing.cardName.toLowerCase().includes(term.toLowerCase())
      );
      
      // 3. Combinar cartas de API con listings
      const cardMap = new Map();
      
      // Agregar cartas de APIs
      apiCards.forEach(card => {
        if (!cardMap.has(card.id)) {
          cardMap.set(card.id, {
            ...card,
            sellers: [],
            averagePrice: 0,
            minPrice: 0,
            maxPrice: 0,
            totalStock: 0
          });
        }
      });
      
      // Agregar listings como vendedores
      allListings.forEach(listing => {
        const cardId = listing.cardId;
        
        if (!cardMap.has(cardId)) {
          cardMap.set(cardId, {
            id: cardId,
            name: listing.cardName,
            images: { small: listing.cardImage, large: listing.cardImage },
            set: { name: listing.setName || 'Desconocido' },
            rarity: listing.rarity || 'Sin rareza',
            tcgType: listing.tcgType || 'unknown',
            tcgName: TCG_GAMES[listing.tcgType]?.name || 'Desconocido',
            sellers: [],
            averagePrice: 0,
            minPrice: 0,
            maxPrice: 0,
            totalStock: 0
          });
        }
        
        const card = cardMap.get(cardId);
        card.sellers.push({
          listingId: listing.id,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          price: listing.price,
          condition: listing.condition,
          quantity: listing.availableQuantity || listing.quantity || 1,
          createdAt: listing.createdAt,
          userPhone: listing.userPhone
        });
      });
      
      // 4. Calcular precios ponderados
      cardMap.forEach((card) => {
        if (card.sellers.length > 0) {
          const prices = card.sellers.map(s => s.price);
          const quantities = card.sellers.map(s => s.quantity);
          
          card.minPrice = Math.min(...prices);
          card.maxPrice = Math.max(...prices);
          card.totalStock = quantities.reduce((sum, q) => sum + q, 0);
          
          const totalWeightedPrice = card.sellers.reduce((sum, seller) => {
            return sum + (seller.price * seller.quantity);
          }, 0);
          card.averagePrice = totalWeightedPrice / card.totalStock;
          
          card.sellers.sort((a, b) => a.price - b.price);
        }
      });
      
      // 5. Convertir a array y aplicar filtros
      let finalCards = Array.from(cardMap.values());
      finalCards = applyFilters(finalCards, filters);
      
      // 6. Paginación
      const itemsPerPage = 12;
      const totalCount = finalCards.length;
      const calculatedPages = Math.ceil(totalCount / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const paginatedCards = finalCards.slice(startIndex, startIndex + itemsPerPage);

      setCards(paginatedCards);
      setListings(allListings);
      setTotalResults(totalCount);
      setTotalPages(calculatedPages);
      setCurrentPage(page);

      if (paginatedCards.length === 0) {
        const errorMsg = apiErrors.length > 0 
          ? `No se encontraron cartas. Errores de API: ${apiErrors.join(', ')}`
          : 'No se encontraron cartas que coincidan con tu búsqueda.';
        setSearchError(errorMsg);
      }

    } catch (error) {
      console.error('Error searching cards:', error);
      setCards([]);
      setListings([]);
      setTotalResults(0);
      setTotalPages(1);
      setSearchError(error.message || 'Error al buscar cartas. Inténtalo de nuevo.');
    }
    setLoading(false);
  }, [filters, enabledAPIs]);

  // Paginación
  const handlePagination = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (searchTerm.trim()) {
      performSearch(searchTerm, newPage);
    }
  }, [totalPages, searchTerm, performSearch]);

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setSearchError('');
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    if (!value.trim()) {
      setCards([]);
      setListings([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }
    
    const timer = setTimeout(() => {
      performSearch(value, 1);
    }, 1000);
    
    setDebounceTimer(timer);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (cardId) => {
    const newFavorites = favorites.includes(cardId) 
      ? favorites.filter(id => id !== cardId)
      : [...favorites, cardId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const openCardModal = (card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
    setShowCardModal(false);
  };

  // Funciones para el comparador de precios
  const openComparator = (card) => {
    setComparatorCard(card);
    setShowComparator(true);
  };

  const closeComparator = () => {
    setComparatorCard(null);
    setShowComparator(false);
  };

  // Función para manejar cambios en filtros
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    if (searchTerm.trim()) {
      setTimeout(() => performSearch(searchTerm, 1), 100);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container>
        {/* Header del Marketplace */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="section-title mb-2">🏪 Marketplace TCG Unificado</h2>
            <p className="text-muted mb-0">Busca cartas en múltiples APIs y compara precios de vendedores en tiempo real</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="success" 
              onClick={() => setShowSellModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaShoppingCart size={14} />
              Vender Cartas
            </Button>
          </div>
        </div>


        {/* Barra de búsqueda mejorada */}
        <div className="mb-4">
          <div className="input-group mb-3">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="🔍 Buscar cartas en todos los TCGs - Pokémon, One Piece, Dragon Ball, Magic, Digimon y más..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTerm.trim() && performSearch(searchTerm, 1)}
              className="form-control-lg"
            />
            <Button 
              variant="outline-secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-lg d-flex align-items-center gap-2"
              title="Filtros avanzados"
            >
              <FaFilter />
              {getActiveFiltersCount() > 0 && (
                <span className="badge bg-primary">{getActiveFiltersCount()}</span>
              )}
              <span className="d-none d-md-inline">Filtros</span>
            </Button>
            <Button 
              onClick={() => searchTerm.trim() && performSearch(searchTerm, 1)} 
              disabled={loading || !searchTerm.trim()}
              variant="primary"
              className="btn-lg"
            >
              {loading ? (
                <Spinner size="sm" animation="border" role="status" />
              ) : (
                <FaSearch size={14} />
              )}
              <span className="d-none d-sm-inline ms-2">
                {loading ? 'Buscando...' : 'Buscar'}
              </span>
            </Button>
          </div>
          
          {/* Filtro de APIs */}
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <small className="text-muted me-2">🎮 APIs habilitadas:</small>
              {Object.entries(TCG_GAMES).map(([key, config]) => (
                <div key={key} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`api-${key}`}
                    checked={enabledAPIs[key]}
                    onChange={(e) => setEnabledAPIs(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                  <label className="form-check-label" htmlFor={`api-${key}`}>
                    <span className="badge bg-secondary me-1">{config.icon}</span>
                    {config.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Mostrar errores de búsqueda */}
          {searchError && (
            <Alert variant="warning" className="mb-3">
              <strong>⚠️ Atención:</strong> {searchError}
            </Alert>
          )}
          
          {totalResults > 0 && (
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                <strong>Cartas en venta:</strong> Mostrando {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, totalResults)} de {totalResults} resultados
              </div>
            </div>
          )}
        </div>

        {/* Layout principal con sidebar de filtros */}
        <Row className="g-4">
          {/* Sidebar de filtros */}
          {showFilters && (
            <Col lg={3}>
              <MarketplaceFilters 
                filters={filters}
                onFiltersChange={handleFiltersChange}
                activeFiltersCount={getActiveFiltersCount()}
              />
            </Col>
          )}
          
          {/* Contenido principal */}
          <Col lg={showFilters ? 9 : 12}>
            {/* Secciones destacadas (solo cuando no hay búsqueda activa) */}
            {!searchTerm.trim() && !getActiveFiltersCount() && (
              <FeaturedSections onViewCard={openCardModal} />
            )}

            {/* Últimas cartas publicadas */}
            {!searchTerm.trim() && !getActiveFiltersCount() && latestListings.length > 0 && (
          <div className="latest-cards-section mb-5">
            <h3 className="mb-4">🔥 Últimas cartas publicadas</h3>
            <div className="latest-cards-horizontal">
              <div className="latest-cards-container">
                {latestListings.map(listing => (
                  <div key={listing.id} className="latest-card-item">
                    <Card 
                      className="h-100 latest-card-hover"
                      onClick={() => {
                        // Create a simplified card object for the modal
                        const cardData = {
                          id: listing.cardId || listing.id,
                          name: listing.cardName,
                          images: { small: listing.cardImage, large: listing.cardImage },
                          set: { name: listing.setName || 'Desconocido' },
                          rarity: listing.rarity || 'Sin rareza'
                        };
                        openCardModal(cardData);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Img 
                        variant="top" 
                        src={listing.cardImage || 'https://via.placeholder.com/200'} 
                        className="card-img-top"
                        style={{ height: '140px', objectFit: 'contain', padding: '0.5rem' }}
                      />
                      <Card.Body className="p-2">
                        <Card.Title className="fs-6 mb-1 text-truncate">{listing.cardName}</Card.Title>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-success">${listing.price}</span>
                          <small className="text-muted">{listing.condition}</small>
                        </div>
                        <div className="mt-2">
                          <small className="text-muted d-block text-truncate">Por: {listing.sellerName || "Anónimo"}</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {cards.length > 0 && (
          <>
            <div className="mb-4">
              <Pagination className="justify-content-center">
                <Pagination.Prev 
                  disabled={currentPage === 1} 
                  onClick={() => handlePagination(currentPage - 1)}
                  aria-label="Página anterior"
                />
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  
                  if (startPage > 1) {
                    pages.push(
                      <Pagination.Item key={1} onClick={() => handlePagination(1)}>
                        1
                      </Pagination.Item>
                    );
                    if (startPage > 2) {
                      pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Pagination.Item
                        key={i}
                        active={i === currentPage}
                        onClick={() => handlePagination(i)}
                      >
                        {i}
                      </Pagination.Item>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
                    }
                    pages.push(
                      <Pagination.Item key={totalPages} onClick={() => handlePagination(totalPages)}>
                        {totalPages}
                      </Pagination.Item>
                    );
                  }
                  
                  return pages;
                })()}
                <Pagination.Next 
                  disabled={currentPage === totalPages} 
                  onClick={() => handlePagination(currentPage + 1)}
                  aria-label="Página siguiente"
                />
              </Pagination>
            </div>
            <Row className="g-4">
              {cards.map(card => (
                <Col key={card.id} md={6} lg={4} className="mb-4">
                  <Card className="h-100 shadow-sm hover-effect position-relative">
                    <div className="position-relative">
                      <Card.Img 
                        variant="top" 
                        src={card.images?.small || 'https://via.placeholder.com/300'} 
                        className="card-img-custom"
                        onClick={() => openCardModal(card)}
                        style={{ cursor: 'pointer', height: '250px', objectFit: 'contain', padding: '1rem' }}
                      />
                      
                      {/* Badge del TCG en esquina superior izquierda */}
                      <div className="position-absolute top-0 start-0 p-2">
                        <span className="badge bg-primary">{card.tcgName || 'TCG'}</span>
                      </div>
                      
                      {/* Botón de favoritos */}
                      <div className="position-absolute top-0 end-0 p-2">
                        <Button
                          variant={favorites.includes(card.id) ? "danger" : "outline-light"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(card.id);
                          }}
                          className="rounded-circle p-1"
                          title={favorites.includes(card.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                          style={{ 
                            backdropFilter: 'blur(10px)',
                            backgroundColor: favorites.includes(card.id) ? 'rgba(220, 53, 69, 0.9)' : 'rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          <FaHeart size={12} className={favorites.includes(card.id) ? 'text-white' : 'text-danger'} />
                        </Button>
                      </div>
                    </div>
                    
                    <Card.Body 
                      className="d-flex flex-column" 
                      onClick={() => openCardModal(card)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Title className="fs-5 mb-2">{card.name}</Card.Title>
                      <Card.Text className="text-muted small mb-3">
                        {card.set?.name} • {card.rarity || 'Sin rareza'}
                      </Card.Text>
                      
                      {/* Información de precios */}
                      {card.sellers && card.sellers.length > 0 ? (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Precio:</small>
                            <div className="text-end">
                              {card.minPrice !== card.maxPrice ? (
                                <>
                                  <div className="fs-6 fw-bold text-success">${card.minPrice.toFixed(2)} - ${card.maxPrice.toFixed(2)}</div>
                                  <small className="text-muted">Promedio: ${card.averagePrice.toFixed(2)}</small>
                                </>
                              ) : (
                                <div className="fs-6 fw-bold text-success">${card.minPrice.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Vendedores:</small>
                            <span className="badge bg-info">{card.sellers.length}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <small className="text-muted">Stock total:</small>
                            <span className="badge bg-secondary">{card.totalStock}</span>
                          </div>
                          
                          {/* Mejor precio destacado */}
                          <div className="border rounded p-2 mb-3 bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-bold text-success">${card.sellers[0].price}</div>
                                <small className="text-muted">{card.sellers[0].condition}</small>
                                <div className="small">
                                  <strong>{card.sellers[0].sellerName || "Anónimo"}</strong>
                                </div>
                              </div>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Crear objeto listing compatible
                                    const listing = {
                                      id: card.sellers[0].listingId,
                                      cardId: card.id,
                                      cardName: card.name,
                                      cardImage: card.images.small,
                                      price: card.sellers[0].price,
                                      condition: card.sellers[0].condition,
                                      sellerId: card.sellers[0].sellerId,
                                      sellerName: card.sellers[0].sellerName,
                                      availableQuantity: card.sellers[0].quantity
                                    };
                                    addToCart(listing);
                                  }}
                                  title="Agregar al carrito"
                                >
                                  <FaShoppingCart size={14} />
                                </Button>
                                <Button 
                                  variant="outline-success" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/${card.sellers[0].userPhone}`, '_blank');
                                  }}
                                  title="Contactar por WhatsApp"
                                >
                                  <FaWhatsapp size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {card.sellers.length > 1 && (
                            <div className="text-center">
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Abrir modal con todos los vendedores
                                  openCardModal(card);
                                }}
                                className="text-decoration-none"
                              >
                                Ver {card.sellers.length - 1} vendedores más
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-3 mb-3">
                          <small>💤 No hay vendedores actualmente</small>
                          <div className="mt-2">
                            <small className="text-info">Haz clic para ver detalles de la carta</small>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
          </Col>
        </Row>
      </Container>

      <SellCardModal show={showSellModal} handleClose={() => setShowSellModal(false)} />
      
      {/* Modal Gigante de Detalle de Carta */}
      <Modal 
        show={showCardModal} 
        onHide={closeCardModal}
        size="xl"
        centered
        className="card-detail-modal"
      >
        <Modal.Header closeButton className="border-0 bg-light">
          <Modal.Title className="d-flex align-items-center gap-2">
            <span className="badge bg-primary">{selectedCard?.tcgName || 'TCG'}</span>
            {selectedCard?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {selectedCard && (
            <div className="row g-0">
              {/* Columna izquierda: Imagen gigante de la carta */}
              <div className="col-lg-5 bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '500px' }}>
                  <img 
                    src={selectedCard.images?.large || selectedCard.images?.small || 'https://via.placeholder.com/400'} 
                    alt={selectedCard.name}
                    className="img-fluid rounded shadow-lg"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '450px', 
                      objectFit: 'contain',
                      border: '3px solid rgba(255,255,255,0.3)'
                    }}
                  />
                  <div className="mt-3 text-center">
                    <Button
                      variant={favorites.includes(selectedCard?.id) ? "danger" : "light"}
                      onClick={() => selectedCard && toggleFavorite(selectedCard.id)}
                      className="btn-lg"
                    >
                      <FaHeart className="me-2" />
                      {favorites.includes(selectedCard?.id) ? "💖 En favoritos" : "🤍 Agregar a favoritos"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Columna derecha: Información y vendedores */}
              <div className="col-lg-7">
                <div className="p-4">
                  {/* Header de la carta */}
                  <div className="mb-4">
                    <h3 className="card-title mb-2">{selectedCard.name}</h3>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge bg-secondary">{selectedCard.set?.name || 'Desconocido'}</span>
                      <span className="badge bg-warning text-dark">{selectedCard.rarity || 'Sin rareza'}</span>
                      {selectedCard.tcgName && <span className="badge bg-info">{selectedCard.tcgName}</span>}
                    </div>
                  </div>

                  {/* Información específica por TCG */}
                  <div className="mb-4">
                    <h5 className="mb-3">📊 Detalles de la carta</h5>
                    <div className="row g-3">
                      {/* Campos comunes */}
                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <FaTag className="text-muted" size={14} />
                          <strong>Set:</strong> {selectedCard.set?.name || 'Desconocido'}
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <FaStar className="text-warning" size={14} />
                          <strong>Rareza:</strong> {selectedCard.rarity || 'Sin rareza'}
                        </div>
                      </div>
                      
                      {/* Campos específicos de Pokémon */}
                      {selectedCard.tcgType === 'pokemon' && (
                        <>
                          {selectedCard.hp && (
                            <div className="col-6">
                              <strong>HP:</strong> {selectedCard.hp}
                            </div>
                          )}
                          {selectedCard.types && (
                            <div className="col-6">
                              <strong>Tipo:</strong> {selectedCard.types.join(', ')}
                            </div>
                          )}
                          {selectedCard.artist && (
                            <div className="col-6">
                              <div className="d-flex align-items-center gap-2">
                                <FaUser className="text-muted" size={14} />
                                <strong>Artista:</strong> {selectedCard.artist}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Campos específicos de otros TCGs */}
                      {selectedCard.tcgType !== 'pokemon' && (
                        <>
                          {selectedCard.cost && (
                            <div className="col-6">
                              <strong>Costo:</strong> {selectedCard.cost}
                            </div>
                          )}
                          {selectedCard.power && (
                            <div className="col-6">
                              <strong>Poder:</strong> {selectedCard.power}
                            </div>
                          )}
                          {selectedCard.color && (
                            <div className="col-6">
                              <strong>Color:</strong> {selectedCard.color}
                            </div>
                          )}
                          {selectedCard.attribute && (
                            <div className="col-6">
                              <strong>Atributo:</strong> {selectedCard.attribute}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ataques (solo Pokémon) */}
                  {selectedCard.attacks && selectedCard.attacks.length > 0 && (
                    <div className="mb-4">
                      <h5 className="mb-3">⚔️ Ataques</h5>
                      {selectedCard.attacks.map((attack, index) => (
                        <div key={index} className="border rounded p-3 mb-2 bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong className="text-primary">{attack.name}</strong>
                            <span className="badge bg-danger">{attack.damage || '-'}</span>
                          </div>
                          {attack.text && (
                            <small className="text-muted">{attack.text}</small>
                          )}
                          {attack.cost && (
                            <div className="mt-1">
                              <small><strong>Costo:</strong> {attack.cost.join(', ')}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Habilidades (otros TCGs) */}
                  {selectedCard.ability && (
                    <div className="mb-4">
                      <h5 className="mb-3">✨ Habilidad</h5>
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted">{selectedCard.ability}</small>
                      </div>
                    </div>
                  )}

                  {/* Descripción/Flavor Text */}
                  {selectedCard.flavorText && (
                    <div className="mb-4">
                      <h5 className="mb-3">📖 Descripción</h5>
                      <blockquote className="blockquote">
                        <p className="text-muted fst-italic">"{selectedCard.flavorText}"</p>
                      </blockquote>
                    </div>
                  )}

                  {/* Lista de vendedores */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">🏪 Vendedores disponibles</h5>
                      {selectedCard.sellers && selectedCard.sellers.length > 0 && (
                        <div className="d-flex gap-2">
                          <span className="badge bg-success">Desde ${selectedCard.minPrice.toFixed(2)}</span>
                          {selectedCard.minPrice !== selectedCard.maxPrice && (
                            <span className="badge bg-info">Hasta ${selectedCard.maxPrice.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedCard.sellers && selectedCard.sellers.length > 0 ? (
                      <div className="seller-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {selectedCard.sellers.map((seller, index) => (
                          <div key={index} className="border rounded p-3 mb-3 seller-card">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <h6 className="mb-0 text-success fs-4">${seller.price}</h6>
                                  {index === 0 && <span className="badge bg-warning text-dark">Mejor precio</span>}
                                </div>
                                <div className="mb-2">
                                  <strong>Condición:</strong> {seller.condition}
                                </div>
                                <div className="mb-2">
                                  <strong>Vendedor:</strong> {seller.sellerName || "Anónimo"}
                                </div>
                                <div className="mb-2">
                                  <strong>Stock:</strong> {seller.quantity} disponible{seller.quantity > 1 ? 's' : ''}
                                </div>
                                <SellerRating sellerId={seller.sellerId} />
                              </div>
                              <div className="d-flex flex-column gap-2">
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Crear objeto listing compatible
                                    const listing = {
                                      id: seller.listingId,
                                      cardId: selectedCard.id,
                                      cardName: selectedCard.name,
                                      cardImage: selectedCard.images.small,
                                      price: seller.price,
                                      condition: seller.condition,
                                      sellerId: seller.sellerId,
                                      sellerName: seller.sellerName,
                                      availableQuantity: seller.quantity
                                    };
                                    addToCart(listing);
                                    alert('¡Carta agregada al carrito!');
                                  }}
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaShoppingCart size={14} />
                                  Carrito
                                </Button>
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/${seller.userPhone}`, '_blank');
                                  }}
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaWhatsapp size={14} />
                                  WhatsApp
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <div className="mb-3">
                          <FaExchangeAlt size={48} className="text-muted opacity-50" />
                        </div>
                        <h6>No hay vendedores disponibles</h6>
                        <p className="mb-0">Esta carta no está siendo vendida actualmente por ningún usuario.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light">
          <Button variant="secondary" onClick={closeCardModal} size="lg">
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comparador de Precios */}
      <PriceComparator
        show={showComparator}
        onHide={closeComparator}
        cardId={comparatorCard?.id}
        cardName={comparatorCard?.name}
        cardImage={comparatorCard?.image}
      />
    </motion.div>
  );
}