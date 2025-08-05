// src/pages/Marketplace.js
import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Spinner, ListGroup, Button, Pagination, Modal, Alert } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import SellCardModal from '../components/SellCardModal';
import { FaShoppingCart, FaWhatsapp, FaHeart, FaSearch, FaUser, FaTag, FaStar, FaGamepad } from 'react-icons/fa';
import ReactStars from "react-rating-stars-component";

const POKEMON_API_KEY = '1f1c90be-e3da-4ff5-9753-8a662f20c2f0';
const TCG_API_KEY = 'dfdafe3318674ef4614e77913b6e2b85f80433d413f03c082503edb68d77ef2b';

// Configuración de juegos TCG
const TCG_GAMES = {
  pokemon: {
    name: 'Pokémon TCG',
    apiUrl: 'https://api.pokemontcg.io/v2/cards',
    apiKey: POKEMON_API_KEY,
    searchParam: 'name',
    icon: '🔥',
    available: true,
    apiType: 'pokemon'
  },
  onepiece: {
    name: 'One Piece',
    apiUrl: 'https://www.apitcg.com/api/one-piece/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🏴‍☠️',
    available: true,
    apiType: 'tcgapi'
  },
  dragonball: {
    name: 'Dragon Ball',
    apiUrl: 'https://www.apitcg.com/api/dragon-ball-fusion/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🐉',
    available: true,
    apiType: 'tcgapi'
  },
  digimon: {
    name: 'Digimon',
    apiUrl: 'https://www.apitcg.com/api/digimon/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🦖',
    available: true,
    apiType: 'tcgapi'
  },
  magic: {
    name: 'Magic: The Gathering',
    apiUrl: 'https://www.apitcg.com/api/magic/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🪄',
    available: true,
    apiType: 'tcgapi'
  },
  unionarena: {
    name: 'Union Arena',
    apiUrl: 'https://www.apitcg.com/api/union-arena/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '⚔️',
    available: true,
    apiType: 'tcgapi'
  },
  gundam: {
    name: 'Gundam',
    apiUrl: 'https://www.apitcg.com/api/gundam/cards',
    apiKey: TCG_API_KEY,
    searchParam: 'name',
    icon: '🤖',
    available: true,
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
  // Eliminar selectedGame - ahora buscaremos en todos los TCGs
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
  const { addToCart } = useCart();

  const [latestListings, setLatestListings] = useState([]);

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
      const cacheKey = `all-tcgs-${sanitizedTerm}-${page}`;
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

      // Buscar directamente en listings (cartas ya publicadas para venta)
      let fetchedListings = [];
      let totalCount = 0;

      // Buscar directamente en listings de Firestore (cartas ya publicadas)
      const listingsQuery = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50) // Limitar resultados para mejor rendimiento
      );
      
      const listingsSnapshot = await getDocs(listingsQuery);
      const allListings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtrar listings que coincidan con el término de búsqueda
      fetchedListings = allListings.filter(listing => 
        listing.cardName && listing.cardName.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      
      // Crear cards únicos basados en los listings
      const uniqueCards = [];
      const seenCardIds = new Set();
      
      fetchedListings.forEach(listing => {
        if (!seenCardIds.has(listing.cardId)) {
          seenCardIds.add(listing.cardId);
          uniqueCards.push({
            id: listing.cardId,
            name: listing.cardName,
            images: { 
              small: listing.cardImage,
              large: listing.cardImage
            },
            set: { name: listing.setName || 'Desconocido' },
            rarity: listing.rarity || 'Sin rareza',
            tcgType: listing.tcgType || 'unknown'
          });
        }
      });

      totalCount = uniqueCards.length;

      const itemsPerPage = 10;
      const calculatedPages = Math.ceil(totalCount / itemsPerPage);

      // Cache results
      const cacheData = {
        cards: uniqueCards,
        listings: fetchedListings,
        totalResults: totalCount,
        totalPages: calculatedPages
      };
      
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: cacheData
      }));

      setCards(uniqueCards);
      setListings(fetchedListings);
      setTotalResults(totalCount);
      setTotalPages(calculatedPages);
      setCurrentPage(page);

      if (uniqueCards.length === 0) {
        setSearchError('No se encontraron cartas en venta que coincidan con tu búsqueda.');
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
  }, [searchTerm, searchCache]);

  const handlePagination = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    searchCards(newPage);
  }, [totalPages, searchCards]);

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setSearchError(''); // Limpiar errores previos
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      if (value.trim()) {
        searchCards(1, true); // Skip cache for new searches
      } else {
        // Limpiar resultados si no hay término de búsqueda
        setCards([]);
        setListings([]);
        setTotalResults(0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    }, 500);
    
    setDebounceTimer(timer);
  }, [debounceTimer, searchCards]);

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
            <h2 className="section-title mb-2">🏪 Marketplace</h2>
            <p className="text-muted mb-0">Encuentra cartas de Pokémon, One Piece, Dragon Ball y más TCGs</p>
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
              placeholder="Buscar cartas en todos los TCGs (ej: Charizard, Luffy, Goku, Agumon...)"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCards(1, true)}
              className="form-control-lg"
            />
            <Button 
              onClick={() => searchCards(1, true)} 
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

        {/* Últimas cartas publicadas */}
        {!searchTerm.trim() && latestListings.length > 0 && (
          <div className="latest-cards-section mb-5">
            <h3 className="mb-4">🔥 Últimas cartas publicadas</h3>
            <Row className="g-3">
              {latestListings.map(listing => (
                <Col key={listing.id} xs={6} sm={4} md={3} lg={2}>
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
                </Col>
              ))}
            </Row>
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
                <Col key={card.id} md={4} lg={3} className="mb-4">
                  <Card className="h-100 shadow-sm hover-effect position-relative">
                    <div className="position-relative">
                      <Card.Img 
                        variant="top" 
                        src={card.images?.small || 'https://via.placeholder.com/300'} 
                        className="card-img-custom"
                        onClick={() => openCardModal(card)}
                        style={{ cursor: 'pointer' }}
                      />
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
                        {card.set?.name} - {card.rarity || 'Sin rareza'}
                      </Card.Text>
                      <div className="mt-auto">
                        <h6 className="mb-3">Vendedores:</h6>
                        <ListGroup className="mb-3">
                          {listings
                            .filter(l => l.cardId === card.id)
                            .map((listing, index) => (
                              <ListGroup.Item key={`${listing.id}-${index}`} className="py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <h6 className="mb-0 text-primary">${listing.price}</h6>
                                    <div className="text-muted small">
                                      <div>{listing.condition}</div>
                                      <div className="fw-bold">
                                        Vendedor: {listing.sellerName || "Desconocido"}
                                      </div>
                                      <SellerRating sellerId={listing.sellerId} />
                                    </div>
                                  </div>
                                  <div className="d-flex gap-2">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(listing);
                                      }}
                                      title="Agregar al carrito"
                                    >
                                      <FaShoppingCart size={18} />
                                    </Button>
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://wa.me/${listing.userPhone}`, '_blank');
                                      }}
                                      title="Contactar por WhatsApp"
                                    >
                                      <FaWhatsapp size={18} />
                                    </Button>
                                  </div>
                                </div>
                              </ListGroup.Item>
                            ))}
                        </ListGroup>
                        {listings.filter(l => l.cardId === card.id).length === 0 && (
                          <div className="text-center text-muted py-2">
                            <small>No hay vendedores para esta carta</small>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>

      <SellCardModal show={showSellModal} handleClose={() => setShowSellModal(false)} />
      
      {/* Modal de Detalle de Carta */}
      <Modal 
        show={showCardModal} 
        onHide={closeCardModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaTag className="text-primary" />
            {selectedCard?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedCard && (
            <div className="row g-0">
              <div className="col-md-5">
                <img 
                  src={selectedCard.images?.large || selectedCard.images?.small || 'https://via.placeholder.com/400'} 
                  alt={selectedCard.name}
                  className="img-fluid rounded-start"
                  style={{ width: '100%', height: '400px', objectFit: 'contain', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
                />
              </div>
              <div className="col-md-7">
                <div className="card-body p-4">
                  <h4 className="card-title mb-3">{selectedCard.name}</h4>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaTag className="text-muted" size={14} />
                      <strong>Set:</strong> {selectedCard.set?.name || 'Desconocido'}
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaStar className="text-warning" size={14} />
                      <strong>Rareza:</strong> {selectedCard.rarity || 'Sin rareza'}
                    </div>
                    {selectedCard.artist && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FaUser className="text-muted" size={14} />
                        <strong>Artista:</strong> {selectedCard.artist}
                      </div>
                    )}
                  </div>

                  {selectedCard.attacks && selectedCard.attacks.length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold">Ataques:</h6>
                      {selectedCard.attacks.map((attack, index) => (
                        <div key={index} className="border rounded p-2 mb-2 bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <strong>{attack.name}</strong>
                            <span className="badge bg-danger">{attack.damage || '-'}</span>
                          </div>
                          {attack.text && (
                            <small className="text-muted">{attack.text}</small>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCard.flavorText && (
                    <div className="mb-3">
                      <h6 className="fw-bold">Descripción:</h6>
                      <p className="text-muted fst-italic">"{selectedCard.flavorText}"</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <h6 className="fw-bold">Vendedores disponibles:</h6>
                    {listings.filter(l => l.cardId === selectedCard.id).length > 0 ? (
                      <div className="row g-2">
                        {listings.filter(l => l.cardId === selectedCard.id).slice(0, 3).map((listing, index) => (
                          <div key={index} className="col-12">
                            <div className="border rounded p-3 d-flex justify-content-between align-items-center">
                              <div className="flex-grow-1">
                                <div className="fw-bold text-success fs-5">${listing.price}</div>
                                <small className="text-muted d-block">
                                  {listing.condition} • {listing.sellerName || "Anónimo"}
                                </small>
                                <small className="text-muted">
                                  Stock: {listing.availableQuantity || listing.quantity || 1} disponible{(listing.availableQuantity || listing.quantity || 1) > 1 ? 's' : ''}
                                </small>
                              </div>
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(listing);
                                    alert('¡Carta agregada al carrito!');
                                  }}
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaShoppingCart size={12} />
                                  <span className="d-none d-md-inline">Carrito</span>
                                </Button>
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://wa.me/${listing.userPhone}`, '_blank');
                                  }}
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaWhatsapp size={12} />
                                  <span className="d-none d-md-inline">WhatsApp</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3">
                        <small>No hay vendedores disponibles para esta carta</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant={favorites.includes(selectedCard?.id) ? "danger" : "outline-danger"}
            onClick={() => selectedCard && toggleFavorite(selectedCard.id)}
          >
            <FaHeart className="me-2" />
            {favorites.includes(selectedCard?.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
          </Button>
          <Button variant="secondary" onClick={closeCardModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
}