import { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LatestCards = () => {
  const [latestCards, setLatestCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchLatestCards = async () => {
      try {
        const q = query(
          collection(db, 'listings'),
          orderBy('createdAt', 'desc'),
          limit(10) // Cargar 10 cartas para el scroll
        );
        
        const querySnapshot = await getDocs(q);
        const cards = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setLatestCards(cards);
      } catch (error) {
        console.error('Error fetching latest cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCards();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando últimas cartas...</p>
      </div>
    );
  }

  if (latestCards.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No hay cartas disponibles</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="h4 fw-bold text-primary mb-0">
          <i className="fas fa-fire me-2"></i>
          Últimas Cartas Añadidas
        </h3>
        <Link 
          to="/marketplace" 
          className="btn btn-outline-primary btn-sm"
        >
          Ver todas
        </Link>
      </div>
      
      <div className="latest-cards-horizontal">
        <div className="latest-cards-container">
          {latestCards.map((card, index) => (
            <motion.div
              key={card.id}
              className="latest-card-item"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
{isMobile ? (
                // Vista móvil simplificada: solo imagen + precio
                <div className="mobile-card-simple">
                  <div className="mobile-card-image-container">
                    <img 
                      src={card.cardImage || 'https://via.placeholder.com/200'} 
                      alt={card.cardName}
                      className="mobile-card-image"
                    />
                    <div className="mobile-price-overlay">
                      <span className="mobile-price-badge">
                        ${card.price}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Vista desktop completa
                <Card className="h-100 latest-card-hover shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={card.cardImage || 'https://via.placeholder.com/200'} 
                    className="card-img-top"
                    style={{ 
                      height: '160px', 
                      objectFit: 'contain', 
                      padding: '0.75rem',
                      background: '#f8f9fa'
                    }}
                  />
                  <Card.Body className="p-3">
                    <Card.Title className="fs-6 mb-2 text-truncate fw-bold">
                      {card.cardName}
                    </Card.Title>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success fs-6 px-2 py-1">
                        ${card.price}
                      </span>
                      <span className="badge bg-light text-dark">
                        {card.condition}
                      </span>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted text-truncate">
                        <i className="fas fa-user me-1"></i>
                        {card.sellerName || "Anónimo"}
                      </small>
                      <small className="text-muted">
                        <i className="fas fa-gamepad me-1"></i>
                        {card.tcgGame || "TCG"}
                      </small>
                    </div>
                    
                    {card.rarity && (
                      <div className="mt-2">
                        <span className={`badge ${
                          card.rarity === 'Rare' || card.rarity === 'Ultra Rare' ? 'bg-warning' :
                          card.rarity === 'Secret Rare' ? 'bg-danger' :
                          'bg-secondary'
                        } text-dark`}>
                          {card.rarity}
                        </span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="text-center mt-3">
        <Link 
          to="/marketplace" 
          className="btn btn-primary"
        >
          <i className="fas fa-shopping-cart me-2"></i>
          Explorar Marketplace
        </Link>
      </div>
    </motion.div>
  );
};

export default LatestCards;