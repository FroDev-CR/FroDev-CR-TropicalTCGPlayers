// src/components/CardDetailModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Button, Card, Spinner, Alert, Table, Tab, Tabs } from 'react-bootstrap';
import { FaHeart, FaShoppingCart, FaWhatsapp, FaEnvelope, FaPhone, FaStar, FaExchangeAlt, FaInfoCircle, FaRocket, FaDragon, FaGamepad, FaMagic, FaSkull, FaUser } from 'react-icons/fa';
import { GiPirateCaptain, GiRobotGolem } from 'react-icons/gi';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';
import ReactStars from 'react-rating-stars-component';

// Configuración de iconos para TCGs
const TCG_ICONS = {
  pokemon: { icon: FaRocket, color: 'primary', name: 'Pokémon' },
  onepiece: { icon: GiPirateCaptain, color: 'warning', name: 'One Piece' },
  dragonball: { icon: FaDragon, color: 'danger', name: 'Dragon Ball' },
  digimon: { icon: FaGamepad, color: 'info', name: 'Digimon' },
  magic: { icon: FaMagic, color: 'secondary', name: 'Magic' },
  unionarena: { icon: FaSkull, color: 'dark', name: 'Union Arena' },
  gundam: { icon: GiRobotGolem, color: 'success', name: 'Gundam' }
};

