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
          limit(20) // Cargar 20 cartas para el scroll - carrusel más largo
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
              {/* Vista simplificada: solo imagen de carta + datos esenciales */}
              <div className="simple-card-container">
                <div className="simple-card-image-wrapper">
                  <img 
                    src={card.cardImage || 'https://via.placeholder.com/300x400'} 
                    alt={card.cardName}
                    className="simple-card-image"
                  />
                  
                  {/* Overlay con precio */}
                  <div className="simple-card-overlay">
                    <div className="simple-price-badge">
                      ₡{card.price}
                    </div>
                  </div>
                </div>
                
                {/* Información del vendedor debajo */}
                <div className="simple-card-info">
                  <small className="seller-name">
                    {card.sellerName || "Vendedor"}
                  </small>
                </div>
              </div>
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