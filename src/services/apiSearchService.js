// src/services/apiSearchService.js
class APISearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.pokemonApiKey = process.env.REACT_APP_POKEMON_API_KEY;
    this.tcgApiKey = process.env.REACT_APP_TCG_API_KEY;
  }

  // Método principal para buscar en todas las APIs
  async searchAllAPIs(searchTerm, page = 1, pageSize = 24, tcgFilter = 'all') {
    if (!searchTerm.trim()) {
      return { cards: [], totalResults: 0, errors: [] };
    }

    const cacheKey = `${searchTerm}-${page}-${pageSize}-${tcgFilter}`;
    
    // Verificar caché
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('=€ Resultado obtenido desde caché');
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    console.log(`= Buscando "${searchTerm}" en APIs externas (filtro: ${tcgFilter})`);

    let allCards = [];
    let errors = [];

    try {
      const searchPromises = [];

      // Determinar qué APIs consultar
      if (tcgFilter === 'all' || tcgFilter === 'pokemon') {
        searchPromises.push(
          this.searchPokemonAPI(searchTerm, 1, 50)
            .catch(error => {
              console.error('Error en Pokémon API:', error);
              errors.push({ api: 'Pokemon', error: error.message });
              return { cards: [] };
            })
        );
      }

      // APIs del TCGS para otros juegos
      const tcgGames = ['onepiece', 'dragonball', 'digimon', 'magic', 'unionarena', 'gundam'];
      tcgGames.forEach(game => {
        if (tcgFilter === 'all' || tcgFilter === game) {
          searchPromises.push(
            this.searchTCGSAPI(game, searchTerm, 1, 30)
              .catch(error => {
                console.error(`Error en ${game} API:`, error);
                errors.push({ api: game, error: error.message });
                return { cards: [] };
              })
          );
        }
      });

      // Ejecutar todas las búsquedas en paralelo
      const results = await Promise.all(searchPromises);
      
      // Combinar resultados
      results.forEach(result => {
        if (result.cards && Array.isArray(result.cards)) {
          allCards = allCards.concat(result.cards);
        }
      });

      // Normalizar y eliminar duplicados
      const normalizedCards = this.normalizeCards(allCards);
      const uniqueCards = this.removeDuplicates(normalizedCards);

      // Ordenar por relevancia
      const sortedCards = this.sortByRelevance(uniqueCards, searchTerm);

      // Paginación
      const startIndex = (page - 1) * pageSize;
      const paginatedCards = sortedCards.slice(startIndex, startIndex + pageSize);

      const result = {
        cards: paginatedCards,
        totalResults: sortedCards.length,
        errors: errors,
        page: page,
        totalPages: Math.ceil(sortedCards.length / pageSize)
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(` Búsqueda completada: ${sortedCards.length} cartas encontradas`);
      return result;

    } catch (error) {
      console.error('Error general en búsqueda de APIs:', error);
      return {
        cards: [],
        totalResults: 0,
        errors: [{ api: 'General', error: error.message }],
        page: 1,
        totalPages: 0
      };
    }
  }

  // Buscar en Pokémon API
  async searchPokemonAPI(searchTerm, page = 1, pageSize = 50) {
    if (!this.pokemonApiKey) {
      console.warn('  Pokémon API key no configurada');
      return { cards: [] };
    }

    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(searchTerm)}*&pageSize=${pageSize}&page=${page}`,
        {
          headers: {
            'X-Api-Key': this.pokemonApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pokémon API error: ${response.status}`);
      }

      const data = await response.json();
      return { cards: data.data || [] };

    } catch (error) {
      console.error('Error en Pokémon API:', error);
      throw error;
    }
  }

  // Buscar en TCGS API
  async searchTCGSAPI(tcgType, searchTerm, page = 1, limit = 30) {
    if (!this.tcgApiKey) {
      console.warn('  TCGS API key no configurada');
      return { cards: [] };
    }

    const apiEndpoints = {
      onepiece: '/one-piece/cards',
      dragonball: '/dragon-ball-fusion/cards', 
      digimon: '/digimon/cards',
      magic: '/magic/cards',
      unionarena: '/union-arena/cards',
      gundam: '/gundam/cards'
    };

    const endpoint = apiEndpoints[tcgType];
    if (!endpoint) {
      console.warn(`  TCG tipo desconocido: ${tcgType}`);
      return { cards: [] };
    }

    try {
      const response = await fetch(
        `https://apitcg.com/api${endpoint}?name=${encodeURIComponent(searchTerm)}&limit=${limit}&page=${page}`,
        {
          headers: {
            'x-api-key': this.tcgApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`TCGS API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Agregar tcgType a cada carta
      const cards = (data.data || data.cards || []).map(card => ({
        ...card,
        tcgType: tcgType,
        apiSource: 'tcgapis'
      }));

      return { cards };

    } catch (error) {
      console.error(`Error en ${tcgType} API:`, error);
      throw error;
    }
  }

  // Obtener detalles de una carta específica
  async getCardDetails(cardId, tcgType) {
    if (tcgType === 'pokemon') {
      return this.getPokemonCardDetails(cardId);
    } else {
      return this.getTCGSCardDetails(cardId, tcgType);
    }
  }

  async getPokemonCardDetails(cardId) {
    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards/${cardId}`,
        {
          headers: {
            'X-Api-Key': this.pokemonApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Pokémon API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizePokemonCard(data.data);

    } catch (error) {
      console.error('Error obteniendo detalles de carta Pokémon:', error);
      return null;
    }
  }

  async getTCGSCardDetails(cardId, tcgType) {
    const apiEndpoints = {
      onepiece: '/one-piece/cards',
      dragonball: '/dragon-ball-fusion/cards',
      digimon: '/digimon/cards', 
      magic: '/magic/cards',
      unionarena: '/union-arena/cards',
      gundam: '/gundam/cards'
    };

    const endpoint = apiEndpoints[tcgType];
    if (!endpoint) {
      return null;
    }

    try {
      const response = await fetch(
        `https://apitcg.com/api${endpoint}/${cardId}`,
        {
          headers: {
            'x-api-key': this.tcgApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`TCGS API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeTCGSCard(data.data || data, tcgType);

    } catch (error) {
      console.error(`Error obteniendo detalles de carta ${tcgType}:`, error);
      return null;
    }
  }

  // Normalizar cartas de diferentes APIs a un formato unificado
  normalizeCards(cards) {
    return cards.map(card => {
      if (card.apiSource === 'tcgapis' || card.tcgType !== 'pokemon') {
        return this.normalizeTCGSCard(card, card.tcgType);
      } else {
        return this.normalizePokemonCard(card);
      }
    });
  }

  normalizePokemonCard(card) {
    return {
      id: card.id,
      name: card.name,
      images: {
        small: card.images?.small || '',
        large: card.images?.large || card.images?.small || ''
      },
      set: {
        name: card.set?.name || 'Desconocido'
      },
      rarity: card.rarity || 'Común',
      tcgType: 'pokemon',
      apiSource: 'pokemon',
      
      // Campos específicos de Pokémon
      hp: card.hp ? parseInt(card.hp) : null,
      types: card.types || [],
      attacks: card.attacks || [],
      abilities: card.abilities || [],
      artist: card.artist,
      flavorText: card.flavorText,
      
      // Precios si están disponibles
      tcgplayer: card.tcgplayer,
      legalities: card.legalities
    };
  }

  normalizeTCGSCard(card, tcgType) {
    // Mapear nombres de TCG
    const tcgNames = {
      onepiece: 'One Piece',
      dragonball: 'Dragon Ball',
      digimon: 'Digimon',
      magic: 'Magic: The Gathering',
      unionarena: 'Union Arena',
      gundam: 'Gundam'
    };

    return {
      id: card.id || card._id || `${tcgType}-${Date.now()}`,
      name: card.name || card.card_name || 'Sin nombre',
      images: {
        small: card.image || card.images?.small || card.card_image || '',
        large: card.image || card.images?.large || card.card_image || ''
      },
      set: {
        name: card.set || card.set_name || card.expansion || 'Desconocido'
      },
      rarity: card.rarity || 'Común',
      tcgType: tcgType,
      tcgName: tcgNames[tcgType] || tcgType,
      apiSource: 'tcgapis',
      
      // Campos específicos por TCG
      cost: card.cost || card.play_cost,
      power: card.power || card.battle_power,
      color: card.color || card.colours,
      type: card.type || card.card_type,
      attribute: card.attribute,
      ability: card.ability || card.card_text,
      effect: card.effect || card.effect_text,
      flavorText: card.flavor_text || card.flavour_text
    };
  }

  // Eliminar cartas duplicadas basándose en el ID
  removeDuplicates(cards) {
    const seen = new Set();
    return cards.filter(card => {
      const key = `${card.id}-${card.tcgType}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Ordenar por relevancia (nombre más similar primero)
  sortByRelevance(cards, searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    return cards.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Coincidencia exacta
      if (aName === term && bName !== term) return -1;
      if (bName === term && aName !== term) return 1;
      
      // Comienza con el término
      const aStarts = aName.startsWith(term);
      const bStarts = bName.startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      // Contiene el término
      const aContains = aName.includes(term);
      const bContains = bName.includes(term);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;
      
      // Por longitud del nombre (más corto primero)
      return aName.length - bName.length;
    });
  }

  // Limpiar caché manualmente
  clearCache() {
    this.cache.clear();
    console.log('>ù Caché de API limpiado');
  }

  // Obtener estadísticas del caché
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Exportar como singleton
const apiSearchService = new APISearchService();
export default apiSearchService;