export default function CardDetailModal({ show, onHide, card }) {
  const [favorites, setFavorites] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellersError, setSellersError] = useState('');
  const { addToCart, user } = useCart();

  // Cargar favoritos del localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Buscar vendedores cuando se abre el modal
  useEffect(() => {
    if (show && card?.id) {
      searchSellers();
    }
  }, [show, card?.id]);

  const searchSellers = async () => {
    if (!card?.id) return;

    setLoadingSellers(true);
    setSellersError('');
    setSellers([]);

    try {
      // Buscar listings que coincidan con esta carta
      const listingsQuery = query(
        collection(db, 'listings'),
        where('cardId', '==', card.id),
        where('status', '==', 'active')
      );

      const listingsSnapshot = await getDocs(listingsQuery);
      
      if (listingsSnapshot.empty) {
        setSellers([]);
        return;
      }

      // Obtener información de los vendedores
      const sellersWithData = await Promise.all(
        listingsSnapshot.docs.map(async (listingDoc) => {
          const listing = { id: listingDoc.id, ...listingDoc.data() };
          
          try {
            // Obtener datos del vendedor
            const sellerDoc = await getDoc(doc(db, 'users', listing.sellerId));
            const sellerData = sellerDoc.exists() ? sellerDoc.data() : {};

            return {
              ...listing,
              sellerName: sellerData.displayName || sellerData.email || 'Usuario',
              sellerRating: sellerData.rating || 0,
              sellerReviews: sellerData.reviews || 0,
              sellerLocation: sellerData.location || 'No especificado'
            };
          } catch (error) {
            console.error('Error loading seller data:', error);
            return {
              ...listing,
              sellerName: 'Usuario',
              sellerRating: 0,
              sellerReviews: 0,
              sellerLocation: 'No especificado'
            };
          }
        })
      );

      // Ordenar por precio (menor a mayor)
      sellersWithData.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      setSellers(sellersWithData);

    } catch (error) {
      console.error('Error searching sellers:', error);
      setSellersError('Error al cargar los vendedores. Inténtalo de nuevo.');
    }

    setLoadingSellers(false);
  };

  const toggleFavorite = (cardId) => {
    const newFavorites = favorites.includes(cardId) 
      ? favorites.filter(id => id !== cardId)
      : [...favorites, cardId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleAddToCart = (listing) => {
    if (!user) {
      alert('Debes iniciar sesión para agregar al carrito');
      return;
    }

    const cartItem = {
      listingId: listing.id,
      cardId: listing.cardId,
      cardName: listing.cardName,
      cardImage: listing.cardImage,
      price: listing.price,
      condition: listing.condition,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      availableQuantity: listing.availableQuantity || listing.quantity,
      tcgType: listing.tcgType
    };

    addToCart(cartItem);
  };

  const getWhatsAppLink = (listing) => {
    const phone = listing.whatsapp || listing.phone || '';
    const message = `Hola! Me interesa tu carta: ${card?.name} - ${listing.condition} por $${listing.price}. ¿Está disponible?`;
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const getEmailLink = (listing) => {
    const subject = `Interés en ${card?.name} - ${listing.condition}`;
    const body = `Hola!\n\nMe interesa tu carta:\n- ${card?.name}\n- Condición: ${listing.condition}\n- Precio: $${listing.price}\n\n¿Está disponible?\n\nGracias!`;
    return `mailto:${listing.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderTCGBadge = (tcgType) => {
    const config = TCG_ICONS[tcgType] || TCG_ICONS.pokemon;
    const IconComponent = config.icon;
    
    return (
      <Badge bg={config.color} className="d-flex align-items-center gap-1">
        <IconComponent size={14} />
        {config.name}
      </Badge>
    );
  };

  const renderCardDetails = () => {
    if (!card) return null;

    return (
      <Tabs defaultActiveKey="details" className="mb-3">
        <Tab eventKey="details" title="Detalles">
          <div className="card-details">
            {/* Información básica */}
            <div className="mb-3">
              <h6 className="text-muted mb-2">Información Básica</h6>
              <Row className="g-2">
                <Col xs={6}>
                  <small className="text-muted">Set:</small>
                  <div>{card.set?.name || 'Desconocido'}</div>
                </Col>
                <Col xs={6}>
                  <small className="text-muted">Rareza:</small>
                  <div>
                    <Badge bg="secondary">{card.rarity || 'Sin especificar'}</Badge>
                  </div>
                </Col>
                {card.artist && (
                  <Col xs={12}>
                    <small className="text-muted">Artista:</small>
                    <div>{card.artist}</div>
                  </Col>
                )}
              </Row>
            </div>

            {/* Detalles específicos de Pokémon */}
            {card.tcgType === 'pokemon' && (
              <>
                {card.hp && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Estadísticas</h6>
                    <Row className="g-2">
                      <Col xs={4}>
                        <small className="text-muted">HP:</small>
                        <div className="fw-bold">{String(card.hp)}</div>
                      </Col>
                      {card.types && Array.isArray(card.types) && (
                        <Col xs={8}>
                          <small className="text-muted">Tipos:</small>
                          <div>
                            {card.types.map((type, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1">
                                {typeof type === 'object' ? JSON.stringify(type) : String(type)}
                              </Badge>
                            ))}
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>
                )}

                {card.attacks && card.attacks.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Ataques</h6>
                    {card.attacks.slice(0, 2).map((attack, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="fw-bold">{typeof attack === 'object' ? String(attack.name || attack) : String(attack)}</div>
                        {typeof attack === 'object' && attack.damage && <div className="text-end fw-bold">{String(attack.damage)}</div>}
                        {typeof attack === 'object' && attack.text && <small className="text-muted">{String(attack.text)}</small>}
                      </div>
                    ))}
                  </div>
                )}

                {card.abilities && card.abilities.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Habilidades</h6>
                    {card.abilities.map((ability, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="fw-bold">{typeof ability === 'object' ? String(ability.name || ability) : String(ability)}</div>
                        <small className="text-muted">{typeof ability === 'object' ? String(ability.text || '') : ''}</small>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Detalles para otros TCGs */}
            {card.tcgType !== 'pokemon' && (
              <div className="mb-3">
                <h6 className="text-muted mb-2">Características</h6>
                <Row className="g-2">
                  {card.cost && (
                    <Col xs={6}>
                      <small className="text-muted">Costo:</small>
                      <div className="fw-bold">{String(card.cost)}</div>
                    </Col>
                  )}
                  {card.power && (
                    <Col xs={6}>
                      <small className="text-muted">Poder:</small>
                      <div className="fw-bold">{String(card.power)}</div>
                    </Col>
                  )}
                  {card.color && (
                    <Col xs={6}>
                      <small className="text-muted">Color:</small>
                      <div>
                        <Badge bg="light" text="dark">{String(card.color)}</Badge>
                      </div>
                    </Col>
                  )}
                  {card.type && (
                    <Col xs={6}>
                      <small className="text-muted">Tipo:</small>
                      <div>
                        <Badge bg="info">{String(card.type)}</Badge>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* Habilidad/Efecto */}
            {(card.ability || card.effect) && (
              <div className="mb-3">
                <h6 className="text-muted mb-2">
                  {card.ability ? 'Habilidad' : 'Efecto'}
                </h6>
                <div className="border rounded p-2 bg-light">
                  <small>{String(card.ability || card.effect || '')}</small>
                </div>
              </div>
            )}

            {/* Flavor text */}
            {card.flavorText && (
              <div className="mb-3">
                <h6 className="text-muted mb-2">Texto de Ambientación</h6>
                <div className="fst-italic text-muted">
                  <small>"{String(card.flavorText || '')}"</small>
                </div>
              </div>
            )}
          </div>
        </Tab>

        {/* Tab de precios (si están disponibles) */}
        {card.tcgplayer && (
          <Tab eventKey="prices" title="Precios de Referencia">
            <div className="price-reference">
              <h6 className="text-muted mb-3">Precios de TCGPlayer (USD)</h6>
              {card.tcgplayer.prices && Object.entries(card.tcgplayer.prices).map(([type, prices]) => (
                <div key={type} className="mb-3 border rounded p-2">
                  <div className="fw-bold text-capitalize mb-2">{type.replace(/([A-Z])/g, ' $1')}</div>
                  <Row className="g-2 text-center">
                    {prices.low && (
                      <Col>
                        <small className="text-muted">Bajo</small>
                        <div className="fw-bold text-success">${prices.low}</div>
                      </Col>
                    )}
                    {prices.market && (
                      <Col>
                        <small className="text-muted">Mercado</small>
                        <div className="fw-bold text-primary">${prices.market}</div>
                      </Col>
                    )}
                    {prices.high && (
                      <Col>
                        <small className="text-muted">Alto</small>
                        <div className="fw-bold text-danger">${prices.high}</div>
                      </Col>
                    )}
                  </Row>
                </div>
              ))}
              <small className="text-muted">
                Última actualización: {card.tcgplayer.updatedAt}
              </small>
            </div>
          </Tab>
        )}

        {/* Tab de legalidades (solo para Pokémon) */}
        {card.legalities && Object.keys(card.legalities).length > 0 && (
          <Tab eventKey="legalities" title="Legalidades">
            <div className="legalities">
              <h6 className="text-muted mb-3">Formatos Legales</h6>
              {Object.entries(card.legalities).map(([format, status]) => (
                <div key={format} className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-capitalize">{format}:</span>
                  <Badge bg={status === 'Legal' ? 'success' : 'danger'}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </Tab>
        )}
      </Tabs>
    );
  };

  if (!card) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      centered
      className="card-detail-modal"
    >
      <Modal.Header closeButton className="border-0 bg-light">
        <Modal.Title className="d-flex align-items-center gap-2">
          {renderTCGBadge(card.tcgType)}
          {card.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Row className="g-0">
          {/* Columna izquierda: Imagen de la carta */}
          <Col lg={5} className="bg-gradient d-flex flex-column">
            <div 
              className="p-4 d-flex flex-column align-items-center justify-content-center flex-grow-1"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                minHeight: '500px'
              }}
            >
              <img 
                src={card.images?.large || card.images?.small || '/placeholder-card.png'}
                alt={card.name}
                className="img-fluid rounded shadow-lg mb-3"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '450px', 
                  objectFit: 'contain',
                  border: '3px solid rgba(255,255,255,0.3)'
                }}
                onError={(e) => {
                  e.target.src = '/placeholder-card.png';
                }}
              />
              
              <Button
                variant={favorites.includes(card.id) ? "danger" : "light"}
                onClick={() => toggleFavorite(card.id)}
                className="btn-lg d-flex align-items-center gap-2"
              >
                <FaHeart />
                {favorites.includes(card.id) ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
              </Button>
            </div>
          </Col>

          {/* Columna derecha: Detalles y vendedores */}
          <Col lg={7}>
            <div className="p-4">
              {/* Información básica de la carta */}
              <div className="mb-4">
                <h4 className="mb-2">{card.name}</h4>
                <div className="d-flex gap-2 mb-3">
                  {renderTCGBadge(card.tcgType)}
                  <Badge bg="secondary">{card.rarity || 'Sin rareza'}</Badge>
                </div>
                <p className="text-muted mb-3">
                  {card.set?.name || 'Set desconocido'}
                </p>
              </div>

              {/* Tabs con detalles de la carta */}
              {renderCardDetails()}

              {/* Sección de vendedores */}
              <div className="sellers-section mt-4">
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FaShoppingCart />
                  Vendedores Disponibles
                  {sellers.length > 0 && (
                    <Badge bg="primary">{sellers.length}</Badge>
                  )}
                </h5>

                {loadingSellers ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                    <p className="mt-2 text-muted">Buscando vendedores...</p>
                  </div>
                ) : sellersError ? (
                  <Alert variant="warning" className="d-flex align-items-center gap-2">
                    <FaInfoCircle />
                    {sellersError}
                  </Alert>
                ) : sellers.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <FaInfoCircle className="mb-2" size={24} />
                    <p className="mb-0">
                      No hay vendedores disponibles para esta carta actualmente.
                    </p>
                  </Alert>
                ) : (
                  <div className="sellers-list">
                    {sellers.map((seller, index) => (
                      <Card key={seller.id} className="mb-3 seller-card">
                        <Card.Body>
                          <Row className="align-items-center">
                            <Col md={8}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1 d-flex align-items-center gap-2">
                                    <FaUser size={14} />
                                    {seller.sellerName}
                                    {seller.sellerRating > 0 && (
                                      <div className="d-flex align-items-center gap-1">
                                        <ReactStars
                                          count={5}
                                          value={seller.sellerRating}
                                          size={16}
                                          edit={false}
                                          activeColor="#ffd700"
                                        />
                                        <small className="text-muted">
                                          ({seller.sellerReviews})
                                        </small>
                                      </div>
                                    )}
                                  </h6>
                                  <div className="d-flex gap-3 align-items-center mb-2">
                                    <div>
                                      <small className="text-muted">Precio:</small>
                                      <div className="h5 mb-0 text-success">${seller.price}</div>
                                    </div>
                                    <div>
                                      <small className="text-muted">Condición:</small>
                                      <div>
                                        <Badge bg="primary">{seller.condition}</Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <small className="text-muted">Stock:</small>
                                      <div>
                                        <Badge bg={seller.availableQuantity > 5 ? 'success' : seller.availableQuantity > 0 ? 'warning' : 'danger'}>
                                          {seller.availableQuantity || seller.quantity} disponible(s)
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <small className="text-muted">
                                    📍 {seller.sellerLocation}
                                  </small>
                                </div>
                              </div>
                            </Col>
                            
                            <Col md={4}>
                              <div className="d-flex flex-column gap-2">
                                {/* Botón agregar al carrito */}
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleAddToCart(seller)}
                                  disabled={!user || (seller.availableQuantity === 0)}
                                  className="d-flex align-items-center justify-content-center gap-1"
                                >
                                  <FaShoppingCart size={12} />
                                  {!user ? 'Inicia Sesión' : 
                                   seller.availableQuantity === 0 ? 'Sin Stock' : 
                                   'Agregar al Carrito'}
                                </Button>

                                {/* Botones de contacto */}
                                <div className="d-flex gap-1">
                                  {seller.whatsapp && (
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      href={getWhatsAppLink(seller)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-fill d-flex align-items-center justify-content-center"
                                      title="Contactar por WhatsApp"
                                    >
                                      <FaWhatsapp size={14} />
                                    </Button>
                                  )}
                                  
                                  {seller.email && (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      href={getEmailLink(seller)}
                                      className="flex-fill d-flex align-items-center justify-content-center"
                                      title="Contactar por Email"
                                    >
                                      <FaEnvelope size={14} />
                                    </Button>
                                  )}
                                  
                                  {seller.phone && (
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      href={`tel:${seller.phone}`}
                                      className="flex-fill d-flex align-items-center justify-content-center"
                                      title="Llamar por teléfono"
                                    >
                                      <FaPhone size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Col>
                          </Row>

                          {/* Notas del vendedor */}
                          {seller.notes && (
                            <div className="mt-2 pt-2 border-top">
                              <small className="text-muted">
                                <strong>Notas:</strong> {seller.notes}
                              </small>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
}