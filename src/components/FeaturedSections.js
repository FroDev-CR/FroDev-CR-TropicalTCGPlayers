// src/components/FeaturedSections.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { FaFire, FaStar, FaGem, FaClock, FaCrown, FaEye, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';

const SECTION_CONFIGS = {
  offers: {
    title: "🔥 Ofertas del Día",
    subtitle: "Cartas con los mejores precios",
    icon: FaFire,
    color: "danger",
    limit: 6
  },
  popular: {
    title: "⭐ Más Populares", 
    subtitle: "Las cartas más vistas y compradas",
    icon: FaStar,
    color: "warning",
    limit: 6
  },
  rare: {
    title: "💎 Cartas Raras",
    subtitle: "Encuentra cartas especiales y únicas",
    icon: FaGem,
    color: "info",
    limit: 6
  },
  recent: {
    title: "🆕 Recién Agregadas",
    subtitle: "Últimas cartas publicadas",
    icon: FaClock,
    color: "success",
    limit: 6
  },
  topSellers: {
    title: "👑 Vendedores Destacados",
    subtitle: "Cartas de vendedores con mejor rating",
    icon: FaCrown,
    color: "primary",
    limit: 6
  }
};

function FeaturedCard({ listing, onViewCard, onAddToCart }) {
  const [sellerRating, setSellerRating] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSellerRating = async () => {
      try {
        const userRef = doc(db, 'users', listing.sellerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setSellerRating(userData.rating || 0);
        }
      } catch (error) {
        console.error('Error fetching seller rating:', error);
      }
    };
    
    if (listing.sellerId) {
      fetchSellerRating();
    }
  }, [listing.sellerId]);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await onAddToCart(listing);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    setLoading(false);
  };

  return (
    <Card className="h-100 featured-card shadow-sm">
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={listing.cardImage || 'https://via.placeholder.com/200'} 
          className="featured-card-img"
          onClick={() => onViewCard(listing)}
          style={{ 
            cursor: 'pointer',
            height: '200px',
            objectFit: 'contain',
            padding: '0.5rem'
          }}
        />
        {listing.tcgType && (
          <Badge 
            bg="dark" 
            className="position-absolute top-0 start-0 m-2"
            style={{ fontSize: '0.7rem' }}
          >
            {listing.tcgType.toUpperCase()}
          </Badge>
        )}
        {listing.price < 15 && (
          <Badge 
            bg="danger" 
            className="position-absolute top-0 end-0 m-2"
            style={{ fontSize: '0.7rem' }}
          >
            🔥 OFERTA
          </Badge>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column p-3">
        <Card.Title 
          className="fs-6 mb-2 text-truncate"
          style={{ cursor: 'pointer' }}
          onClick={() => onViewCard(listing)}
          title={listing.cardName}
        >
          {listing.cardName}
        </Card.Title>
        
        <div className="mb-2">
          <small className="text-muted d-block text-truncate">
            {listing.setName || 'Set desconocido'}
          </small>
          <div className="d-flex justify-content-between align-items-center mt-1">
            <Badge bg="secondary" className="small">
              {listing.condition || 'N/A'}
            </Badge>
            <Badge bg="info" className="small">
              {listing.rarity || 'Common'}
            </Badge>
          </div>
        </div>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold text-success fs-5">
              ${listing.price}
            </div>
            <small className="text-muted">
              Stock: {listing.availableQuantity || listing.quantity || 1}
            </small>
          </div>
          
          <div className="mb-2">
            <small className="text-muted d-flex align-items-center gap-1">
              <FaStar className="text-warning" size={12} />
              <span>{sellerRating.toFixed(1)}</span>
              <span>• {listing.sellerName || 'Vendedor'}</span>
            </small>
          </div>

          <div className="d-grid gap-2">
            <div className="d-flex gap-1">
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleAddToCart}
                disabled={loading || (listing.availableQuantity || listing.quantity || 1) <= 0}
                className="flex-fill d-flex align-items-center justify-content-center gap-1"
              >
                {loading ? (
                  <Spinner size="sm" animation="border" role="status" />
                ) : (
                  <>
                    <FaShoppingCart size={12} />
                    <span className="d-none d-lg-inline">Carrito</span>
                  </>
                )}
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => window.open(`https://wa.me/${listing.userPhone}`, '_blank')}
                className="d-flex align-items-center justify-content-center"
                title="Contactar por WhatsApp"
              >
                <FaWhatsapp size={12} />
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => onViewCard(listing)}
                className="d-flex align-items-center justify-content-center"
                title="Ver detalles"
              >
                <FaEye size={12} />
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function FeaturedSection({ sectionKey, listings, onViewCard, onAddToCart }) {
  const config = SECTION_CONFIGS[sectionKey];
  
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="featured-section mb-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className={`d-flex align-items-center gap-2 text-${config.color}`}>
          <config.icon size={24} />
          <div>
            <h4 className="mb-0">{config.title}</h4>
            <small className="text-muted">{config.subtitle}</small>
          </div>
        </div>
      </div>
      
      <Row className="g-3">
        {listings.slice(0, config.limit).map(listing => (
          <Col key={listing.id} xs={6} sm={4} md={3} lg={2}>
            <FeaturedCard 
              listing={listing}
              onViewCard={onViewCard}
              onAddToCart={onAddToCart}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default function FeaturedSections({ onViewCard }) {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const sectionsData = {};

        // 1. Ofertas del día (cartas baratas)
        const offersQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          where('price', '<=', 15),
          orderBy('price', 'asc'),
          limit(6)
        );
        const offersSnapshot = await getDocs(offersQuery);
        sectionsData.offers = offersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Cartas raras (por rareza)
        const rareQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const rareSnapshot = await getDocs(rareQuery);
        const allRare = rareSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        sectionsData.rare = allRare
          .filter(listing => {
            const rarity = (listing.rarity || '').toLowerCase();
            return rarity.includes('rare') || rarity.includes('ultra') || rarity.includes('secret') || rarity.includes('special');
          })
          .slice(0, 6);

        // 3. Recién agregadas (últimas 24-48 horas)
        const recentQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const recentSnapshot = await getDocs(recentQuery);
        sectionsData.recent = recentSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Populares (simulado con cartas de precio medio)
        const popularQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          where('price', '>=', 20),
          where('price', '<=', 50),
          orderBy('price', 'desc'),
          limit(6)
        );
        const popularSnapshot = await getDocs(popularQuery);
        sectionsData.popular = popularSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // 5. Vendedores destacados (simulado con variedad)
        const topSellersQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(15)
        );
        const topSellersSnapshot = await getDocs(topSellersQuery);
        const allTopSellers = topSellersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Simular "mejores vendedores" tomando una variedad
        const uniqueSellers = [];
        const seenSellers = new Set();
        for (const listing of allTopSellers) {
          if (!seenSellers.has(listing.sellerId) && uniqueSellers.length < 6) {
            seenSellers.add(listing.sellerId);
            uniqueSellers.push(listing);
          }
        }
        sectionsData.topSellers = uniqueSellers;

        setSections(sectionsData);
      } catch (error) {
        console.error('Error fetching featured sections:', error);
      }
      setLoading(false);
    };

    fetchFeaturedListings();
  }, []);

  const handleAddToCart = async (listing) => {
    try {
      await addToCart(listing);
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" className="mb-3" />
        <p className="text-muted">Cargando secciones destacadas...</p>
      </div>
    );
  }

  return (
    <div className="featured-sections">
      {Object.entries(sections).map(([sectionKey, listings]) => (
        <FeaturedSection
          key={sectionKey}
          sectionKey={sectionKey}
          listings={listings}
          onViewCard={onViewCard}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}