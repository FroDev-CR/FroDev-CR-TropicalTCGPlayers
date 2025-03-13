// src/pages/Marketplace.js
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Spinner, ListGroup, Button, Pagination } from 'react-bootstrap';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import SellCardModal from '../components/SellCardModal';

const API_KEY = '1f1c90be-e3da-4ff5-9753-8a662f20c2f0';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showSellModal, setShowSellModal] = useState(false);
  const { addToCart } = useCart();

  // Estado para las últimas cartas publicadas
  const [latestListings, setLatestListings] = useState([]);

  // Consulta de las últimas cartas publicadas (últimos 6)
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
    fetchLatestListings();
  }, []);

  const searchCards = async (page = 1) => {
    setLoading(true);
    try {
      // Limpieza del término y codificación
      const sanitizedTerm = searchTerm
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ');
      
      let queryTerm;
      if (sanitizedTerm.includes(' ')) {
        queryTerm = encodeURIComponent(`"${sanitizedTerm}"`);
      } else {
        queryTerm = encodeURIComponent(sanitizedTerm + '*');
      }

      if (!sanitizedTerm) {
        setCards([]);
        setListings([]);
        setTotalResults(0);
        return;
      }

      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:${queryTerm}&page=${page}&pageSize=10`,
        {
          headers: { 'X-Api-Key': API_KEY }
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Por favor usa un término de búsqueda válido (ej: "Charizard ex")');
        }
        throw new Error(`Error en la búsqueda: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error('Formato de respuesta inválido');
      }

      // Obtenemos listados de Firestore para las cartas encontradas
      const cardIds = data.data.map(c => c.id);
      const listingsQuery = query(collection(db, 'listings'), where('cardId', 'in', cardIds));
      const listingsSnapshot = await getDocs(listingsQuery);
      const fetchedListings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filtrar: solo se muestran cartas que tengan listados (en stock)
      const filteredCards = data.data.filter(card =>
        fetchedListings.some(listing => listing.cardId === card.id)
      );

      setCards(filteredCards);
      setListings(fetchedListings);
      setTotalResults(filteredCards.length);
      setTotalPages(Math.ceil(filteredCards.length / 10));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching cards:', error);
      setCards([]);
      setListings([]);
      setTotalResults(0);
      alert(error.message);
    }
    setLoading(false);
  };

  const handlePagination = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    searchCards(newPage);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container>
        <h2 className="section-title">Marketplace</h2>

        {/* Botón "Vender Cartas" y barra de búsqueda siempre arriba */}
        <div className="mb-4">
          <div className="d-flex justify-content-end mb-2">
            <Button variant="success" onClick={() => setShowSellModal(true)}>
              Vender Cartas
            </Button>
          </div>
          <div>
            <Form.Control
              type="text"
              placeholder="Buscar carta (ej: 'Charizard ex')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCards(1)}
            />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <Button 
                onClick={() => searchCards(1)} 
                disabled={loading}
                variant="primary"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <span className="ms-2">Buscando...</span>
                  </>
                ) : 'Buscar'}
              </Button>
              {totalResults > 0 && (
                <div className="text-muted">
                  Mostrando {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, totalResults)} de {totalResults} resultados
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección "Últimas cartas publicadas" justo debajo de la barra de búsqueda */}
        {latestListings.length > 0 && (
          <div className="latest-cards-section my-4">
            <h3>Últimas cartas publicadas</h3>
            <div className="d-flex gap-3 overflow-auto" style={{ paddingBottom: '1rem' }}>
              {latestListings.map(listing => (
                <Card
                  key={listing.id}
                  className="latest-card"
                  style={{ minWidth: '200px', flex: '0 0 auto' }}
                >
                  <Card.Img 
                    variant="top" 
                    src={listing.cardImage || 'https://via.placeholder.com/200'} 
                  />
                  <Card.Body>
                    <Card.Title className="fs-6">{listing.cardName}</Card.Title>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resultados de búsqueda */}
        {cards.length > 0 && (
          <>
            <div className="mb-4">
              <Pagination className="justify-content-center">
                <Pagination.Prev 
                  disabled={currentPage === 1} 
                  onClick={() => handlePagination(currentPage - 1)}
                  aria-label="Página anterior"
                />
                
                {Array.from({ length: totalPages }, (_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => handlePagination(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
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
                  <Card className="h-100 shadow-sm hover-effect">
                    <Card.Img 
                      variant="top" 
                      src={card.images?.small || 'https://via.placeholder.com/300'} 
                      className="card-img-custom"
                    />
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="fs-5 mb-3">{card.name}</Card.Title>
                      <Card.Text className="text-muted small mb-4">
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
                                    <small className="text-muted">{listing.condition}</small>
                                  </div>
                                  <div className="d-flex gap-2">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => addToCart(listing)}
                                      title="Agregar al carrito"
                                    >
                                      <i className="bi bi-cart-plus"></i>
                                    </Button>
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      onClick={() => window.location = `https://wa.me/${listing.userPhone}`}
                                      title="Contactar por WhatsApp"
                                    >
                                      <i className="bi bi-whatsapp"></i>
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
    </motion.div>
  );
}
