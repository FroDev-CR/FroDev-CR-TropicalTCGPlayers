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

  // Función para formatear información del set
  const formatSetInfo = (set) => {
    if (!set) return 'Set desconocido';
    
    // Si ya es un string simple, devolverlo directamente
    if (typeof set === 'string') {
      return set;
    }
    
    // Si es un objeto, extraer la información relevante
    if (typeof set === 'object' && set !== null) {
      const name = set.name || '';
      const series = set.series || '';
      
      if (name && series) {
        return `${name}, ${series}`;
      } else if (name) {
        return name;
      } else if (series) {
        return series;
      } else {
        return 'Set desconocido';
      }
    }
    
    // Fallback - convertir cualquier cosa a string
    return String(set);
  };

  // Función utilitaria para formatear cualquier campo que pueda ser un objeto
  const formatCardField = (field, fallback = 'N/A') => {
    if (!field) return fallback;
    
    if (typeof field === 'string' || typeof field === 'number') {
      return String(field);
    }
    
    if (typeof field === 'object') {
      // Si tiene propiedad 'name', usarla
      if (field.name) {
        return String(field.name);
      }
      // Si es un array, unir con comas
      if (Array.isArray(field)) {
        return field.map(item => typeof item === 'object' ? (item.name || String(item)) : String(item)).join(', ');
      }
      // Si es un objeto simple, intentar extraer información útil
      return fallback;
    }
    
    return String(field);
  };

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
    const message = `Hola! Me interesa tu carta: ${card?.name} - ${listing.condition} por ₡${listing.price}. ¿Está disponible?`;
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const getEmailLink = (listing) => {
    const subject = `Interés en ${card?.name} - ${listing.condition}`;
    const body = `Hola!\n\nMe interesa tu carta:\n- ${card?.name}\n- Condición: ${listing.condition}\n- Precio: ₡${listing.price}\n\n¿Está disponible?\n\nGracias!`;
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
        {/* Tab de Detalles */}
        <Tab eventKey="details" title="Detalles">
          <div className="card-details">
            {/* Información básica */}
            <div className="mb-3">
              <h6 className="text-muted mb-2">Información Básica</h6>
              <Row className="g-2">
                <Col xs={6}>
                  <small className="text-muted">Set:</small>
                  <div>{formatSetInfo(card.set)}</div>
                </Col>
                <Col xs={6}>
                  <small className="text-muted">Rareza:</small>
                  <div>
                    <Badge bg="secondary">{card.rarity || 'Sin especificar'}</Badge>
                  </div>
                </Col>
                {card.artist && (
                  <Col xs={6}>
                    <small className="text-muted">Artista:</small>
                    <div>{card.artist}</div>
                  </Col>
                )}
                {card.id && (
                  <Col xs={6}>
                    <small className="text-muted">ID/Código:</small>
                    <div><code>{card.id}</code></div>
                  </Col>
                )}
                {card.number && (
                  <Col xs={6}>
                    <small className="text-muted">Número:</small>
                    <div>#{card.number}</div>
                  </Col>
                )}
                {card.supertype && (
                  <Col xs={6}>
                    <small className="text-muted">Supertipo:</small>
                    <div><Badge bg="info">{card.supertype}</Badge></div>
                  </Col>
                )}
                {card.subtypes && card.subtypes.length > 0 && (
                  <Col xs={12}>
                    <small className="text-muted">Subtipos:</small>
                    <div>
                      {card.subtypes.map((subtype, index) => (
                        <Badge key={index} bg="outline-primary" className="me-1">{subtype}</Badge>
                      ))}
                    </div>
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
                                {formatCardField(type)}
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
                        <div className="fw-bold">{formatCardField(attack, attack.name || 'Ataque')}</div>
                        {typeof attack === 'object' && attack.damage && <div className="text-end fw-bold">{attack.damage}</div>}
                        {typeof attack === 'object' && attack.text && <small className="text-muted">{attack.text}</small>}
                      </div>
                    ))}
                  </div>
                )}

                {card.abilities && card.abilities.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Habilidades</h6>
                    {card.abilities.map((ability, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="fw-bold">{formatCardField(ability, ability.name || 'Habilidad')}</div>
                        <small className="text-muted">{typeof ability === 'object' && ability.text ? ability.text : ''}</small>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Detalles específicos de One Piece */}
            {card.tcgType === 'onepiece' && (
              <div className="mb-3">
                <h6 className="text-muted mb-2">Detalles One Piece</h6>
                <Row className="g-2">
                  {card.cost && (
                    <Col xs={4}>
                      <small className="text-muted">Costo:</small>
                      <div className="fw-bold">{String(card.cost)}</div>
                    </Col>
                  )}
                  {card.power && (
                    <Col xs={4}>
                      <small className="text-muted">Poder:</small>
                      <div className="fw-bold">{String(card.power)}</div>
                    </Col>
                  )}
                  {card.counter && (
                    <Col xs={4}>
                      <small className="text-muted">Counter:</small>
                      <div className="fw-bold">{String(card.counter)}</div>
                    </Col>
                  )}
                  {card.color && (
                    <Col xs={6}>
                      <small className="text-muted">Color:</small>
                      <div><Badge bg="warning" text="dark">{String(card.color)}</Badge></div>
                    </Col>
                  )}
                  {card.type && (
                    <Col xs={6}>
                      <small className="text-muted">Tipo:</small>
                      <div><Badge bg="info">{String(card.type)}</Badge></div>
                    </Col>
                  )}
                  {card.family && (
                    <Col xs={12}>
                      <small className="text-muted">Familia:</small>
                      <div><Badge bg="light" text="dark">{String(card.family)}</Badge></div>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* Detalles para otros TCGs que no son Pokémon ni One Piece */}
            {card.tcgType !== 'pokemon' && card.tcgType !== 'onepiece' && (
              <div className="mb-3">
                <h6 className="text-muted mb-2">Características Específicas</h6>
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
                      <div><Badge bg="light" text="dark">{String(card.color)}</Badge></div>
                    </Col>
                  )}
                  {card.type && (
                    <Col xs={6}>
                      <small className="text-muted">Tipo:</small>
                      <div><Badge bg="info">{String(card.type)}</Badge></div>
                    </Col>
                  )}
                  {card.level && (
                    <Col xs={6}>
                      <small className="text-muted">Nivel:</small>
                      <div className="fw-bold">{String(card.level)}</div>
                    </Col>
                  )}
                  {card.dp && (
                    <Col xs={6}>
                      <small className="text-muted">DP:</small>
                      <div className="fw-bold">{String(card.dp)}</div>
                    </Col>
                  )}
                  {card.ap && (
                    <Col xs={6}>
                      <small className="text-muted">AP:</small>
                      <div className="fw-bold">{String(card.ap)}</div>
                    </Col>
                  )}
                  {card.bp && (
                    <Col xs={6}>
                      <small className="text-muted">BP:</small>
                      <div className="fw-bold">{String(card.bp)}</div>
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
                <div className="border rounded p-2" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <small style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{String(card.ability || card.effect || '')}</small>
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

        {/* Tab de Precios para TODOS los TCGs */}
        <Tab eventKey="prices" title="Precios">
          <div className="price-reference">
            {/* Precios de TCGPlayer */}
            <div className="mb-4">
              <h6 className="text-muted mb-3">💰 Precios TCGPlayer.com</h6>
              {card.tcgplayer && card.tcgplayer.prices ? (
                Object.entries(card.tcgplayer.prices).map(([type, prices]) => (
                  <div key={type} className="mb-3 border rounded p-2" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)' }}>
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
                ))
              ) : (
                <div className="text-center py-3">
                  <span className="text-muted">-</span>
                  <div><small className="text-muted">No disponible</small></div>
                </div>
              )}
            </div>
            
            {/* Precios Mercado CR */}
            <div className="mb-4">
              <h6 className="text-muted mb-3">🇨🇷 Precio Mercado CR</h6>
              <div className="border rounded p-3" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)' }}>
                {sellers && sellers.length > 0 ? (
                  <Row className="g-2 text-center">
                    <Col>
                      <small className="text-muted">Precio Promedio</small>
                      <div className="fw-bold text-success">
                        ₡{Math.round(sellers.reduce((sum, seller) => sum + seller.price, 0) / sellers.length)}
                      </div>
                    </Col>
                    <Col>
                      <small className="text-muted">Precio Más Bajo</small>
                      <div className="fw-bold text-primary">₡{Math.min(...sellers.map(s => s.price))}</div>
                    </Col>
                    <Col>
                      <small className="text-muted">Precio Más Alto</small>
                      <div className="fw-bold text-danger">₡{Math.max(...sellers.map(s => s.price))}</div>
                    </Col>
                  </Row>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-muted">-</span>
                    <div><small className="text-muted">No hay vendedores activos</small></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tab>

        {/* Tab de Vendedores para TODOS los TCGs */}
        <Tab eventKey="sellers" title="Vendedores">
          <div className="sellers-section">
            <h6 className="mb-3 d-flex align-items-center gap-2">
              <FaShoppingCart />
              Vendedores Disponibles
              {sellers.length > 0 && (
                <Badge bg="primary">{sellers.length}</Badge>
              )}
            </h6>

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
                                  <div className="h5 mb-0 text-success">₡{seller.price}</div>
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
        </Tab>
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
      <div 
        className="modal-content-wrapper"
        style={{
          backgroundImage: 'url("/tropical tcg/background celeeste.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Overlay para todo el modal */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)'
          }}
        ></div>
        
        <Modal.Header closeButton className="border-0 position-relative" style={{ background: 'transparent', position: 'relative', zIndex: 3 }}>
          <div className="w-100 d-flex justify-content-center align-items-center">
            <div className="text-center">
              <div className="mb-2">{renderTCGBadge(card.tcgType)}</div>
              <Modal.Title className="h3" style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {card.name}
              </Modal.Title>
            </div>
          </div>
          {/* Botón de favoritos */}
          <Button
            variant={favorites.includes(card.id) ? "danger" : "outline-light"}
            onClick={() => toggleFavorite(card.id)}
            className="position-absolute"
            style={{ 
              top: '10px',
              right: '50px',
              background: favorites.includes(card.id) ? 'rgba(220, 53, 69, 0.9)' : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={favorites.includes(card.id) ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
          >
            <FaHeart size={16} />
          </Button>
        </Modal.Header>
        
        <Modal.Body className="p-0" style={{ position: 'relative', zIndex: 2 }}>
        <Row className="g-0" style={{ minHeight: '70vh' }}>
          {/* Columna izquierda: Imagen de la carta */}
          <Col lg={6} className="bg-gradient d-flex flex-column">
            <div 
              className="p-3 d-flex flex-column align-items-center justify-content-center flex-grow-1"
              style={{ 
                minHeight: '70vh',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', height: '100%' }}>
              <div 
                className="card-image-container position-relative mb-2"
                style={{
                  width: '100%',
                  height: '55vh',
                  overflow: 'hidden',
                  borderRadius: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
              >
                <img 
                  src={card.images?.large || card.images?.small || '/placeholder-card.png'}
                  alt={card.name}
                  className="img-fluid"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-card.png';
                  }}
                />
              </div>
              </div>
            </div>
          </Col>

          {/* Columna derecha: Detalles y vendedores */}
          <Col lg={6}>
            <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto', color: 'white' }}>
              {/* Información básica de la carta */}
              <div className="mb-4">
                <h4 className="mb-2" style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{card.name}</h4>
                <div className="d-flex gap-2 mb-3">
                  {renderTCGBadge(card.tcgType)}
                  <Badge bg="secondary">{card.rarity || 'Sin rareza'}</Badge>
                </div>
                <p className="mb-3" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                  {formatSetInfo(card.set)}
                </p>
              </div>

              {/* Tabs con detalles de la carta */}
              {renderCardDetails()}

            </div>
          </Col>
        </Row>
        </Modal.Body>
      </div>
    </Modal>
  );
}